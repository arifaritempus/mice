import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/mail";

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
    const host = req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const appUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:6002");

    const { projectId, quoteId, confirmedBy } = await req.json();

    if (!quoteId) {
      return NextResponse.json(
        { error: "Missing quoteId" },
        { status: 400 },
      );
    }

    const admin = getAdminClient();

    // Fetch quote and relations
    const { data: quote, error: quoteError } = await admin
      .from("quotes")
      .select("*, agencies(name), hotels(name)")
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      console.error("Quote fetch error:", quoteError);
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Fetch quote items
    const { data: items } = await admin
      .from("quote_items")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: true });

    // Fetch project manager / creator
    let pmName = "Atanmamış";
    let creatorEmail = null;
    
    let opManagers = quote.operation_managers;
    if (typeof opManagers === "string") {
      try { opManagers = JSON.parse(opManagers); } catch(e) {}
    }

    if (opManagers && Array.isArray(opManagers) && opManagers.length > 0) {
      const { data: managers } = await admin
        .from("users")
        .select("full_name")
        .in("id", opManagers);
      if (managers && managers.length > 0) {
        pmName = managers.map(m => m.full_name || "Bilinmeyen Kullanıcı").join(", ");
      }
    }

    if (quote.created_by) {
      const { data: creator } = await admin
        .from("users")
        .select("email, full_name")
        .eq("id", quote.created_by)
        .single();
      if (creator) {
        creatorEmail = creator.email;
        if (pmName === "Atanmamış") {
          pmName = creator.full_name || "Atanmamış";
        }
      }
    }

    const confirmedByName = confirmedBy?.name || "Sistem Kullanıcısı";
    const agencyName = quote.company_name && quote.agencies?.name 
      ? `${quote.agencies.name} - ${quote.company_name}` 
      : quote.company_name || quote.agencies?.name || "Bilinmiyor";
      
    // Fetch hotels to map hotel_id to name
    const { data: allHotels } = await admin.from("hotels").select("id, name");
    const hotelMap = new Map();
    if (allHotels) {
      allHotels.forEach((h: any) => hotelMap.set(h.id, h.name));
    }

    // Fetch categories to map UUIDs to actual names
    const { data: allCategories } = await admin.from("categories").select("id, name");
    const categoryMap = new Map();
    if (allCategories) {
      allCategories.forEach((c: any) => categoryMap.set(c.id, c.name));
    }
    const isUUID = (str: string) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    const currency = quote.currency || quote.main_currency || "EUR";
    const curSym = currency === "TRY" || currency === "TL" ? "₺" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "€";
    
    const fmtMoney = (val: number) => {
      return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
    };
    
    const formatDateStr = (dateStr: string) => {
       if (!dateStr) return "-";
       try { return new Date(dateStr).toLocaleDateString("tr-TR"); } catch (e) { return dateStr; }
    };

    let hotelsData = [];
    if (typeof quote.hotels_data === "string") {
      try { hotelsData = JSON.parse(quote.hotels_data); } catch(e) {}
    } else if (Array.isArray(quote.hotels_data)) {
      hotelsData = quote.hotels_data;
    }
    
    // Sadece KONFİRME olan otelleri al
    let confirmedHotels = hotelsData.filter((h: any) => h.is_confirmed || h.hotel_status === "KONFİRME");
    
    // Eski sistem teklifi ise (hotels_data yoksa)
    if (confirmedHotels.length === 0 && quote.hotel_id) {
      confirmedHotels.push({
        id: "legacy",
        hotel_id: quote.hotel_id,
        check_in_date: quote.check_in_date,
        check_out_date: quote.check_out_date
      });
    }

    let itemsTableHtml = "";
    
    if (confirmedHotels.length > 0) {
       confirmedHotels.forEach((hotelData: any) => {
         const hName = hotelMap.get(hotelData.hotel_id) || "Bilinmeyen Otel";
         
         // Sadece bu otele ait kalemleri filtrele
         let hotelItems = [];
         if (hotelData.id === "legacy") {
           hotelItems = items || [];
         } else {
           hotelItems = (items || []).filter((item: any) => {
             if (item.description && item.description.includes(`[T:${hotelData.id}]`)) return true;
             if (item.hotel_id === hotelData.hotel_id || item.hotel_id === hotelData.id) return true;
             return false;
           });
         }
         
         const hotelTotal = hotelItems.reduce((acc: number, item: any) => acc + Number(item.total_price || item.total || 0), 0);
         
         itemsTableHtml += `
          <div style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #f1f5f9; padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
              <h4 style="margin: 0; color: #0f172a; font-size: 14px;">${hName}</h4>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">Giriş: ${formatDateStr(hotelData.check_in_date)} | Çıkış: ${formatDateStr(hotelData.check_out_date)}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <thead>
                <tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
                  <th style="padding: 10px 16px; text-align: left; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px;">Hizmet Detayı</th>
                  <th style="padding: 10px 16px; text-align: right; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px;">Miktar</th>
                  <th style="padding: 10px 16px; text-align: right; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px;">Birim Fiyat</th>
                  <th style="padding: 10px 16px; text-align: right; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px;">Toplam</th>
                </tr>
              </thead>
              <tbody>
                ${hotelItems.length > 0 ? hotelItems.map((item: any) => {
                  const subCatStr = item.sub_category || "";
                  const mainCatStr = item.main_category || "";
                  
                  const resolvedSub = isUUID(subCatStr) ? categoryMap.get(subCatStr) : subCatStr;
                  const resolvedMain = isUUID(mainCatStr) ? categoryMap.get(mainCatStr) : mainCatStr;
                  
                  const finalName = resolvedSub || resolvedMain || "Diğer";

                  return `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 16px; color: #1e293b; font-weight: 500;">
                      ${finalName}
                    </td>
                    <td style="padding: 10px 16px; text-align: right; color: #334155;">${item.unit_quantity} x ${item.sefer || 1}</td>
                    <td style="padding: 10px 16px; text-align: right; color: #334155; white-space: nowrap;">${curSym}${fmtMoney(item.unit_price)}</td>
                    <td style="padding: 10px 16px; text-align: right; color: #0f172a; font-weight: 600; white-space: nowrap;">${curSym}${fmtMoney(item.total_price || item.total)}</td>
                  </tr>
                  `;
                }).join("") : `<tr><td colspan="4" style="padding: 10px 16px; text-align: center; color: #94a3b8;">Bu otele ait kalem bulunmuyor</td></tr>`}
              </tbody>
              <tfoot>
                <tr style="background-color: #f8fafc;">
                  <td colspan="3" style="padding: 12px 16px; text-align: right; font-weight: 700; color: #0f172a; font-size: 13px;">TOPLAM:</td>
                  <td style="padding: 12px 16px; text-align: right; font-weight: 800; color: #0f172a; font-size: 14px; white-space: nowrap;">
                    ${curSym}${fmtMoney(hotelTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
         `;
       });
    } else {
       itemsTableHtml = `<p style="color:#64748b; font-size:13px; text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px;">Konfirme edilen otel bulunamadı.</p>`;
    }

    const notificationTitle = `✅ Sistemden Teklif Onaylandı: ${quote.reference}`;
    const approvalTypeBadge = confirmedBy?.type === "customer_link" 
      ? `<span style="background-color: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; border: 1px solid #34d399;">Müşteri (Link)</span>`
      : `<span style="background-color: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; border: 1px solid #bfdbfe;">Sistem İçi</span>`;

    const notificationHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #f1f5f9; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 24px; letter-spacing: -0.5px;">Teklif Başarıyla Onaylandı</h2>
          <p style="color: #64748b; margin: 0; font-size: 14px;">Bu teklif ${confirmedBy?.type === 'customer_link' ? 'müşteri tarafından link üzerinden' : 'sistem üzerinden'} konfirme edilerek projelere aktarılmıştır.</p>
        </div>

        <!-- Meta Info -->
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 140px; font-weight: 500;">Referans:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${quote.reference}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Müşteri / Acente / Firma:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${agencyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Proje Sorumlusu:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${pmName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Onay Tipi:</td>
              <td style="padding: 8px 0;">${approvalTypeBadge}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 500;">İşlemi Yapan:</td>
              <td style="padding: 8px 0; color: #2563eb; font-weight: 600;">${confirmedByName}</td>
            </tr>
          </table>
        </div>

        <!-- Sales Details -->
        <div>
          <h3 style="color: #0f172a; font-size: 16px; margin: 0 0 16px 0; padding-left: 8px; border-left: 4px solid #3b82f6;">Onaylanan Oteller & Detaylar</h3>
          ${itemsTableHtml}
        </div>

        <div style="margin-top: 32px; text-align: center; padding-top: 24px; border-top: 1px solid #f1f5f9;">
          <a href="${appUrl}/projects" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">Projeye Git</a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">Bu e-posta otomatik olarak gönderilmiştir.</p>
        </div>
      </div>
    `;

    // Send Emails
    const { data: settingsData } = await admin
      .from("settings")
      .select("value")
      .eq("key", "general_settings")
      .maybeSingle();

    let notificationEmail = null;
    if (settingsData && settingsData.value) {
      let parsed = settingsData.value;
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch(e) {}
      }
      if (parsed && parsed.mailNotificationEmail) {
        notificationEmail = parsed.mailNotificationEmail;
      }
    }

    const sentEmails = new Set<string>();

    if (notificationEmail && !sentEmails.has(notificationEmail)) {
      // Virgülle ayrılmış birden fazla mail olabilir diye kontrol edebiliriz ama varsayılan olarak tekil string
      const emails = notificationEmail.split(",").map((e: string) => e.trim()).filter(Boolean);
      for (const email of emails) {
        if (!sentEmails.has(email)) {
          await sendMail({
            to: email,
            subject: notificationTitle,
            html: notificationHtml
          }).catch(err => console.error("Notification email send error:", err));
          sentEmails.add(email);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Quote Confirmation Notification API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
