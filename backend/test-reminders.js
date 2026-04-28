require('dotenv').config({ override: true });
const { reminderService } = require('./src/services/reminderService');
const logger = require('./src/utils/logger')('TestReminder');

async function testReminders() {
  logger.info('🚀 Manuel hatırlatıcı testi başlatılıyor...');
  try {
    await reminderService.checkAllReminders();
    logger.success('✅ Test tamamlandı. E-postalar (eğer varsa ve SMTP doğruysa) gönderildi.');
  } catch (error) {
    logger.error('❌ Test sırasında hata:', error);
  }
}

testReminders();
