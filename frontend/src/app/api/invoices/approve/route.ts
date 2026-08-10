import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { entityType, entityId, fileUrl, extractedData } = await req.json();

    if (!entityType || !fileUrl || !extractedData) {
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

    // Insert the invoice directly as APPROVED since we skip PENDING phase
    const { data, error } = await supabase
      .from('uploaded_invoices')
      .insert({
        entity_type: entityType,
        entity_id: entityId || null,
        file_url: fileUrl,
        status: 'APPROVED',
        extracted_data: extractedData
      })
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
