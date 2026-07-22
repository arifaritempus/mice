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

    const {
      smtp_host,
      smtp_port,
      smtp_username,
      smtp_password,
      smtp_secure,
      mail_from_email,
      mail_from_name,
      mail_reply_to,
    } = generalSettings;

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
