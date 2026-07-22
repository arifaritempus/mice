const nodemailer = require('nodemailer');
const { supabase } = require('../config/database');

class EmailService {
  constructor() {
    this.transporter = null;
    this.setupTransporter();
  }

  setupTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      // Eğer SMTP bilgileri .env'de tanımlıysa onları kullan
      this.transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(port),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: user,
          pass: pass
        },
        tls: {
          rejectUnauthorized: false // Geliştirme ortamında sertifika hatalarını önlemek için
        }
      });
      console.log(`📧 E-posta taşıyıcısı yapılandırıldı: ${host}`);
    } else {
      // Bilgiler eksikse test hesabı (Ethereal) kullan
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER || 'test@example.com',
          pass: process.env.EMAIL_PASS || 'testpass'
        }
      });
      console.log('📧 E-posta taşıyıcısı test modunda (Ethereal) başlatıldı');
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@eventiq.com',
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ E-posta gönderildi:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ E-posta gönderme hatası:', error);
      throw error;
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Etkinlik kayıt onayı
  async sendRegistrationConfirmation(user, event, registration) {
    const subject = `Etkinlik Kayıt Onayı: ${event.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Etkinlik Kayıt Onayı</h2>
        <p>Merhaba ${user.full_name},</p>
        <p>${event.title} etkinliğine kaydınız başarıyla onaylanmıştır.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Etkinlik Detayları:</h3>
          <p><strong>Etkinlik:</strong> ${event.title}</p>
          <p><strong>Tarih:</strong> ${new Date(event.start_date).toLocaleDateString('tr-TR')}</p>
          <p><strong>Saat:</strong> ${new Date(event.start_date).toLocaleTimeString('tr-TR')}</p>
          <p><strong>Konum:</strong> ${event.location}</p>
          <p><strong>Kayıt No:</strong> ${registration.id}</p>
        </div>
        
        <p>Etkinlik günü görüşmek üzere!</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Etkinlik hatırlatması
  async sendEventReminder(user, event) {
    const subject = `Hatırlatma: ${event.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Etkinlik Hatırlatması</h2>
        <p>Merhaba ${user.full_name},</p>
        <p>Yarın katılacağınız etkinliği hatırlatmak istiyoruz:</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${event.title}</h3>
          <p><strong>Tarih:</strong> ${new Date(event.start_date).toLocaleDateString('tr-TR')}</p>
          <p><strong>Saat:</strong> ${new Date(event.start_date).toLocaleTimeString('tr-TR')}</p>
          <p><strong>Konum:</strong> ${event.location}</p>
        </div>
        
        <p>İyi eğlenceler!</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Şifre sıfırlama
  async sendPasswordReset(user, resetToken) {
    const subject = 'Şifre Sıfırlama';
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Şifre Sıfırlama</h2>
        <p>Merhaba ${user.full_name},</p>
        <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Şifremi Sıfırla
          </a>
        </div>
        
        <p>Bu link 1 saat geçerlidir.</p>
        <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Hoş geldin e-postası
  async sendWelcomeEmail(user) {
    const subject = 'EventIQ\'a Hoş Geldiniz!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">EventIQ\'a Hoş Geldiniz!</h2>
        <p>Merhaba ${user.full_name},</p>
        <p>EventIQ etkinlik yönetim platformuna kayıt olduğunuz için teşekkür ederiz.</p>
        
        <p>Platformumuzda şunları yapabilirsiniz:</p>
        <ul>
          <li>Etkinlikler oluşturun ve yönetin</li>
          <li>Projelerinizi takip edin</li>
          <li>Bütçelerinizi kontrol edin</li>
          <li>Müşterilerinizi yönetin</li>
          <li>Detaylı raporlar alın</li>
        </ul>
        
        <p>Herhangi bir sorunuz olursa bizimle iletişime geçebilirsiniz.</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Modern Sistem Bildirimi
  async sendSystemNotificationEmail(user, notification) {
    const subject = notification.title || 'Yeni Bildirim';
    
    // Type-based colors
    let typeColor = '#2563eb'; // Info (blue)
    let typeIcon = 'ℹ️';
    let bgColor = '#eff6ff';
    
    if (notification.type === 'success') {
      typeColor = '#16a34a';
      typeIcon = '✅';
      bgColor = '#f0fdf4';
    } else if (notification.type === 'warning') {
      typeColor = '#d97706';
      typeIcon = '⚠️';
      bgColor = '#fffbeb';
    } else if (notification.type === 'error') {
      typeColor = '#dc2626';
      typeIcon = '🚫';
      bgColor = '#fef2f2';
    }

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        <div style="background-color: ${typeColor}; padding: 32px 24px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">${typeIcon}</div>
          <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${subject}</h2>
        </div>
        
        <div style="padding: 32px 24px;">
          <p style="color: #475569; font-size: 16px; line-height: 1.5; margin-top: 0;">Merhaba <strong>${user.full_name || 'Kullanıcı'}</strong>,</p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Sistemden yeni bir bildiriminiz var:</p>
          
          <div style="background-color: ${bgColor}; border-left: 4px solid ${typeColor}; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 32px;">
            <p style="color: #1e293b; font-size: 15px; line-height: 1.6; margin: 0;">${notification.message.replace(/<[^>]*>?/gm, '')}</p>
          </div>
          
          ${notification.action_url ? `
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${notification.action_url.startsWith('http') ? notification.action_url : process.env.FRONTEND_URL + notification.action_url}" style="background-color: ${typeColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Detayları Görüntüle</a>
          </div>
          ` : ''}
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 32px; text-align: center;">
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">Bu e-posta sistem tarafından otomatik olarak gönderilmiştir.</p>
            <p style="color: #94a3b8; font-size: 13px; margin: 8px 0 0 0;">EventIQ &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }
}

const emailService = new EmailService();

const setupEmailService = () => {
  console.log('📧 E-posta servisi başlatıldı');
};

module.exports = {
  emailService,
  setupEmailService
}; 