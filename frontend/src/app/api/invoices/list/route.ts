import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !serviceKey) {
       return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get('entityId');

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    let query = supabase
      .from('uploaded_invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching invoices:", error);
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }

    return NextResponse.json({ invoices: data });

  } catch (error: any) {
    console.error("List Invoices API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
