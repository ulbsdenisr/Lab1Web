const http = require('http');
const fs = require('fs');
const path = require('path');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    const match = trimmedLine.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      throw new Error(`Invalid .env entry on line ${index + 1}.`);
    }

    const [, name] = match;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }

    if (process.env[name] === undefined) {
      process.env[name] = value;
    }
  });
}

loadLocalEnv();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.CARSXE_API_KEY;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

function serveFile(res, filePath) {
  const safePath = path.normalize(filePath).replace(/^\/+/, '');
  const fullPath = path.join(ROOT, safePath);

  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/decode') {
    const vin = (url.searchParams.get('vin') || '').toUpperCase();

    if (!API_KEY) {
      sendJson(res, 500, {
        error: 'Missing CarsXE API key. Set CARSXE_API_KEY in your environment before starting the server.'
      });
      return;
    }

    if (!vin) {
      sendJson(res, 400, { error: 'VIN is required.' });
      return;
    }

    try {
      const apiUrl = `https://api.carsxe.com/specs?key=${encodeURIComponent(API_KEY)}&vin=${encodeURIComponent(vin)}`;
      const apiResponse = await fetch(apiUrl);
      const data = await apiResponse.json();

      if (!apiResponse.ok || data?.error || !data?.attributes) {
        sendJson(res, apiResponse.status || 400, {
          error: data?.message || 'VIN lookup failed.'
        });
        return;
      }

      sendJson(res, 200, { attributes: data.attributes });
    } catch (error) {
      sendJson(res, 500, {
        error: 'Unable to reach CarsXE API.',
        details: error.message
      });
    }

    return;
  }

  let requestedPath = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');

  if (!requestedPath || requestedPath.includes('..')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  serveFile(res, requestedPath);
});

server.listen(PORT, () => {
  console.log(`VIN app running at http://localhost:${PORT}`);
});
