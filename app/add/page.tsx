"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { addPDF } from "./actions"


const Add = () => {
    const [pdf, setPdf] = useState<File | undefined>(undefined)
    const [id, setId] = useState<string | undefined>(undefined)
    const [documents, setDocuments] = useState<string[]>([])
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


        const {data, error} = await supabase.storage.from('pdfs').upload(`${id}_${time}`, pdf)

        if (error) {
            console.error('Error uploading pdfs:', error);
            return;
        }

        const publicUrl = await getURL(`${id}_${time}`);
        if (!publicUrl) {
            console.error('Error fetching public url');
            return;
        }

        router.push('/')

        await addPDF({id: id, url: publicUrl, documents: documents})

        
    }



    return (
        <>
            <input className="m-auto text-white border-2 border-white w-[80%] rounded-md" type="file" onChange={newFile} name="file" />
            <button className="m-auto text-white border-2 border-white w-[80%] rounded-md" onClick={post}>Submit</button>
        </>
    )

}

export default Add