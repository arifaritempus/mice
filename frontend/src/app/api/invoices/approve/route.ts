import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, extractedData } = await req.json();

    if (!invoiceId || !extractedData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !serviceKey) {
       return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Update the invoice status to APPROVED and update the extracted data with user's final corrections
    const { data, error } = await supabase
      .from('uploaded_invoices')
      .update({
        status: 'APPROVED',
        extracted_data: extractedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      console.error("Error approving invoice:", error);
      return NextResponse.json({ error: "Failed to approve invoice" }, { status: 500 });
    }

    return NextResponse.json({ success: true, invoice: data });

  } catch (error: any) {
    console.error("Approve API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
