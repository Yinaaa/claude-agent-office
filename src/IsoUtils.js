import { TILE_W, TILE_H, ORIGIN_X, ORIGIN_Y } from './config.js';

/** Convert grid (col, row) → isometric screen (x, y) */
export function gridToScreen(col, row) {
    return {
        x: ORIGIN_X + (col - row) * (TILE_W / 2),
        y: ORIGIN_Y + (col + row) * (TILE_H / 2),
    };
}

/** Convert screen (sx, sy) → approximate grid (col, row) */
export function screenToGrid(sx, sy) {
    const dx = sx - ORIGIN_X;
    const dy = sy - ORIGIN_Y;
    const col = Math.round((dx / (TILE_W / 2) + dy / (TILE_H / 2)) / 2);
    const row = Math.round((dy / (TILE_H / 2) - dx / (TILE_W / 2)) / 2);
    return { col, row };
}

/** Depth value for isometric painter's algorithm */
export function getDepth(col, row, layer = 0) {
    return (col + row) * 10 + layer;
}
