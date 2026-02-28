import { LiveBridge } from './LiveBridge.js';

export const MONITORED_APPS = [
    { id: 'xiaohongshu', name: '小红书',  icon: '📕', color: 0xff2442, desc: '浏览种草内容' },
    { id: 'wechat',      name: '微信',    icon: '💬', color: 0x07c160, desc: '消息通知' },
    { id: 'cursor',      name: 'Cursor',  icon: '⚡', color: 0x0ea5e9, desc: '代码编辑中' },
    { id: 'chrome',      name: 'Chrome',  icon: '🌐', color: 0xf97316, desc: '网页浏览' },
    { id: 'spotify',     name: 'Spotify', icon: '🎵', color: 0x1db954, desc: '播放音乐' },
    { id: 'notion',      name: 'Notion',  icon: '📝', color: 0xe5e7eb, desc: '记录笔记' },
];

export class AppMonitor {
    constructor() {
        this.appStates = {};
        this.listeners = [];
        this._demoTimer = null;
        this._isLive    = false;

        MONITORED_APPS.forEach(a => {
            this.appStates[a.id] = { active: false, cpu: 0 };
        });
    }

    onChange(cb) { this.listeners.push(cb); }

    start() {
        LiveBridge.connect(); // reuses existing connection

        // Give server 2 s to arrive; fall back to demo
        const fallback = setTimeout(() => {
            if (!this._isLive) {
                console.log('[AppMonitor] No server — using demo mode');
                this._tickDemo();
            }
        }, 2000);

        // Live: server pushes real app states
        LiveBridge.on('appState', (msg) => {
            if (!this._isLive) {
                this._isLive = true;
                clearTimeout(fallback);
                clearTimeout(this._demoTimer);
                console.log('[AppMonitor] ✓ Live app states received');
            }
            // Merge server data (may be partial)
            Object.assign(this.appStates, msg.states ?? {});
            this._notify();
        });

        LiveBridge.on('disconnected', () => {
            if (this._isLive) {
                this._isLive = false;
                this._tickDemo();
            }
        });
    }

    // ── Demo mode ─────────────────────────────────────────────────────────────
    _tickDemo() {
        if (this._isLive) return;
        MONITORED_APPS.forEach(app => {
            const st   = this.appStates[app.id];
            const flip = Math.random();
            if (!st.active && flip < 0.12) {
                st.active = true;
                st.cpu    = Math.round(5 + Math.random() * 30);
            } else if (st.active && flip < 0.08) {
                st.active = false;
                st.cpu    = 0;
            } else if (st.active) {
                st.cpu = Math.max(1, Math.min(95, st.cpu + Math.round((Math.random() - 0.5) * 8)));
            }
        });
        this._notify();
        const delay = 2000 + Math.random() * 2000;
        this._demoTimer = setTimeout(() => this._tickDemo(), delay);
    }

    _notify() {
        this.listeners.forEach(cb => cb({ ...this.appStates }));
    }
}
