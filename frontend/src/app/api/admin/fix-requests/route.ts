import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL) as string;
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) as string;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase URL veya Service Role Key eksik.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET() {
  try {
    const adminClient = getAdminClient();
    
    // Find all locked requests
    const { data: lockedRequests, error: reqError } = await adminClient
      .from('mice_requests')
      .select('id, reference')
      .eq('status', 'TEKLİFE AKTARILDI');
      
    if (reqError) throw reqError;
    if (!lockedRequests || lockedRequests.length === 0) {
      return NextResponse.json({ message: "Takılı kalan talep bulunamadı." });
    }

    // Check quotes for each locked request
    const fixedIds = [];
    for (const req of lockedRequests) {
      if (!req.reference) continue;
      
      const { data: quotes } = await adminClient
        .from('quotes')
        .select('id')
        .ilike('reference', `%${req.reference.trim()}%`);
        
      if (!quotes || quotes.length === 0) {
        // No quote exists! Unlock it.
        const { error: updateError } = await adminClient
          .from('mice_requests')
          .update({ status: 'CEVAPLANDI' })
          .eq('id', req.id);
          
        if (!updateError) {
          fixedIds.push(req.reference);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${fixedIds.length} adet takılı kalan talep düzeltildi.`,
      fixed_references: fixedIds 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
