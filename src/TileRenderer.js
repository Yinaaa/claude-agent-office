import { TILE_W, TILE_H, WALL_H, COLORS, FURNITURE_BOX_H } from './config.js';

/** Draw a flat isometric diamond */
function drawIsoTop(g, cx, cy, w, h, color) {
    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(cx,         cy - h / 2);
    g.lineTo(cx + w / 2, cy);
    g.lineTo(cx,         cy + h / 2);
    g.lineTo(cx - w / 2, cy);
    g.closePath();
    g.fillPath();
}

/** Draw an isometric box (top + left + right faces) */
function drawIsoBox(g, cx, cy, w, h, wallH, topC, leftC, rightC) {
    // Top face
    drawIsoTop(g, cx, cy - wallH / 2, w, h, topC);
    // Left face
    g.fillStyle(leftC, 1);
    g.beginPath();
    g.moveTo(cx - w / 2, cy);
    g.lineTo(cx,          cy + h / 2);
    g.lineTo(cx,          cy + h / 2 + wallH);
    g.lineTo(cx - w / 2,  cy + wallH);
    g.closePath();
    g.fillPath();
    // Right face
    g.fillStyle(rightC, 1);
    g.beginPath();
    g.moveTo(cx + w / 2, cy);
    g.lineTo(cx,          cy + h / 2);
    g.lineTo(cx,          cy + h / 2 + wallH);
    g.lineTo(cx + w / 2,  cy + wallH);
    g.closePath();
    g.fillPath();
}

export function generateTileTextures(scene) {
    const W = TILE_W, H = TILE_H;
    const cx = W / 2, cy = H / 2 + WALL_H;

    // ── Floor 1 (dark blue-grey) ─────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        drawIsoTop(g, cx, cy, W, H, COLORS.FLOOR_1.top);
        g.generateTexture('floor1', W, H + WALL_H + 4);
        g.destroy();
    }
    // ── Floor 2 (slightly lighter) ────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        drawIsoTop(g, cx, cy, W, H, COLORS.FLOOR_2.top);
        g.generateTexture('floor2', W, H + WALL_H + 4);
        g.destroy();
    }
    // ── Meeting room floor (green tint) ───────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        drawIsoTop(g, cx, cy, W, H, COLORS.FLOOR_MEETING.top);
        g.generateTexture('floorMeeting', W, H + WALL_H + 4);
        g.destroy();
    }
    // ── Break room floor (blue tint) ─────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        drawIsoTop(g, cx, cy, W, H, COLORS.FLOOR_BREAK.top);
        g.generateTexture('floorBreak', W, H + WALL_H + 4);
        g.destroy();
    }
    // ── Wall ──────────────────────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        drawIsoBox(g, cx, cy, W, H, WALL_H,
            COLORS.WALL.top, COLORS.WALL.left, COLORS.WALL.right);
        g.generateTexture('wall', W, H + WALL_H * 2 + 4);
        g.destroy();
    }
    // ── Door ──────────────────────────────────────────────────────────────────
    {
        const dH = Math.floor(WALL_H * 0.45);
        const g  = scene.make.graphics({ x: 0, y: 0, add: false });
        drawIsoBox(g, cx, cy, W, H, dH,
            COLORS.DOOR.top, COLORS.DOOR.left, COLORS.DOOR.right);
        g.generateTexture('door', W, H + WALL_H * 2 + 4);
        g.destroy();
    }
    // ── Highlight ─────────────────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.lineStyle(2, 0x00ff88, 0.8);
        g.beginPath();
        g.moveTo(cx,         cy - H / 2);
        g.lineTo(cx + W / 2, cy);
        g.lineTo(cx,         cy + H / 2);
        g.lineTo(cx - W / 2, cy);
        g.closePath();
        g.strokePath();
        g.generateTexture('highlight', W, H + WALL_H + 4);
        g.destroy();
    }

    // ══ Furniture textures ════════════════════════════════════════════════════
    generateFurnitureTextures(scene);
}

function generateFurnitureTextures(scene) {
    const W = TILE_W, H = TILE_H;
    const cx = W / 2, cy = H / 2 + WALL_H;

    // ── Desk ──────────────────────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const bH = FURNITURE_BOX_H.desk;
        drawIsoBox(g, cx, cy, W * 0.85, H * 0.85, bH, 0x8b6914, 0x6d4f0e, 0x5a3f0a);
        // Screen
        g.fillStyle(0x1e90ff, 1);
        g.fillRect(cx - 8, cy - bH - 14, 16, 10);
        g.fillStyle(0x0a0a1a, 1);
        g.fillRect(cx - 6, cy - bH - 12, 12, 8);
        g.generateTexture('desk', W, H + WALL_H * 2 + 4);
        g.destroy();
    }
    // ── Chair ─────────────────────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const bH = FURNITURE_BOX_H.chair;
        drawIsoBox(g, cx, cy, W * 0.45, H * 0.45, bH, 0x2a2a4a, 0x1a1a3a, 0x0f0f28);
        g.generateTexture('chair', W, H + WALL_H * 2 + 4);
        g.destroy();
    }
    // ── Whiteboard ────────────────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const bH = FURNITURE_BOX_H.whiteboard;
        drawIsoBox(g, cx, cy, W * 0.9, H * 0.5, bH, 0xf0f0f8, 0xd0d0e0, 0xb8b8d0);
        // Lines on board
        g.lineStyle(1, 0x16a34a, 0.5);
        for (let i = 0; i < 3; i++) {
            const ly = cy - bH - 18 + i * 6;
            g.lineBetween(cx - 12, ly, cx + 12, ly);
        }
        g.generateTexture('whiteboard', W, H + WALL_H * 2 + 4);
        g.destroy();
    }
    // ── Plant ─────────────────────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const bH = FURNITURE_BOX_H.plant;
        drawIsoBox(g, cx, cy, W * 0.3, H * 0.3, 6, 0x8b4513, 0x6b3410, 0x4f260b);
        g.fillStyle(0x22c55e, 1);
        g.fillCircle(cx, cy - bH - 6, 10);
        g.fillStyle(0x16a34a, 1);
        g.fillCircle(cx - 6, cy - bH - 4, 7);
        g.fillCircle(cx + 6, cy - bH - 4, 7);
        g.generateTexture('plant', W, H + WALL_H * 2 + 4);
        g.destroy();
    }
    // ── Server rack ───────────────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const bH = FURNITURE_BOX_H.server;
        drawIsoBox(g, cx, cy, W * 0.6, H * 0.6, bH, 0x374151, 0x1f2937, 0x111827);
        // LEDs
        for (let i = 0; i < 4; i++) {
            g.fillStyle(i % 2 === 0 ? 0x00ff88 : 0x3b82f6, 1);
            g.fillRect(cx - 6 + i * 3, cy - bH - 4, 2, 2);
        }
        g.generateTexture('server', W, H + WALL_H * 2 + 4);
        g.destroy();
    }
    // ── Computer / monitor ───────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const bH = FURNITURE_BOX_H.computer;
        drawIsoBox(g, cx, cy, W * 0.55, H * 0.55, bH, 0x1e1e3a, 0x16163a, 0x0f0f28);
        g.fillStyle(0x0ea5e9, 1);
        g.fillRect(cx - 9, cy - bH - 14, 18, 12);
        g.fillStyle(0x0c0c1a, 1);
        g.fillRect(cx - 7, cy - bH - 12, 14, 9);
        g.generateTexture('computer', W, H + WALL_H * 2 + 4);
        g.destroy();
    }
    // ── Filing cabinet ────────────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const bH = FURNITURE_BOX_H.filing;
        drawIsoBox(g, cx, cy, W * 0.55, H * 0.55, bH, 0x4b5563, 0x374151, 0x1f2937);
        for (let i = 0; i < 3; i++) {
            g.lineStyle(1, 0x9ca3af, 0.6);
            g.lineBetween(cx - 10, cy - bH + i * 7 - 6, cx + 10, cy - bH + i * 7 - 6);
        }
        g.generateTexture('filing', W, H + WALL_H * 2 + 4);
        g.destroy();
    }
    // ── Coffee machine ────────────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const bH = FURNITURE_BOX_H.coffee;
        drawIsoBox(g, cx, cy, W * 0.35, H * 0.35, bH, 0x1c1c1c, 0x111111, 0x0a0a0a);
        g.fillStyle(0xf97316, 1);
        g.fillRect(cx - 3, cy - bH - 4, 6, 4);
        g.generateTexture('coffee', W, H + WALL_H * 2 + 4);
        g.destroy();
    }
    // ── Couch ─────────────────────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const bH = FURNITURE_BOX_H.couch;
        drawIsoBox(g, cx, cy, W * 0.8, H * 0.8, bH, 0x166534, 0x14532d, 0x052e16);
        g.generateTexture('couch', W, H + WALL_H * 2 + 4);
        g.destroy();
    }
    // ── Bookshelf ─────────────────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const bH = FURNITURE_BOX_H.bookshelf;
        drawIsoBox(g, cx, cy, W * 0.7, H * 0.5, bH, 0x92400e, 0x78340f, 0x5c2a0a);
        const bookColors = [0xef4444, 0x3b82f6, 0x22c55e, 0xf59e0b, 0x8b5cf6];
        for (let i = 0; i < 5; i++) {
            g.fillStyle(bookColors[i], 1);
            g.fillRect(cx - 11 + i * 5, cy - bH - 12, 4, 10);
        }
        g.generateTexture('bookshelf', W, H + WALL_H * 2 + 4);
        g.destroy();
    }

    // ── Cooler ────────────────────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const bH = FURNITURE_BOX_H.cooler;
        drawIsoBox(g, cx, cy, W * 0.3, H * 0.3, bH, 0xe0f2fe, 0xbae6fd, 0x93c5fd);
        g.generateTexture('cooler', W, H + WALL_H * 2 + 4);
        g.destroy();
    }
    // ── Conference table ─────────────────────────────────────────────────────
    {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        const bH = FURNITURE_BOX_H.table;
        drawIsoBox(g, cx, cy, W * 0.9, H * 0.9, bH, 0x78350f, 0x5c2d0a, 0x431f07);
        // Glass top sheen
        g.fillStyle(0xfbbf24, 0.25);
        drawIsoTop(g, cx, cy - bH, W * 0.9, H * 0.9, 0xfbbf24);
        g.generateTexture('table', W, H + WALL_H * 2 + 4);
        g.destroy();
    }
}
