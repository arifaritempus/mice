require('dotenv').config({ override: true });
const { emailService } = require('./src/services/emailService');

async function testService() {
  console.log('📧 EmailService testi başlatılıyor...');
  try {
    const result = await emailService.sendEmail(
      'arif.ari@tempustravel.co',
      'EventIQ Servis Testi',
      '<h1>Sistem Çalışıyor</h1><p>Bu mail doğrudan EmailService üzerinden gönderilmiştir.</p>'
    );
    console.log('✅ Servis başarıyla mail gönderdi:', result.messageId);
  } catch (error) {
    console.error('❌ Servis hatası:', error.message);
  }
}

testService();
