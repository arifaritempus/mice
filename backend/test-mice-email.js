require('dotenv').config({ override: true });
const { emailService } = require('./src/services/emailService');

async function testToMice() {
  const recipient = 'mice@tempustravel.co';
  console.log(`📧 ${recipient} adresine test maili gönderiliyor...`);
  try {
    const result = await emailService.sendEmail(
      recipient,
      'EventIQ Sistem Testi - MICE',
      '<h1>Sistem Aktif</h1><p>Mailing sistemi başarıyla yapılandırıldı ve alıcı olarak bu adres tanımlandı.</p>'
    );
    console.log('✅ Mail başarıyla gönderildi:', result.messageId);
  } catch (error) {
    console.error('❌ Gönderim hatası:', error.message);
    if (error.response) console.log('Sunucu Yanıtı:', error.response);
  }
}

testToMice();
