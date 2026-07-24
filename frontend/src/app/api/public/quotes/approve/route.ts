import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/mail";

// Server-side Supabase admin client
function getAdminClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL) as string;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase configuration missing (URL or Service Role Key).",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(req: Request) {
  try {
    const { token, quoteId, approvalData, hotelsData } = await req.json();

    if (!token || !quoteId || !approvalData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const admin = getAdminClient();

    // 1. Verify token and quoteId match
    const { data: link, error: linkError } = await admin
      .from("public_links")
      .select("id, quote_id, is_active, expiry_date")
      .eq("token", token)
      .single();

    if (linkError || !link) {
      console.error("Link verification error:", linkError);
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 403 },
      );
    }

    if (link.quote_id !== quoteId) {
      return NextResponse.json(
        { error: "Token/Quote mismatch" },
        { status: 403 },
      );
    }

    // Check expiry
    if (link.expiry_date && new Date(link.expiry_date) < new Date()) {
      return NextResponse.json({ error: "Link expired" }, { status: 403 });
    }

    if (!link.is_active) {
      return NextResponse.json({ error: "Link inactive" }, { status: 403 });
    }

    // 2. Perform updates using SERVICE_ROLE (bypassing RLS)

    // Fetch quote details for notification
    const { data: quote, error: quoteFetchError } = await admin
      .from("quotes")
      .select("*, agencies(name), hotels(name)")
      .eq("id", quoteId)
      .single();

    if (quoteFetchError) {
      console.error("Quote fetch error:", quoteFetchError);
      throw quoteFetchError;
    }

    // 2.5 Prevent duplicate approvals
    if (quote.status === "KONFİRME") {
      return NextResponse.json(
        { error: "Bu teklif zaten daha önce onaylanmış." },
        { status: 400 }
      );
    }

    // Update public_link approval
    const { error: approvalError } = await admin
      .from("public_links")
      .update({
        approval: approvalData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", link.id);

    if (approvalError) {
      console.error("Approval update error:", approvalError);
      throw approvalError;
    }

    // Update quote status and hotels_data
    const { error: quoteError } = await admin
      .from("quotes")
      .update({
        status: "KONFİRME",
        hotels_data: hotelsData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (quoteError) {
      console.error("Quote update error:", quoteError);
      throw quoteError;
    }

    // 3. Create Detailed Notification
    try {
      const creatorId = quote.created_by;
      const agencyName =
        quote.agencies?.name || quote.company_name || "Bilinmiyor";
      const hotelName = quote.hotels?.name || "Çoklu Otel/Belirtilmemiş";
      const checkIn = quote.check_in_date
        ? new Date(quote.check_in_date).toLocaleDateString("tr-TR")
        : "-";
      const checkOut = quote.check_out_date
        ? new Date(quote.check_out_date).toLocaleDateString("tr-TR")
        : "-";

      const notificationTitle = `✅ Teklif Onaylandı: ${quote.reference}`;
      const notificationHtml = `
        <div class="prose prose-sm max-w-none">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900 m-0">Teklif Müşteri Tarafından Onaylandı</h3>
              <p class="text-sm text-slate-500 m-0">${quote.reference} referanslı teklif onaylandı.</p>
            </div>
          </div>

          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
            <table class="w-full text-sm">
              <tr><td class="py-1 font-semibold text-slate-500 w-32">Müşteri/Acente:</td><td class="py-1 font-bold text-slate-900">${agencyName}</td></tr>
              <tr><td class="py-1 font-semibold text-slate-500">Ana Otel:</td><td class="py-1 font-bold text-slate-900">${hotelName}</td></tr>
              <tr><td class="py-1 font-semibold text-slate-500">Tarih Aralığı:</td><td class="py-1 font-bold text-slate-900">${checkIn} - ${checkOut}</td></tr>
              <tr><td class="py-1 font-semibold text-slate-500">Tutar:</td><td class="py-1 font-bold text-green-600">${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "EUR" }).format(quote.total_amount || 0)}</td></tr>
            </table>
          </div>

          <div class="bg-blue-500/10 rounded-xl p-4 border border-blue-100">
            <h4 class="text-xs font-bold text-blue-700 uppercase mb-2">Onay Bilgileri</h4>
            <table class="w-full text-xs">
              <tr><td class="py-1 font-semibold text-blue-600 w-32">Onaylayan:</td><td class="py-1 font-bold text-blue-900">${approvalData.name} ${approvalData.surname}</td></tr>
              <tr><td class="py-1 font-semibold text-blue-600">E-Posta:</td><td class="py-1 font-bold text-blue-900">${approvalData.email}</td></tr>
              <tr><td class="py-1 font-semibold text-blue-600">IP / Konum:</td><td class="py-1 font-bold text-blue-900">${approvalData.ip_address} (${approvalData.geo_location?.city || "Bilinmiyor"})</td></tr>
            </table>
          </div>
          
          <p class="text-[10px] text-slate-400 mt-4 italic">Not: Bu teklif otomatik olarak projeye dönüştürülmüştür. Projeler sayfasından detayları kontrol edebilirsiniz.</p>
        </div>
      `;

      // Fetch user emails for email notifications
      let creatorEmail = null;
      if (creatorId) {
        const { data: creator } = await admin.from("users").select("email").eq("id", creatorId).single();
        if (creator) creatorEmail = creator.email;
      }

      const { data: admins } = await admin
        .from("users")
        .select("id, email")
        .eq("role", "super_admin");

      // Creator'a uygulama içi bildirim gönder
      if (creatorId) {
        await admin.from("notifications").insert({
          user_id: creatorId,
          title: notificationTitle,
          message: notificationHtml,
          type: "success",
          action_url: `/quotes`,
        });
      }

      // Adminlere de uygulama içi bildirim gönder
      if (admins) {
        const adminTargets = admins.filter((a) => a.id !== creatorId);
        
        const bulk = adminTargets.map((a) => ({
          user_id: a.id,
          title: notificationTitle,
          message: notificationHtml,
          type: "success",
          action_url: `/quotes`,
        }));
        
        if (bulk.length > 0) {
          await admin.from("notifications").insert(bulk);
        }
      }
      
      // E-posta bildirimlerini merkezi API üzerinden tetikle
      try {
        const { POST: sendQuoteConfirmedEmail } = await import("@/app/api/notifications/quote-confirmed/route");
        
        // Mock a Request object
        const mockReq = new Request("http://localhost/api/notifications/quote-confirmed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteId: quoteId,
            confirmedBy: { 
              name: `${approvalData.name} ${approvalData.surname}`.trim(), 
              type: "customer_link" 
            }
          })
        });

        await sendQuoteConfirmedEmail(mockReq);
        console.log("Triggered centralized email notification successfully via direct handler call.");
      } catch (err) {
        console.error("Failed to trigger centralized email API:", err);
      }
      
    } catch (notifErr) {
      console.error("Notification creation error (non-fatal):", notifErr);
    }

    // 4. Automatically transfer to project
    try {
      const { quotesService } = await import("@/lib/supabaseService");
      await quotesService.transferToProject(quoteId, admin);
      console.log(`🚀 Auto-transferred Quote ${quoteId} to Project`);
    } catch (transferErr) {
      console.error("Auto-transfer error (non-fatal):", transferErr);
    }

    console.log(
      `✅ Success: Quote ${quoteId} approved via token ${token.substring(0, 8)}...`,
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Critical Approval API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
