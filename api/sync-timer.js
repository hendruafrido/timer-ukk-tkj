import { put } from '@vercel/blob';

export default async function handler(request, response) {
  if (request.method === 'POST') {
    const data = await request.body;
    // Menyimpan seluruh state timer ke satu file JSON di Blob
    const blob = await put('ukk/timer-state.json', JSON.stringify(data), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false, // Agar nama file tetap sama untuk di-update
    });
    return response.status(200).json(blob);
  }

  return response.status(405).json({ error: 'Method not allowed' });
}
