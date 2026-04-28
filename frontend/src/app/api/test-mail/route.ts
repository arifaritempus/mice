import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      smtp_host,
      smtp_port,
      smtp_username,
      smtp_password,
      smtp_secure,
      mail_from_name,
      mail_from_email,
      mail_reply_to,
      test_email
    } = body;

    // Gerekli alanları kontrol et
    const missingFields = [];
    if (!smtp_host) missingFields.push('SMTP Sunucu');
    if (!smtp_port) missingFields.push('SMTP Port');
    if (!smtp_username) missingFields.push('SMTP Kullanıcı Adı');
    if (!smtp_password) missingFields.push('SMTP Şifre');
    if (!test_email) missingFields.push('Test E-posta');
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          message: `Eksik mail ayarları: ${missingFields.join(', ')}`,
          missingFields 
        },
        { status: 400 }
      );
    }

    // Mail ayarlarını doğrula (basit validasyon)
    const validationErrors = [];
    
    if (!smtp_host.includes('.')) {
      validationErrors.push('Geçersiz SMTP sunucu adresi');
    }
    
    if (isNaN(parseInt(smtp_port)) || parseInt(smtp_port) < 1 || parseInt(smtp_port) > 65535) {
      validationErrors.push('Geçersiz SMTP port numarası');
    }
    
    if (!smtp_username.includes('@')) {
      validationErrors.push('Geçersiz SMTP kullanıcı adı');
    }
    
    if (!test_email.includes('@')) {
      validationErrors.push('Geçersiz test e-posta adresi');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { message: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    // Simüle edilmiş mail gönderimi (gerçek mail gönderilmez)
    console.log('Mail Test Simülasyonu:', {
      smtp_host,
      smtp_port,
      smtp_username,
      smtp_secure,
      mail_from_name,
      mail_from_email,
      mail_reply_to,
      test_email,
      timestamp: new Date().toISOString()
    });

    // Başarılı yanıt döndür
    return NextResponse.json({
      message: 'Mail ayarları doğrulandı! (Simülasyon modu)',
      messageId: `sim-${Date.now()}`,
      details: {
        smtp_host,
        smtp_port,
        smtp_secure,
        mail_from_name,
        mail_from_email,
        test_email,
        timestamp: new Date().toLocaleString('tr-TR')
      }
    });

  } catch (error) {
    console.error('Mail test hatası:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Mail test hatası',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
