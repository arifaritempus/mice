import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/mail";

function getAdminClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL) as string;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase configuration missing (URL or Service Role Key).");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const getFutureDateRange = (days: number) => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  
  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);
  
  return { start: start.toISOString(), end: end.toISOString() };
};

const formatDate = (dateStr: string, withTime = false) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return withTime ? d.toLocaleString("tr-TR") : d.toLocaleDateString("tr-TR");
  } catch (e) {
    return dateStr;
  }
};

const formatMoney = (val: number | string | undefined | null, currency: string = "") => {
  if (val === undefined || val === null) return "-";
  const num = Number(val);
  if (isNaN(num)) return "-";
  return `${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2 }).format(num)} ${currency}`.trim();
};

export async function GET(req: Request) {
  try {
    const admin = getAdminClient();
    const notificationsToInsert: any[] = [];
    const emailsToSend: { to: string; subject: string; html: string }[] = [];
    const notificationHtmlStyle = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);`;

    // Fetch dependencies
    const { data: superAdmins } = await admin.from("users").select("id, email, full_name").eq("role", "super_admin");
    const adminTargets = superAdmins || [];
    
    const { data: allUsers } = await admin.from("users").select("id, full_name, email");
    const userMap = new Map((allUsers || []).map((u: any) => [u.id, u.full_name || u.email || "Bilinmiyor"]));

    let systemNotificationEmail = "";
    const { data: settingsData } = await admin.from("settings").select("value").eq("key", "general_settings").single();
    if (settingsData && settingsData.value) {
       const gs = typeof settingsData.value === 'string' ? JSON.parse(settingsData.value) : settingsData.value;
       systemNotificationEmail = gs.mailNotificationEmail || gs.mail_notification_email || "";
    }

    const { start: in3DaysStart, end: in3DaysEnd } = getFutureDateRange(3);
    const { start: tomorrowStart, end: tomorrowEnd } = getFutureDateRange(1);

    // Helpers
    const buildTable = (fields: {label: string, value: string | number | undefined, highlight?: boolean, highlightColor?: string}[]) => {
      let html = `<table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px;">`;
      const validFields = fields.filter(f => f.value !== undefined && f.value !== null && f.value !== "" && f.value !== "-" && f.value !== "0" && f.value !== 0);
      validFields.forEach((f, i) => {
        const color = f.highlightColor || (f.highlight ? '#b91c1c' : '#0f172a');
        const weight = f.highlight ? '700' : '600';
        const fontSize = f.highlight ? '15px' : '13px';
        html += `<tr style="border-top: ${i === 0 ? 'none' : '1px solid #e2e8f0'};">
          <td style="padding: 10px 0; color: #64748b; width: 140px; font-weight: 500;">${f.label}:</td>
          <td style="padding: 10px 0; color: ${color}; font-weight: ${weight}; font-size: ${fontSize};">${f.value}</td>
        </tr>`;
      });
      html += `</table>`;
      return html;
    };

    const buildEmailHtml = (title: string, desc: string, titleColor: string, fields: any[], link: string, linkText: string, bgColor = "#f8fafc") => {
      return `
        <div style="${notificationHtmlStyle}">
          <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #f1f5f9; margin-bottom: 24px;">
            <h2 style="color: ${titleColor}; margin: 0 0 8px 0; font-size: 22px; letter-spacing: -0.5px;">${title}</h2>
            <p style="color: #64748b; margin: 0; font-size: 14px;">${desc}</p>
          </div>
          <div style="background-color: ${bgColor}; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
            ${buildTable(fields)}
          </div>
          <div style="text-align: center;">
            <a href="${link}" style="display:inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">${linkText}</a>
          </div>
        </div>
      `;
    };

    const buildModalHtml = (desc: string, fields: any[]) => {
      return `
        <div style="font-family: inherit;">
          <p style="margin-top: 0; color: #475569; font-size: 14px;">${desc}</p>
          ${buildTable(fields)}
        </div>
      `;
    };

    const pushNotification = (title: string, desc: string, fields: any[], link: string, linkText: string, type: string, titleColor: string, bgColor: string, extraUserIds: string[] = [], extraEmails: string[] = []) => {
      const emailHtml = buildEmailHtml(title, desc, titleColor, fields, link, linkText, bgColor);
      const modalHtml = buildModalHtml(desc, fields);
      
      const sentUserIds = new Set<string>();
      const sentEmails = new Set<string>();

      for (const user of allUsers || []) {
        notificationsToInsert.push({ user_id: user.id, title, message: modalHtml, type, action_url: new URL(link).pathname });
      }
      
      const allTargetEmails = [systemNotificationEmail, ...extraEmails];
      for (const email of allTargetEmails) {
        if (!email || sentEmails.has(email)) continue;
        emailsToSend.push({ to: email, subject: title, html: emailHtml });
        sentEmails.add(email);
      }
    };

    const host = req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const appUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:6002");

    // --- 1. FATURALAR ---
    const { data: invoices } = await admin.from("invoices").select("*").gte("due_date", in3DaysStart).lte("due_date", in3DaysEnd).not("status", "in", '("completed","paid")');
    if (invoices) {
      for (const inv of invoices) {
        const typeLabel = inv.type === 'income' ? 'Tahsilat' : 'Ödeme';
        const meta = typeof inv.metadata === 'object' ? inv.metadata : {};
        const fields = [
          { label: "Türü", value: typeLabel },
          { label: "Belge No", value: inv.invoice_no },
          { label: "Müşteri / Firma", value: inv.contact_name },
          { label: "Proje", value: meta?.project_name },
          { label: "Otel / Hizmet", value: meta?.hotel_name },
          { label: "Sorumlu Kişi", value: inv.created_by ? userMap.get(inv.created_by) : "-" },
          { label: "Açıklama", value: inv.notes },
          { label: "Bütçe / Tutar", value: formatMoney(inv.total, inv.currency), highlight: true, highlightColor: "#b91c1c" },
          { label: "Vade Tarihi", value: formatDate(inv.due_date), highlight: true, highlightColor: "#1e40af" }
        ];
        
        pushNotification(
          `🚨 Vadesi Yaklaşan ${typeLabel}`,
          `Aşağıda detayları verilen <strong>${typeLabel}</strong> işleminin vadesine sadece 3 gün kalmıştır.`,
          fields,
          `${appUrl}/accounting/invoices/${inv.type}/pending`,
          "Detayları Görüntüle ve İşlem Yap",
          "warning",
          "#1e40af",
          "#f8fafc"
        );
      }
    }

    // --- 2. MICE VE SEJOUR (Giriş/Çıkışlar) ---
    // Giriş (start_date)
    const { data: projectsIn } = await admin.from("projects").select("*").gte("start_date", tomorrowStart).lte("start_date", tomorrowEnd).neq("status", "cancelled");
    if (projectsIn) {
      for (const proj of projectsIn) {
        const fields = [
          { label: "Türü", value: "Proje Check-in (Giriş)" },
          { label: "Referans No", value: proj.reference },
          { label: "Proje / Grup Adı", value: proj.title },
          { label: "Müşteri / Firma", value: proj.company_name },
          { label: "Sorumlu Kişi", value: proj.created_by ? userMap.get(proj.created_by) : "-" },
          { label: "Kişi Sayısı (Pax)", value: proj.pax_count },
          { label: "Oda Sayısı", value: proj.room_count },
          { label: "Bütçe / Tutar", value: proj.budget ? formatMoney(proj.budget, "Döviz / Bütçe") : "-" },
          { label: "Giriş Tarihi", value: formatDate(proj.start_date), highlight: true, highlightColor: "#d97706" }
        ];
        
        pushNotification(
          `🏨 Proje Girişi Yaklaşıyor: ${proj.reference || proj.title}`,
          `<strong>${proj.title || proj.reference}</strong> projesi kapsamındaki grubun otel giriş tarihi <strong>YARIN</strong>'dır.`,
          fields,
          `${appUrl}/projects/view/${proj.id}`,
          "Projeyi İncele",
          "info",
          "#d97706",
          "#fffbeb"
        );
      }
    }

    // Çıkış (end_date)
    const { data: projectsOut } = await admin.from("projects").select("*").gte("end_date", tomorrowStart).lte("end_date", tomorrowEnd).neq("status", "cancelled");
    if (projectsOut) {
      for (const proj of projectsOut) {
        const fields = [
          { label: "Türü", value: "Proje Check-out (Çıkış)" },
          { label: "Referans No", value: proj.reference },
          { label: "Proje / Grup Adı", value: proj.title },
          { label: "Müşteri / Firma", value: proj.company_name },
          { label: "Sorumlu Kişi", value: proj.created_by ? userMap.get(proj.created_by) : "-" },
          { label: "Kişi Sayısı (Pax)", value: proj.pax_count },
          { label: "Oda Sayısı", value: proj.room_count },
          { label: "Bütçe / Tutar", value: proj.budget ? formatMoney(proj.budget, "Döviz / Bütçe") : "-" },
          { label: "Çıkış Tarihi", value: formatDate(proj.end_date), highlight: true, highlightColor: "#d97706" }
        ];
        
        pushNotification(
          `🏨 Proje Çıkışı Yaklaşıyor: ${proj.reference || proj.title}`,
          `<strong>${proj.title || proj.reference}</strong> projesi kapsamındaki grubun otel çıkış tarihi <strong>YARIN</strong>'dır.`,
          fields,
          `${appUrl}/projects/view/${proj.id}`,
          "Projeyi İncele",
          "info",
          "#d97706",
          "#fffbeb"
        );
      }
    }

    // --- 3. MARKETING GÖREVLERİ ---
    const { data: mktInteractions } = await admin.from("marketing_interactions").select("id, interaction_date, interaction_type, notes, status, user_id, marketing_clients(name)").gte("interaction_date", tomorrowStart).lte("interaction_date", tomorrowEnd).neq("status", "completed");
    if (mktInteractions) {
      for (const mkt of mktInteractions) {
        const clientName = (mkt.marketing_clients as any)?.name || "Bilinmeyen Firma/Müşteri";
        const fields = [
          { label: "Türü", value: `Pazarlama ${mkt.interaction_type || 'Görüşmesi'}` },
          { label: "Müşteri / Firma", value: clientName },
          { label: "Sorumlu Kişi", value: mkt.user_id ? userMap.get(mkt.user_id) : "-" },
          { label: "Alınan Notlar", value: mkt.notes },
          { label: "Görüşme Tarihi", value: formatDate(mkt.interaction_date, true), highlight: true, highlightColor: "#6d28d9" }
        ];
        
        pushNotification(
          `📅 Yaklaşan Pazarlama Randevusu: ${clientName}`,
          `<strong>YARIN</strong> için planlanmış bir pazarlama görüşmeniz/etkinliğiniz bulunmaktadır.`,
          fields,
          `${appUrl}/marketing`,
          "Pazarlama Paneline Git",
          "info",
          "#6d28d9",
          "#f5f3ff",
          mkt.user_id ? [mkt.user_id] : [],
          systemNotificationEmail ? [systemNotificationEmail] : []
        );
      }
    }

    // --- 4. OTEL VE BİLET OPSİYONLARI ---
    try {
      const { data: quotesOptions } = await admin.from("quotes").select("*").gte("option_date", tomorrowStart).lte("option_date", tomorrowEnd).neq("status", "approved");
      if (quotesOptions) {
        for (const qo of quotesOptions) {
          const typeStr = qo.quote_type === 'ticket' ? 'Bilet Teklifi / Opsiyonu' : 'Genel Teklif / Konaklama Opsiyonu';
          const fields = [
            { label: "Türü", value: typeStr },
            { label: "Referans No", value: qo.reference },
            { label: "Müşteri / Firma", value: qo.company_name },
            { label: "Sorumlu Kişi", value: qo.created_by ? userMap.get(qo.created_by) : "-" },
            { label: "Kişi Sayısı (Pax)", value: qo.pax_count },
            { label: "Oda Sayısı", value: qo.room_count },
            { label: "Bütçe / Tutar", value: qo.total_amount ? formatMoney(qo.total_amount, qo.currency || "") : "-" },
            { label: "Opsiyon Bitiş", value: formatDate(qo.option_date), highlight: true, highlightColor: "#b91c1c" }
          ];
          
          pushNotification(
            `🚨 Opsiyon Bitiş Uyarısı: ${qo.reference}`,
            `Aşağıdaki teklifin geçerlilik veya otel opsiyon süresi <strong>YARIN</strong> dolmaktadır.`,
            fields,
            `${appUrl}/quotes/${qo.id}/edit`,
            "Teklifi / Opsiyonu İncele",
            "warning",
            "#b91c1c",
            "#fef2f2"
          );
        }
      }
    } catch (ignore) {}

    // Insert Notifications
    if (notificationsToInsert.length > 0) {
      const { error: notifErr } = await admin.from("notifications").insert(notificationsToInsert);
      if (notifErr) console.error("Cron notification insert error:", notifErr);
    }

    // Send Emails
    let emailsSent = 0;
    for (const em of emailsToSend) {
      try {
        await sendMail({ to: em.to, subject: em.subject, html: em.html });
        emailsSent++;
      } catch (e) {
        console.error("Cron email send error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Daily notifications processed",
      notificationsInserted: notificationsToInsert.length,
      emailsSent
    });

  } catch (error: any) {
    console.error("Daily Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
