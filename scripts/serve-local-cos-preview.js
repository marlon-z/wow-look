const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'cos-upload');
const HOST = '127.0.0.1';
const PORT = Number(process.env.WOWLOOK_LOCAL_PORT) || 8787;
const MIME_TYPES = {
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function getFilePath(requestPath) {
  const decodedPath = decodeURIComponent(requestPath.split('?')[0]);
  const relativePath = decodedPath.replace(/^[/\\]+/, '');
  const filePath = path.resolve(ROOT, relativePath);
  return filePath.startsWith(`${ROOT}${path.sep}`) ? filePath : null;
}

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }

  const filePath = getFilePath(request.url || '/');
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  fs.createReadStream(filePath).pipe(response);
});

server.listen(PORT, HOST, () => {
  console.log(`WoWLook local COS preview: http://${HOST}:${PORT}/`);
  console.log(`Serving: ${ROOT}`);
});
