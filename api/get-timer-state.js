import { head } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    // Ganti URL ini dengan URL JSON asli Anda dari dashboard Vercel Blob nanti
    const response = await fetch('URL_BLOB_JSON_ANDA_DI_SINI');
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Data belum ada' });
  }
}
