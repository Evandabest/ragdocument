import { NextResponse } from "next/server";
import fetch from 'node-fetch';
import pdf from 'pdf-parse';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@/utils/supabase/server";




export async function POST(req: Request) {
    const data = await req.json()

    const apiKey = process.env.NEXT_GOOGLE_GEMINI_KEY;

    const supabase = createClient();

    const { url } = await req.json();

    if (!url) {
        return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    try {
        // Fetch the PDF from the URL
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch the PDF');
        }

        const buffer = await response.buffer();

        // Parse the PDF to extract text
        const data = await pdf(buffer);

        const text = data.text;

        // Use LangChain's RecursiveCharacterTextSplitter to split the text
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 600, chunkOverlap: 100 });
        const chunks = splitter.splitText(text);

        // Use LangChain's GoogleGenerativeAIEmbeddings to get the embeddings for the text
        const llm = new ChatGoogleGenerativeAI({
            apiKey: apiKey,
            modelName: "gemini-1.5-flash",
        });
        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: apiKey,
            modelName: "embedding-004",
          })
        
        const embeddingsData = await embeddings.embedDocuments(await chunks);

        // Store the embeddings in the database
        const { error } = await supabase
            .from('vectors')
            .insert(embeddingsData);

        // Return the extracted text
        return NextResponse.json({ chunks });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

}
