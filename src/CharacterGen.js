import {
    CHAR_FRAME_W, CHAR_FRAME_H, CHAR_ANIM_FRAMES,
    ROLE_COLORS, ROLE_CLAUDE, ROLE_BASH, ROLE_CODER,
    ROLE_READER, ROLE_SEARCHER, ROLE_PLANNER,
} from './config.js';

let textureCounter = 0;

/** Draw one animation frame for a character at x-offset ox in the sprite sheet. */
function drawFrame(g, ox, frame, role, colors) {
    const { skin, shirt, pants, hair } = colors;
    const shoes = 0x111111;

    // Walk cycle: legs / arms alternate
    const t  = (frame / CHAR_ANIM_FRAMES) * Math.PI * 2;
    const lL = Math.round(Math.sin(t) * 2);       // left  leg  x-offset
    const lR = Math.round(-Math.sin(t) * 2);      // right leg  x-offset
    const aL = Math.round(-Math.sin(t) * 1.5);   // left  arm  y-offset
    const aR = Math.round(Math.sin(t) * 1.5);    // right arm  y-offset

    // ── Role-specific hair / hat ──────────────────────────────────────────────
    drawHair(g, ox, role, hair, skin);

    // ── Head (big One Piece style) ────────────────────────────────────────────
    g.fillStyle(skin, 1);
    g.fillRect(ox + 3, 4, 10, 9);   // main head block
    g.fillRect(ox + 2, 5, 12, 7);   // wider middle

    // ── Eyes (big expressive OP eyes) ─────────────────────────────────────────
    g.fillStyle(0x111111, 1);
    g.fillRect(ox + 4, 7, 3, 3);
    g.fillRect(ox + 9, 7, 3, 3);
    g.fillStyle(0xffffff, 1);
    g.fillRect(ox + 5, 7, 1, 1);    // left highlight
    g.fillRect(ox + 10, 7, 1, 1);   // right highlight

    // ── Smile ─────────────────────────────────────────────────────────────────
    drawMouth(g, ox, role, frame);

    // ── Neck ──────────────────────────────────────────────────────────────────
    g.fillStyle(skin, 1);
    g.fillRect(ox + 6, 13, 4, 2);

    // ── Shirt body ────────────────────────────────────────────────────────────
    g.fillStyle(shirt, 1);
    g.fillRect(ox + 3, 15, 10, 7);

    // ── Arms (shirt colour + skin hands) ─────────────────────────────────────
    g.fillStyle(shirt, 1);
    g.fillRect(ox + 1, 15 + aL, 2, 5);
    g.fillRect(ox + 13, 15 + aR, 2, 5);
    g.fillStyle(skin, 1);
    g.fillRect(ox + 1, 20 + aL, 2, 2);
    g.fillRect(ox + 13, 20 + aR, 2, 2);

    // ── Pants ─────────────────────────────────────────────────────────────────
    g.fillStyle(pants, 1);
    g.fillRect(ox + 3, 22, 10, 3);

    // ── Legs ──────────────────────────────────────────────────────────────────
    g.fillRect(ox + 3 + lL, 25, 4, 4);
    g.fillRect(ox + 9 + lR, 25, 4, 4);

    // ── Shoes ─────────────────────────────────────────────────────────────────
    g.fillStyle(shoes, 1);
    g.fillRect(ox + 2 + lL, 28, 5, 2);
    g.fillRect(ox + 8 + lR, 28, 5, 2);

    // ── Role-specific accessory ───────────────────────────────────────────────
    drawAccessory(g, ox, role, shirt);
}

function drawHair(g, ox, role, hair, skin) {
    switch (role) {
        case ROLE_CLAUDE: {
            // Straw hat (wide brim, flat top) - golden/amber
            g.fillStyle(0xd97706, 1);
            g.fillRect(ox + 1, 1, 14, 2);   // wide brim
            g.fillRect(ox + 3, 0, 10, 3);   // hat crown
            g.fillStyle(hair, 1);
            g.fillRect(ox + 3, 3, 2, 2);    // hair under brim left
            g.fillRect(ox + 11, 3, 2, 2);   // hair under brim right
            break;
        }
        case ROLE_BASH: {
            // Spiky black hair (like a fearless swordsman)
            g.fillStyle(hair, 1);
            g.fillRect(ox + 3, 0, 10, 5);   // base
            g.fillRect(ox + 2, 1, 2, 4);
            g.fillRect(ox + 12, 1, 2, 4);
            // Three green hair bands
            g.fillStyle(0x16a34a, 1);
            g.fillRect(ox + 5, 2, 2, 1);
            g.fillRect(ox + 9, 2, 2, 1);
            break;
        }
        case ROLE_CODER: {
            // Curly grey hair + round glasses
            g.fillStyle(hair, 1);
            g.fillRect(ox + 2, 1, 12, 4);
            g.fillRect(ox + 1, 2, 2, 5);
            g.fillRect(ox + 13, 2, 2, 5);
            // Glasses frame (green)
            g.fillStyle(0x16a34a, 1);
            g.fillRect(ox + 3, 8, 4, 1);    // left frame top
            g.fillRect(ox + 3, 11, 4, 1);   // left frame bottom
            g.fillRect(ox + 3, 9, 1, 2);    // left frame side
            g.fillRect(ox + 6, 9, 1, 2);    // left frame side
            g.fillRect(ox + 7, 9, 2, 1);    // bridge
            g.fillRect(ox + 9, 8, 4, 1);    // right frame top
            g.fillRect(ox + 9, 11, 4, 1);
            g.fillRect(ox + 9, 9, 1, 2);
            g.fillRect(ox + 12, 9, 1, 2);
            break;
        }
        case ROLE_READER: {
            // Long flowing orange hair
            g.fillStyle(hair, 1);
            g.fillRect(ox + 2, 0, 12, 4);   // top
            g.fillRect(ox + 1, 2, 3, 10);   // left flowing
            g.fillRect(ox + 12, 2, 3, 10);  // right flowing
            break;
        }
        case ROLE_SEARCHER: {
            // Blue cap
            g.fillStyle(0x2563eb, 1);
            g.fillRect(ox + 2, 1, 12, 2);   // brim
            g.fillRect(ox + 3, 0, 10, 3);   // cap body
            g.fillStyle(hair, 1);
            g.fillRect(ox + 3, 3, 2, 2);    // hair under cap
            g.fillRect(ox + 11, 3, 2, 2);
            break;
        }
        case ROLE_PLANNER: {
            // Distinguished silver/white swept-back hair
            g.fillStyle(hair, 1);
            g.fillRect(ox + 2, 0, 12, 5);
            g.fillRect(ox + 1, 2, 2, 6);
            g.fillRect(ox + 13, 2, 2, 6);
            // Hair shadow
            g.fillStyle(0xadb5bd, 1);
            g.fillRect(ox + 4, 3, 8, 2);
            break;
        }
        default: {
            g.fillStyle(hair, 1);
            g.fillRect(ox + 3, 0, 10, 4);
        }
    }
}

function drawMouth(g, ox, role, frame) {
    // Most characters smile; bash character looks stern
    if (role === ROLE_BASH) {
        g.fillStyle(0x333333, 1);
        g.fillRect(ox + 5, 11, 6, 1);   // straight line
    } else {
        // Wavy smile
        g.fillStyle(0xcc3333, 1);
        g.fillRect(ox + 5, 11, 1, 1);
        g.fillRect(ox + 10, 11, 1, 1);
        g.fillRect(ox + 6, 12, 4, 1);
        // teeth
        g.fillStyle(0xffffff, 1);
        g.fillRect(ox + 6, 11, 4, 1);
    }
}

function drawAccessory(g, ox, role, shirt) {
    switch (role) {
        case ROLE_CLAUDE: {
            // Red X mark on shirt (like Luffy's scar)
            g.fillStyle(0xef4444, 1);
            g.fillRect(ox + 7, 17, 2, 2);
            break;
        }
        case ROLE_BASH: {
            // Three-stripe motif on shirt (swordsman style)
            g.fillStyle(0x16a34a, 1);
            g.fillRect(ox + 4, 16, 8, 1);
            g.fillRect(ox + 4, 18, 8, 1);
            g.fillRect(ox + 4, 20, 8, 1);
            break;
        }
        case ROLE_CODER: {
            // Small laptop icon
            g.fillStyle(0x166534, 1);
            g.fillRect(ox + 5, 17, 6, 4);
            g.fillStyle(0x4ade80, 1);
            g.fillRect(ox + 6, 18, 4, 2);
            break;
        }
        case ROLE_READER: {
            // Book on shirt
            g.fillStyle(0x1c1c1c, 1);
            g.fillRect(ox + 5, 16, 6, 5);
            g.fillStyle(0xfff, 1);
            g.fillRect(ox + 6, 17, 4, 3);
            break;
        }
        case ROLE_SEARCHER: {
            // Magnifying glass icon
            g.fillStyle(0xffffff, 1);
            g.fillRect(ox + 5, 16, 4, 4);
            g.fillStyle(0x1d4ed8, 1);
            g.fillRect(ox + 6, 17, 2, 2);
            g.fillStyle(0xffffff, 1);
            g.fillRect(ox + 9, 19, 2, 2);
            break;
        }
        case ROLE_PLANNER: {
            // Clipboard
            g.fillStyle(0xfbbf24, 1);
            g.fillRect(ox + 5, 15, 6, 7);
            g.fillStyle(0x111111, 1);
            g.fillRect(ox + 6, 17, 4, 1);
            g.fillRect(ox + 6, 19, 4, 1);
            break;
        }
    }
}

/**
 * Create a spritesheet texture for a given role.
 * Returns the texture key.
 */
export function createCharacterTexture(scene, role) {
    const colors = ROLE_COLORS[role] ?? ROLE_COLORS[ROLE_CLAUDE];
    const key    = `char_${role}_${textureCounter++}`;
    const FW     = CHAR_FRAME_W;
    const FH     = CHAR_FRAME_H;
    const totalW = FW * CHAR_ANIM_FRAMES;

    const g = scene.make.graphics({ x: 0, y: 0, add: false });

    for (let frame = 0; frame < CHAR_ANIM_FRAMES; frame++) {
        drawFrame(g, frame * FW, frame, role, colors);
    }

    g.generateTexture(key, totalW, FH);
    g.destroy();

    // Register individual frames
    const tex = scene.textures.get(key);
    for (let i = 0; i < CHAR_ANIM_FRAMES; i++) {
        tex.add(i, 0, i * FW, 0, FW, FH);
    }

    // Walk animation
    if (!scene.anims.exists(`walk_${key}`)) {
        scene.anims.create({
            key: `walk_${key}`,
            frames: Array.from({ length: CHAR_ANIM_FRAMES }, (_, i) => ({ key, frame: i })),
            frameRate: 9,
            repeat: -1,
        });
    }

    return key;
}
