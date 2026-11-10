import nodemailer from 'nodemailer';
import HttpError from '../utils/HttpError.js';

export function smtpConfigured() {
  return ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].every((key) =>
    Boolean(process.env[key]),
  );
}
export function createMailTransport() {
  if (!smtpConfigured())
    throw new HttpError(
      503,
      'Email replies are not configured. Add the Gmail SMTP settings to server/.env.',
    );
  const port = Number(process.env.SMTP_PORT || 465);
  if (![465, 587].includes(port))
    throw new HttpError(503, 'SMTP_PORT must be 465 or 587.');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: true },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}
export const mailService = {
  async sendReply({ to, subject, message }) {
    const transport = createMailTransport();
    return transport.sendMail({
      from: {
        name: 'Oor Suthalam',
        address: process.env.SMTP_FROM || process.env.SMTP_USER,
      },
      to: { address: to },
      subject,
      text: message,
    });
  },
};
