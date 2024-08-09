import { NextResponse } from "next/server";
import fetch from 'node-fetch';
import pdf from 'pdf-parse';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@/utils/supabase/server";

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