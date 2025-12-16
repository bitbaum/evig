import nodemailer from 'nodemailer';
import { env } from './env';

// Create reusable transporter object using SMTP transport
const createTransporter = (): any => {
  // For development, use a test service or console logging
  if (env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || 'test@example.com',
        pass: process.env.ETHEREAL_PASS || 'test',
      },
    });
  }

  // For production, use configured SMTP
  if (!env.SMTP_HOST) {
    console.warn('SMTP not configured, emails will be logged to console');
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_PORT === 465, // Use SSL for port 465
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using the configured transporter
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = createTransporter();

  if (!transporter) {
    // Fallback: log email to console in development
    console.log('📧 EMAIL (not sent - no transporter configured):', {
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html?.substring(0, 100) + '...',
    });
    return;
  }

  const mailOptions = {
    from: env.SMTP_FROM || `"RevampIT" <noreply@revamp-it.ch>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);

    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log('⚠️ Email configuration test: No transporter available');
      return false;
    }

    await transporter.verify();
    console.log('✅ Email configuration test: Connection successful');
    return true;
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    return false;
  }
}
