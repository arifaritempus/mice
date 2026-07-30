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

    const { projectId, beforeStats, afterStats, updatedBy } = await req.json();

    if (!projectId || !beforeStats || !afterStats) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const admin = getAdminClient();

    // Fetch project
    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("*, agencies(name)")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("Project fetch error:", projectError);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch project manager
    let pmName = "Sistem";
    let creatorEmail = null;
    if (project.created_by) {
      const { data: creator } = await admin
        .from("users")
        .select("first_name, last_name, email")
        .eq("id", project.created_by)
        .single();
      if (creator) {
        pmName = `${creator.first_name || ""} ${creator.last_name || ""}`.trim() || "Sistem";
        creatorEmail = creator.email;
      }
    }

    const updatedByName = updatedBy?.name || "Sistem Kullanıcısı";
    const agencyName = project.agencies?.name || project.company_name || "Bilinmiyor";
    const currency = project.currency || "EUR";
    const curSym = currency === "TRY" || currency === "TL" ? "₺" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "€";

    const fmtMoney = (val: number) => {
      return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
    };

    const getDeltaColor = (before: number, after: number, reverseLogic: boolean = false) => {
      const diff = after - before;
      if (Math.abs(diff) < 0.01) return "#64748b"; // neutral
      if (diff > 0) return reverseLogic ? "#ef4444" : "#10b981"; // positive change = green (or red if cost)
      return reverseLogic ? "#10b981" : "#ef4444"; // negative change = red (or green if cost)
    };

    const getDeltaIcon = (before: number, after: number) => {
      const diff = after - before;
      if (Math.abs(diff) < 0.01) return "-";
      return diff > 0 ? "▲" : "▼";
    };

    const fmtDiff = (before: number, after: number) => {
      const diff = after - before;
      if (Math.abs(diff) < 0.01) return "0.00";
      return (diff > 0 ? "+" : "") + fmtMoney(diff);
    };

    const formatPercentDiff = (before: number, after: number) => {
      const diff = after - before;
      if (Math.abs(diff) < 0.01) return "0.00 pts";
      return (diff > 0 ? "+" : "") + diff.toFixed(2) + " pts";
    };

    // Calculate margins
    const beforeMargin = beforeStats.sales > 0 ? ((beforeStats.sales - beforeStats.costs) / beforeStats.sales) * 100 : 0;
    const afterMargin = afterStats.sales > 0 ? ((afterStats.sales - afterStats.costs) / afterStats.sales) * 100 : 0;

    const notificationTitle = `🔄 Proje Güncellendi: ${project.name || project.reference}`;
    const notificationHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header Banner -->
        <div style="background-color: #0f172a; padding: 32px 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0 0 8px 0; font-size: 24px; letter-spacing: -0.5px;">Proje Güncellendi</h2>
          <p style="color: #94a3b8; margin: 0; font-size: 14px;"><strong>${project.name || project.reference}</strong> projesinin finansal verilerinde değişiklik yapıldı.</p>
        </div>

        <div style="padding: 24px;">
          <!-- Meta Info -->
          <div style="margin-bottom: 24px; font-size: 13px;">
            <p style="margin: 0 0 4px 0; color: #475569;"><strong>Müşteri:</strong> ${agencyName}</p>
            <p style="margin: 0 0 4px 0; color: #475569;"><strong>Sorumlu:</strong> ${pmName}</p>
            <p style="margin: 0; color: #475569;"><strong>Güncelleyen:</strong> <span style="color: #2563eb;">${updatedByName}</span></p>
          </div>

          <!-- Before/After Table -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
            <thead>
              <tr>
                <th style="padding: 16px; text-align: left; background-color: #ffffff; border-bottom: 2px solid #e2e8f0; border-right: 1px solid #e2e8f0;"></th>
                <th style="padding: 16px; text-align: center; background-color: #1e293b; color: #ffffff; border-top-left-radius: 8px; width: 33%;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; margin-bottom: 4px;">Önceki Durum</div>
                </th>
                <th style="padding: 16px; text-align: center; background-color: #0ea5e9; color: #ffffff; border-top-right-radius: 8px; width: 33%;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; margin-bottom: 4px;">Sonraki Durum</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- Sales -->
              <tr>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; background-color: #f8fafc;">
                  <strong style="color: #0f172a; display: block;">Toplam Satış</strong>
                </td>
                <td style="padding: 16px; text-align: center; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155;">
                  ${curSym}${fmtMoney(beforeStats.sales)}
                </td>
                <td style="padding: 16px; text-align: center; border-bottom: 1px solid #e2e8f0; background-color: #f0f9ff;">
                  <strong style="color: #0f172a; display: block; font-size: 15px;">${curSym}${fmtMoney(afterStats.sales)}</strong>
                  <span style="color: ${getDeltaColor(beforeStats.sales, afterStats.sales, false)}; font-size: 12px; font-weight: 600;">
                    ${getDeltaIcon(beforeStats.sales, afterStats.sales)} ${fmtDiff(beforeStats.sales, afterStats.sales)}
                  </span>
                </td>
              </tr>
              
              <!-- Costs -->
              <tr>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; background-color: #f8fafc;">
                  <strong style="color: #0f172a; display: block;">Toplam Maliyet</strong>
                </td>
                <td style="padding: 16px; text-align: center; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155;">
                  ${curSym}${fmtMoney(beforeStats.costs)}
                </td>
                <td style="padding: 16px; text-align: center; border-bottom: 1px solid #e2e8f0; background-color: #f0f9ff;">
                  <strong style="color: #0f172a; display: block; font-size: 15px;">${curSym}${fmtMoney(afterStats.costs)}</strong>
                  <span style="color: ${getDeltaColor(beforeStats.costs, afterStats.costs, true)}; font-size: 12px; font-weight: 600;">
                    ${getDeltaIcon(beforeStats.costs, afterStats.costs)} ${fmtDiff(beforeStats.costs, afterStats.costs)}
                  </span>
                </td>
              </tr>

              <!-- Profit -->
              <tr>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; background-color: #f8fafc;">
                  <strong style="color: #0f172a; display: block;">Kar</strong>
                </td>
                <td style="padding: 16px; text-align: center; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155;">
                  ${curSym}${fmtMoney(beforeStats.sales - beforeStats.costs)}
                </td>
                <td style="padding: 16px; text-align: center; border-bottom: 1px solid #e2e8f0; background-color: #f0f9ff;">
                  <strong style="color: #0f172a; display: block; font-size: 15px;">${curSym}${fmtMoney(afterStats.sales - afterStats.costs)}</strong>
                  <span style="color: ${getDeltaColor(beforeStats.sales - beforeStats.costs, afterStats.sales - afterStats.costs, false)}; font-size: 12px; font-weight: 600;">
                    ${getDeltaIcon(beforeStats.sales - beforeStats.costs, afterStats.sales - afterStats.costs)} ${fmtDiff(beforeStats.sales - beforeStats.costs, afterStats.sales - afterStats.costs)}
                  </span>
                </td>
              </tr>

              <!-- Margin -->
              <tr>
                <td style="padding: 16px; border-right: 1px solid #e2e8f0; background-color: #f8fafc;">
                  <strong style="color: #0f172a; display: block;">Kar Marjı</strong>
                </td>
                <td style="padding: 16px; text-align: center; border-right: 1px solid #e2e8f0; color: #334155;">
                  %${beforeMargin.toFixed(2)}
                </td>
                <td style="padding: 16px; text-align: center; background-color: #f0f9ff;">
                  <strong style="color: #0f172a; display: block; font-size: 15px;">%${afterMargin.toFixed(2)}</strong>
                  <span style="color: ${getDeltaColor(beforeMargin, afterMargin, false)}; font-size: 12px; font-weight: 600;">
                    ${getDeltaIcon(beforeMargin, afterMargin)} ${formatPercentDiff(beforeMargin, afterMargin)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 32px; text-align: center;">
            <a href="${appUrl}/projects/${project.id}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">Proje Detayını Görüntüle</a>
          </div>
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

    if (creatorEmail) {
      await sendMail({
        to: creatorEmail,
        subject: notificationTitle,
        html: notificationHtml
      });
      sentEmails.add(creatorEmail);
    }

    if (notificationEmail && !sentEmails.has(notificationEmail)) {
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
    console.error("Project Update Notification API Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
