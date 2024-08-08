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
    const chunks = await splitter.createDocuments([text]);


    if (!chunks || chunks.length === 0) {
      return NextResponse.json({ error: 'No valid PDFs were processed' }, { status: 400 });
    }

    // Use LangChain's GoogleGenerativeAIEmbeddings to get the embeddings for the text
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey,
      modelName: "embedding-004",
    });

    const embeddingsData = await embeddings.embedDocuments(chunks.map(chunk => chunk.metadata.text));

    if (!embeddingsData || embeddingsData.length === 0) {
      throw new Error('Failed to get embeddings for the text');
    }

    const { error } = await supabase
      .from('vectors')
      .insert({
        document: docID,
        embeddings: embeddingsData,
      });

    if (error) {
      throw new Error('Failed to insert embeddings into the database');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process PDFs' }, { status: 500 });
  }
}



export async function GET(req: Request) {
    const apiKey = process.env.NEXT_GOOGLE_GEMINI_KEY;
    const supabase = createClient();
    
    const {question } = await req.json()
    
    if (!question) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }


    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: apiKey,
        modelName: "embedding-004",
    });

    const llm = new ChatGoogleGenerativeAI({
        apiKey: apiKey,
        modelName: "gemini-1.5-flash",
    });

    const [embedding] = await embeddings.embedDocuments([question]);

    const {data, error} = await supabase.rpc('get_similar_vectors', { embedding: embedding });

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch similar vectors' }, { status: 500 });
    }

    const similarVectors = data;

    const prompt : any = question + "use the following as context: " + similarVectors.map((vector: any) => vector.content).join(" ");

    const response = await llm.invoke(prompt);

    if (!response) {
        return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
    }

    const {chat} = await req.json();

    const updateChat = async () => {

        const { data } = await supabase.from('chats').select('chat').eq('id', chat);
        
        if (!data) {
            return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
        }
        const newChat = [...data, {sender: "ai", content: response } ];

        const { error } = await supabase.from('chats').update({chat: newChat}).eq('id', chat);
    }

    updateChat();
}