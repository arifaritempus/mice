import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, company, email, phone } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Lütfen zorunlu alanları doldurun.' },
        { status: 400 }
      );
    }

    // Hostinger SMTP configuration
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: 'hello@codeicon.co',
        pass: process.env.SMTP_PASSWORD, // Must be set in .env or Vercel
      },
    });

    // Email content
    const mailOptions = {
      from: '"Codeicon Web Sistemi" <hello@codeicon.co>', // sender address
      to: 'hello@codeicon.co', // list of receivers (send to yourself)
      replyTo: email, // If you click "reply", it goes to the customer
      subject: `Yeni Demo Talebi: ${company || name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #3b82f6;">Yeni Demo Talebi Alındı</h2>
          <p>Web sitesi üzerinden yeni bir demo talebi gönderildi. Detaylar aşağıdadır:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; width: 150px;"><strong>Ad Soyad:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Firma Adı:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${company || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>E-Posta:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Telefon:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${phone}</td>
            </tr>
          </table>
          
          <p style="margin-top: 30px; font-size: 12px; color: #888;">
            Bu e-posta Codeicon web sitesindeki Demo Talep formundan otomatik olarak gönderilmiştir.
          </p>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'Demo talebi başarıyla gönderildi.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email sending failed:', error);
    return NextResponse.json(
      { error: 'Mail gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }
}
