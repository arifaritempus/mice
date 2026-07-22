import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  if (!q) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const decodedLink = Buffer.from(q, "base64").toString("utf-8");
    
    // Güvenlik kontrolü: Linkin supabase.co içerdiğinden emin olalım
    if (!decodedLink.includes(".supabase.co")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.redirect(decodedLink);
  } catch (error) {
    console.error("Yönlendirme linki çözülemedi:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
