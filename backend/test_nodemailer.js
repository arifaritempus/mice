const nodemailer = require('nodemailer');

async function testMail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: 'hello@codeicon.co',
      pass: '..Q1w2E3r4..'
    }
  });

  try {
    await transporter.verify();
    console.log("Port 587 verification success!");
  } catch (err) {
    console.error("Port 587 verification failed:", err.message);
  }

  const transporter465 = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: 'hello@codeicon.co',
      pass: '..Q1w2E3r4..'
    }
  });

  try {
    await transporter465.verify();
    console.log("Port 465 verification success!");
  } catch (err) {
    console.error("Port 465 verification failed:", err.message);
  }
}

testMail();
