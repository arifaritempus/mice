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
    const { token, projectId, approvalData } = await req.json();

    if (!token || !projectId || !approvalData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1. Verify token and projectId match
    const { data: link, error: linkError } = await admin
      .from('public_links')
      .select('id, project_id, is_active, expiry_date')
      .eq('token', token)
      .single();

    if (linkError || !link) {
      console.error('Link verification error:', linkError);
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 403 });
    }

    if (link.project_id !== projectId) {
      return NextResponse.json({ error: 'Token/Project mismatch' }, { status: 403 });
    }

    // Check expiry
    if (link.expiry_date && new Date(link.expiry_date) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 403 });
    }

    if (!link.is_active) {
      return NextResponse.json({ error: 'Link inactive' }, { status: 403 });
    }

    // 2. Perform updates using SERVICE_ROLE (bypassing RLS)
    
    // Fetch project details for notification
    const { data: project, error: projectFetchError } = await admin
      .from('projects')
      .select('*, agencies(name), hotels(name)')
      .eq('id', projectId)
      .single();

    if (projectFetchError) {
      console.error('Project fetch error:', projectFetchError);
      throw projectFetchError;
    }

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

    // Update project status to approved
    const { error: projectError } = await admin
      .from('projects')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (projectError) {
      console.error('Project update error:', projectError);
      throw projectError;
    }

    // 3. Create Detailed Notification
    try {
      const managerId = project.manager_id;
      const agencyName = project.agencies?.name || project.company_name || 'Bilinmiyor';
      const hotelName = project.hotels?.name || 'Çoklu Otel/Belirtilmemiş';
      const checkIn = project.start_date ? new Date(project.start_date).toLocaleDateString('tr-TR') : '-';
      const checkOut = project.end_date ? new Date(project.end_date).toLocaleDateString('tr-TR') : '-';
      
      // Calculate total from project_sales_items
      const { data: salesItems } = await admin
        .from('project_sales_items')
        .select('total_price')
        .eq('project_id', projectId);
      
      const totalAmount = salesItems?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;

      const notificationTitle = `🤝 Mutabakat Onaylandı: ${project.reference}`;
      const notificationHtml = `
        <div class="prose prose-sm max-w-none">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900 m-0">Satış Mutabakatı Onaylandı</h3>
              <p class="text-sm text-slate-500 m-0">${project.reference} referanslı proje için mutabakat sağlandı.</p>
            </div>
          </div>

          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
            <table class="w-full text-sm">
              <tr><td class="py-1 font-semibold text-slate-500 w-32">Müşteri/Acente:</td><td class="py-1 font-bold text-slate-900">${agencyName}</td></tr>
              <tr><td class="py-1 font-semibold text-slate-500">Otel:</td><td class="py-1 font-bold text-slate-900">${hotelName}</td></tr>
              <tr><td class="py-1 font-semibold text-slate-500">Tarih Aralığı:</td><td class="py-1 font-bold text-slate-900">${checkIn} - ${checkOut}</td></tr>
              <tr><td class="py-1 font-semibold text-slate-500">Mutabakat Tutarı:</td><td class="py-1 font-bold text-indigo-600">${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR' }).format(totalAmount)}</td></tr>
            </table>
          </div>

          <div class="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <h4 class="text-xs font-bold text-indigo-700 uppercase mb-2">Dijital İmza Bilgileri</h4>
            <table class="w-full text-xs">
              <tr><td class="py-1 font-semibold text-indigo-600 w-32">Onaylayan:</td><td class="py-1 font-bold text-indigo-900">${approvalData.name} ${approvalData.surname}</td></tr>
              <tr><td class="py-1 font-semibold text-indigo-600">E-Posta:</td><td class="py-1 font-bold text-indigo-900">${approvalData.email}</td></tr>
              <tr><td class="py-1 font-semibold text-indigo-600">IP / Konum:</td><td class="py-1 font-bold text-indigo-900">${approvalData.ip_address} (${approvalData.geo_location?.city || 'Bilinmiyor'})</td></tr>
            </table>
          </div>
          
          <p class="text-[10px] text-slate-400 mt-4 italic">Not: Bu proje durumu "Onaylandı" olarak güncellenmiştir. Operasyon ve faturalandırma süreçlerini başlatabilirsiniz.</p>
        </div>
      `;

      // Manager'a bildirim gönder
      if (managerId) {
        await admin.from('notifications').insert({
          user_id: managerId,
          title: notificationTitle,
          message: notificationHtml,
          type: 'info',
          action_url: `/projects`
        });
      }

      // Adminlere de gönder
      const { data: admins } = await admin.from('users').select('id').eq('role', 'super_admin');
      if (admins) {
        const bulk = admins
          .filter(a => a.id !== managerId)
          .map(a => ({
            user_id: a.id,
            title: notificationTitle,
            message: notificationHtml,
            type: 'info',
            action_url: `/projects`
          }));
        if (bulk.length > 0) await admin.from('notifications').insert(bulk);
      }

    } catch (notifErr) {
      console.error('Notification creation error (non-fatal):', notifErr);
    }

    console.log(`✅ Success: Project ${projectId} reconciliation approved via token ${token.substring(0,8)}...`);
    
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Critical Project Approval API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
