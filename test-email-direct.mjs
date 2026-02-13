#!/usr/bin/env node
// Direct email test using nodemailer

import nodemailer from 'nodemailer';

const config = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'a19fc1001@smtp-brevo.com',
    pass: '60AIvmThj81pDPQH'
  }
};

async function testEmail() {
  console.log('Creating transporter...');
  const transporter = nodemailer.createTransport(config);

  console.log('\n1. Verifying SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified!');
  } catch (error) {
    console.error('❌ SMTP verification failed:', error.message);
    return;
  }

  console.log('\n2. Sending test email to georgy.butaev@revamp-it.ch...');
  try {
    const info = await transporter.sendMail({
      from: 'georgy.butaev@revamp-it.ch',
      to: 'georgy.butaev@revamp-it.ch',
      subject: 'RevampIT Email Test - ' + new Date().toISOString(),
      text: 'This is a direct test email from the authentication system. If you receive this, email delivery is working!',
      html: '<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>RevampIT Email Test</h2><p>This is a <strong>direct test email</strong> from the authentication system.</p><p style="color: green;">✅ If you receive this, email delivery is working!</p><p style="font-size: 12px; color: #666;">Sent at: ' + new Date().toISOString() + '</p></div>'
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('\n📧 Check your inbox at georgy.butaev@revamp-it.ch');
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
    if (error.responseCode) {
      console.error('Response Code:', error.responseCode);
    }
  }
}

testEmail().catch(console.error);
