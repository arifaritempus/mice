import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !serviceKey) {
       return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { error } = await supabase
      .from('uploaded_invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      console.error("Error deleting invoice:", error);
      return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Delete Invoice API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
