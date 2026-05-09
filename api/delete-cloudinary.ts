import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

type Req = IncomingMessage & { body?: Record<string, string> };
type Res = ServerResponse & {
  status(code: number): Res;
  json(data: unknown): void;
};

export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiSecret || !apiKey || !cloudName) {
    res.status(500).json({ error: 'Cloudinary not configured' });
    return;
  }

  const { publicId, resourceType = 'image' } = req.body ?? {};
  if (!publicId) { res.status(400).json({ error: 'publicId required' }); return; }

  const timestamp = Math.round(Date.now() / 1000);
  const paramString = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1').update(paramString + apiSecret).digest('hex');

  try {
    const body = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: apiKey,
      signature,
    });

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
      { method: 'POST', body }
    );
    const data = await response.json() as { result?: string };
    if (data.result === 'ok' || data.result === 'not found') {
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ error: data.result ?? 'Delete failed' });
    }
  } catch (e) {
    console.error('Cloudinary delete error:', e);
    res.status(500).json({ error: 'Delete failed' });
  }
}
