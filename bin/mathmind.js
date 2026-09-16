#!/usr/bin/env node

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

// Check if dist exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('\n❌ 错误：未找到 dist 静态构建目录。');
  console.error('请先在项目根目录运行 `npm run build` 生成构建产物。\n');
  process.exit(1);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm'
};

function openBrowser(url) {
  const startCmd = process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(startCmd, () => {});
}

function startServer(initialPort = 5173, maxTries = 10) {
  let port = initialPort;
  let attempts = 0;

  const server = http.createServer((req, res) => {
    // Parse URL path and decode URI
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/' || !reqPath) {
      reqPath = '/index.html';
    }

    let filePath = path.join(DIST_DIR, reqPath);

    // Prevent directory traversal
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // SPA Fallback: serve index.html
        filePath = path.join(DIST_DIR, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('500 Internal Server Error');
          return;
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=31536000, immutable'
        });
        res.end(content);
      });
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      attempts++;
      if (attempts < maxTries) {
        port++;
        server.listen(port);
      } else {
        console.error(`\n❌ 端口 ${initialPort} 至 ${port} 均被占用，启动失败。\n`);
        process.exit(1);
      }
    } else {
      console.error('\n❌ 服务器启动异常:', err.message);
      process.exit(1);
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log('\n========================================');
    console.log('  MathMind - 数学命题推演网络');
    console.log(`  本地地址: ${url}`);
    console.log('  已自动唤起浏览器。按 Ctrl+C 停止服务');
    console.log('========================================\n');
    openBrowser(url);
  });
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
MathMind - 命令行启动工具

用法:
  npx mathmind [options]
  mathmind [options]

选项:
  -p, --port <number>  指定服务端口 (默认 5173)
  -h, --help           查看帮助说明
  -v, --version        查看版本号
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));
  console.log(`v${pkg.version}`);
  process.exit(0);
}

let customPort = 5173;
const portIdx = args.findIndex(a => a === '-p' || a === '--port');
if (portIdx !== -1 && args[portIdx + 1]) {
  const p = parseInt(args[portIdx + 1], 10);
  if (!isNaN(p) && p > 0 && p < 65536) {
    customPort = p;
  }
}

startServer(customPort);
