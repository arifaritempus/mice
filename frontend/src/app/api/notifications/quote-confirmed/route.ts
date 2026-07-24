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
    const { quoteId, confirmedBy } = await req.json();

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
    let pmName = "Sistem";
    let creatorEmail = null;
    if (quote.created_by) {
      const { data: creator } = await admin
        .from("users")
        .select("first_name, last_name, email")
        .eq("id", quote.created_by)
        .single();
      if (creator) {
        pmName = `${creator.first_name || ""} ${creator.last_name || ""}`.trim() || "Sistem";
        creatorEmail = creator.email;
      }
    }

    const confirmedByName = confirmedBy?.name || "Sistem Kullanıcısı";
    const agencyName = quote.agencies?.name || quote.company_name || "Bilinmiyor";
    const hotelName = quote.hotels?.name || "Çoklu Otel / Belirtilmemiş";
    const currency = quote.currency || quote.main_currency || "EUR";
    const curSym = currency === "TRY" || currency === "TL" ? "₺" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "€";
    
    const fmtMoney = (val: number) => {
      return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
    };

    // Generate Items Table HTML
    let itemsTableHtml = "";
    if (items && items.length > 0) {
      itemsTableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 12px 8px; text-align: left; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px;">Hizmet Detayı</th>
              <th style="padding: 12px 8px; text-align: right; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px;">Miktar</th>
              <th style="padding: 12px 8px; text-align: right; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px;">Birim Fiyat</th>
              <th style="padding: 12px 8px; text-align: right; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px;">Toplam</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 8px; color: #1e293b; font-weight: 500;">
                  ${item.sub_category || item.main_category || "Diğer"}
                  ${item.description ? `<br><span style="font-size: 11px; color: #64748b; font-weight: normal;">${item.description}</span>` : ""}
                </td>
                <td style="padding: 12px 8px; text-align: right; color: #334155;">${item.unit_quantity} x ${item.sefer || 1}</td>
                <td style="padding: 12px 8px; text-align: right; color: #334155; white-space: nowrap;">${curSym}${fmtMoney(item.unit_price)}</td>
                <td style="padding: 12px 8px; text-align: right; color: #0f172a; font-weight: 600; white-space: nowrap;">${curSym}${fmtMoney(item.total_price || item.total)}</td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 16px 8px; text-align: right; font-weight: 700; color: #0f172a; font-size: 14px;">GENEL TOPLAM:</td>
              <td style="padding: 16px 8px; text-align: right; font-weight: 800; color: #0f172a; font-size: 16px; white-space: nowrap; background-color: #f8fafc;">
                ${curSym}${fmtMoney(quote.total_amount || 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    const notificationTitle = `✅ Sistemden Teklif Onaylandı: ${quote.reference}`;
    const notificationHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #f1f5f9; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 24px; letter-spacing: -0.5px;">Teklif Başarıyla Onaylandı</h2>
          <p style="color: #64748b; margin: 0; font-size: 14px;">Bu teklif sistem üzerinden konfirme edilerek projelere aktarılmıştır.</p>
        </div>

        <!-- Meta Info -->
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 140px; font-weight: 500;">Referans:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${quote.reference}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Müşteri / Acente:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${agencyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Ana Otel:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${hotelName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Proje Sorumlusu:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${pmName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 500;">İşlemi Yapan:</td>
              <td style="padding: 8px 0; color: #2563eb; font-weight: 600;">${confirmedByName}</td>
            </tr>
          </table>
        </div>

        <!-- Sales Details -->
        <div>
          <h3 style="color: #0f172a; font-size: 16px; margin: 0 0 12px 0; padding-left: 8px; border-left: 4px solid #3b82f6;">Satış Detayları</h3>
          ${itemsTableHtml}
        </div>

        <div style="margin-top: 32px; text-align: center; padding-top: 24px; border-top: 1px solid #f1f5f9;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6002'}/projects" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">Projeye Git</a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">Bu e-posta otomatik olarak gönderilmiştir.</p>
        </div>
      </div>
    `;

    // Send Emails
    const { data: admins } = await admin
      .from("users")
      .select("id, email")
      .eq("role", "super_admin");

    const sentEmails = new Set<string>();

    if (creatorEmail) {
      await sendMail({
        to: creatorEmail,
        subject: notificationTitle,
        html: notificationHtml
      }).catch(err => console.error("Creator email send error:", err));
      sentEmails.add(creatorEmail);
    }

    if (admins) {
      for (const a of admins) {
        if (a.email && !sentEmails.has(a.email)) {
          await sendMail({
            to: a.email,
            subject: notificationTitle,
            html: notificationHtml
          }).catch(err => console.error("Admin email send error:", err));
          sentEmails.add(a.email);
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
