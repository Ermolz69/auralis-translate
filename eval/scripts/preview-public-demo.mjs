import http from 'node:http';
import fs from 'node:fs/promises';

const report = new URL('../../site/index.html', import.meta.url);
const server = http.createServer(async (request, response) => {
  if (!['/', '/index.html'].includes(request.url)) {
    response.writeHead(404); response.end('Not found'); return;
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  response.end(await fs.readFile(report));
});
server.listen(8089, '127.0.0.1', () => console.log('Report preview: http://127.0.0.1:8089/'));
