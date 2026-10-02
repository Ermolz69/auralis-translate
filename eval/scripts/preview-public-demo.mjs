import http from 'node:http';
import fs from 'node:fs/promises';

const reports = new Map([
  ['/', new URL('../../site/index.html', import.meta.url)],
  ['/index.html', new URL('../../site/index.html', import.meta.url)],
  ['/history.html', new URL('../../site/history.html', import.meta.url)],
]);
const server = http.createServer(async (request, response) => {
  const report = reports.get(new URL(request.url, 'http://127.0.0.1').pathname);
  if (!report) {
    response.writeHead(404); response.end('Not found'); return;
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  response.end(await fs.readFile(report));
});
server.listen(8089, '127.0.0.1', () => console.log('Report preview: http://127.0.0.1:8089/'));
