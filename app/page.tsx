import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { CardHoverEffectDemo } from "@/components/Cards";

export default function Home() {
  const supabase = createClient();
  
  return (
    <>
      <CardHoverEffectDemo></CardHoverEffectDemo>
    </>
  );
}
