import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log(`[DEBUG] Initializing nodemailer transporter`);
let transporter;

try {
  transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  console.log(`[DEBUG] Transporter created successfully`);

  transporter.verify((error, success) => {
    if (error) {
      console.error(`[DEBUG] Transporter verification failed: ${error.message}`);
    } else {
      console.log(`[DEBUG] Transporter ready to send emails`);
    }
  });
} catch (initError) {
  console.error(`[DEBUG] Failed to create transporter: ${initError.message}`);
}

export const send2FACode = async (recipientEmail, verificationCode) => {
  console.log(`[DEBUG] Starting to send 2FA code to: ${recipientEmail}`);
  console.log(`[DEBUG] Using EMAIL_USER: ${process.env.EMAIL_USER ? 'Set' : 'NOT SET'}`);
  console.log(`[DEBUG] Using EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? 'Set' : 'NOT SET'}`);
  console.log(`[DEBUG] Using EMAIL_FROM: ${process.env.EMAIL_FROM || 'NOT SET'}`);

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: recipientEmail,
    subject: 'Your Two-Factor Authentication Code',
    text: `Your verification code is: ${verificationCode}`,
    html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>`,
  };

  try {
    console.log(`[DEBUG] About to call transporter.sendMail`);
    const info = await transporter.sendMail(mailOptions);
    console.log(verificationCode)
    console.log(`[DEBUG] Email sent successfully, message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[DEBUG] FAILED to send email: ${error.message}`);
    console.error(`[DEBUG] Error name: ${error.name}, code: ${error.code}`);
    if (error.response) {
      console.error(`[DEBUG] SMTP response: ${error.response}`);
    }
    throw new Error('Failed to send 2FA code. Please try again.');
  }
};