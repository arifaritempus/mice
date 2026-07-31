import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

interface MailOptions {
  to: string;
  cc?: string | string[];
  subject: string;
  html: string;
}

export async function sendMail(options: MailOptions) {
  try {
    // 1. Ayarları Supabase'den çek (Server side olduğu için admin yetkisi ile çekmeli)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );
    const { data: settingsData, error } = await supabaseAdmin.from('settings').select('*');
    if (error) throw error;

    const settings: any = {};
    settingsData?.forEach(setting => {
      try {
        if (typeof setting.value === 'string') {
          try {
            settings[setting.key] = JSON.parse(setting.value);
          } catch {
            settings[setting.key] = setting.value;
          }
        } else {
          settings[setting.key] = setting.value;
        }
      } catch (e) {
        settings[setting.key] = setting.value;
      }
    });

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
    const port = parseInt(smtp_port || "587");
    // Nodemailer'da secure: true sadece 465 (Implicit SSL) içindir.
    // 587 (STARTTLS) portu için secure: false olmalıdır.
    const isSecure = port === 465;

    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: port,
      secure: isSecure,
      auth: {
        user: smtp_username,
        pass: smtp_password,
      },
    });

    // 3. E-postayı gönder
    const info = await transporter.sendMail({
      from: `"${mail_from_name || "Sistem"}" <${mail_from_email}>`,
      to: options.to,
      cc: options.cc,
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
