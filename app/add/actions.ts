'use server'
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"


export const addPDF = async ({id, url, documents }: {id: string, url: string, documents: string[]}) => {

    const supabase = createClient()

    const { data: updatedData, error: updateError } = await supabase.from('pdf').insert({
        link: url, 
    }).select("id").single()
    
    if (updateError) {
        console.error('Error uploading pdf:', updateError);
        return;
    }
    
    async function callChatAPI(urls: string, docID: string) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              urls: urls,
              docID: docID,
            }),
          });
      
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error:', errorData.error);
            return null;
          }
      
          const data = await response.json();
          console.log('Success:', data);
          return data;
        } catch (error) {
          console.error('Failed to make API call:', error);
          return null;
        }
      }

    console.log(updatedData.id)

    const { data: updatedData2, error: updateError2 } = await supabase.from('profiles').update({documents: [...documents, updatedData.id]}).eq('id', id)

    await callChatAPI(url, updatedData.id)

}