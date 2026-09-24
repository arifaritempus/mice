import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token eksik." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Sunucu ayarları eksik." },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  try {
    const { data: link, error: linkError } = await supabaseAdmin
      .from("public_links")
      .select("*")
      .eq("token", token)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: "Geçersiz link." }, { status: 404 });
    }

    if (link.expiry_date && new Date(link.expiry_date) < new Date()) {
      return NextResponse.json({ error: "Link süresi dolmuş." }, { status: 403 });
    }
    if (!link.is_active) {
      return NextResponse.json({ error: "Link pasif." }, { status: 403 });
    }

    // Fetch dictionaries
    const [agList, htList, catList] = await Promise.all([
      supabaseAdmin.from("agencies").select("*").order("name"),
      supabaseAdmin.from("hotels").select("*").order("name"),
      supabaseAdmin.from("categories").select("*").order("name"),
    ]);

    const dictionaries = {
      agencies: agList.data || [],
      hotels: htList.data || [],
      categories: catList.data || [],
    };

    if (link.link_type === "quote") {
      const { data: quote, error: quoteError } = await supabaseAdmin
        .from("quotes")
        .select("*")
        .eq("id", link.quote_id)
        .single();

      if (quoteError || !quote) {
        return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
      }

      const { data: items } = await supabaseAdmin
        .from("quote_items")
        .select("*")
        .eq("quote_id", link.quote_id)
        .order("created_at", { ascending: true });

      return NextResponse.json({
        type: "quote",
        link,
        quote,
        items: items || [],
        dictionaries,
      });
    } else if (link.link_type === "project") {
      const { data: project, error: projectError } = await supabaseAdmin
        .from("projects")
        .select("*")
        .eq("id", link.project_id)
        .single();

      if (projectError || !project) {
        return NextResponse.json({ error: "Proje bulunamadı." }, { status: 404 });
      }

      const { data: items } = await supabaseAdmin
        .from("project_sales_items")
        .select("*")
        .eq("project_id", link.project_id)
        .order("created_at", { ascending: true });

      return NextResponse.json({
        type: "project",
        link,
        project,
        items: items || [],
        dictionaries,
      });
    } else {
      return NextResponse.json({ error: "Geçersiz link tipi." }, { status: 400 });
    }
  } catch (err) {
    console.error("link-data api error:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
