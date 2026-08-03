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
  <title>Müsaitlik ve Fiyat Teklifi Talebi</title>
  <style>
    body {
      margin: 0;
      padding: 30px 10px;
      background-color: #f4f6f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
    }
    .body-content {
      padding: 32px 30px;
    }
    .greeting {
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .detail-list {
      border-left: 3px solid #0284c7;
      padding-left: 14px;
      margin-bottom: 20px;
    }
    .detail-item {
      margin-bottom: 8px;
      font-size: 13.5px;
    }
    .detail-item:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      color: #64748b;
      font-weight: 600;
      display: inline-block;
      width: 130px;
    }
    .detail-value {
      color: #0f172a;
      font-weight: 700;
    }
    .note-box {
      background: #f8fafc;
      border-left: 3px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 20px;
    }
    .note-title {
      font-size: 11px;
      font-weight: 700;
      color: #b45309;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .note-text {
      font-size: 13px;
      color: #451a03;
      line-height: 1.4;
      white-space: pre-wrap;
    }
    .footer {
      background: #fafafa;
      border-top: 1px solid #f1f5f9;
      padding: 18px 30px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="body-content">
      
      <!-- Doğrudan Otel Hitabı -->
      <div class="greeting">
        Sayın <strong>${data.hotel_name}</strong> Yetkilisi,<br><br>
        Öncelikle tüm ekibe keyifli mesailer diliyoruz.<br>
        Aşağıda detayları belirtilen grubumuz için tesisinizin müsaitlik durumunu ve fiyat teklifinizi rica ederiz.
      </div>

      <!-- Grup Detayları ve İlk Sırada Ref No -->
      <div class="section-title">GRUP DETAYLARI</div>
      <div class="detail-list">
        <div class="detail-item">
          <span class="detail-label">Talep Ref No:</span>
          <span class="detail-value" style="color: #0284c7;">#${data.reference}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Firma / Sektör:</span>
          <span class="detail-value">${data.company_name || "-"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Tarih Aralığı:</span>
          <span class="detail-value">${data.date_range}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Geceleme:</span>
          <span class="detail-value">${data.nights} Gece</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Oda / Kişi:</span>
          <span class="detail-value">${data.room_pax}</span>
        </div>
      </div>

      ${data.notes ? `
      <div class="note-box">
        <div class="note-title">Özel Notlar</div>
        <div class="note-text">${data.notes}</div>
      </div>
      ` : ''}

      ${data.events_html ? `
      <div class="section-title">ETKİNLİK VE PROGRAM TALEPLERİ</div>
      <div style="margin-top: 8px;">
        ${data.events_html}
      </div>
      ` : ''}

    </div>

    <div class="footer">
      Bu e-posta <strong>${data.system_company_name || "Sistem"}</strong> adına 
      <a href="https://www.codeicon.co/" target="_blank" style="color: #0284c7; font-weight: 600; text-decoration: none;">CODEICON</a> 
      altyapısı ile otomatik oluşturulmuştur.<br>
      İletişim: ${data.system_company_phone || "-"} | 
      <a href="mailto:${data.system_company_email || data.reply_to_email}" style="color: #0284c7; text-decoration: none;">${data.system_company_email || data.reply_to_email}</a>
    </div>
  </div>

</body>
</html>`;
}
