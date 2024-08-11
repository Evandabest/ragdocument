"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import usePDFJS from "../hooks/usePDFJS"


const Add = () => {
    const [pdf, setPdf] = useState<File | undefined>(undefined)
    const [id, setId] = useState<string | undefined>(undefined)
    const [documents, setDocuments] = useState<string[]>([])
    const [url, setUrl] = useState<string | undefined>(undefined)
    const [uploaded, setUploaded] = useState<boolean>(false)
    const supabase = createClient()
    const router = useRouter()

    const newFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) {
            return;
        }
        console.log(file)
        setPdf(file)
    }

    useEffect(() => {
        const getDocuments = async () => {
            const {data: {user}} = await supabase.auth.getUser();
            const id = user?.id
            if (!id) {
                console.error('Error fetching user id');
                return;
            }
            setId(id)
            const {data, error} = await supabase.from('profiles').select('documents').eq('id', id)
            const documents = data? [data] : []

            if (error) {
                console.error('Error fetching documents:', error);
                return;
            }

            const docs = documents[0].flatMap((doc: any) => doc.documents)
            console.log(docs)

            setDocuments(docs)
        }
        getDocuments()
    }, [supabase])

    const getURL = async (link:string) => {
        const { data: {publicUrl} } = await supabase.storage.from('pdfs').getPublicUrl(link);
            if (!publicUrl) {
                console.error('Error fetching public url');
                return;
        }
        return publicUrl
    }

    

    const post = async (e: any) => {

        e.preventDefault()

        if (!pdf) {
            console.error('No file selected');
            return;
        }

        if (!id) {
            console.error('No user id');
            return;
        }
        
        const time = Date.now()


        const {data, error} = await supabase.storage.from('pdfs').upload(`${id}_${time}`, pdf, {upsert: true, contentType: "application/pdf"})

        if (error) {
            console.error('Error uploading pdfs:', error);
            return;
        }

        const publicUrl = await getURL(`${id}_${time}`);
        if (!publicUrl) {
            console.error('Error fetching public url');
            return;
        }
        
        setUrl(publicUrl)
        setUploaded(true)

        const { data: updatedData, error: updateError } = await supabase.from('pdf').insert({
            link: publicUrl, 
        }).select("id").single()
        
        if (updateError) {
            console.error('Error uploading pdf:', updateError);
            return;
        }
       
        const { data: updatedData2, error: updateError2 } = await supabase.from('profiles').update({documents: [...documents, updatedData.id]}).eq('id', id)

        const encodedPublicUrl = encodeURIComponent(publicUrl);
        router.push(`/loading/${encodedPublicUrl}`)
        
    }


    if (uploaded) {
        usePDFJS(async (pdfjs) => {
            try {
            const loadingTask = pdfjs.getDocument(url);
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;
            let extractedText = "";
        
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const textItems = textContent.items.map((item: any) => item.str).join(" ");
                extractedText += `Page ${pageNum}:\n${textItems}\n\n`;
            }
        
            console.log(extractedText);
            } catch (error) {
            console.error("Error loading PDF: ", error);
            }
        });
    }


    return (
        <>
            <input className="m-auto text-white border-2 border-white w-[80%] rounded-md" type="file" onChange={newFile} name="file" />
            <button className="m-auto text-white border-2 border-white w-[80%] rounded-md" onClick={post}>Submit</button>
        </>
    )

}

export default Add