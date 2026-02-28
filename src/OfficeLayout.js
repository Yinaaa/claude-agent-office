import {
    TILE_EMPTY as E, TILE_FLOOR as F, TILE_WALL as W, TILE_DOOR as D,
    FURN_DESK, FURN_CHAIR, FURN_PLANT, FURN_COOLER,
    FURN_WHITEBOARD, FURN_COFFEE, FURN_BOOKSHELF,
    FURN_COUCH, FURN_FILING, FURN_SERVER, FURN_COMPUTER, FURN_TABLE,
    ROLE_CLAUDE, ROLE_BASH, ROLE_CODER, ROLE_READER, ROLE_SEARCHER, ROLE_PLANNER,
    ZONE_OFFICE, ZONE_MEETING, ZONE_BREAK,
} from './config.js';

/**
 * Office layout — 20 × 16 grid
 *
 * Zones:
 *   会议室  (Meeting Room):  col 1-6,  row 1-6
 *   茶水间  (Break Room):    col 1-6,  row 8-13
 *   办公区  (Office Zone):   col 8-18, row 1-13
 *
 * Internal walls:
 *   Vertical divider:     col 7, rows 1-13  (doors at row 4 and row 11)
 *   Horizontal divider:   row 7, col 1-6    (door at col 3)
 */
export const DEFAULT_GRID = [
//   0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19
    [E, E, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, E, E], // 0
    [E, W, F, F, F, F, F, W, F, F, F, F, F, F, F, F, F, F, W, E], // 1
    [W, F, F, F, F, F, F, W, F, F, F, F, F, F, F, F, F, F, F, W], // 2
    [W, F, F, F, F, F, F, W, F, F, F, F, F, F, F, F, F, F, F, W], // 3
    [W, F, F, F, F, F, F, D, F, F, F, F, F, F, F, F, F, F, F, W], // 4  ← door
    [W, F, F, F, F, F, F, W, F, F, F, F, F, F, F, F, F, F, F, W], // 5
    [W, F, F, F, F, F, F, W, F, F, F, F, F, F, F, F, F, F, F, W], // 6
    [W, W, W, D, W, W, W, W, F, F, F, F, F, F, F, F, F, F, F, W], // 7  ← horiz wall + door
    [W, F, F, F, F, F, F, W, F, F, F, F, F, F, F, F, F, F, F, W], // 8
    [W, F, F, F, F, F, F, W, F, F, F, F, F, F, F, F, F, F, F, W], // 9
    [W, F, F, F, F, F, F, W, F, F, F, F, F, F, F, F, F, F, F, W], // 10
    [W, F, F, F, F, F, F, D, F, F, F, F, F, F, F, F, F, F, F, W], // 11 ← door
    [W, F, F, F, F, F, F, W, F, F, F, F, F, F, F, F, F, F, F, W], // 12
    [E, W, F, F, F, F, F, W, F, F, F, F, F, F, F, F, F, F, W, E], // 13
    [E, E, W, W, W, D, W, W, D, W, W, W, W, D, W, W, W, W, E, E], // 14
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E], // 15
];

// ─── Furniture  [type, col, row] ─────────────────────────────────────────────

export const DEFAULT_FURNITURE = [
    // ══ 会议室 (Meeting Room, col 1-6, row 1-6) ══════════════════════════════
    // Conference table (center)
    [FURN_TABLE, 3, 3], [FURN_TABLE, 4, 3], [FURN_TABLE, 3, 4], [FURN_TABLE, 4, 4],
    // Chairs around table
    [FURN_CHAIR, 2, 3], [FURN_CHAIR, 2, 4],  // left side
    [FURN_CHAIR, 5, 3], [FURN_CHAIR, 5, 4],  // right side
    [FURN_CHAIR, 3, 2], [FURN_CHAIR, 4, 2],  // top
    [FURN_CHAIR, 3, 5], [FURN_CHAIR, 4, 5],  // bottom
    // Whiteboard on back wall
    [FURN_WHITEBOARD, 2, 2],
    // Plant in corner
    [FURN_PLANT, 5, 2], [FURN_PLANT, 5, 5],

    // ══ 茶水间 (Break Room, col 1-6, row 8-13) ═══════════════════════════════
    [FURN_COUCH,     3,  9],
    [FURN_COUCH,     4,  9],
    [FURN_COFFEE,    2,  8],
    [FURN_COOLER,    5,  8],
    [FURN_TABLE,     3, 11], [FURN_TABLE, 4, 11],
    [FURN_CHAIR,     3, 12], [FURN_CHAIR, 4, 12],
    [FURN_BOOKSHELF, 2, 12],
    [FURN_PLANT,     5, 12], [FURN_PLANT, 2, 10],

    // ══ 办公区 (Office Zone, col 8-18) ═══════════════════════════════════════
    // Claude's main desk (center of office)
    [FURN_DESK,     12,  7], [FURN_COMPUTER, 11,  7], [FURN_CHAIR, 12,  8],

    // Bash / Terminal station (top-left of office)
    [FURN_DESK,      9,  3], [FURN_SERVER,   8,  2], [FURN_CHAIR,  9,  4],

    // Coder station (top-right of office)
    [FURN_DESK,     15,  3], [FURN_COMPUTER, 16,  2], [FURN_CHAIR, 15,  4],

    // Reader / File station (bottom-left of office)
    [FURN_DESK,      9, 11], [FURN_FILING,   8, 11], [FURN_BOOKSHELF, 8, 12],
    [FURN_CHAIR,     9, 12],

    // Searcher / Web station (bottom-right of office)
    [FURN_DESK,     15, 11], [FURN_COMPUTER, 16, 11], [FURN_CHAIR, 15, 12],

    // Planner station (right corridor)
    [FURN_WHITEBOARD, 17,  4], [FURN_WHITEBOARD, 17,  6],
    [FURN_DESK,       17,  8], [FURN_CHAIR,      17,  9],

    // Decorative plants & server racks
    [FURN_PLANT,  9,  1], [FURN_PLANT, 17,  1],
    [FURN_PLANT,  9, 13], [FURN_PLANT, 17, 13],
    [FURN_SERVER, 18,  3], [FURN_SERVER, 18, 10],
    [FURN_COOLER, 10,  1],
];

// ─── Initial employee positions ───────────────────────────────────────────────
//   [role, startCol, startRow, deskCol, deskRow, zone]
export const DEFAULT_EMPLOYEES = [
    { role: ROLE_CLAUDE,   col: 12, row: 8,  deskCol: 12, deskRow: 7,  zone: ZONE_OFFICE },
    { role: ROLE_BASH,     col:  9, row: 4,  deskCol:  9, deskRow: 3,  zone: ZONE_OFFICE },
    { role: ROLE_CODER,    col: 15, row: 4,  deskCol: 15, deskRow: 3,  zone: ZONE_OFFICE },
    { role: ROLE_READER,   col:  9, row: 12, deskCol:  9, deskRow: 11, zone: ZONE_OFFICE },
    { role: ROLE_SEARCHER, col: 15, row: 12, deskCol: 15, deskRow: 11, zone: ZONE_OFFICE },
    { role: ROLE_PLANNER,  col: 17, row: 9,  deskCol: 17, deskRow: 8,  zone: ZONE_OFFICE },
];

// ─── Zone label positions (grid coords for Phaser.Text anchor) ────────────────
export const ZONE_LABELS = [
    { text: '会议室',  col: 3,  row: 1  },
    { text: '茶水间',  col: 3,  row: 8  },
    { text: '办公区',  col: 13, row: 1  },
];

// ─── Break-room wander targets (safe walkable tiles) ─────────────────────────
export const BREAK_ROOM_TILES = [
    { col: 2, row: 9 }, { col: 3, row: 10 }, { col: 4, row: 10 },
    { col: 5, row: 9 }, { col: 3, row: 8  }, { col: 4, row: 8  },
];

// ─── Meeting-room tiles ───────────────────────────────────────────────────────
export const MEETING_ROOM_TILES = [
    { col: 2, row: 5 }, { col: 3, row: 5 }, { col: 4, row: 5 }, { col: 5, row: 5 },
    { col: 2, row: 6 }, { col: 3, row: 6 }, { col: 4, row: 6 }, { col: 5, row: 6 },
];

// ─── Office idle wander tiles (around desks, corridors) ──────────────────────
export const OFFICE_IDLE_TILES = [
    { col: 11, row: 7 }, { col: 13, row: 7 }, { col: 12, row: 6 },
    { col: 10, row: 5 }, { col: 14, row: 5 }, { col: 12, row: 10 },
    { col: 11, row: 4 }, { col: 13, row: 9 }, { col: 10, row: 9 },
];
