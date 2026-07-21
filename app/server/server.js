#!/usr/bin/env node
// FamilyOS — BFF proxy (one-time-ticket pattern, property-walker chart contract)
//
// Run:  node server/server.js
// Env:  PORT=5055                                       (default)
//       UPSTREAM_URL=https://localhost:5020/familyos    (default)
//
// Routing:
//   GET  /                       → serves client/index.html (liveness probe)
//   GET  /<asset>                → serves the built Vite bundle from client/
//   GET|POST|DELETE /api/<rest>  → proxied to UPSTREAM_URL/<rest>
//
// TLS: upstream certificate errors are intentionally ignored (dev mesh adapter
//      uses a self-signed cert, same pattern as property-walker).

'use strict';

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { URL } = require('url');

const CLIENT_DIR = path.resolve(__dirname, '..', 'client');
const PORT       = Number(process.env.PORT) || 5055;
const UPSTREAM   = (process.env.UPSTREAM_URL || 'https://localhost:5020/familyos').replace(/\/$/, '');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map':  'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

// ---------------------------------------------------------------------------
// response helpers
// ---------------------------------------------------------------------------

function sendJson(res, status, obj) {
  const data = JSON.stringify(obj);
  res.writeHead(status, {
    'content-type':   'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(data),
    'access-control-allow-origin':  '*',
    'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(data);
}

function sendFile(res, filePath) {
  const data = fs.readFileSync(filePath);
  res.writeHead(200, {
    'content-type':   MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'content-length': data.length,
  });
  res.end(data);
}

// ---------------------------------------------------------------------------
// body reader
// ---------------------------------------------------------------------------

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1_000_000) reject(new Error('body too large'));
    });
    req.on('end',   () => resolve(data));
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// upstream proxy (generic — pass-through method, path, query, body)
// ---------------------------------------------------------------------------

function proxyRequest(method, upstreamPath, rawBody, contentType) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(UPSTREAM + upstreamPath);
    } catch (e) {
      return reject(new Error('bad upstream URL: ' + e.message));
    }

    const lib     = url.protocol === 'https:' ? https : http;
    const payload = rawBody && rawBody.length > 0 ? rawBody : null;

    const opts = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method,
      headers: {
        accept: 'application/json',
        ...(payload != null && {
          'content-type':   contentType || 'application/json',
          'content-length': Buffer.byteLength(payload),
        }),
      },
      rejectUnauthorized: false, // mesh adapter uses a self-signed cert
    };

    const req = lib.request(opts, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data',  c  => { data += c; });
      res.on('end',   () => resolve({ status: res.statusCode, text: data }));
    });

    req.on('error', reject);
    if (payload != null) req.write(payload);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const started = Date.now();

  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin':  '*',
      'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
      'access-control-allow-headers': 'content-type',
    });
    res.end();
    return;
  }

  const parsed   = new URL(req.url, 'http://x');
  const pathname = parsed.pathname;

  // -----------------------------------------------------------------------
  // Proxy: /api/<rest> → UPSTREAM/<rest>
  // -----------------------------------------------------------------------
  if (pathname.startsWith('/api/') || pathname === '/api') {
    const upstreamPath = pathname.slice(4) + parsed.search; // e.g. /tasks?id=x

    let rawBody     = '';
    const contentType = req.headers['content-type'] || 'application/json';

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      try       { rawBody = await readBody(req); }
      catch (e) {
        sendJson(res, 400, { error: 'bad_request', detail: e.message });
        return;
      }
    }

    try {
      const r = await proxyRequest(req.method, upstreamPath, rawBody, contentType);
      const status = r.status || 200;

      let body;
      try { body = r.text ? JSON.parse(r.text) : {}; }
      catch { body = r.text; }

      console.log(`${new Date().toISOString()}  ${req.method.padEnd(6)}  ${req.url}  → upstream ${upstreamPath}  ${status}  ${Date.now()-started}ms`);
      sendJson(res, status, body);
    } catch (e) {
      console.log(`${new Date().toISOString()}  ${req.method.padEnd(6)}  ${req.url}  502  ${e.message}`);
      sendJson(res, 502, { error: 'upstream_unreachable' });
    }
    return;
  }

  // -----------------------------------------------------------------------
  // Static: serve the built client (GET only)
  // -----------------------------------------------------------------------
  if (req.method === 'GET' || req.method === 'HEAD') {
    if (pathname === '/favicon.ico' && !fs.existsSync(path.join(CLIENT_DIR, 'favicon.ico'))) {
      res.writeHead(204);
      res.end();
      return;
    }

    // Resolve inside CLIENT_DIR only; anything unknown falls back to the SPA.
    const rel  = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = path.resolve(CLIENT_DIR, rel);
    try {
      if (file.startsWith(CLIENT_DIR) && fs.statSync(file).isFile()) {
        sendFile(res, file);
        return;
      }
    } catch { /* fall through to SPA */ }

    try {
      sendFile(res, path.join(CLIENT_DIR, 'index.html'));
    } catch (e) {
      sendJson(res, 500, { error: 'client_missing', detail: e.message });
    }
    return;
  }

  sendJson(res, 404, { error: 'not_found' });
});

server.listen(PORT, () => {
  console.log(`familyos proxy  →  ${UPSTREAM}`);
  console.log(`open UI:        http://localhost:${PORT}/`);
});
