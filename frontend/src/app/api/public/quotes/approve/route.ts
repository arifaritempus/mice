import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase admin client
function getAdminClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase configuration missing (URL or Service Role Key).');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(req: Request) {
  try {
    const { token, quoteId, approvalData, hotelsData } = await req.json();

    if (!token || !quoteId || !approvalData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1. Verify token and quoteId match
    const { data: link, error: linkError } = await admin
      .from('public_links')
      .select('id, quote_id, is_active, expiry_date')
      .eq('token', token)
      .single();

    if (linkError || !link) {
      console.error('Link verification error:', linkError);
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 403 });
    }

    if (link.quote_id !== quoteId) {
      return NextResponse.json({ error: 'Token/Quote mismatch' }, { status: 403 });
    }

    // Check expiry
    if (link.expiry_date && new Date(link.expiry_date) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 403 });
    }

    if (!link.is_active) {
      return NextResponse.json({ error: 'Link inactive' }, { status: 403 });
    }

    // 2. Perform updates using SERVICE_ROLE (bypassing RLS)
    
    // Update public_link approval
    const { error: approvalError } = await admin
      .from('public_links')
      .update({ 
        approval: approvalData,
        updated_at: new Date().toISOString()
      })
      .eq('id', link.id);

    if (approvalError) {
      console.error('Approval update error:', approvalError);
      throw approvalError;
    }

    // Update quote status and hotels_data
    const { error: quoteError } = await admin
      .from('quotes')
      .update({
        status: 'KONFİRME',
        hotels_data: hotelsData,
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId);

    if (quoteError) {
      console.error('Quote update error:', quoteError);
      throw quoteError;
    }

    // 3. Automatically transfer to project
    try {
      const { quotesService } = await import('@/lib/supabaseService');
      await quotesService.transferToProject(quoteId, admin);
      console.log(`🚀 Auto-transferred Quote ${quoteId} to Project`);
    } catch (transferErr) {
      console.error('Auto-transfer error (non-fatal):', transferErr);
      // We don't fail the whole request because the approval was successful
    }

    console.log(`✅ Success: Quote ${quoteId} approved via token ${token.substring(0,8)}...`);
    
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Critical Approval API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
