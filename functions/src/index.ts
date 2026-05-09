import { onRequest } from 'firebase-functions/v2/https';
import { createHash } from 'node:crypto';
import nodemailer from 'nodemailer';

// ── helpers ────────────────────────────────────────────────────────────────
function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── /api/sign-cloudinary ──────────────────────────────────────────────────
export const signCloudinary = onRequest({ cors: true }, (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const cloudName  = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey     = process.env.CLOUDINARY_API_KEY;
  const apiSecret  = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    res.status(500).json({ error: 'Cloudinary not configured' });
    return;
  }

  const { folder = 'cv', publicId, resourceType = 'image' } =
    (req.body ?? {}) as { folder?: string; publicId?: string; resourceType?: string };

  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = { timestamp };
  if (folder) params.folder = folder;
  if (publicId) params.public_id = publicId;

  const paramString = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const signature   = createHash('sha1').update(paramString + apiSecret).digest('hex');

  res.json({ signature, timestamp, apiKey, cloudName, resourceType });
});

// ── /api/delete-cloudinary ────────────────────────────────────────────────
export const deleteCloudinary = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? '';
  const apiKey    = process.env.CLOUDINARY_API_KEY    ?? '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? '';

  const { publicId, resourceType = 'image' } =
    (req.body ?? {}) as { publicId?: string; resourceType?: string };

  if (!publicId) { res.status(400).json({ error: 'publicId required' }); return; }

  const timestamp   = Math.round(Date.now() / 1000);
  const paramString = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature   = createHash('sha1').update(paramString + apiSecret).digest('hex');

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    { method: 'POST', body },
  );
  const data = (await response.json()) as { result?: string };

  if (data.result === 'ok' || data.result === 'not found') {
    res.json({ success: true });
  } else {
    res.status(400).json({ error: data.result ?? 'Delete failed' });
  }
});

// ── /api/send-email ───────────────────────────────────────────────────────
export const sendEmail = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false });
    return;
  }

  const smtpUser = process.env.SMTP_USER ?? '';
  const smtpPass = process.env.SMTP_PASS ?? '';

  const { name, email, subject, message } =
    (req.body ?? {}) as { name?: string; email?: string; subject?: string; message?: string };

  if (!name || !email || !subject || !message) {
    res.status(400).json({ success: false });
    return;
  }

  if (!smtpUser || !smtpPass) {
    console.error('[send-email] SMTP_USER / SMTP_PASS not set');
    res.status(503).json({ success: false });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: smtpUser, pass: smtpPass },
    tls: { rejectUnauthorized: false },
  });

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1a1a2e;padding:18px 24px;border-radius:10px 10px 0 0">
        <h2 style="margin:0;color:#c9a84c;font-size:18px">Neue Kontaktanfrage</h2>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;padding:24px">
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:100px">Name</td><td style="font-size:14px;font-weight:600">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">E-Mail</td><td style="font-size:14px;font-weight:600">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Betreff</td><td style="font-size:14px;font-weight:600">${escapeHtml(subject)}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p style="font-size:13px;font-weight:600;color:#374151;margin:0 0 8px">Nachricht:</p>
        <p style="font-size:14px;line-height:1.7;color:#4b5563;white-space:pre-wrap;margin:0">${escapeHtml(message)}</p>
      </div>
    </div>`.trim();

  await transporter.sendMail({
    from: `"${name}" <${smtpUser}>`,
    replyTo: email,
    to: smtpUser,
    subject: `[Kontakt] ${subject}`,
    text: `Von: ${name}\nE-Mail: ${email}\nBetreff: ${subject}\n\nNachricht:\n${message}`,
    html,
  });

  console.log(`[send-email] Sent ✓  from=${email}  subject=${subject}`);
  res.json({ success: true });
});
