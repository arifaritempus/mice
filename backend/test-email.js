require('dotenv').config({ override: true });
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('📧 E-posta testi başlatılıyor...');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@eventiq.com',
      to: 'arif.ari@tempustravel.co', // User's email from logs
      subject: 'EventIQ E-posta Testi',
      text: 'Bu bir test e-postasıdır.',
      html: '<b>Bu bir test e-postasıdır.</b>'
    });

    console.log('✅ E-posta başarıyla gönderildi!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ E-posta gönderme hatası:', error.message);
    if (error.code === 'EAUTH') {
      console.log('💡 Hata: Kimlik doğrulama başarısız. Lütfen SMTP_USER ve SMTP_PASS bilgilerini kontrol edin.');
    }
  }
}

testEmail();
