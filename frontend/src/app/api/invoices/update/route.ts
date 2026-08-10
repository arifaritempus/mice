import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, category, extracted_data, entity_type, entity_id } = await req.json();

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

    // Get current invoice to update its extracted_data
    const { data: currentInvoice, error: fetchError } = await supabase
      .from('uploaded_invoices')
      .select('extracted_data')
      .eq('id', invoiceId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
    }

    let updatedExtractedData = { ...(currentInvoice.extracted_data || {}) };
    
    if (extracted_data) {
       updatedExtractedData = { ...updatedExtractedData, ...extracted_data };
    }
    
    if (category !== undefined) {
       updatedExtractedData.category = category;
    }

    const updatePayload: any = {
      extracted_data: updatedExtractedData,
      updated_at: new Date().toISOString()
    };

    if (entity_type !== undefined) updatePayload.entity_type = entity_type;
    if (entity_id !== undefined) updatePayload.entity_id = entity_id;

    const { data, error } = await supabase
      .from('uploaded_invoices')
      .update(updatePayload)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      console.error("Error updating invoice category:", error);
      return NextResponse.json({ error: "Failed to update invoice category" }, { status: 500 });
    }

    return NextResponse.json({ success: true, invoice: data });

  } catch (error: any) {
    console.error("Update Invoice API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
