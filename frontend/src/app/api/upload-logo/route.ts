import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const filename = formData.get("filename") as string | null;

    if (!file || !filename) {
      return NextResponse.json({ error: "Eksik dosya veya dosya adı" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    // RLS'yi atlamak için Service Role Key kullanıyoruz
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase.storage
      .from("logos")
      .upload(filename, buffer, {
        upsert: true,
        contentType: file.type || "image/png",
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(filename);

    return NextResponse.json({ publicUrl: urlData.publicUrl });
  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
