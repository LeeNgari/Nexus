require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail', // Use your provider (e.g., Gmail, Outlook, SMTP)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Function to send a test email
async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM, // Make sure this matches your EMAIL_USER
      to: 'leengari76@gmail.com', // Replace with your test email
      subject: 'Test Email from Nodemailer',
      text: 'Hello! This is a test email from Nodemailer.',
      html: '<p>Hello! This is a <strong>test email</strong> from Nodemailer.</p>'
    });

    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}

// Verify SMTP Connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP connection error:', error);
  } else {
    console.log('✅ SMTP server is ready to send emails');
    sendTestEmail(); // Send a test email after verifying connection
  }
});
