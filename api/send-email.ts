import nodemailer from 'nodemailer';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Minimal Vercel-compatible handler types (avoids @vercel/node dependency)
type Req = IncomingMessage & { body?: Record<string, string> };
type Res = ServerResponse & {
  status(code: number): Res;
  json(data: unknown): void;
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req: Req, res: Res) {
  // Allow CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { name, email, subject, message } = req.body ?? {};

  if (!name || !email || !subject || !message) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.error('SMTP credentials not configured');
    res.status(500).json({ success: false, message: 'Email service not configured' });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: { user: smtpUser, pass: smtpPass },
    tls: { rejectUnauthorized: false },
  });

  const htmlBody = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1a1a2e;padding:18px 24px;border-radius:10px 10px 0 0">
        <h2 style="margin:0;color:#c9a84c;font-size:18px">Neue Kontaktanfrage</h2>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:24px">
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:13px;width:110px">Name</td>
            <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:13px">E-Mail</td>
            <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827">${escapeHtml(email)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;font-size:13px">Betreff</td>
            <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827">${escapeHtml(subject)}</td>
          </tr>
        </table>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151">Nachricht:</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#4b5563;white-space:pre-wrap">${escapeHtml(message)}</p>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:14px">
        Gesendet über das Kontaktformular der Website
      </p>
    </div>
  `.trim();

  try {
    await transporter.sendMail({
      from: `"${name}" <${smtpUser}>`,
      replyTo: email,
      to: smtpUser,
      subject: `[Kontakt] ${subject}`,
      text: `Von: ${name}\nE-Mail: ${email}\nBetreff: ${subject}\n\nNachricht:\n${message}`,
      html: htmlBody,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Nodemailer send error:', err);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
}
