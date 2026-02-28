# Claude Agent Office 🏢

一个实时可视化 Claude agent 工具调用状态的等距像素风格虚拟办公室，灵感来自 [pixelHQ](https://github.com/mustafa3252/pixelhq)。

![Claude Agent Office](https://img.shields.io/badge/Phaser-3.80-blue) ![Vite](https://img.shields.io/badge/Vite-5.4-purple) ![Node](https://img.shields.io/badge/Node-18+-green)

## 预览

每次 Claude 调用工具，对应的像素角色就会走到工位开始工作。会议、休息、寻路——全部实时驱动。

## 功能

- **等距像素办公室** — 三个区域：办公区、会议室、茶水间
- **6 个 Agent 角色** — 海贼王大头像素风，每个角色对应一类工具
- **实时工具监控** — 通过 Claude Code Hooks 接入，工具调用驱动角色行为
- **员工行为状态机** — 工位=工作、会议室=开会、茶水间=休息，BFS 寻路不穿墙
- **忙碌排行榜** — 左侧面板实时统计每个 Agent 的累计 busy 时长
- **App 监控** — 右侧面板检测本机运行的应用（微信、Chrome、Spotify 等）
- **Demo 模式** — 无需服务器也能运行，自动模拟 Agent 状态

## 角色对应关系

| 角色 | 颜色 | 负责工具 |
|------|------|---------|
| Claude | 🟢 绿 | 思考 / 响应 |
| Terminal | 🔴 红 | `Bash` |
| Code Editor | 🟢 绿 | `Edit` `Write` `NotebookEdit` |
| File Reader | 🟠 橙 | `Read` `Glob` |
| Web Search | 🔵 蓝 | `Grep` `WebSearch` `WebFetch` |
| Task Planner | 🩵 青 | `Task` |

## 快速开始

```bash
git clone https://github.com/Yinaaa/claude-agent-office
cd claude-agent-office
npm install
```

### Demo 模式（无需配置）

```bash
npm run dev
```

打开 http://localhost:5173 即可看到自动演示。

### 实时模式（接入真实 Claude agent）

**1. 启动服务器 + 前端**

```bash
npm start
```

**2. 配置 Claude Code Hooks**

在 `~/.claude/settings.json` 中添加：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/claude-agent-office/scripts/hook.sh PreToolUse"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/claude-agent-office/scripts/hook.sh PostToolUse"
          }
        ]
      }
    ]
  }
}
```

之后每次 Claude 调用工具，办公室里对应的角色就会实时响应。

## 架构

```
Claude Code Hooks
  → scripts/hook.sh  (fire-and-forget POST)
    → server.js :3141  (HTTP + WebSocket)
      → 浏览器  (ws://localhost:3141)
        → Phaser 场景更新
```

服务器同时每 4 秒扫描 `ps aux`，检测本机 App 运行状态并推送到前端。

## 操作

| 操作 | 功能 |
|------|------|
| WASD / 方向键 | 平移视角 |
| 鼠标滚轮 | 缩放 |
| 右键拖动 | 平移视角 |

## 技术栈

- [Phaser 3](https://phaser.io/) — 游戏引擎（等距渲染、动画、寻路）
- [Vite](https://vitejs.dev/) — 前端构建
- [ws](https://github.com/websockets/ws) — WebSocket 服务器
- Claude Code Hooks — 实时工具调用事件

## License

MIT
