import Phaser from 'phaser';
import { gridToScreen, getDepth } from './IsoUtils.js';
import {
    CHAR_SCALE, CHAR_FRAME_H, TILE_W, TILE_H,
    ROLE_CLAUDE, ROLE_COLORS,
} from './config.js';
import { findPath } from './Pathfinder.js';

const MOVE_SPEED = 80; // px / s

/**
 * States:
 *   'idle'    – sitting at desk, not active
 *   'working' – at desk, executing a tool (busy)
 *   'walking' – moving between locations
 *   'meeting' – in meeting room (interacting)
 *   'break'   – in break room (resting)
 */
export class Employee {
    constructor(scene, { role, col, row, deskCol, deskRow, textureKey }) {
        this.scene    = scene;
        this.role     = role;
        this.col      = col;
        this.row      = row;
        this.deskCol  = deskCol;
        this.deskRow  = deskRow;
        this.texKey   = textureKey;

        this.state      = 'idle';
        this._moving    = false;
        this._workTween = null;
        this._breakTimer = null;

        const pos = gridToScreen(col, row);

        this.sprite = scene.add.sprite(pos.x, pos.y - 8, textureKey, 0);
        this.sprite.setScale(CHAR_SCALE).setOrigin(0.5, 1.0);
        this.sprite.setDepth(getDepth(col, row, 5));
        this.sprite.setInteractive();

        this.label = scene.add.text(pos.x, pos.y - CHAR_FRAME_H * CHAR_SCALE - 2,
            role.toUpperCase(), {
                fontSize: '9px', fontFamily: 'Courier New',
                color: '#7a7a9a',
            }).setOrigin(0.5, 1).setDepth(getDepth(col, row, 6));

        this.stateTag = scene.add.text(pos.x, pos.y - CHAR_FRAME_H * CHAR_SCALE - 14,
            '', {
                fontSize: '8px', fontFamily: 'Courier New',
                color: '#86efac', backgroundColor: '#0a1a0a',
                padding: { x: 3, y: 1 },
            }).setOrigin(0.5, 1).setDepth(getDepth(col, row, 7));

        this.glow = scene.add.graphics();
        this.glow.setDepth(getDepth(col, row, 4));
        this._drawGlow(pos, false);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Public API called by OfficeScene
    // ─────────────────────────────────────────────────────────────────────────

    /** Tool is being used → walk to desk and start typing */
    activate(toolName) {
        this._cancelBreakTimer();
        this.state = 'working';
        this._setTag(`⚡ ${toolName ?? '工作中'}`, '#86efac');
        this._walkTo(this.deskCol, this.deskRow, () => this._startTyping());
    }

    /** Tool done → back to idle at desk */
    deactivate() {
        if (this.state === 'working') {
            this._stopTyping();
            this.state = 'idle';
            this._setTag('');
            this._drawGlow(gridToScreen(this.col, this.row), false);
            this.label.setColor('#7a7a9a');
        }
    }

    /** Sent to break room — called by OfficeScene scheduler */
    goOnBreak(tile, duration, onReturn) {
        if (this.state === 'working') return;
        this.state = 'break';
        this._setTag('☕ 休息中', '#fbbf24');
        this._walkTo(tile.col, tile.row, () => {
            // gentle idle bob
            this._workTween = this.scene.tweens.add({
                targets: this.sprite, y: this.sprite.y - 3,
                yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut',
            });
            const pos = gridToScreen(tile.col, tile.row);
            this._drawGlow(pos, true, 0xf97316, 0.6);

            this._breakTimer = this.scene.time.delayedCall(duration, () => {
                this._stopTyping();
                this.state = 'idle';
                this._setTag('');
                this._drawGlow(gridToScreen(this.col, this.row), false);
                this._walkTo(this.deskCol, this.deskRow, onReturn);
            });
        });
    }

    /** Called when a group meeting starts */
    goToMeeting(tile) {
        if (this.state === 'working') return;
        this._cancelBreakTimer();
        this._stopTyping();
        this.state = 'meeting';
        this._setTag('👥 开会中', '#93c5fd');
        this._walkTo(tile.col, tile.row, () => {
            const pos = gridToScreen(tile.col, tile.row);
            this._drawGlow(pos, true, 0x3b82f6, 0.55);
        });
    }

    /** Called when meeting ends */
    returnToDesk(onArrived) {
        this._stopTyping();
        this.state = 'idle';
        this._setTag('');
        this._drawGlow(gridToScreen(this.col, this.row), false);
        this._walkTo(this.deskCol, this.deskRow, onArrived);
    }

    setLabelText(txt) {
        this.label.setText(txt);
        this.label.setColor('#ffffff');
    }

    resetLabel() {
        this.label.setText(this.role.toUpperCase());
        this.label.setColor('#7a7a9a');
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Movement
    // ─────────────────────────────────────────────────────────────────────────

    _walkTo(targetCol, targetRow, onDone) {
        if (this._moving) {
            // Queue the walk for after current one finishes via a small delay
            this.scene.time.delayedCall(200, () => this._walkTo(targetCol, targetRow, onDone));
            return;
        }
        if (this.col === targetCol && this.row === targetRow) {
            if (onDone) onDone();
            return;
        }
        const path = findPath(this.scene.grid, this.col, this.row, targetCol, targetRow);
        if (!path || path.length === 0) { if (onDone) onDone(); return; }
        this._moving = true;
        this._walkPath(path, 0, onDone);
    }

    _walkPath(path, idx, onDone) {
        if (idx >= path.length) {
            this._moving = false;
            this.sprite.anims.stop();
            this.sprite.setFrame(0);
            if (onDone) onDone();
            return;
        }
        const step   = path[idx];
        const target = gridToScreen(step.col, step.row);
        const dist   = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y, target.x, target.y - 8
        );

        this.sprite.play(`walk_${this.texKey}`, true);
        this.scene.tweens.add({
            targets: this.sprite,
            x: target.x, y: target.y - 8,
            duration: Math.max((dist / MOVE_SPEED) * 1000, 80),
            ease: 'Linear',
            onUpdate: () => {
                this.sprite.setDepth(getDepth(step.col, step.row, 5));
                this._syncLabels();
                this._drawGlow(
                    { x: this.sprite.x, y: this.sprite.y + 8 },
                    this.state === 'working',
                );
            },
            onComplete: () => {
                this.col = step.col;
                this.row = step.row;
                this._walkPath(path, idx + 1, onDone);
            },
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Animations & visuals
    // ─────────────────────────────────────────────────────────────────────────

    _startTyping() {
        const pos = gridToScreen(this.col, this.row);
        this._drawGlow(pos, true);
        const isClaude = this.role === ROLE_CLAUDE;
        this._workTween = this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - (isClaude ? 4 : 2),
            yoyo: true, repeat: -1,
            duration: isClaude ? 500 : 160,
            ease: 'Sine.easeInOut',
        });
    }

    _stopTyping() {
        if (this._workTween) { this._workTween.stop(); this._workTween = null; }
    }

    _cancelBreakTimer() {
        if (this._breakTimer) { this._breakTimer.remove(); this._breakTimer = null; }
    }

    _syncLabels() {
        const y = this.sprite.y;
        const x = this.sprite.x;
        const baseY = y - CHAR_FRAME_H * CHAR_SCALE - 2;
        this.label.setPosition(x, baseY);
        this.label.setDepth(getDepth(this.col, this.row, 6));
        this.stateTag.setPosition(x, baseY - 12);
        this.stateTag.setDepth(getDepth(this.col, this.row, 7));
    }

    _setTag(text, color = '#86efac') {
        this.stateTag.setText(text);
        this.stateTag.setColor(color);
    }

    _drawGlow(pos, on, color, alpha) {
        this.glow.clear();
        if (!on) return;
        const c = color ?? (ROLE_COLORS[this.role]?.shirt ?? 0x16a34a);
        const a = alpha ?? 0.9;
        this.glow.lineStyle(2, c, a);
        this.glow.strokeEllipse(pos.x, pos.y, TILE_W * 0.55, TILE_H * 0.55);
        this.glow.lineStyle(1, 0x86efac, 0.3);
        this.glow.strokeEllipse(pos.x, pos.y, TILE_W * 0.8, TILE_H * 0.8);
    }
}
