
"use server"
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";


const Profile = async () => {
    const supabase = createClient()
    const {data: {user}} = await supabase.auth.getUser();
    const id = user?.id;
    const {data, error} = await supabase.from('profiles').select('*').eq('id', id)
    if (error) {
        console.error('Error fetching posts:', error);
        return;
    }

    console.log(data[0])

    const goToEdit = async (formData: FormData) => {
        "use server"
        redirect("/profile/edit") 
    }
    return (
        <>
        <div className="flex flex-col items-center justify-center bg-black m-auto h-[50%] rounded-md">
            <form className="flex flex-col shadow-md rounded-md shadow-black p-4 w-80 items-center justify-center m-auto bg-black">
                <img className="rounded-full mb-8 h-24 w-24 text-white" src={data[0].pfp} alt="Profile Picture" />
                <h1 className="text-white text-2xl mb-4">{data[0].name}</h1>
                <button className="text-white" formAction={goToEdit}>Edit</button>
            </form>
        </div>
        </>
    )
}


export default Profile;