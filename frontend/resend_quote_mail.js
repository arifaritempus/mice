require('dotenv').config({ path: '.env' });
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lnyhtuudivwsbedxbauw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueWh0dXVkaXZ3c2JlZHhiYXV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc5MzI4MiwiZXhwIjoyMTAwMzY5MjgyfQ.GsYUWvBlCu0MRQHG7R9ed5U-BsjHrl5-XvmPhykTuus';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const quoteId = 'f04f45ef-3b3a-4322-939f-37afc1e3f2b2';
  const targetEmail = 'test-7mr6uz6o6@srv1.mail-tester.com';
  const appUrl = "http://localhost:6002";
  
  console.log("Fetching quote...");
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*, agencies(name), hotels(name)")
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) {
    console.error("Quote fetch error:", quoteError);
    return;
  }

  // Fetch quote items
  const { data: items } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: true });

  let pmName = "Atanmamış";
  let opManagers = quote.operation_managers;
  if (typeof opManagers === "string") {
    try { opManagers = JSON.parse(opManagers); } catch(e) {}
  }

  if (opManagers && Array.isArray(opManagers) && opManagers.length > 0) {
    const { data: managers } = await supabase
      .from("users")
      .select("full_name")
      .in("id", opManagers);
    if (managers && managers.length > 0) {
      pmName = managers.map(m => m.full_name || "Bilinmeyen Kullanıcı").join(", ");
    }
  }

  if (quote.created_by) {
    const { data: creator } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", quote.created_by)
      .single();
    if (creator) {
      if (pmName === "Atanmamış") {
        pmName = creator.full_name || "Atanmamış";
      }
    }
  }

  const confirmedByName = "Sistem Kullanıcısı";
  const agencyName = quote.company_name && quote.agencies?.name 
    ? `${quote.agencies.name} - ${quote.company_name}` 
    : quote.company_name || quote.agencies?.name || "Bilinmiyor";

  // Fetch hotels
  const { data: allHotels } = await supabase.from("hotels").select("id, name");
  const hotelMap = new Map();
  if (allHotels) {
    allHotels.forEach((h) => hotelMap.set(h.id, h.name));
  }

  const currency = quote.currency || quote.main_currency || "EUR";
  const curSym = currency === "TRY" || currency === "TL" ? "₺" : currency === "USD" ? "$" : currency === "GBP" ? "£" : "€";
  
  const fmtMoney = (val) => {
    return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
  };

  let hotelsData = [];
  if (typeof quote.hotels_data === "string") {
    try { hotelsData = JSON.parse(quote.hotels_data); } catch(e) {}
  } else if (Array.isArray(quote.hotels_data)) {
    hotelsData = quote.hotels_data;
  }
  
  let confirmedHotels = hotelsData.filter((h) => h.is_confirmed || h.hotel_status === "KONFİRME");
  
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
     confirmedHotels.forEach((hotelData) => {
       const hName = hotelMap.get(hotelData.hotel_id) || "Bilinmeyen Otel";
       const hotelItems = (items || []).filter(item => item.hotel_id === hotelData.hotel_id);
       const hotelTotal = hotelItems.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

       itemsTableHtml += `
        <div style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
            <h4 style="margin: 0; color: #0f172a; font-size: 15px;">${hName}</h4>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background-color: #ffffff; border-bottom: 2px solid #f1f5f9;">
                <th style="padding: 10px 16px; text-align: left; color: #64748b; font-weight: 600;">Kalem</th>
                <th style="padding: 10px 16px; text-align: center; color: #64748b; font-weight: 600;">Adet</th>
                <th style="padding: 10px 16px; text-align: right; color: #64748b; font-weight: 600;">Birim Fiyat</th>
                <th style="padding: 10px 16px; text-align: right; color: #64748b; font-weight: 600;">Toplam</th>
              </tr>
            </thead>
            <tbody>
              ${hotelItems.length > 0 ? hotelItems.map(item => {
                const itemTotal = Number(item.total) || 0;
                const unitPrice = item.quantity ? itemTotal / item.quantity : itemTotal;
                return `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 16px; color: #334155; font-weight: 500;">${item.name || "-"}</td>
                    <td style="padding: 10px 16px; text-align: center; color: #64748b;">${item.quantity || 1}</td>
                    <td style="padding: 10px 16px; text-align: right; color: #64748b;">${curSym}${fmtMoney(unitPrice)}</td>
                    <td style="padding: 10px 16px; text-align: right; color: #0f172a; font-weight: 600;">${curSym}${fmtMoney(itemTotal)}</td>
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
  const approvalTypeBadge = `<span style="background-color: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; border: 1px solid #bfdbfe;">Sistem İçi</span>`;

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

  console.log("Fetching settings...");
  const { data: settingsData } = await supabase.from('settings').select('*');
  const settings = {};
  settingsData?.forEach(setting => {
    try {
      if (typeof setting.value === 'string') {
        settings[setting.key] = JSON.parse(setting.value);
      } else {
        settings[setting.key] = setting.value;
      }
    } catch (e) {
      settings[setting.key] = setting.value;
    }
  });

  const generalSettings = settings?.general_settings;
  const smtp_host = generalSettings.smtp_host || generalSettings.smtpServer;
  const smtp_port = generalSettings.smtp_port || generalSettings.smtpPort;
  const smtp_username = generalSettings.smtp_username || generalSettings.smtpUser;
  const smtp_password = generalSettings.smtp_password || generalSettings.smtpPass;
  const mail_from_email = generalSettings.mail_from_email || generalSettings.mailFromEmail;
  const mail_from_name = generalSettings.mail_from_name || generalSettings.mailFromName;

  const port = parseInt(smtp_port || "587");
  const transporter = nodemailer.createTransport({
    host: smtp_host,
    port: port,
    secure: port === 465,
    auth: {
      user: smtp_username,
      pass: smtp_password,
    },
  });

  console.log("Sending mail to:", targetEmail);
  await transporter.sendMail({
    from: `"${mail_from_name || "Sistem"}" <${mail_from_email}>`,
    to: targetEmail,
    subject: notificationTitle,
    html: notificationHtml,
  });
  console.log("Mail sent successfully!");
}

main().catch(console.error);
