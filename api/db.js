// Vercel Serverless Function (Node.js)
// GitHub経由でVercelにデプロイすると自動的に /api/db としてアクセス可能になります

export default async function handler(req, res) {
  // CORSヘッダー設定
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Upstash Redis 環境変数 (Vercel KV / Upstash 接続情報)
  const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.error('Missing KV/Upstash environment variables');
    return res.status(200).json({ 
      warning: 'Upstash Redis env variables not set', 
      data: null 
    });
  }

  // GET リクエスト：ユーザーIDに基づくデータ取得
  if (req.method === 'GET') {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    try {
      const response = await fetch(`${redisUrl}/get/${encodeURIComponent('sft_user_' + userId)}`, {
        headers: {
          Authorization: `Bearer ${redisToken}`
        }
      });
      const result = await response.json();
      
      if (result && result.result) {
        let parsed = result.result;
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch(e) {}
        }
        return res.status(200).json({ status: 'success', data: parsed });
      } else {
        return res.status(200).json({ status: 'success', data: null });
      }
    } catch (err) {
      console.error('Redis GET Error:', err);
      return res.status(500).json({ error: 'Failed to fetch from DB' });
    }
  }

  // POST リクエスト：ユーザーIDに基づくデータ保存
  if (req.method === 'POST') {
    const { userId, workData } = req.body || {};
    if (!userId || !workData) {
      return res.status(400).json({ error: 'Missing userId or workData in body' });
    }

    try {
      const jsonStr = JSON.stringify(workData);
      const response = await fetch(`${redisUrl}/set/${encodeURIComponent('sft_user_' + userId)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`
        },
        body: jsonStr
      });
      const result = await response.json();

      return res.status(200).json({ status: 'success', message: 'Data saved to cloud DB successfully', result });
    } catch (err) {
      console.error('Redis SET Error:', err);
      return res.status(500).json({ error: 'Failed to save to DB' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
