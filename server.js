/**
 * Claude Agent Office — backend server
 *
 * Port 3141:
 *   WebSocket  ws://localhost:3141        ← browser connects here
 *   HTTP POST  http://localhost:3141/event ← Claude Code hooks POST here
 *   HTTP GET   http://localhost:3141/health ← health check
 *
 * Usage:
 *   node server.js
 */

import { createServer }   from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { execSync }       from 'child_process';

const PORT = process.env.PORT ?? 3141;

// ─── HTTP + WebSocket server ──────────────────────────────────────────────────
const httpServer = createServer(handleHttp);
const wss        = new WebSocketServer({ server: httpServer });
const clients    = new Set();

wss.on('connection', (ws, req) => {
    clients.add(ws);
    const ip = req.socket.remoteAddress;
    console.log(`[WS] Client connected (${ip}). Total: ${clients.size}`);

    // Send current app snapshot immediately on connect
    const snapshot = getAppStates();
    ws.send(JSON.stringify({ type: 'appState', states: snapshot }));

    ws.on('close', () => {
        clients.delete(ws);
        console.log(`[WS] Client left. Total: ${clients.size}`);
    });
    ws.on('error', () => clients.delete(ws));
});

function broadcast(data) {
    const msg = JSON.stringify(data);
    clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            try { ws.send(msg); } catch { clients.delete(ws); }
        }
    });
}

// ─── HTTP handler ─────────────────────────────────────────────────────────────
function handleHttp(req, res) {
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.method === 'POST' && req.url === '/event') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const raw   = JSON.parse(body);
                const event = transformHookEvent(raw);
                if (event) {
                    broadcast(event);
                    const label = event.tool ? `${event.type}: ${event.tool}` : event.type;
                    console.log(`[HOOK] ${label} (role: ${event.role}) — ${event.detail ?? ''}`);
                }
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('ok');
            } catch (e) {
                console.error('[HOOK] Bad JSON:', e.message);
                res.writeHead(400); res.end('bad request');
            }
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, clients: clients.size, uptime: process.uptime() }));
        return;
    }

    res.writeHead(404); res.end('not found');
}

// ─── Hook event transformer ───────────────────────────────────────────────────
const TOOL_ROLE_MAP = {
    Bash:         'bash',
    Edit:         'coder',   Write:        'coder',
    Read:         'reader',  Glob:         'reader',
    Grep:         'searcher',WebSearch:    'searcher',
    WebFetch:     'searcher',Task:         'planner',
    NotebookEdit: 'coder',
};

function transformHookEvent(raw) {
    const hookType = raw.hookType ?? raw.type;
    const toolName = raw.tool_name ?? raw.tool;

    if (hookType === 'PreToolUse' && toolName) {
        return {
            type:   'PreToolUse',
            tool:   toolName,
            role:   TOOL_ROLE_MAP[toolName] ?? 'claude',
            label:  toolName,
            detail: extractDetail(raw.tool_input),
        };
    }

    if (hookType === 'PostToolUse') {
        return {
            type:   'PostToolUse',
            tool:   null,
            role:   'claude',
            label:  '思考中',
            detail: '处理结果中…',
        };
    }

    return null;
}

function extractDetail(input) {
    if (!input) return '';
    if (typeof input.command   === 'string') return input.command.slice(0, 100);
    if (typeof input.file_path === 'string') return input.file_path;
    if (typeof input.query     === 'string') return input.query.slice(0, 100);
    if (typeof input.pattern   === 'string') return input.pattern.slice(0, 100);
    if (typeof input.prompt    === 'string') return input.prompt.slice(0, 100);
    if (typeof input.url       === 'string') return input.url.slice(0, 100);
    try { return JSON.stringify(input).slice(0, 100); } catch { return ''; }
}

// ─── macOS App Monitor ────────────────────────────────────────────────────────
const WATCHED_APPS = [
    { id: 'xiaohongshu', names: ['小红书', 'XiaoHongShu']           },
    { id: 'wechat',      names: ['WeChat', '微信']                   },
    { id: 'cursor',      names: ['Cursor']                           },
    { id: 'chrome',      names: ['Google Chrome', 'chrome']          },
    { id: 'spotify',     names: ['Spotify']                          },
    { id: 'notion',      names: ['Notion']                           },
];

let _psCache = '';
let _psCacheTime = 0;

function getPsOutput() {
    const now = Date.now();
    if (now - _psCacheTime < 3500) return _psCache;
    try {
        _psCache     = execSync('ps aux', { timeout: 4000 }).toString();
        _psCacheTime = now;
    } catch { _psCache = ''; }
    return _psCache;
}

function getAppStates() {
    const ps    = getPsOutput();
    const lines = ps.split('\n');
    const states = {};

    WATCHED_APPS.forEach(app => {
        let running = false;
        let cpu     = 0;

        lines.forEach(line => {
            if (line.includes('grep')) return;
            const matchesName = app.names.some(n =>
                line.toLowerCase().includes(n.toLowerCase())
            );
            if (matchesName) {
                running = true;
                const cols = line.trim().split(/\s+/);
                cpu += parseFloat(cols[2] ?? '0') || 0;
            }
        });

        states[app.id] = {
            active: running,
            cpu:    Math.min(99, Math.round(cpu * 10) / 10),
        };
    });

    return states;
}

// Poll every 4 s and push to all clients
setInterval(() => {
    if (clients.size === 0) return;
    const states = getAppStates();
    broadcast({ type: 'appState', states });
}, 4000);

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
    console.log(`\n╔═══════════════════════════════════════╗`);
    console.log(`║  Claude Agent Office Server           ║`);
    console.log(`║  ws://localhost:${PORT}                ║`);
    console.log(`║  http://localhost:${PORT}/event (POST) ║`);
    console.log(`║  http://localhost:${PORT}/health       ║`);
    console.log(`╚═══════════════════════════════════════╝\n`);
});
