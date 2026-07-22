import nodemailer from "nodemailer";
import { SettingsService } from "./supabaseService";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(options: MailOptions) {
  try {
    // 1. Ayarları Supabase'den çek
    const settings = await SettingsService.getSettings();
    const generalSettings = settings?.general_settings;

    if (!generalSettings) {
      throw new Error("Sistem ayarları bulunamadı.");
    }

    // Hem snake_case (eski) hem de camelCase (yeni) anahtarları destekle
    const smtp_host = generalSettings.smtp_host || generalSettings.smtpServer;
    const smtp_port = generalSettings.smtp_port || generalSettings.smtpPort;
    const smtp_username = generalSettings.smtp_username || generalSettings.smtpUser;
    const smtp_password = generalSettings.smtp_password || generalSettings.smtpPass;
    const smtp_secure = generalSettings.smtp_secure || (generalSettings.smtpSecure === "ssl" || generalSettings.smtpSecure === "tls" || generalSettings.smtpSecure === true);
    const mail_from_email = generalSettings.mail_from_email || generalSettings.mailFromEmail;
    const mail_from_name = generalSettings.mail_from_name || generalSettings.mailFromName;
    const mail_reply_to = generalSettings.mail_reply_to || generalSettings.mailReplyTo;

    if (!smtp_host || !smtp_username || !smtp_password || !mail_from_email) {
      throw new Error("Eksik SMTP yapılandırması.");
    }

    // 2. Nodemailer Transport oluştur
    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: parseInt(smtp_port || "587"),
      secure: smtp_secure ?? (smtp_port === "465"), // 465 is commonly secure, 587 is STARTTLS
      auth: {
        user: smtp_username,
        pass: smtp_password,
      },
    });

    // 3. E-postayı gönder
    const info = await transporter.sendMail({
      from: `"${mail_from_name || "Sistem"}" <${mail_from_email}>`,
      to: options.to,
      replyTo: mail_reply_to || mail_from_email,
      subject: options.subject,
      html: options.html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Mail gönderme hatası:", error);
    throw error;
  }
}
