const https = require('https');

exports.handler = async (event) => {
  const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
  const API_KEY    = process.env.CLOUDINARY_API_KEY;
  const API_SECRET = process.env.CLOUDINARY_API_SECRET;

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Not configured' }) };
  }

  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/usage`,
      method: 'GET',
      headers: { 'Authorization': `Basic ${auth}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: data
      }));
    });
    req.on('error', e => resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) }));
    req.end();
  });
};
