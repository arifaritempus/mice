import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { getRequestMailHtml } from "@/lib/templates/requestMail";
import { SettingsService } from "@/lib/supabaseService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
        to, 
        cc, 
        subject, 
        requestData, 
        hotelData 
    } = body;

    if (!to) {
      return NextResponse.json(
        { message: "Alıcı (TO) adresi zorunludur." },
        { status: 400 }
      );
    }
    
    // Fallback için genel ayarlardan reply to bilgisini al
    const settings = await SettingsService.getSettings();
    const generalSettings = settings?.general_settings;
    const mail_reply_to = generalSettings?.mail_reply_to || generalSettings?.mail_from_email || "info@tempustravel.co";

    // E-posta HTML içeriğini oluştur
    const htmlContent = getRequestMailHtml({
      reference: requestData.reference || "-",
      hotel_name: hotelData.name || "Otel",
      company_name: requestData.company_name || "-",
      date_range: requestData.date_range || "-",
      nights: requestData.nights || 0,
      room_pax: requestData.room_pax || "-",
      events_html: requestData.events_html || "",
      notes: requestData.notes || "",
      reply_to_email: mail_reply_to,
      system_company_name: generalSettings?.companyName || generalSettings?.company_name || "",
      system_company_phone: generalSettings?.companyPhone || generalSettings?.company_phone || "",
      system_company_email: generalSettings?.companyEmail || generalSettings?.company_email || ""
    });

    // Konu başlığı formatı: Tarih Planı | Firma / Sektör Adı | Referans No | Genel Ayarlarda Tanımlı Firma Adı
    const baseSubject = subject || `${requestData.date_range} | ${requestData.company_name} | #${requestData.reference} | ${generalSettings?.companyName || generalSettings?.company_name || ""}`;
    const mailSubject = `📋 ${baseSubject}`;

    // E-postayı gönder
    const result = await sendMail({
      to,
      cc,
      subject: mailSubject,
      html: htmlContent
    });

    return NextResponse.json({
      success: true,
      message: "E-posta başarıyla gönderildi",
      messageId: result.messageId
    });
    
  } catch (error) {
    console.error("Mail gönderim hatası (send-request-mail):", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Mail gönderim hatası",
      },
      { status: 500 }
    );
  }
}
