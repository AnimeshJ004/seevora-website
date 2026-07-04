import 'dotenv/config';
import { sendMail } from './server/utils/mailer.js';

console.log('SMTP Config:');
console.log('  Host:', process.env.SMTP_HOST);
console.log('  Port:', process.env.SMTP_PORT);
console.log('  User:', process.env.SMTP_USER);
console.log('  From:', process.env.SMTP_FROM);
console.log('  Secure:', process.env.SMTP_SECURE);
console.log('  Pass:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');

console.log('\nSending test email...');
const result = await sendMail({
  to: process.env.SMTP_USER,
  subject: 'Seevora SMTP Test',
  html: '<h1>Test Email</h1><p>If you see this, SMTP is working.</p>',
  text: 'Test email - SMTP is working.',
});

console.log('Result:', result);
process.exit(0);
