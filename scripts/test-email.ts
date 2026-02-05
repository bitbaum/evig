/**
 * Test Email Script
 *
 * Run with: npx tsx scripts/test-email.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  }
}

const EMAIL_CONFIG = {
  HOST: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  PORT: parseInt(process.env.EMAIL_PORT || '587'),
  USER: process.env.EMAIL_USER || '',
  PASS: process.env.EMAIL_PASS || '',
  FROM: process.env.EMAIL_FROM || '',
  SECURE: process.env.EMAIL_SECURE === 'true',
};

async function testEmail() {
  console.log('Email Configuration:');
  console.log('  Host:', EMAIL_CONFIG.HOST);
  console.log('  Port:', EMAIL_CONFIG.PORT);
  console.log('  User:', EMAIL_CONFIG.USER);
  console.log('  From:', EMAIL_CONFIG.FROM);
  console.log('  Secure:', EMAIL_CONFIG.SECURE);
  console.log('');

  const transporter = nodemailer.createTransport({
    host: EMAIL_CONFIG.HOST,
    port: EMAIL_CONFIG.PORT,
    secure: EMAIL_CONFIG.SECURE,
    auth: {
      user: EMAIL_CONFIG.USER,
      pass: EMAIL_CONFIG.PASS,
    },
  });

  // Test connection
  console.log('Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('SMTP connection successful!');
  } catch (error) {
    console.error('SMTP connection failed:', error);
    process.exit(1);
  }

  // Send test email
  const testRecipient = EMAIL_CONFIG.FROM; // Send to ourselves
  console.log(`\nSending test email to ${testRecipient}...`);

  try {
    const info = await transporter.sendMail({
      from: `"RevampIT Test" <${EMAIL_CONFIG.FROM}>`,
      to: testRecipient,
      subject: 'RevampIT Email Test',
      text: 'This is a test email from RevampIT. If you received this, email sending is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">RevampIT Email Test</h1>
          <p>This is a test email from RevampIT.</p>
          <p>If you received this, email sending is working correctly!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Sent via Brevo SMTP at ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
    process.exit(1);
  }
}

testEmail();
