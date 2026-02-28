import Phaser from 'phaser';
import {
    GAME_W, GAME_H,
    LEFT_PANEL_W, RIGHT_PANEL_W,
    ROLE_COLORS, TOOL_LABELS,
    ROLE_CLAUDE, ROLE_BASH, ROLE_CODER, ROLE_READER, ROLE_SEARCHER, ROLE_PLANNER,
} from './config.js';
import { MONITORED_APPS } from './AppMonitor.js';

const PAD  = 12;
const RP_X = GAME_W - RIGHT_PANEL_W;   // right panel start x

// Roles ordered for leaderboard
const ALL_ROLES = [ROLE_CLAUDE, ROLE_BASH, ROLE_CODER, ROLE_READER, ROLE_SEARCHER, ROLE_PLANNER];

function fmtMs(ms) {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m${s % 60}s`;
}

export class UIScene extends Phaser.Scene {
    constructor() { super({ key: 'UIScene' }); }

    init(data) {
        this.agentState = data.agentState;
        this.appMonitor = data.appMonitor;
    }

    create() {
        this._buildLeftPanel();
        this._buildRightPanel();
        this._buildHint();

        this.agentState.onChange((state) => this._updateRight(state));
        this.appMonitor.onChange((apps)  => this._updateApps(apps));
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  LEFT PANEL — Busy leaderboard
    // ═════════════════════════════════════════════════════════════════════════
    _buildLeftPanel() {
        const bg = this.add.graphics();
        bg.fillStyle(0x0d0d1f, 0.92);
        bg.fillRect(0, 0, LEFT_PANEL_W, GAME_H);
        bg.fillStyle(0x16a34a, 1);
        bg.fillRect(LEFT_PANEL_W - 2, 0, 2, GAME_H);   // right border accent

        // Title
        this.add.text(PAD, PAD + 2, '🏆 忙碌排行榜', {
            fontSize: '12px', fontFamily: 'Courier New',
            color: '#86efac', fontStyle: 'bold',
        });
        this.add.text(PAD, PAD + 18, 'BUSY LEADERBOARD', {
            fontSize: '8px', fontFamily: 'Courier New', color: '#4b5563',
        });

        const divG = this.add.graphics();
        divG.lineStyle(1, 0x2a2a3c, 1);
        divG.lineBetween(PAD, 42, LEFT_PANEL_W - PAD, 42);

        // Rows — one per role
        this.lbRows = {};
        ALL_ROLES.forEach((role, i) => {
            const y    = 50 + i * 48;
            const col  = ROLE_COLORS[role].shirt;
            const name = TOOL_LABELS[role] ?? role;

            // Rank number
            this.add.text(PAD, y + 2, `#${i + 1}`, {
                fontSize: '10px', fontFamily: 'Courier New', color: '#374151',
            });

            // Colour dot
            const dot = this.add.circle(PAD + 28, y + 8, 5, col, 0.9);

            // Role name
            const lbl = this.add.text(PAD + 38, y, name, {
                fontSize: '9px', fontFamily: 'Courier New', color: '#9ca3af',
                wordWrap: { width: LEFT_PANEL_W - PAD - 40 },
            });

            // Time text
            const time = this.add.text(LEFT_PANEL_W - PAD, y, '0s', {
                fontSize: '9px', fontFamily: 'Courier New', color: '#6b7280',
            }).setOrigin(1, 0);

            // Bar background
            const barBg = this.add.graphics();
            barBg.fillStyle(0x1a1a2e, 1);
            barBg.fillRect(PAD + 2, y + 16, LEFT_PANEL_W - PAD * 2 - 4, 6);

            // Bar fill
            const bar = this.add.graphics();

            // Status badge
            const status = this.add.text(PAD + 38, y + 26, 'idle', {
                fontSize: '8px', fontFamily: 'Courier New', color: '#374151',
            });

            this.lbRows[role] = { dot, lbl, time, bar, status, rank: i + 1, rankText: null };
        });

        // Rank number texts (separate so we can reorder)
        this._lbRankTexts = ALL_ROLES.map((_, i) => {
            return this.add.text(PAD, 50 + i * 48 + 2, `#${i + 1}`, {
                fontSize: '10px', fontFamily: 'Courier New', color: '#374151',
            });
        });
    }

    _updateLeaderboard({ busyTime }) {
        if (!busyTime) return;

        // Sort roles by busy time descending
        const sorted = ALL_ROLES.slice().sort(
            (a, b) => (busyTime[b] ?? 0) - (busyTime[a] ?? 0)
        );
        const maxMs = busyTime[sorted[0]] || 1;

        sorted.forEach((role, rank) => {
            const row   = this.lbRows[role];
            if (!row) return;
            const ms    = busyTime[role] ?? 0;
            const barW  = Math.round((ms / maxMs) * (LEFT_PANEL_W - PAD * 2 - 6));
            const col   = ROLE_COLORS[role].shirt;

            row.time.setText(fmtMs(ms));
            row.time.setColor(rank === 0 ? '#fbbf24' : '#6b7280');

            row.bar.clear();
            if (barW > 0) {
                row.bar.fillStyle(col, 0.8);
                row.bar.fillRect(PAD + 2, 50 + rank * 48 + 16, barW, 6);
            }

            // Move all elements to new sorted position
            const y = 50 + rank * 48;
            row.dot.setPosition(PAD + 28, y + 8);
            row.lbl.setPosition(PAD + 38, y);
            row.time.setPosition(LEFT_PANEL_W - PAD, y);
            row.status.setPosition(PAD + 38, y + 26);
        });

        // Rank labels
        this._lbRankTexts?.forEach((t, i) => {
            t.setText(`#${i + 1}`);
        });
    }

    _updateLbStatus(role, state) {
        const row = this.lbRows[role];
        if (!row) return;
        const statusMap = {
            working: { text: '⚡ 工作中', color: '#86efac' },
            meeting: { text: '👥 开会中', color: '#93c5fd' },
            break:   { text: '☕ 休息中', color: '#fbbf24' },
            walking: { text: '🚶 移动中', color: '#d1d5db' },
            idle:    { text: 'idle',     color: '#374151' },
        };
        const s = statusMap[state] ?? statusMap.idle;
        row.status.setText(s.text).setColor(s.color);
        row.lbl.setColor(state === 'working' ? '#f3f4f6' : '#9ca3af');
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  RIGHT PANEL — Agent status + App monitor
    // ═════════════════════════════════════════════════════════════════════════
    _buildRightPanel() {
        const bg = this.add.graphics();
        bg.fillStyle(0x0d0d1f, 0.92);
        bg.fillRect(RP_X, 0, RIGHT_PANEL_W, GAME_H);
        bg.fillStyle(0x16a34a, 1);
        bg.fillRect(RP_X, 0, 2, GAME_H);   // left border accent

        // ── Title badge ───────────────────────────────────────────────────────
        const badge = this.add.graphics();
        badge.fillStyle(0x16a34a, 0.85);
        badge.fillRoundedRect(RP_X + PAD, PAD, 254, 28, 6);
        this.add.text(RP_X + PAD + 10, PAD + 7, '◈ Claude Agent Office', {
            fontSize: '10px', fontFamily: 'Courier New',
            color: '#f3f4f6', fontStyle: 'bold',
        });

        // ── Current status ────────────────────────────────────────────────────
        const sy = 46;
        this.add.text(RP_X + PAD, sy, 'AGENT STATUS', {
            fontSize: '9px', fontFamily: 'Courier New', color: '#4b5563',
        });
        this.statusDot   = this.add.circle(RP_X + PAD + 6, sy + 20, 5, 0x16a34a);
        this.statusLabel = this.add.text(RP_X + PAD + 16, sy + 14, '...', {
            fontSize: '12px', fontFamily: 'Courier New', color: '#f3f4f6',
        });
        this.statusDetail = this.add.text(RP_X + PAD, sy + 30, '', {
            fontSize: '9px', fontFamily: 'Courier New', color: '#9ca3af',
            wordWrap: { width: RIGHT_PANEL_W - PAD * 2 },
        });
        this.tweens.add({ targets: this.statusDot, alpha: 0.3, yoyo: true, repeat: -1, duration: 700 });

        // ── Divider ───────────────────────────────────────────────────────────
        const d1 = this.add.graphics();
        d1.lineStyle(1, 0x2a2a3c, 1);
        d1.lineBetween(RP_X + PAD, sy + 52, GAME_W - PAD, sy + 52);

        // ── Activity log ──────────────────────────────────────────────────────
        const logY = sy + 58;
        this.add.text(RP_X + PAD, logY, 'ACTIVITY LOG', {
            fontSize: '9px', fontFamily: 'Courier New', color: '#4b5563',
        });
        this.logLines = [];
        for (let i = 0; i < 7; i++) {
            this.logLines.push(this.add.text(RP_X + PAD, logY + 14 + i * 13, '', {
                fontSize: '9px', fontFamily: 'Courier New', color: '#4b5563',
                wordWrap: { width: RIGHT_PANEL_W - PAD * 2 },
            }));
        }

        // ── Divider ───────────────────────────────────────────────────────────
        const appY = logY + 14 + 7 * 13 + 4;
        const d2 = this.add.graphics();
        d2.lineStyle(1, 0x2a2a3c, 1);
        d2.lineBetween(RP_X + PAD, appY, GAME_W - PAD, appY);

        // ── App monitor ───────────────────────────────────────────────────────
        this.add.text(RP_X + PAD, appY + 6, '⬡ APP MONITOR', {
            fontSize: '9px', fontFamily: 'Courier New', color: '#4b5563',
        });
        this.appRows = {};
        MONITORED_APPS.forEach((app, i) => {
            const y = appY + 22 + i * 22;
            const dot = this.add.circle(RP_X + PAD + 5, y + 5, 4, app.color, 0.4);
            const nameTxt = this.add.text(RP_X + PAD + 14, y, app.name, {
                fontSize: '9px', fontFamily: 'Courier New', color: '#4b5563',
            });
            const bar = this.add.graphics();
            const cpu  = this.add.text(GAME_W - PAD, y, '—', {
                fontSize: '9px', fontFamily: 'Courier New', color: '#374151',
            }).setOrigin(1, 0);
            this.appRows[app.id] = { dot, nameTxt, bar, cpu };
        });
    }

    // ── Update methods ────────────────────────────────────────────────────────

    _updateRight({ role, tool, detail, history, busyTime }) {
        const label = tool ? `⚡ ${tool}` : '💭 思考中';
        this.statusLabel.setText(label);
        this.statusDetail.setText(detail ?? '');
        const col = ROLE_COLORS[role]?.shirt ?? 0x16a34a;
        this.statusDot.setFillStyle(col);

        // Log
        const lines = (history ?? []).slice(0, 7);
        this.logLines.forEach((t, i) => {
            const entry = lines[i];
            if (!entry) { t.setText(''); return; }
            const ts  = new Date(entry.ts).toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            t.setText(`${ts}  ${entry.tool ?? 'think'}`);
            t.setColor(i === 0 ? '#d1d5db' : '#4b5563');
        });

        // Leaderboard
        this._updateLeaderboard({ busyTime });

        // Update leaderboard status for active role
        if (role) this._updateLbStatus(role, tool ? 'working' : 'idle');
    }

    _updateApps(states) {
        MONITORED_APPS.forEach(app => {
            const row = this.appRows[app.id];
            const st  = states[app.id];
            if (!row || !st) return;

            row.dot.setAlpha(st.active ? 1.0 : 0.3);
            row.dot.setFillStyle(app.color);
            row.nameTxt.setColor(st.active ? '#e5e7eb' : '#4b5563');

            row.bar.clear();
            if (st.active && st.cpu > 0) {
                const barW = Math.round((st.cpu / 100) * 80);
                row.bar.fillStyle(app.color, 0.7);
                row.bar.fillRect(RP_X + PAD + 78, this._appRowY(app.id) + 3, barW, 5);
            }

            row.cpu.setText(st.active ? `${st.cpu}%` : '—');
            row.cpu.setColor(st.active ? '#9ca3af' : '#374151');
        });
    }

    _appRowY(id) {
        const idx = MONITORED_APPS.findIndex(a => a.id === id);
        // Compute same y as in _buildRightPanel
        const sy   = 46;
        const logY = sy + 58;
        const appY = logY + 14 + 7 * 13 + 4;
        return appY + 22 + idx * 22;
    }

    // ── Bottom hint ───────────────────────────────────────────────────────────
    _buildHint() {
        this.add.text(LEFT_PANEL_W + PAD, GAME_H - 16,
            'WASD/↑↓←→: 平移  ·  滚轮: 缩放  ·  右键拖动: 平移', {
                fontSize: '8px', fontFamily: 'Courier New', color: '#374151',
            });
    }
}
