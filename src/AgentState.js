import { LiveBridge } from './LiveBridge.js';

const TOOL_ROLE_MAP = {
    Bash:         'bash',
    Edit:         'coder',
    Write:        'coder',
    Read:         'reader',
    Glob:         'reader',
    Grep:         'searcher',
    WebSearch:    'searcher',
    WebFetch:     'searcher',
    Task:         'planner',
    NotebookEdit: 'coder',
};

const DEMO_SCENARIOS = [
    { tool: null,        role: 'claude',   detail: '规划下一步行动' },
    { tool: 'Bash',      role: 'bash',     detail: 'ls -la ~/projects' },
    { tool: 'Read',      role: 'reader',   detail: '读取 src/main.js' },
    { tool: 'Grep',      role: 'searcher', detail: '搜索 "pixelHQ"' },
    { tool: null,        role: 'claude',   detail: '分析搜索结果' },
    { tool: 'Edit',      role: 'coder',    detail: '编辑 OfficeScene.js' },
    { tool: 'Write',     role: 'coder',    detail: '写入 config.js' },
    { tool: 'WebSearch', role: 'searcher', detail: '搜索 Phaser 文档' },
    { tool: null,        role: 'claude',   detail: '检查输出结果' },
    { tool: 'Task',      role: 'planner',  detail: '启动子 Agent' },
    { tool: 'Bash',      role: 'bash',     detail: 'npm run build' },
    { tool: null,        role: 'claude',   detail: '正在回复用户' },
];

export class AgentState {
    constructor() {
        this.listeners       = [];
        this.currentScenario = null;
        this.history         = [];
        this.busyTime        = {};
        this._busyStart      = null;
        this._currentRole    = null;
        this._demoIdx        = 0;
        this._demoTimer      = null;
        this._isLive         = false;   // true once first real hook arrives
    }

    onChange(cb) { this.listeners.push(cb); }

    start() {
        // Attempt live connection via shared bridge
        LiveBridge.connect();

        // Give the server 2 s to connect; fall back to demo if it doesn't
        const fallbackTimer = setTimeout(() => {
            if (!this._isLive) {
                console.log('[AgentState] Server not reachable — using demo mode');
                this._startDemo();
            }
        }, 2000);

        // Live: PreToolUse → activate role
        LiveBridge.on('PreToolUse', (msg) => {
            if (!this._isLive) {
                this._isLive = true;
                clearTimeout(fallbackTimer);
                clearTimeout(this._demoTimer);
                this._demoTimer = null;
                console.log('[AgentState] ✓ Live mode activated');
            }
            const toolName = msg.tool_name ?? msg.tool;
            const role     = TOOL_ROLE_MAP[toolName] ?? 'claude';
            const detail   = this._extractDetail(msg.tool_input);
            this._applyEvent({ tool: toolName, role, label: toolName, detail });
        });

        // Live: PostToolUse → back to thinking
        LiveBridge.on('PostToolUse', (msg) => {
            this._applyEvent({ tool: null, role: 'claude', label: '思考中', detail: '处理结果中…' });
        });

        // If server disconnects mid-session, resume demo
        LiveBridge.on('disconnected', () => {
            if (this._isLive) {
                console.log('[AgentState] Server lost — resuming demo');
                this._isLive = false;
                this._startDemo();
            }
        });
    }

    _startDemo() {
        if (this._demoTimer) return;
        this._tickDemo();
    }

    _tickDemo() {
        if (this._isLive) return;   // live took over
        const s = DEMO_SCENARIOS[this._demoIdx % DEMO_SCENARIOS.length];
        this._demoIdx++;
        this._applyEvent(s);
        const delay = s.tool ? 2800 + Math.random() * 1200 : 1600 + Math.random() * 800;
        this._demoTimer = setTimeout(() => this._tickDemo(), delay);
    }

    _applyEvent(evt) {
        // Accumulate busy time for the role that just finished a tool
        if (this._currentRole && this._busyStart && this.currentScenario?.tool) {
            this.busyTime[this._currentRole] =
                (this.busyTime[this._currentRole] ?? 0) + (Date.now() - this._busyStart);
        }
        this._currentRole = evt.role ?? null;
        this._busyStart   = evt.tool ? Date.now() : null;

        this.currentScenario = evt;
        this.history.unshift({ ...evt, ts: Date.now() });
        if (this.history.length > 12) this.history.pop();

        this.listeners.forEach(cb =>
            cb({ ...evt, history: this.history, busyTime: { ...this.busyTime } })
        );
    }

    _extractDetail(input) {
        if (!input) return '';
        if (typeof input.command   === 'string') return input.command.slice(0, 80);
        if (typeof input.file_path === 'string') return input.file_path;
        if (typeof input.query     === 'string') return input.query.slice(0, 80);
        if (typeof input.pattern   === 'string') return input.pattern.slice(0, 80);
        if (typeof input.prompt    === 'string') return input.prompt.slice(0, 80);
        if (typeof input.url       === 'string') return input.url.slice(0, 80);
        try { return JSON.stringify(input).slice(0, 80); } catch { return ''; }
    }
}
