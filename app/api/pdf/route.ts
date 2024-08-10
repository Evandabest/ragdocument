import { NextResponse } from "next/server";
import fetch from 'node-fetch';
import pdf from 'pdf-parse';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const apiKey = process.env.NEXT_GOOGLE_GEMINI_KEY;
  const supabase = createClient();

  try {
    const { urls, docID } = await req.json();

    if (!urls) {
      return NextResponse.json({ error: 'No valid URLs provided' }, { status: 400 });
    }

    const response = await fetch(urls);
    if (!response.ok) {
      throw new Error('Failed to fetch the URL');
    }

    //problem starts here
    const buffer = await response.arrayBuffer();
    if (!buffer) {
      throw new Error('Failed to read the buffer');
    }

    // Parse the PDF to extract text
    const data = await pdf(Buffer.from(buffer));
    if (!data) {
      throw new Error('Failed to parse the data');
    }
    const text = data.text;
    //up to here it probably doesnt work

    // Use LangChain's RecursiveCharacterTextSplitter to split the text
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 600, chunkOverlap: 100 });

    const chunks = await splitter.createDocuments([text]);
    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ error: 'No valid PDFs were processed' }, { status: 400 });
    }

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey,
      modelName: "embedding-004",
    });

    // Create an array to store all insert operations
    const insertPromises = chunks.map(async (chunk, index) => {
      const embedding = await embeddings.embedQuery(chunk.pageContent);
      
      return await supabase
        .from('vectors')
        .insert({
          document: docID,
          content: chunk.pageContent,
          embedding: embedding,
        });
    });

    // Wait for all insert operations to complete
    const results = await Promise.all(insertPromises);

    // Check if any insertions failed
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error('Failed to insert some chunks');
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process PDFs', details: error }, { status: 500 });
  }
}
