import { TILE_WALL, TILE_EMPTY } from './config.js';

/**
 * BFS pathfinding on the office grid.
 * Returns an array of {col, row} steps from start (exclusive) to end (inclusive),
 * or null if no path exists.
 */
export function findPath(grid, startCol, startRow, endCol, endRow) {
    if (startCol === endCol && startRow === endRow) return [];

    const rows = grid.length;
    const cols = grid[0].length;
    const visited = new Set();
    const queue   = [{ col: startCol, row: startRow, path: [] }];
    visited.add(`${startCol},${startRow}`);

    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

    while (queue.length > 0) {
        const { col, row, path } = queue.shift();

        for (const [dc, dr] of dirs) {
            const nc = col + dc;
            const nr = row + dr;
            const key = `${nc},${nr}`;
            if (visited.has(key)) continue;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            const tile = grid[nr][nc];
            if (tile === TILE_WALL || tile === TILE_EMPTY) continue;

            visited.add(key);
            const newPath = [...path, { col: nc, row: nr }];
            if (nc === endCol && nr === endRow) return newPath;
            queue.push({ col: nc, row: nr, path: newPath });
        }
    }
    return null; // unreachable
}
