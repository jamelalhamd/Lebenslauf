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

  const { folder = 'cv', publicId, resourceType = 'image' } = req.body ?? {};
  const timestamp = Math.round(Date.now() / 1000);

  const params: Record<string, string | number> = { timestamp };
  if (folder) params.folder = folder;
  if (publicId) params.public_id = publicId;

  const paramString = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');

  const signature = crypto.createHash('sha1').update(paramString + apiSecret).digest('hex');

  res.status(200).json({ signature, timestamp, apiKey, cloudName, resourceType });
}
