import { NextResponse } from "next/server";
import fetch from 'node-fetch';
import pdf from 'pdf-parse';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@/utils/supabase/server"

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


    // Use LangChain's RecursiveCharacterTextSplitter to split the text
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 600, chunkOverlap: 100 });


    // ... (previous code remains the same)

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
  
  return supabase
    .from('vectors')
    .insert({
      document: docID,
      chunk_index: index,
      content: chunk.pageContent,
      embedding: embedding,
    });
});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process PDFs' }, { status: 500 });
  }
}
