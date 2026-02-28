// ─── Canvas / game dimensions ────────────────────────────────────────────────
export const GAME_W = 1280;
export const GAME_H = 720;

// ─── Isometric tile geometry ──────────────────────────────────────────────────
export const TILE_W  = 64;
export const TILE_H  = 32;
export const WALL_H  = 44;

// ─── Character sprite sheet dimensions (One Piece big-head style) ─────────────
export const CHAR_FRAME_W   = 16;
export const CHAR_FRAME_H   = 32;
export const CHAR_SCALE     = 2.5;
export const CHAR_ANIM_FRAMES = 6;

// ─── Grid size ────────────────────────────────────────────────────────────────
export const GRID_COLS = 20;
export const GRID_ROWS = 16;

// ─── World-space origin for the isometric grid ───────────────────────────────
export const ORIGIN_X = 560;
export const ORIGIN_Y = 110;

// ─── Tile type constants ──────────────────────────────────────────────────────
export const TILE_EMPTY = 0;
export const TILE_FLOOR = 1;
export const TILE_WALL  = 2;
export const TILE_DOOR  = 3;

// ─── Furniture type keys ──────────────────────────────────────────────────────
export const FURN_DESK       = 'desk';
export const FURN_CHAIR      = 'chair';
export const FURN_PLANT      = 'plant';
export const FURN_COOLER     = 'cooler';
export const FURN_WHITEBOARD = 'whiteboard';
export const FURN_COFFEE     = 'coffee';
export const FURN_BOOKSHELF  = 'bookshelf';
export const FURN_COUCH      = 'couch';
export const FURN_FILING     = 'filing';
export const FURN_SERVER     = 'server';
export const FURN_COMPUTER   = 'computer';
export const FURN_TABLE      = 'table';

// ─── Agent roles ──────────────────────────────────────────────────────────────
export const ROLE_CLAUDE    = 'claude';
export const ROLE_BASH      = 'bash';
export const ROLE_CODER     = 'coder';
export const ROLE_READER    = 'reader';
export const ROLE_SEARCHER  = 'searcher';
export const ROLE_PLANNER   = 'planner';

// ─── Zone IDs ─────────────────────────────────────────────────────────────────
export const ZONE_OFFICE   = 'office';
export const ZONE_MEETING  = 'meeting';
export const ZONE_BREAK    = 'break';

// ─── UI panel widths ──────────────────────────────────────────────────────────
export const LEFT_PANEL_W  = 210;
export const RIGHT_PANEL_W = 280;

// ─── Tile palette (warm tones) ────────────────────────────────────────────────
export const COLORS = {
    FLOOR_1:       { top: 0x2e1e0e },   // dark warm wood
    FLOOR_2:       { top: 0x3a2618 },   // lighter warm wood
    FLOOR_MEETING: { top: 0x1e2a0e },   // warm green tint
    FLOOR_BREAK:   { top: 0x2a1e18 },   // warm clay
    WALL:          { top: 0xf0d9b0, left: 0xd4aa70, right: 0xb88040 }, // warm cream/tan
    DOOR:          { top: 0x16a34a, left: 0x15803d, right: 0x166534 },
};

// ─── Per-role character colours ───────────────────────────────────────────────
export const ROLE_COLORS = {
    [ROLE_CLAUDE]:   { shirt: 0x16a34a, pants: 0x052e16, hair: 0xf59e0b, skin: 0xfde0c8 },
    [ROLE_BASH]:     { shirt: 0xef4444, pants: 0x1c1c1c, hair: 0x1a0a00, skin: 0xf0c8a0 },
    [ROLE_CODER]:    { shirt: 0x22c55e, pants: 0x1a2e1a, hair: 0x888888, skin: 0xd4a070 },
    [ROLE_READER]:   { shirt: 0xf97316, pants: 0x1c1a10, hair: 0xdaa520, skin: 0xc08050 },
    [ROLE_SEARCHER]: { shirt: 0x3b82f6, pants: 0x0a1a2e, hair: 0x1a0a00, skin: 0xfde0c8 },
    [ROLE_PLANNER]:  { shirt: 0x06b6d4, pants: 0x0c2a2a, hair: 0xe5e7eb, skin: 0xfde0c8 },
};

// ─── Tool name → role mapping ─────────────────────────────────────────────────
export const TOOL_ROLE_MAP = {
    Bash:         ROLE_BASH,
    Edit:         ROLE_CODER,
    Write:        ROLE_CODER,
    Read:         ROLE_READER,
    Glob:         ROLE_READER,
    Grep:         ROLE_SEARCHER,
    WebSearch:    ROLE_SEARCHER,
    WebFetch:     ROLE_SEARCHER,
    Task:         ROLE_PLANNER,
    NotebookEdit: ROLE_CODER,
};

export const TOOL_LABELS = {
    [ROLE_BASH]:     'Terminal',
    [ROLE_CODER]:    'Code Editor',
    [ROLE_READER]:   'File Reader',
    [ROLE_SEARCHER]: 'Web Search',
    [ROLE_PLANNER]:  'Task Planner',
    [ROLE_CLAUDE]:   'Claude',
};

export const FURNITURE_BOX_H = {
    desk: 10, chair: 8, cooler: 28, whiteboard: 30,
    coffee: 20, bookshelf: 28, couch: 12, filing: 22,
    plant: 16, server: 28, computer: 14, table: 8,
};
