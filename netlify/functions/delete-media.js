const https = require('https');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const CLOUD_NAME   = process.env.CLOUDINARY_CLOUD_NAME;
  const API_KEY      = process.env.CLOUDINARY_API_KEY;
  const API_SECRET   = process.env.CLOUDINARY_API_SECRET;

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Cloudinary env vars not configured' }) };
  }

  let body;
  try { body = JSON.parse(event.body); } 
  catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { publicIds, resourceType = 'image' } = body;
  if (!publicIds || !publicIds.length) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No publicIds provided' }) };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicIdsStr = publicIds.join(',');
  const signStr = `public_ids=${publicIdsStr}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash('sha1').update(signStr).digest('hex');

  const postData = new URLSearchParams({
    public_ids: publicIdsStr,
    timestamp: timestamp.toString(),
    api_key: API_KEY,
    signature,
    resource_type: resourceType
  }).toString();

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/resources/delete_by_ids`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: data
        });
      });
    });
    req.on('error', e => resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) }));
    req.write(postData);
    req.end();
  });
};
