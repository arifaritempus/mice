import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ID kısmından (varsa) .pdf veya .jpg uzantısını temizle
    const id = params.id.replace(/\.(pdf|jpg|jpeg|png|webp)$/i, '');
    
    if (!id) {
      return new NextResponse("Missing ID", { status: 400 });
    }

    const { data, error } = await supabase
      .from('uploaded_invoices')
      .select('file_url')
      .eq('id', id)
      .single();

    if (error || !data?.file_url) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Supabase URL'ini backend'den fetch ediyoruz, böylece client Supabase adresini görmez
    const response = await fetch(data.file_url);
    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: 500 });
    }

    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });

  } catch (error) {
    console.error("Preview proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
