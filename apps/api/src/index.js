import http from 'node:http';
import {
  bindProcessMonitoring,
  captureServerException,
  initMonitoring,
} from './monitoring/sentry.js';

const PORT = Number(process.env.PORT ?? 3001);

const monitoringEnabled = initMonitoring();

if (monitoringEnabled) {
  bindProcessMonitoring();
}

const server = http.createServer((req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ ok: true, ts: Date.now() }));
    }

    if (req.method === 'GET' && req.url === '/monitoring/debug-error') {
      throw new Error('backend monitoring check');
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'not found' }));
  } catch (error) {
    captureServerException(error, { route: req.url, method: req.method });
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'server error' }));
  }
});

server.listen(PORT, '0.0.0.0', () =>
  console.log(`API on http://localhost:${PORT}`),
);
