import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Missing config" }, { status: 500 });
    }

    const client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [agenciesRes, hotelsRes, categoriesRes] = await Promise.all([
      client.from('agencies').select('id, name, company_name'),
      client.from('hotels').select('id, name, concept'),
      client.from('categories').select('id, name, parent_id, sort_order, code')
    ]);

    return NextResponse.json({
      agencies: agenciesRes.data || [],
      hotels: hotelsRes.data || [],
      categories: categoriesRes.data || []
    }, { status: 200 });

  } catch (err) {
    console.error("[PublicDictionariesAPI] Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
