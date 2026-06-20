import http from 'node:http';

const port = Number(process.env.PORT ?? 3101);

const server = http.createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true, service: 'launcher3001-backend' }));
    return;
  }

  response.writeHead(404, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Launcher3001 backend listening on http://localhost:${port}`);
});
