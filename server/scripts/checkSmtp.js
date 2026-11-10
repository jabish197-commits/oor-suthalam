import '../src/config/env.js';
import { createMailTransport } from '../src/services/mailService.js';
const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error(`SMTP settings missing: ${missing.join(', ')}. Fill these in server/.env.`);
  process.exitCode = 1;
} else if (!['465', '587'].includes(process.env.SMTP_PORT || '465')) {
  console.error('SMTP_PORT must be 465 or 587.');
  process.exitCode = 1;
} else {
  try {
    await createMailTransport().verify();
    console.log('SMTP connection and authentication succeeded. No email was sent.');
  } catch (error) {
    const code = error.code;
    if (code === 'EAUTH') {
      console.error('Gmail rejected SMTP authentication. Use the full Gmail address as SMTP_USER and a Google App Password as SMTP_PASS, not your normal account password. Confirm the App Password belongs to that same account.');
    } else if (['EDNS', 'ENOTFOUND', 'EAI_AGAIN'].includes(code)) {
      console.error('SMTP DNS lookup failed. Check SMTP_HOST (Gmail: smtp.gmail.com) and your network DNS.');
    } else if (['ETIMEDOUT', 'ECONNECTION', 'ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH', 'ESOCKET'].includes(code) && !/CERT|TLS|SSL|SELF_SIGNED|ISSUER/.test(error.cause?.code || '')) {
      console.error('SMTP connection failed or timed out. Check network access to smtp.gmail.com on port 465 or 587. Try the other supported port or a phone hotspot.');
    } else {
      console.error('SMTP connection or TLS verification failed. Check the host/port and trusted certificate chain. TLS verification remains enabled.');
    }
    console.error('Credentials and raw server responses were not displayed.');
    process.exitCode = 1;
  }
}
