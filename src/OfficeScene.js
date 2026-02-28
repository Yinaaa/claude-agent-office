import Phaser from 'phaser';
import {
    TILE_W, TILE_H, WALL_H,
    TILE_EMPTY, TILE_FLOOR, TILE_WALL, TILE_DOOR,
    GRID_COLS, GRID_ROWS, FURNITURE_BOX_H,
    ROLE_CLAUDE, LEFT_PANEL_W, RIGHT_PANEL_W,
    GAME_H,
} from './config.js';
import { gridToScreen, getDepth } from './IsoUtils.js';
import { generateTileTextures } from './TileRenderer.js';
import { createCharacterTexture } from './CharacterGen.js';
import { Employee } from './Employee.js';
import {
    DEFAULT_GRID, DEFAULT_FURNITURE, DEFAULT_EMPLOYEES,
    ZONE_LABELS, BREAK_ROOM_TILES, MEETING_ROOM_TILES,
} from './OfficeLayout.js';
import { AgentState } from './AgentState.js';
import { AppMonitor } from './AppMonitor.js';

const DOOR_H          = Math.floor(WALL_H * 0.45);
const MEETING_INTERVAL = 40_000;
const MEETING_DURATION = 14_000;
// How often each employee takes a break (ms between breaks)
const BREAK_INTERVAL_MIN = 18_000;
const BREAK_INTERVAL_MAX = 32_000;
const BREAK_DURATION_MIN =  7_000;
const BREAK_DURATION_MAX = 12_000;

export class OfficeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OfficeScene' });
        this.employees    = {};
        this.tileSprites  = [];
        this.furnitureSprites = [];
        this.grid         = [];
        this.agentState   = new AgentState();
        this.appMonitor   = new AppMonitor();
        this._activeRole  = null;
        this._inMeeting   = false;
    }

    create() {
        this.grid = DEFAULT_GRID.map(row => [...row]);

        generateTileTextures(this);
        this._renderGrid();
        this._placeFurniture();
        this._renderZoneLabels();
        this._spawnEmployees();

        // ── Camera: centre office in the visible area between the two panels ──
        const GAME_W   = 1280;
        const visibleCX = LEFT_PANEL_W + (GAME_W - LEFT_PANEL_W - RIGHT_PANEL_W) / 2; // 200 + 400 = 600
        const visibleCY = GAME_H / 2;
        const center   = gridToScreen(Math.floor(GRID_COLS / 2), Math.floor(GRID_ROWS / 2));
        this.cameras.main.setBackgroundColor(0x0f0f1a);
        this.cameras.main.setScroll(center.x - visibleCX, center.y - visibleCY);

        // ── Input ─────────────────────────────────────────────────────────────
        this.input.on('pointermove', (p) => {
            if (p.isDown && p.button === 2) {
                this.cameras.main.scrollX -= (p.x - p.prevPosition.x);
                this.cameras.main.scrollY -= (p.y - p.prevPosition.y);
            }
        });
        this.input.mouse?.disableContextMenu();
        this.input.on('wheel', (p, gs, dx, dy) => {
            const cam = this.cameras.main;
            cam.setZoom(Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.4, 2.5));
        });
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd    = this.input.keyboard.addKeys('W,A,S,D');

        // ── Agent + app state ─────────────────────────────────────────────────
        this.agentState.onChange((state) => this._onAgentState(state));
        this.agentState.start();
        this.appMonitor.start();
        this.scene.launch('UIScene', {
            agentState: this.agentState,
            appMonitor: this.appMonitor,
        });

        // ── Periodic all-hands meeting ────────────────────────────────────────
        this.time.addEvent({
            delay: MEETING_INTERVAL, loop: true,
            callback: this._triggerMeeting, callbackScope: this,
        });

        // ── Individual break schedules ────────────────────────────────────────
        this.time.delayedCall(3000, () => {
            Object.values(this.employees).forEach((emp, i) => {
                // Stagger start so they don't all leave at once
                this.time.delayedCall(i * 2000, () => this._scheduleBreak(emp));
            });
        });
    }

    update() {
        const cam = this.cameras.main, speed = 4;
        if (this.cursors.left.isDown  || this.wasd.A.isDown) cam.scrollX -= speed;
        if (this.cursors.right.isDown || this.wasd.D.isDown) cam.scrollX += speed;
        if (this.cursors.up.isDown    || this.wasd.W.isDown) cam.scrollY -= speed;
        if (this.cursors.down.isDown  || this.wasd.S.isDown) cam.scrollY += speed;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Agent state handler
    // ─────────────────────────────────────────────────────────────────────────
    _onAgentState({ role, tool }) {
        if (this._inMeeting) return;

        if (this._activeRole && this.employees[this._activeRole]) {
            const prev = this.employees[this._activeRole];
            prev.deactivate();
            prev.resetLabel();
        }

        const targetRole = role ?? ROLE_CLAUDE;
        this._activeRole = targetRole;
        const emp = this.employees[targetRole];
        if (!emp) return;

        emp.activate(tool);
        emp.setLabelText(tool ? `⚡ ${tool}` : '💭');
        this._spawnParticles(emp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Break scheduling
    // ─────────────────────────────────────────────────────────────────────────
    _scheduleBreak(emp) {
        const delay = BREAK_INTERVAL_MIN + Math.random() * (BREAK_INTERVAL_MAX - BREAK_INTERVAL_MIN);
        this.time.delayedCall(delay, () => {
            // Only send idle employees on break
            if (emp.state !== 'idle' || this._inMeeting) {
                this._scheduleBreak(emp);
                return;
            }
            const tile = BREAK_ROOM_TILES[Math.floor(Math.random() * BREAK_ROOM_TILES.length)];
            const dur  = BREAK_DURATION_MIN + Math.random() * (BREAK_DURATION_MAX - BREAK_DURATION_MIN);
            emp.goOnBreak(tile, dur, () => this._scheduleBreak(emp));
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Meeting
    // ─────────────────────────────────────────────────────────────────────────
    _triggerMeeting() {
        if (this._inMeeting) return;
        this._inMeeting = true;

        if (this._activeRole && this.employees[this._activeRole]) {
            this.employees[this._activeRole].deactivate();
            this.employees[this._activeRole].resetLabel();
        }

        const seats = [...MEETING_ROOM_TILES];
        Object.values(this.employees).forEach((emp, i) => {
            const seat = seats[i % seats.length];
            emp.goToMeeting(seat);
        });

        this.time.delayedCall(MEETING_DURATION, () => {
            this._inMeeting = false;
            Object.values(this.employees).forEach(emp => {
                emp.returnToDesk(() => this._scheduleBreak(emp));
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────────
    _spawnParticles(emp) {
        const pos = gridToScreen(emp.deskCol, emp.deskRow);
        for (let i = 0; i < 7; i++) {
            const px = this.add.circle(
                pos.x + Phaser.Math.Between(-22, 22),
                pos.y + Phaser.Math.Between(-22, 22),
                Phaser.Math.Between(2, 4), 0x16a34a, 0.9
            );
            px.setDepth(9999);
            this.tweens.add({
                targets: px, alpha: 0, y: px.y - 24,
                duration: 500 + i * 80,
                onComplete: () => px.destroy(),
            });
        }
    }

    _renderZoneLabels() {
        ZONE_LABELS.forEach(({ text, col, row }) => {
            const pos = gridToScreen(col, row);
            const badge = this.add.graphics();
            badge.fillStyle(0x0a0a1a, 0.75);
            badge.fillRoundedRect(pos.x - 28, pos.y - 18, 56, 16, 3);
            badge.setDepth(getDepth(col, row, 7));
            this.add.text(pos.x, pos.y - 10, text, {
                fontSize: '11px', fontFamily: 'Courier New',
                color: '#86efac', fontStyle: 'bold',
            }).setOrigin(0.5, 0.5).setDepth(getDepth(col, row, 8));
        });
    }

    _renderGrid() {
        this.tileSprites.forEach(s => s.destroy());
        this.tileSprites = [];
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                const tile = this.grid[row][col];
                if (tile === TILE_EMPTY) continue;
                const pos = gridToScreen(col, row);

                if (tile === TILE_FLOOR || tile === TILE_DOOR) {
                    let key;
                    if      (col <= 6 && row <= 6)  key = 'floorMeeting';
                    else if (col <= 6 && row >= 7)  key = 'floorBreak';
                    else key = (col + row) % 2 === 0 ? 'floor1' : 'floor2';
                    const s = this.add.sprite(pos.x, pos.y, key);
                    s.setOrigin(0.5, 0.5).setDepth(getDepth(col, row, 0));
                    this.tileSprites.push(s);
                }
                if (tile === TILE_WALL) {
                    const f = this.add.sprite(pos.x, pos.y, 'floor1');
                    f.setOrigin(0.5, 0.5).setDepth(getDepth(col, row, 0));
                    this.tileSprites.push(f);
                    const w = this.add.sprite(pos.x, pos.y - WALL_H / 2, 'wall');
                    w.setOrigin(0.5, 0.5).setDepth(getDepth(col, row, 3));
                    this.tileSprites.push(w);
                }
                if (tile === TILE_DOOR) {
                    const d = this.add.sprite(pos.x, pos.y - DOOR_H / 2, 'door');
                    d.setOrigin(0.5, 0.5).setDepth(getDepth(col, row, 2));
                    this.tileSprites.push(d);
                }
            }
        }
    }

    _placeFurniture() {
        this.furnitureSprites.forEach(s => s.destroy());
        this.furnitureSprites = [];
        DEFAULT_FURNITURE.forEach(([type, col, row]) => {
            if (!this.textures.exists(type)) return;
            const pos  = gridToScreen(col, row);
            const boxH = FURNITURE_BOX_H[type] ?? 10;
            const s    = this.add.sprite(pos.x, pos.y - boxH / 2, type);
            s.setOrigin(0.5, 0.5).setDepth(getDepth(col, row, 4));
            this.furnitureSprites.push(s);
        });
    }

    _spawnEmployees() {
        DEFAULT_EMPLOYEES.forEach(({ role, col, row, deskCol, deskRow }) => {
            const texKey = createCharacterTexture(this, role);
            this.employees[role] = new Employee(this, {
                role, col, row, deskCol, deskRow, textureKey: texKey,
            });
        });
    }
}
