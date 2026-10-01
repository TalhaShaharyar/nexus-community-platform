const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

module.exports = async function handler(req, res) {
  try {
    const dir = path.join(process.cwd(), 'payload');
    let encoded = '';
    for (let i = 1; i <= 7; i++) {
      const name = 'part' + String(i).padStart(2, '0') + '.txt';
      encoded += fs.readFileSync(path.join(dir, name), 'utf8').trim();
    }

    const html = zlib.gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
    const bootGuard = "<script>(()=>{const q=location.search||'',h=location.hash||'';const a=/type=(recovery|invite)/.test(q+h)||/[?&]code=/.test(q)||/access_token=/.test(h);if(a){location.replace('/admin-reset'+q+h);return}if(location.pathname==='/home'){history.replaceState({},'', '/')}})();<\/script>";
    const output = html.replace('<title>NEXUS — Construction Without Borders</title>', '<title>NEXUS — Construction Without Borders</title>' + bootGuard);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(output);
  } catch (error) {
    console.error('NEXUS render failed', error);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(500).send('<!doctype html><html><body style="font-family:Arial;padding:32px"><h1>NEXUS is temporarily unavailable.</h1><p>Please refresh in a moment.</p></body></html>');
  }
};
