export interface RequestMailData {
  reference: string;
  hotel_name: string;
  company_name: string;
  date_range: string;
  nights: number;
  room_pax: string;
  events_html: string;
  notes: string;
  reply_to_email: string;
  cc_addresses?: string;
  system_company_name: string;
  system_company_phone: string;
  system_company_email: string;
}

export function getRequestMailHtml(data: RequestMailData): string {
  
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TALEP</title>
  <style>
    body { font-family: 'Avenir Next Medium', 'Avenir Next', Avenir, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f9; margin: 0; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 15px; color: #374151; margin-bottom: 25px; line-height: 1.6; }
    .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px; }
    .row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding: 18px 0; }
    .row:last-child { border-bottom: none; }
    .label { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 15px; }
    .value { font-size: 15px; font-weight: 700; color: #0f172a; text-align: right; line-height: 1.4; }
    .events { margin-top: 25px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
    .event-item { margin-bottom: 15px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px; }
    .event-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .event-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; margin-right: 8px; margin-bottom: 8px; border: 1px solid #bfdbfe; }
    .event-note { display: block; font-size: 13px; color: #64748b; margin-top: 6px; line-height: 1.5; padding-left: 10px; border-left: 3px solid #e2e8f0; white-space: pre-wrap; }
    .notes-box { background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; font-size: 14px; color: #92400e; margin-bottom: 30px; line-height: 1.5; white-space: pre-wrap; }
    .cta { text-align: center; margin-top: 35px; }
    .btn { display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; transition: background 0.2s; }
    .btn:hover { background: #1e293b; }
    .footer { text-align: center; padding: 25px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #f8fafc; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="greeting">
        Sayın <strong>${data.hotel_name}</strong> Yetkilisi,<br><br>
        Aşağıda detayları belirtilen grubumuz için tesisinizin müsaitlik durumunu ve fiyat teklifinizi rica ederiz.
      </div>
      
      <div class="details-box">
        <div class="row">
          <span class="label">REFERANS</span>
          <span class="value">#${data.reference}</span>
        </div>
        <div class="row">
          <span class="label">FİRMA / SEKTÖR</span>
          <span class="value">${data.company_name || "-"}</span>
        </div>
        <div class="row">
          <span class="label">TARİH ARALIĞI</span>
          <span class="value">${data.date_range}</span>
        </div>
        <div class="row">
          <span class="label">GECELEME</span>
          <span class="value">${data.nights} Gece</span>
        </div>
        <div class="row">
          <span class="label">ODA / KİŞİ</span>
          <span class="value">${data.room_pax}</span>
        </div>
        
        ${data.events_html ? `
        <div class="events">
          <span class="label" style="display:block; margin-bottom: 12px;">İSTENEN ETKİNLİKLER</span>
          ${data.events_html}
        </div>
        ` : ''}
      </div>
      
      ${data.notes ? `
      <div class="notes-box">
        <strong>Özel Notlar:</strong> ${data.notes}
      </div>
      ` : ''}

      <div class="cta">
        <a href="mailto:${data.reply_to_email}?${data.cc_addresses ? `cc=${data.cc_addresses}&` : ''}subject=RE: TALEP #${data.reference} - ${data.hotel_name}" class="btn">Yanıtla & Fiyat İlet</a>
      </div>
    </div>
    <div class="footer">
      Bu e-posta <strong>${data.system_company_name || "Sistem"}</strong> üzerinden <a href="https://www.codeicon.co/" target="_blank" style="color: inherit; text-decoration: underline; font-weight: 600;">CODEICON</a> ile otomatik olarak gönderilmiştir.<br>
      Acente İletişim: ${data.system_company_phone || "-"} | <a href="mailto:${data.system_company_email || data.reply_to_email}" style="color: inherit; text-decoration: none;">${data.system_company_email || data.reply_to_email}</a>
    </div>
  </div>
</body>
</html>`;
}
