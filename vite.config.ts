import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import nodemailer from 'nodemailer';

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function emailApiPlugin(smtpUser: string, smtpPass: string): Plugin {
  return {
    name: 'email-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(
        '/api/send-email',
        (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false }));
            return;
          }

          let raw = '';
          req.setEncoding('utf8');
          req.on('data', (chunk: unknown) => { raw += String(chunk); });
          req.on('end', () => {
            void (async () => {
              try {
                const { name, email, subject, message } = JSON.parse(raw) as {
                  name?: string; email?: string; subject?: string; message?: string;
                };

                if (!name || !email || !subject || !message) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false }));
                  return;
                }

                if (!smtpUser || !smtpPass) {
                  console.error('\n[email-api] SMTP_USER / SMTP_PASS missing in .env.local\n');
                  res.writeHead(503, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false }));
                  return;
                }

                const transporter = nodemailer.createTransport({
                  host: 'smtp.gmail.com',
                  port: 587,
                  secure: false,
                  auth: { user: smtpUser, pass: smtpPass },
                  // Bypass intermediate-CA issues (corporate proxies / Windows cert store)
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

                console.log(`[email-api] Sent ✓  from=${email}  subject=${subject}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                console.error('[email-api] Send error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false }));
              }
            })();
          });
        },
      );
    },
  };
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const plugins = [
    react(),
    tailwindcss(),
    emailApiPlugin(env.SMTP_USER ?? '', env.SMTP_PASS ?? ''),
  ];
  try {
    // @ts-ignore
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {}
  return { plugins };
});
