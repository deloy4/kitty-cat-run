// Kitty Cat Run. The movement rules come from the Jetpack Christmas Special rebuild (walking, climbing,
// flying, gravity, ice and conveyor floors, tunnels), with a cat in place of Santa: cat posts for
// ladders, yarn balls for jetpack fuel, a spinning tail for the jetpack and a paw swipe for the
// Phase Shifter. Positions and speeds use 1/32 of a map pixel, so a 12-pixel square is 384.

const COLS = 28, ROWS = 18, U = 384;
const PLAY_W = 312, PLAY_H = 192, HUD_H = 16;
const START_LIVES = 5;

const frameMs = (speed) => 31.25 + (5 - speed) * 5.625;

// ---------- Borland C rand(), as the original engine used ----------

let seed = 1;
function srand(s) { seed = s & 0xffff; }
function rand() {
  seed = (Math.imul(seed, 0x015a4e35) + 1) >>> 0;
  return (seed >>> 16) & 0x7fff;
}

// ---------- state ----------

const G = {
  screen: 'title', level: 0, score: 0, lives: START_LIVES, speed: 5, newLife: 0,
  grid: null, door: null, start: null, monsters: [], pads: [[], [], []], digs: [], pickups: [],
  gifts: 0, giftsTotal: 0, doorCount: 0, doorOpen: false, shield: 0, stun: 0, pressed: [false, false, false],
  info: 0, t: 0, timer: 0,
};
let S = null; // the cat

const catOf = (level) => CATS[level % CATS.length];
const mouseOf = (level) => MICE[level % MICE.length];
const themeOf = (level) => THEMES[level % THEMES.length];

function cellIndex(c, r) { return r * COLS + c; }

// Tile under a pixel in grid space, with swiped boxes and sprinklers turned off (bit 0x80) read as 0.
function tileAt(px, py) {
  const c = Math.floor(px / 12), r = Math.floor(py / 12);
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return 60;
  const v = G.grid[cellIndex(c, r)];
  return v & 0x80 ? 0 : v;
}
const solid = (t) => t >= 40;
const ladder = (t) => t >= 1 && t <= 3;
const solidOrLadder = (t) => t >= 40 || ladder(t);
const sign = (v) => (v > 0) - (v < 0);
const toward0 = (v, d) => (Math.abs(v) <= d ? 0 : v - d * sign(v));

// ---------- level setup ----------

function loadLevel() {
  const L = LEVELS[G.level];
  G.grid = new Uint8Array(COLS * ROWS).fill(60);
  for (let r = 0; r < 16; r++) for (let c = 0; c < 26; c++) G.grid[cellIndex(c + 1, r + 1)] = L.tiles[r * 26 + c];
  G.door = L.door;
  G.start = L.start;
  const [sc, sr] = L.start;
  const FIRST = { 1: 4, 2: 0, 3: 13 };
  G.monsters = L.monsters.map(([type, c, r]) => ({
    type, frame: FIRST[type] ?? 0, x: c * U, y: r * U, vx: 0, vy: 0, st: 0, stuck: 0, px: c * U, py: r * U, face: -1,
  }));
  G.pads = [[], [], []];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const v = G.grid[cellIndex(c, r)];
    if (v >= 6 && v <= 8) G.pads[v - 6].push([c, r]);
  }
  G.giftsTotal = G.grid.filter((v) => v === 4).length;
  G.gifts = 0;
  G.doorCount = G.giftsTotal === 0 ? 1 : 0;
  G.doorOpen = false;
  G.digs = []; G.pickups = []; G.shield = 0; G.stun = 0; G.pressed = [false, false, false];
  S = {
    x: sc * U, y: sr * U, vx: 0, vy: 0, lastvx: 0, fuel: 0, mode: 0, jetCount: 0, swipeT: 0, swipeDir: 0, swipeHold: 0,
    dying: 0, cause: '', teleport: 0, tpDest: null, frame: 0, pxPrev: sc * U, pyPrev: sr * U, pounce: 0,
    padLatch: false, wallLatch: false, jet: false, shifter: false,
  };
  G.staticDirty = true;
}

// ---------- input ----------

const held = new Set();
const pressed = [];
const KEYS = {
  left: ['ArrowLeft', 'KeyA', 'Numpad4'], right: ['ArrowRight', 'KeyD', 'Numpad6'],
  up: ['ArrowUp', 'KeyW', 'Numpad8'], down: ['ArrowDown', 'KeyS', 'Numpad2'],
  jet: ['Space', 'KeyZ', 'AltLeft', 'AltRight', 'Numpad0', 'v-jet'],
  shifter: ['KeyX', 'Enter', 'ControlLeft', 'ControlRight', 'NumpadDecimal', 'v-phase'],
};
const isHeld = (name) => KEYS[name].some((k) => held.has(k));

// ---------- one frame of play ----------

let step = function () {
  let points = 0;

  // 1. one-shot keys
  while (pressed.length) {
    const k = pressed.shift();
    if (k === 'Escape' && !S.dying) { S.dying = 1; S.cause = 'retry'; }
    if (k === 'Minus' || k === 'NumpadSubtract') { G.speed = Math.max(0, G.speed - 1); G.info = 150; }
    if (k === 'Equal' || k === 'NumpadAdd') { G.speed = Math.min(9, G.speed + 1); G.info = 150; }
    if (k === 'KeyQ') return endLife('quit');
    // a quick tap of the swipe key still gives one whole swipe
    if (KEYS.shifter.includes(k)) S.swipeHold = 12;
    if (held.has('Tab') && held.has('Digit2')) {
      if (['KeyN', 'KeyL', 'KeyF', 'KeyI'].includes(k)) G.cheated = true;
      if (k === 'KeyN') return endLife('skip');
      if (k === 'KeyL') { G.lives = Math.min(99, G.lives + 1); sfx('life'); }
      if (k === 'KeyF') { S.fuel = 10000; sfx('yarn'); }
      if (k === 'KeyI') { G.shield = 60000; sfx('bubble'); }
    }
  }

  // 2. held controls; all off while the cat is caught
  let dx = 0, dy = 0, jet = false, shifter = false;
  if (!S.dying) {
    if (isHeld('left')) dx = -1;
    if (isHeld('right')) dx = 1;
    if (isHeld('up')) dy = -1;
    if (isHeld('down')) dy = 1;
    jet = isHeld('jet');
    if (isHeld('shifter')) S.swipeHold = Math.max(S.swipeHold, 1);
    shifter = S.swipeHold > 0;
  }
  if (S.swipeHold > 0) S.swipeHold--;
  S.jet = jet; S.shifter = shifter;

  // 3. last non-zero vx
  if (S.vx !== 0) S.lastvx = S.vx;

  // 4. tile samples from the start-of-frame position
  let px = S.x >> 5, py = S.y >> 5;
  const aboveL = tileAt(px + 2, py - 1), aboveR = tileAt(px + 9, py - 1);
  const rightTop = tileAt(px + 11, py), rightBot = tileAt(px + 11, py + 11);
  const belowR = tileAt(px + 9, py + 12), belowC = tileAt(px + 6, py + 12), belowL = tileAt(px + 2, py + 12);
  const leftBot = tileAt(px, py + 11), leftTop = tileAt(px, py);
  const ladderTop = tileAt(px + 6, py + 10);
  const centre = tileAt(px + 6, py + 6);
  const cc = Math.floor((px + 6) / 12), cr = Math.floor((py + 6) / 12), ci = cellIndex(cc, cr);
  const standingOn = solid(belowR) || solid(belowL);

  // 5. things picked up from the square the cat is in
  switch (centre) {
    case 4:
      points += 10; G.gifts++; G.grid[ci] = 0; sfx('treat');
      if (G.gifts === G.giftsTotal) G.doorCount = 1;
      break;
    case 15: case 16:
      if (S.fuel === 0) S.vy = 0;
      S.fuel = Math.min(10000, S.fuel + (centre === 15 ? 10000 : 5000));
      points += centre === 15 ? 20 : 10; G.grid[ci] = 0; sfx('yarn');
      break;
    case 19: points += 25; G.stun = Math.min(60000, G.stun + 400); G.grid[ci] = 0; sfx('bone'); break;
    case 20: points += 10; G.grid[ci] = 0; sfx('coin'); break;
    case 21: points += 25; G.grid[ci] = 0; sfx('bell'); break;
    case 22: points += 50; G.grid[ci] = 0; sfx('coin'); break;
    case 23: points += 100; G.newLife++; G.grid[ci] = 0; sfx('life'); break;
  }

  // 6. movement mode and velocity
  const anyLadder = (v) => centre === v || belowR === v || belowL === v;
  if (jet && S.fuel > 0 && S.mode !== 2) {
    // flying on the spinning tail
    S.mode = 0; S.jetCount++;
    S.fuel = Math.max(0, S.fuel - 10);
    const hold = dy > 0 || (dy === 0 && dx !== 0 && shifter);
    if (hold) S.vy = toward0(S.vy, 6); else S.vy -= 4;
    S.vy = Math.max(S.vy, -64);
    if (dx) S.vx += 6 * dx; else S.vx = toward0(S.vx, 3);
    S.vx = Math.max(-64, Math.min(64, S.vx));
    const k = (S.jetCount >> 1) % 3;
    S.frame = dx > 0 ? 7 + k : dx < 0 ? 31 + k : (S.frame < 24 ? 4 : 28) + k;
  } else if (!(S.mode >= 2 && jet) && (ladder(centre) || (ladder(belowC) && (ladder(belowR) || ladder(belowL))))) {
    // on a cat post
    if (S.mode === 0) S.mode = 1;
    if (S.mode >= 2 && !jet) S.mode = 1;
    if (anyLadder(2)) S.vy = dy < 0 ? -64 : dy > 0 ? 20 : -25;
    else if (anyLadder(3)) S.vy = dy > 0 ? 64 : dy < 0 ? -20 : 25;
    else S.vy = 45 * dy;
    if (S.vy < 0 && !ladder(centre) && !ladder(tileAt(px + 2, py + 11)) && !ladder(tileAt(px + 9, py + 11))) S.vy = 0;
    if (S.vy < -32 && !ladder(ladderTop)) S.vy = -32;
    S.vx = 55 * dx;
    if (jet && S.fuel === 0 && S.mode < 3) { S.vy = -68; S.mode = 2; sfx('jump'); }
    if (S.vy === 0 && ((dx > 0 && (solid(rightTop) || solid(rightBot))) || (dx < 0 && (solid(leftTop) || solid(leftBot))))) {
      const r = py % 12;
      if (r >= 6) S.vy = 32; else if (r >= 1) S.vy = -32;
    }
    if ((S.vx > 0 && (solid(rightTop) || solid(rightBot))) || (S.vx < 0 && (solid(leftTop) || solid(leftBot)))) S.vx = 0;
    if (dx === 0 && S.vy !== 0) {
      const r = px % 12;
      if (r >= 6 && ladder(rightBot)) S.vx = 32;
      else if (r >= 1 && ladder(leftBot)) S.vx = -32;
      else S.vx = 0;
    }
    if (S.vx !== 0) S.frame = ((px >> 1) % 4) + (S.vx < 0 ? 24 : 0);
    else if (dy !== 0 && S.vy !== 0) S.frame = 48 + (Math.floor(S.y / 200) % 4);
    else if (!(S.frame >= 48 && S.frame <= 51) && !standFrame(S.frame)) S.frame = S.frame >= 24 ? 24 : 0;
  } else if (standingOn) {
    if (S.mode === 0) S.mode = 1;
    if (S.mode >= 2 && !jet) S.mode = 1;
    S.vy = 0;
    S.vx = 55 * dx;
    if (jet && S.fuel === 0 && S.mode < 3) { S.vy = -68; S.mode = 2; sfx('jump'); }
    if (S.vx !== 0) S.frame = ((px >> 1) % 4) + (S.vx < 0 ? 24 : 0);
    else if (!standFrame(S.frame)) S.frame = S.frame >= 24 ? 24 : 0;
  } else {
    // in the air
    if (S.mode === 1) { S.mode = 0; S.vx = 0; S.vy = 64; }
    else if (S.mode === 2) { if (dx) { S.mode = 3; S.vx = 64 * dx; } else S.mode = 4; }
    else if ((S.mode === 3 || S.mode === 4) && jet) S.vy += 5;
    else S.vy += 6;
    S.vy = Math.min(S.vy, 64);
    if (S.mode === 3 && Math.abs(S.vx) > 6 && dx !== 0 && dx !== sign(S.vx)) S.vx = -S.vx;
    else if (dx !== 0 && Math.abs(S.vx) <= 20) S.vx = Math.max(-20, Math.min(20, S.vx + 5 * dx));
    else S.vx = toward0(S.vx, S.mode === 3 ? 2 : 3);
    if (S.mode === 3) {
      const left = S.vx < 0;
      S.frame = (Math.abs(S.vx) <= 20 ? 17 : 16) + (left ? 24 : 0);
    } else if (S.mode === 4) S.frame = S.frame >= 24 && S.frame < 48 ? 40 : 16;
    else {
      const left = dx ? dx < 0 : S.frame >= 24 && S.frame < 48 ? true : S.frame < 24 ? false : S.lastvx < 0;
      S.frame = left ? 24 : 0;
    }
  }

  // 7. an empty yarn meter stops the tail for the rest of the frame
  if (S.fuel === 0) jet = false;

  // 8. floors that move the cat, only when standing: slippery, sticky tape, treadmills
  if (S.mode === 1) {
    const feet = (a, b) => (belowL >= a && belowL <= b) || (belowR >= a && belowR <= b);
    if (feet(94, 96)) {
      const d = dx || sign(S.lastvx) || (S.frame >= 24 && S.frame < 48 ? -1 : 1);
      S.vx = 55 * d; S.frame = d < 0 ? 24 : 0;
    }
    if (feet(97, 99)) S.vx = Math.trunc(S.vx * 0.6);
    if (feet(114, 116)) { S.vx = dx < 0 ? -60 : dx > 0 ? 25 : -40; S.frame = (Math.floor(S.x / 200) % 4) + (S.vx < 0 ? 24 : 0); }
    if (feet(117, 119)) { S.vx = dx > 0 ? 60 : dx < 0 ? -25 : 40; S.frame = (Math.floor(S.x / 200) % 4) + (S.vx < 0 ? 24 : 0); }
  }

  // 9. pounce buttons, and Down in a tunnel
  if (centre >= 33 && centre <= 35 && !G.pressed[centre - 33] && !S.dying) { pressButton(centre - 33); S.pounce = 16; points += 25; }
  if (S.pounce > 0) S.pounce--;
  if (dy > 0 && !shifter && !jet && centre >= 6 && centre <= 8 && !S.teleport) {
    if (!S.padLatch) { S.teleport = (centre - 6) * 1000 + 1; S.padLatch = true; }
  } else if (!(centre >= 6 && centre <= 8) || dy <= 0) S.padLatch = false;

  // 10. a bubble, bone or yarn ball pops up now and then
  if (Math.floor((rand() * 5000) / 32768) === 0 && G.pickups.length < 9) {
    for (let tries = 0; tries < 10; tries++) {
      const c = rand() % 26, r = rand() % 16;
      const underDoor = (c === G.door[0] - 1 || c === G.door[0]) && (r === G.door[1] - 1 || r === G.door[1]);
      const v = G.grid[cellIndex(c + 1, r + 1)];
      if (v === 0 && !underDoor) {
        G.pickups.push({ kind: rand() % 3, timer: 400, c, r });
        sfx('popup');
        break;
      }
    }
  }
  const sc = Math.floor(((S.x >> 5) + 6) / 12) - 1, sr = Math.floor(((S.y >> 5) + 6) / 12) - 1;
  for (let i = G.pickups.length - 1; i >= 0; i--) {
    const p = G.pickups[i];
    if (p.c === sc && p.r === sr && !S.dying) {
      p.timer = 0;
      if (p.kind === 0) { G.shield = Math.min(60000, G.shield + 400); points += 25; sfx('bubble'); }
      if (p.kind === 1) { G.stun = Math.min(60000, G.stun + 400); points += 25; sfx('bone'); }
      if (p.kind === 2) { S.fuel = Math.min(10000, S.fuel + 5000); points += 10; sfx('yarn'); }
    } else p.timer--;
    if (p.timer <= 0) G.pickups.splice(i, 1);
  }

  // 11. timers
  if (G.stun > 0) G.stun--;
  if (G.shield > 0) G.shield--;

  // 12. cactus, and being inside a wall
  if (centre >= 36 && centre <= 39 && !S.dying && !G.shield && !S.teleport) { S.dying = 1; S.cause = 'cactus'; }
  if (solid(centre) && !S.teleport) {
    S.vx = 0; S.vy = 0;
    if (G.shield) S.wallLatch = true;
    else if (!S.dying) { S.dying = 1; S.cause = 'wall'; }
  } else S.wallLatch = false;

  // 13. walls, floors and ceilings
  let f = 0;
  if (S.vx < 0) {
    if (solid(leftBot) && !solid(tileAt(px, py - 1)) && solid(tileAt(px, py - 2))) { S.y -= 32; S.x -= 32; S.vy = 0; f = 1; }
    else if (solid(leftTop) && !solid(tileAt(px, py + 12)) && solid(tileAt(px, py + 13))) { S.y += 32; S.x -= 32; S.vy = 0; f = 1; }
    else if (solid(leftTop) || solid(leftBot)) S.vx = 0;
  } else if (S.vx > 0) {
    if (solid(rightBot) && !solid(tileAt(px + 11, py - 1)) && solid(tileAt(px + 11, py - 2))) { S.y -= 32; S.x += 32; S.vy = 16; f = 1; }
    else if (solid(rightTop) && !solid(tileAt(px + 11, py + 12)) && solid(tileAt(px + 11, py + 13))) { S.y += 32; S.x += 32; S.vy = 0; f = 1; }
    else if (solid(rightTop) || solid(rightBot)) S.vx = 0;
  }
  px = S.x >> 5; py = S.y >> 5;
  if (S.vy < 0) {
    if (!f && solid(aboveR) && !solid(tileAt(px + 8, py - 1))) { S.x -= 32; S.vx = 0; }
    else if (!f && solid(aboveL) && !solid(tileAt(px + 3, py - 1))) { S.x += 32; S.vx = 0; }
    else if (solid(aboveL) || solid(aboveR)) S.vy = 0;
  } else if (S.vy > 0) {
    if (!f && Math.abs(S.vx) < S.vy && solid(belowR) && !solid(tileAt(px + 8, py + 12))) { S.x -= 32; S.vx = 0; }
    else if (!f && Math.abs(S.vx) < S.vy && solid(belowL) && !solid(tileAt(px + 3, py + 12))) { S.x += 32; S.vx = 0; }
    else if (solid(belowL) || solid(belowR)) S.vy = 0;
  }
  px = S.x >> 5; py = S.y >> 5;
  if (S.vy > 32 && (solid(tileAt(px + 2, py + 13)) || solid(tileAt(px + 9, py + 13)))) S.vy = 32;
  if (S.vy > 32 && ((ladder(tileAt(px + 2, py + 13)) && !ladder(belowL)) || (ladder(tileAt(px + 9, py + 13)) && !ladder(belowR)))) S.vy = 32;
  if (S.vy < -32 && (solid(tileAt(px + 2, py - 2)) || solid(tileAt(px + 9, py - 2)))) S.vy = -32;

  // 14. the paw swipe: boxes beside, above or below are knocked away for good
  S.swipeDir = 0;
  if (shifter) {
    const faceLeft = S.frame >= 24 && S.frame <= 47, faceRight = S.frame < 24 || S.frame === 16 || S.frame === 17;
    let dir = 0;
    if (dx < 0 || (!dx && !dy && !jet && faceLeft) || (jet && dy > 0 && faceLeft)) dir = 1;
    else if (dx > 0 || (!dx && !dy && !jet && faceRight) || (jet && dy > 0 && faceRight)) dir = 2;
    else if (dy < 0 || (jet && !dx)) dir = 3;
    else if (dy > 0 && !jet) dir = 4;
    if (dir) {
      S.swipeDir = dir;
      if (S.swipeT % 12 === 0) sfx('swipe');
      S.swipeT++;
      const k = (S.swipeT >> 1) % 3, j = jet ? 3 : 0;
      S.frame = [0, 34 + j, 10 + j, 52 + j, 58][dir] + k;
      const [tx, ty] = [null, [px - 1, py + 6], [px + 12, py + 6], [px + 6, py - 1], [px + 6, py + 12]][dir];
      if ((dir >= 3) && !dx) { const r = px % 12; S.vx = r >= 6 ? 32 : r >= 1 ? -32 : 0; }
      if (dir <= 2 && !dy && ((jet && S.fuel > 0) || ladder(centre))) { const r = py % 12; S.vy = r >= 6 ? 32 : r >= 1 ? -32 : 0; }
      const tc = Math.floor(tx / 12), tr = Math.floor(ty / 12);
      if (tc >= 1 && tr >= 1 && tc <= 26 && tr <= 16) {
        const cell = cellIndex(tc, tr);
        if (G.grid[cell] === 70 && !G.digs.some((d) => d.cell === cell) && S.swipeT % 12 > 4) {
          G.digs.push({ cell, counter: 0, dir });
          G.grid[cell] = 70 | 0x80;
          G.staticDirty = true;
          points += 5;
          sfx('box');
        }
      }
    }
  } else S.swipeT = 0;
  for (let i = G.digs.length - 1; i >= 0; i--) if (++G.digs[i].counter >= 24) G.digs.splice(i, 1);

  // 15. monsters: touch test, then each one's own update
  for (const m of G.monsters) {
    if (!G.stun && !G.shield && !S.dying && !S.teleport && Math.abs(S.y - m.y) < 192 && Math.abs(S.x - m.x) < 192) {
      S.dying = 1; S.cause = m.type === 1 ? 'dog' : m.type === 2 ? 'vacuum' : 'ball';
    }
    updateMonster(m);
  }

  // 16. caught, the mouse waking, and tunnels
  if (S.dying === 1) { S.dying = 2; sfx(S.cause === 'dog' ? 'bark' : 'caught'); }
  else if (S.dying > 1 && S.dying < 1000) {
    S.dying++;
    if (S.dying >= 72) S.dying = 1000;
  }
  if (G.doorCount > 0) {
    if (G.doorCount === 1) sfx('mouse');
    G.doorCount++;
    if (G.doorCount >= 40) { G.doorCount = 0; G.doorOpen = true; }
  }
  if (S.teleport) {
    const e = S.teleport % 1000, pad = Math.floor(S.teleport / 1000);
    if (e === 1) {
      sfx('tunnel');
      const list = G.pads[pad];
      const myC = Math.floor(((S.x + 192) >> 5) / 12), myR = Math.floor(((S.y + 192) >> 5) / 12);
      for (let tries = 0; tries < 10 && list.length; tries++) {
        S.tpDest = list[rand() % list.length];
        if (S.tpDest[0] !== myC || S.tpDest[1] !== myR) break;
      }
    }
    if (e === 20 && S.tpDest) { S.x = S.tpDest[0] * U; S.y = S.tpDest[1] * U; S.vx = 0; S.vy = 0; S.pxPrev = S.x; S.pyPrev = S.y; }
    S.teleport++;
    if (S.teleport % 1000 >= 40) S.teleport = 0;
  }

  // 17. move: monsters first, then the cat
  for (const m of G.monsters) { m.px = m.x; m.py = m.y; m.x += m.vx; m.y += m.vy; }
  S.pxPrev = S.x; S.pyPrev = S.y;
  if (S.dying) { S.vx = 0; S.vy = 0; }
  S.x += S.vx; S.y += S.vy;

  // score and lives: an extra life every 1000 points
  if (points) {
    const before = Math.floor(G.score / 1000);
    G.score += points;
    if (Math.floor(G.score / 1000) !== before) { G.newLife++; sfx('life'); }
  }
  if (G.newLife) { G.lives = Math.min(99, G.lives + 1); G.newLife = 0; }
  if (G.info > 0) G.info--;

  // 18. end checks: caught, or every treat eaten and the cat beside the mouse
  if (S.dying >= 1000) return endLife('died');
  if (G.gifts === G.giftsTotal && G.doorCount === 0 && !S.dying &&
      Math.abs(((S.x + 180) >> 5) - (G.door[0] * 12 + 12)) < 8 && Math.abs(((S.y + 180) >> 5) - (G.door[1] * 12 + 18)) < 2) {
    return endLife('mouse');
  }
};
function standFrame(f) { return (f >= 0 && f <= 3) || (f >= 24 && f <= 27); }

// A pounce on a button turns its sprinkler off for the rest of the level.
function pressButton(c) {
  G.pressed[c] = true;
  G.grid.forEach((v, i) => { if (v === 74 + 2 * c || v === 75 + 2 * c) G.grid[i] = v | 0x80; });
  sfx('pounce');
  G.staticDirty = true;
}

// ---------- the dog, the robot vacuum and the bouncy ball ----------

function sense(m, dx, dy) { return tileAt((m.x >> 5) + dx, (m.y >> 5) + dy); }

function updateMonster(m) {
  m.vx = 0; m.vy = 0;
  if (m.type === 1) dog(m);
  else if (m.type === 2) vacuum(m);
  else if (m.type === 3) ball(m);
  if (m.vx) m.face = sign(m.vx);
}

function stuckCheck(m, cdx, cdy) {
  if (solid(tileAt((m.x >> 5) + cdx, (m.y >> 5) + cdy))) { m.vx = 0; m.vy = 0; m.stuck = 1; } else m.stuck = 0;
}

// The dog follows the cat: along floors, up and down cat posts (the Trackbot from the original,
// a little slower).
function dog(m) {
  const px = m.x >> 5, py = m.y >> 5;
  const aL = sense(m, 2, -1), aR = sense(m, 9, -1), rT = sense(m, 12, 0), rB = sense(m, 12, 11);
  const fR = sense(m, 9, 12), cB = sense(m, 6, 11), fL = sense(m, 2, 12), lB = sense(m, -1, 11), lT = sense(m, -1, 0);
  const b2 = sense(m, 6, 13), c10 = sense(m, 6, 10), c = sense(m, 6, 6);
  const raw = (x, y) => { const cc = Math.floor(x / 12), rr = Math.floor(y / 12); return cc < 0 || rr < 0 || cc >= COLS || rr >= ROWS ? 60 : G.grid[cellIndex(cc, rr)]; };
  const dR = raw(px + 12, py + 12), dL = raw(px - 1, py + 12);
  const dx = (m.x - S.x) >> 5, dy = (m.y - S.y) >> 5;
  const can = {
    1: !solid(lB) && !solid(lT),
    2: !solid(rT) && !solid(rB),
    4: !solid(aL) && !solid(aR) && px % 12 < 2 && ladder(cB),
    8: !solid(fR) && !solid(fL) && px % 12 < 2 && (ladder(c) || (ladder(fR) && ladder(fL))),
  };
  let dir = m.st;
  if ((dir === 4 && can[4]) || (dir === 8 && can[8])) {
    const away = (dy > 0 && dir === 8) || (dy < 0 && dir === 4);
    if (away || rand() % 3 === 0) {
      let done = false;
      if ((dx > 0 || rand() % 20 === 0) && can[1] && solidOrLadder(dL)) { dir = 1; done = true; }
      if (!done && (dx < 0 || rand() % 20 === 0) && can[2] && solidOrLadder(dR)) dir = 2;
    }
  } else if ((dir === 1 && can[1]) || (dir === 2 && can[2])) {
    const away = (dir === 2 && dx > 0) || (dir === 1 && dx < 0);
    if (away || rand() % 3 === 0) {
      let done = false;
      if ((dy > 0 || rand() % 20 === 0) && can[4]) { dir = 4; done = true; }
      if (!done && (dy < 0 || rand() % 20 === 0) && can[8]) dir = 8;
    }
  } else {
    const nv = dir !== 4 && dir !== 8, nh = dir !== 1 && dir !== 2;
    if (nv && dy > 0 && can[4]) dir = 4;
    else if (nv && dy < 0 && can[8]) dir = 8;
    else if (nh && dx > 0 && can[1]) dir = 1;
    else if (nh && dx < 0 && can[2]) dir = 2;
    else if (nv && can[4]) dir = 4;
    else if (nv && can[8]) dir = 8;
    else if (nh && can[1]) dir = 1;
    else if (nh && can[2]) dir = 2;
    else dir = 0;
  }
  if (ladder(c) || solidOrLadder(fR) || solidOrLadder(fL)) {
    if (dir === 1) m.vx = -40;
    if (dir === 2) m.vx = 40;
    if (dir === 4) m.vy = -32;
    if (dir === 8) m.vy = 32;
    if (dir === 4 || dir === 8) { const r = px % 12; if (r >= 6) m.vx = 32; else if (r >= 1) m.vx = -32; }
  } else { dir = 0; m.vx = 0; m.vy = 64; }
  m.st = dir;
  if (G.stun) { m.vx = 0; if (m.vy !== 64) m.vy = 0; }
  if (m.vy === 64) { if (m.frame >= 10) m.frame = 4; }
  else if (m.vy !== 0) m.frame = 10 + ((py >> 1) & 1);
  else if (m.vx !== 0) m.frame = 4 + 3 * (m.vx < 0) + ((px >> 1) % 3);
  const both = (a, b) => fR >= a && fR <= b && fL >= a && fL <= b;
  if (both(97, 99)) m.vx = Math.trunc(m.vx * 0.6);
  if (both(114, 116)) m.vx = -40 - 15 * (m.vx < 0) + 60 * (m.vx > 0);
  if (both(117, 119)) m.vx = 40 + 15 * (m.vx > 0) - 60 * (m.vx < 0);
  if (m.vy < -32 && !(ladder(c10) && !solid(sense(m, 6, -2)))) m.vy = -32;
  if (m.vy > 32 && (solid(b2) || (!ladder(c) && ladder(b2)))) m.vy = 32;
  stuckCheck(m, 6, 6);
}

// The robot vacuum runs back and forth along its floor and turns round at walls.
function vacuum(m) {
  const r = sense(m, 12, 11), b1 = sense(m, 1, 12), b2 = sense(m, 10, 12), l = sense(m, -1, 11);
  m.st++;
  if (m.st % 64 === 63) m.st &= 0x40;
  if (!solidOrLadder(b1) && !solidOrLadder(b2)) m.vy = 64;
  else {
    if (solid(l)) m.st = 0x40; else if (solid(r)) m.st = 0;
    const right = m.st & 0x40;
    if (!right && !solid(l)) m.vx = -36;
    else if (right && !solid(r)) m.vx = 36;
  }
  if (G.stun) { m.vx = 0; if (m.vy !== 64) m.vy = 0; }
  if (b1 >= 97 && b1 <= 99) m.vx = Math.trunc(m.vx * 0.6);
  if (b1 >= 114 && b1 <= 116) m.vx = -30 - 12 * (m.vx < 0) + 50 * (m.vx > 0);
  if (b1 >= 117 && b1 <= 119) m.vx = 30 + 12 * (m.vx > 0) - 50 * (m.vx < 0);
  stuckCheck(m, 6, 11);
}

// The bouncy ball goes straight up and down between floor and ceiling, resting a moment at each.
function ball(m) {
  if (m.st >= 10) {
    if (m.st % 10 === 6) m.st = 2 - Math.floor(m.st / 10);
    else m.st++;
  }
  if (m.st === 0) {
    if (solid(sense(m, 6, 12))) { m.st = 10; m.frame = 12; sfx('boing'); }
    else { m.vy = 44; m.frame = 13; }
  } else if (m.st === 1) {
    if (solid(sense(m, 6, -1))) { m.st = 20; m.frame = 15; }
    else { m.vy = -44; m.frame = 14; }
  }
  if (G.stun) { m.vx = 0; m.vy = 0; }
}

// ---------- between lives and levels ----------

function endLife(why) {
  stopLoops();
  if (why === 'quit') return toTitle();
  if (why === 'skip') { nextLevel(); return toReady(); }
  if (why === 'mouse') { G.screen = 'bonus'; G.timer = 0; G.bonusStep = 0; sfx('win'); return; }
  G.screen = 'flash'; G.timer = 0;
}

function nextLevel() {
  G.level++;
  if (G.level >= LEVELS.length) { G.level = 0; G.screen = 'congrats'; G.timer = 0; sfx('win'); }
}

function toReady() {
  if (G.screen === 'congrats') return;
  loadLevel();
  G.screen = 'ready'; G.timer = 0;
}

function toTitle() {
  G.screen = 'title'; G.timer = 0;
  G.level = 0; loadLevel();
}

function newGame() {
  srand(Date.now() & 0xffff);
  G.level = 0; G.score = 0; G.lives = START_LIVES; G.speed = 5; G.cheated = false;
  toReady();
}

// ---------- the lives cheat ----------

// Typing KITTY, or tapping the hearts five times within two seconds, gives five more lives. Like the
// other cheats it keeps that game off the high score board.
let typed = '', heartTaps = [];
function livesCheat() {
  if (!['play', 'ready', 'intro'].includes(G.screen)) return;
  G.lives = Math.min(99, G.lives + 5);
  G.cheated = true;
  G.cheatShown = G.t + 1.8;
  sfx('life'); meow(1.2, 0.3, 0.06, 0.4);
}
function tapHearts(ev) {
  const r = canvas.getBoundingClientRect();
  const x = (ev.clientX - r.left) / r.width * PLAY_W, y = (ev.clientY - r.top) / r.height * (PLAY_H + HUD_H);
  if (y < PLAY_H || x < 130 || x > 190) return;
  heartTaps = heartTaps.filter((t) => G.t - t < 2).concat(G.t);
  if (heartTaps.length >= 5) { heartTaps = []; livesCheat(); }
}

// ---------- high scores (shared with the other arcade games, see leaderboard.js) ----------

let best = null;
function refreshBest() { Leaderboard.best().then((b) => { best = b; }).catch(() => { /* offline */ }); }

function showScores(score = 0) {
  held.clear(); pressed.length = 0; stopLoops();
  const ended = score > 0 || G.screen === 'board';
  Leaderboard.open({
    score, cheated: G.cheated,
    closeLabel: ended ? 'Play again' : 'Back',
    onClose: () => { refreshBest(); if (ended) newGame(); },
  });
}

// ---------- sound, made with Web Audio ----------

let audio = null, muted = false;
function ensureAudio() {
  if (audio) return;
  try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; }
}
function tone(freq, dur, type = 'square', vol = 0.06, slide = 0, delay = 0) {
  if (!audio || muted) return;
  const t0 = audio.currentTime + delay;
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(audio.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, vol = 0.08, freq = 1200, delay = 0, type = 'bandpass') {
  if (!audio || muted) return;
  const t0 = audio.currentTime + delay;
  const n = audio.createBufferSource(), b = audio.createBuffer(1, Math.ceil(audio.sampleRate * dur), audio.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  n.buffer = b;
  const f = audio.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = audio.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  n.connect(f).connect(g).connect(audio.destination);
  n.start(t0);
}
// A small "mew": a buzzy tone through a filter that opens and closes, the pitch rising then falling.
function meow(pitch = 1, dur = 0.32, vol = 0.07, delay = 0) {
  if (!audio || muted) return;
  const t0 = audio.currentTime + delay;
  const o = audio.createOscillator(), f = audio.createBiquadFilter(), g = audio.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(560 * pitch, t0);
  o.frequency.linearRampToValueAtTime(820 * pitch, t0 + dur * 0.35);
  o.frequency.linearRampToValueAtTime(480 * pitch, t0 + dur);
  f.type = 'bandpass'; f.Q.value = 3;
  f.frequency.setValueAtTime(900, t0);
  f.frequency.linearRampToValueAtTime(1900, t0 + dur * 0.35);
  f.frequency.linearRampToValueAtTime(800, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(f).connect(g).connect(audio.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
const SFX = {
  treat: () => { noise(0.05, 0.05, 2600); tone(988, 0.07, 'triangle', 0.07, 0, 0.02); tone(1480, 0.1, 'triangle', 0.06, 0, 0.08); },
  yarn: () => { tone(420, 0.25, 'sine', 0.08, 520); tone(840, 0.2, 'triangle', 0.04, 400, 0.08); },
  bone: () => { tone(330, 0.1, 'triangle', 0.08); tone(440, 0.14, 'triangle', 0.08, 0, 0.11); },
  coin: () => { tone(1568, 0.06, 'triangle', 0.06); tone(2093, 0.12, 'triangle', 0.05, 0, 0.05); },
  bell: () => { tone(1760, 0.5, 'sine', 0.06); tone(2637, 0.4, 'sine', 0.03, 0, 0.01); },
  bubble: () => tone(500, 0.3, 'sine', 0.08, 700),
  life: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'triangle', 0.08, 0, i * 0.09)),
  mouse: () => { tone(1900, 0.06, 'sine', 0.06, 500); tone(2100, 0.07, 'sine', 0.06, 500, 0.12); tone(2300, 0.09, 'sine', 0.05, 600, 0.24); },
  bark: () => {
    for (const d of [0, 0.2]) { noise(0.1, 0.12, 700, d); tone(260, 0.1, 'square', 0.05, -90, d); }
    meow(0.8, 0.3, 0.06, 0.38);
  },
  caught: () => { meow(1.1, 0.25, 0.07); noise(0.25, 0.05, 900, 0.1); },
  jump: () => tone(520, 0.1, 'triangle', 0.05, 380),
  swipe: () => noise(0.09, 0.06, 3200, 0, 'highpass'),
  box: () => { noise(0.14, 0.12, 320, 0, 'lowpass'); tone(160, 0.12, 'triangle', 0.06, -60); },
  pounce: () => { tone(260, 0.12, 'triangle', 0.09, 300); noise(0.45, 0.05, 2000, 0.1); tone(900, 0.4, 'sine', 0.04, -600, 0.15); },
  tunnel: () => { tone(260, 0.5, 'sine', 0.07, 900); noise(0.4, 0.04, 1500); },
  popup: () => tone(1200, 0.08, 'sine', 0.05, 400),
  boing: () => tone(180, 0.12, 'sine', 0.035, 160),
  win: () => { [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.08, 0, i * 0.11)); meow(1.25, 0.3, 0.06, 0.7); },
  tick: () => tone(1800, 0.02, 'square', 0.02),
  over: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'triangle', 0.08, 0, i * 0.25)),
};
function sfx(name) { if (SFX[name]) SFX[name](); }

// The tail's soft whirr while flying.
const loops = {};
function startWhirr() {
  const o = audio.createOscillator(), g = audio.createGain(), lfo = audio.createOscillator(), depth = audio.createGain();
  o.type = 'triangle'; o.frequency.value = 170;
  lfo.frequency.value = 24; depth.gain.value = 0.03;
  g.gain.value = 0.035;
  lfo.connect(depth).connect(g.gain);
  o.connect(g).connect(audio.destination);
  o.start(); lfo.start();
  return { nodes: [o, lfo] };
}
function setLoop(name, on) {
  if (!audio || muted) on = false;
  if (on && !loops[name]) loops[name] = startWhirr();
  else if (!on && loops[name]) {
    loops[name].nodes.forEach((n) => { try { n.stop(); } catch (e) { /* already stopped */ } });
    delete loops[name];
  }
}
function updateLoops() {
  setLoop('whirr', G.screen === 'play' && !G.paused && S && !S.dying && S.jet && S.fuel > 0);
}
function stopLoops() { Object.keys(loops).forEach((k) => setLoop(k, false)); }

// ---------- drawing ----------

let canvas, ctx, scale = 1, staticLayer = null, staticScale = 0, staticLevel = -1;

function lookAt(cx, cy) { return cx < 0 || cy < 0 || cx > 25 || cy > 15 ? -1 : G.grid[cellIndex(cx + 1, cy + 1)]; }

function buildStatic() {
  const W = Math.ceil(PLAY_W * scale), H = Math.ceil(PLAY_H * scale);
  if (!staticLayer) staticLayer = document.createElement('canvas');
  staticLayer.width = W; staticLayer.height = H;
  const g = staticLayer.getContext('2d');
  g.setTransform(scale, 0, 0, scale, 0, 0);
  drawLevelStatic(g, 26, 16, lookAt, themeOf(G.level));
  staticScale = scale; staticLevel = G.level;
  G.staticDirty = false;
}

// How the cat looks this frame, from its frame number (the original's numbering: 0-3 / 24-27 walk,
// 4-9 / 28-33 fly, 10-15 / 34-39 and 52-60 swipe, 16-17 / 40-41 jump, 48-51 climb).
function catPose(f) {
  const left = f >= 24 && f < 48, b = left ? f - 24 : f, face = left ? -1 : 1;
  if (f >= 48 && f <= 51) return { mode: 'climb', face: 1, walk: (f - 48) * Math.PI / 2 };
  if (f >= 52 && f <= 57) return { mode: f >= 55 ? 'fly' : 'stand', face: S && S.lastvx < 0 ? -1 : 1, swipe: 'up' };
  if (f >= 58 && f <= 60) return { mode: 'stand', face: S && S.lastvx < 0 ? -1 : 1, swipe: 'down' };
  if (b <= 3) return { mode: b === 0 ? 'stand' : 'walk', face, walk: b * Math.PI / 2 };
  if (b <= 9) return { mode: 'fly', face };
  if (b <= 15) return { mode: b >= 13 ? 'fly' : 'stand', face, swipe: 'fwd' };
  if (b <= 17) return { mode: 'jump', face };
  return { mode: 'stand', face };
}

function drawPlay(alpha, t) {
  if (G.staticDirty || staticScale !== scale || staticLevel !== G.level) buildStatic();
  ctx.drawImage(staticLayer, 0, 0, PLAY_W, PLAY_H);
  const th = themeOf(G.level);
  for (let r = 1; r <= 16; r++) for (let c = 1; c <= 26; c++) {
    const v = G.grid[cellIndex(c, r)], tile = v & 0x7f;
    if (!LIVE.has(tile)) continue;
    if (G.screen === 'flash' && tile === 4 && G.flashHide) continue;
    drawTile(ctx, v, (c - 1) * T, (r - 1) * T, c - 1, r - 1, t, (dx, dy) => lookAt(c - 1 + dx, r - 1 + dy), th, G.pressed);
  }
  for (const d of G.digs) {
    const c = d.cell % COLS, r = Math.floor(d.cell / COLS);
    drawBoxKnocked(ctx, (c - 1) * T, (r - 1) * T, d.counter / 24, d.dir);
  }
  const mouseState = G.screen === 'bonus' ? 'happy' : G.doorOpen ? 'awake' : G.doorCount ? 'waking' : 'sleep';
  drawMouseHome(ctx, (G.door[0] - 1) * T, (G.door[1] - 1) * T, mouseOf(G.level), mouseState, G.doorCount / 40, t);
  for (const p of G.pickups) drawPickup(ctx, p.kind, p.c * T, p.r * T, t, p.timer < 100);
  for (const m of G.monsters) {
    const [x, y] = lerpPos(m.px, m.py, m.x, m.y, alpha);
    drawMonster(m, x - T, y - T, t);
  }
  drawTheCat(alpha, t);
}

function drawMonster(m, x, y, t) {
  if (m.type === 1) {
    const pose = m.vy === 64 ? 'fall' : m.vy !== 0 || (m.frame >= 10 && m.frame <= 11) ? 'climb' : G.stun ? 'sit' : m.vx !== 0 ? 'run' : 'stand';
    drawDog(ctx, x, y, m.face, pose, (m.x >> 6) % 4, t);
  } else if (m.type === 2) drawVacuum(ctx, x, y, m.face, t, G.stun > 0);
  else drawBall(ctx, x, y, m.frame, t);
  if (G.stun > 0 && G.stun < 60 && Math.floor(t * 8) % 2) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.arc(x + 6, y + 6, 6, 0, 7); ctx.fill();
  }
}

function drawTheCat(alpha, t) {
  const P = catOf(G.level);
  if (G.screen === 'intro') {
    const k = Math.min(1, G.timer / 1000);
    const x = (S.x >> 5) - T, y = (S.y >> 5) - T;
    if (k < 1) drawCatArrive(ctx, x, y, P, k, t);
    else if (Math.floor((G.timer - 1000) / 220) % 4 !== 3) drawCat(ctx, x, y, P, { face: 1, mode: 'stand' }, t);
    return;
  }
  const [x, y] = lerpPos(S.pxPrev, S.pyPrev, S.x, S.y, alpha);
  const cx = x - T, cy = y - T;
  if (S.dying) {
    if (S.dying < 1000) drawCatScared(ctx, cx, cy, P, (S.dying - 2) / 70, t, S.frame >= 24 && S.frame < 48 ? -1 : 1);
    return;
  }
  if (G.screen === 'bonus') {
    const hop = Math.abs(Math.sin(t * 7)) * 2.5;
    drawCat(ctx, cx, cy - hop, P, { face: 1, mode: 'walk', walk: t * 12, happy: true }, t);
    drawHearts(ctx, cx + 12, cy, t);
    return;
  }
  const pose = catPose(S.frame);
  if (S.pounce > 0) {
    const k = S.pounce / 16;
    pose.mode = 'jump';
    ctx.save(); ctx.translate(0, -Math.sin(k * Math.PI) * 4);
  }
  if (pose.swipe) pose.swipeK = (S.swipeT % 12) / 12;
  if (S.teleport) {
    const e = S.teleport % 1000, k = Math.abs(e - 20) / 20;
    ctx.save();
    ctx.globalAlpha = 0.15 + 0.85 * k;
    ctx.translate(cx + 6, cy + 12); ctx.scale(0.4 + 0.6 * k, 0.4 + 0.6 * k); ctx.translate(-cx - 6, -cy - 12);
    drawCat(ctx, cx, cy, P, { face: pose.face, mode: 'stand' }, t);
    ctx.restore();
  } else drawCat(ctx, cx, cy, P, pose, t);
  if (S.pounce > 0) ctx.restore();
  const shieldOn = G.shield > 50 || (G.shield > 0 && (G.shield & 2));
  if (shieldOn) drawBubble(ctx, cx, cy, t, G.shield <= 50);
  // a hint over a tunnel: press Down
  const centre = tileAt((S.x >> 5) + 6, (S.y >> 5) + 6);
  if (centre >= 6 && centre <= 8 && !S.teleport && S.mode === 1) {
    const b = Math.sin(t * 6) * 1;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = 'rgba(80, 60, 120, 0.6)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(cx + 3.5, cy - 7 + b); ctx.lineTo(cx + 8.5, cy - 7 + b); ctx.lineTo(cx + 6, cy - 3.5 + b); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
}

function lerpPos(ax, ay, bx, by, a) {
  if (Math.abs(bx - ax) > U || Math.abs(by - ay) > U) return [bx >> 5, by >> 5];
  return [(ax + (bx - ax) * a) / 32, (ay + (by - ay) * a) / 32];
}

const FONT = '"Fredoka", "Rubik", system-ui, sans-serif';

function drawHud(t) {
  const y = PLAY_H;
  ctx.fillStyle = grad(ctx, 0, y, 0, y + HUD_H, [[0, '#fff2f6'], [1, '#f6dbe6']]);
  ctx.fillRect(0, y, PLAY_W, HUD_H);
  ctx.fillStyle = 'rgba(200, 120, 150, 0.35)';
  ctx.fillRect(0, y, PLAY_W, 0.5);
  ctx.textBaseline = 'middle';
  ctx.font = `600 6px ${FONT}`;
  if (G.info > 0) {
    ctx.fillStyle = '#7a4a68';
    ctx.fillText(`Level ${G.level + 1}  ·  ${LEVELS[G.level].name}  ·  speed ${G.speed}`, 6, y + 8.5);
    return;
  }
  // treats
  drawTreat(ctx, 2, y + 1.5, t);
  ctx.fillStyle = '#7a4a68';
  ctx.fillText(`${G.gifts}/${G.giftsTotal}`, 15, y + 8.5);
  // yarn meter
  drawYarn(ctx, 44, y + 1.5, false, t);
  const fuel = S ? S.fuel : 0, w = 64 * fuel / 10000;
  ctx.fillStyle = '#ead0dc';
  rrect(ctx, 58, y + 5.5, 66, 5.5, 2.75); ctx.fill();
  if (w > 0) {
    ctx.fillStyle = grad(ctx, 0, y + 6, 0, y + 10.5, [[0, '#d6c4ff'], [1, '#8a6ee0']]);
    rrect(ctx, 59, y + 6.5, Math.max(3.5, w), 3.5, 1.75); ctx.fill();
  }
  // lives as hearts
  let hx = 136;
  const shown = Math.min(G.lives, 6);
  for (let i = 0; i < shown; i++) {
    ctx.fillStyle = '#ff6a90';
    heartPath(ctx, hx + i * 8 + 3, y + 8, 2.6); ctx.fill();
  }
  ctx.fillStyle = '#7a4a68';
  if (G.lives > 6) ctx.fillText(`+${G.lives - 6}`, hx + 6 * 8 + 1, y + 8.5);
  // bubble and bone time left
  let ix = 196;
  if (G.shield > 0) { drawPickup(ctx, 0, ix - 2, y + 2, t, G.shield < 50); ix += 11; }
  if (G.stun > 0) { drawPickup(ctx, 1, ix - 2, y + 2, t, G.stun < 50); ix += 11; }
  ctx.fillStyle = '#b06a8a';
  ctx.font = `600 5px ${FONT}`;
  ctx.fillText('SCORE', 238, y + 8.5);
  ctx.fillStyle = '#7a4a68';
  ctx.font = `700 7px ${FONT}`;
  ctx.fillText(String(G.score % 1000000).padStart(6, '0'), 258, y + 8.5);
  if (muted) { ctx.font = `500 4px ${FONT}`; ctx.fillStyle = '#b06a8a'; ctx.fillText('sound off', 290, y + 3.5); }
}

function card(x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(120, 60, 100, 0.35)'; ctx.shadowBlur = 12;
  ctx.fillStyle = 'rgba(255, 250, 252, 0.95)';
  rrect(ctx, x, y, w, h, 8); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(240, 150, 185, 0.8)'; ctx.lineWidth = 0.8;
  rrect(ctx, x + 1, y + 1, w - 2, h - 2, 7); ctx.stroke();
}

function centerText(s, y, size, color, weight = 600, outline = null) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (outline) { ctx.lineWidth = size * 0.22; ctx.lineJoin = 'round'; ctx.strokeStyle = outline; ctx.strokeText(s, PLAY_W / 2, y); }
  ctx.fillStyle = color;
  ctx.fillText(s, PLAY_W / 2, y);
  ctx.textAlign = 'left';
}

// Draws a cat (or mouse) bigger than life, for the title and level cards.
function bigCat(P, x, y, size, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size); ctx.translate(-6, -12);
  drawCat(ctx, 0, 0, P, s, t);
  ctx.restore();
}
function bigMouse(M, x, y, size, state, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size); ctx.translate(-12, -24);
  drawMouseHome(ctx, 0, 0, M, state, 1, t);
  ctx.restore();
}

function drawTitle(t) {
  drawPlay(1, t);
  ctx.fillStyle = 'rgba(255, 246, 250, 0.9)';
  ctx.fillRect(0, 0, PLAY_W, PLAY_H + HUD_H);
  ctx.save();
  ctx.shadowColor = 'rgba(240, 120, 160, 0.5)'; ctx.shadowBlur = 8;
  centerText('Kitty Cat Run', 38, 30, '#ff7aa2', 700, '#ffffff');
  ctx.restore();
  // Candy walks across under the title; the mouse naps at the far end
  const cx = ((t * 26) % (PLAY_W + 60)) - 30;
  bigCat(CATS[9], cx, 104, 2.4, { face: 1, mode: 'walk', walk: t * 9 }, t);
  bigMouse(MICE[0], 270, 104, 1.4, 'sleep', t);
  ctx.fillStyle = 'rgba(200, 140, 170, 0.25)'; ctx.fillRect(0, 104, PLAY_W, 1);
  const blink = Math.floor(t * 2) % 2 === 0;
  centerText(blink ? 'Press Enter or tap to start' : '', 124, 9, '#c0507a', 700);
  centerText('Arrows walk and climb  ·  Space or Z jumps, and flies once you have yarn  ·  X or Enter swipes boxes', 142, 5, '#7a4a68', 500);
  centerText('Eat every treat to wake the mouse, then go say hi  ·  Down goes into a tunnel  ·  Esc starts over', 151, 5, '#7a4a68', 500);
  if (best) centerText(`Best: ${best.name}  ${best.score}`, 170, 6, '#b06a8a', 600);
  centerText('H high scores  ·  P pause  ·  M sound', 182, 5, '#b06a8a', 500);
}

function drawReady(t) {
  drawPlay(1, t);
  ctx.fillStyle = 'rgba(255, 246, 250, 0.7)';
  ctx.fillRect(0, 0, PLAY_W, PLAY_H + HUD_H);
  card(46, 20, 220, 168);
  const P = catOf(G.level), M = mouseOf(G.level);
  centerText(`Level ${G.level + 1}`, 36, 9, '#c0507a', 700);
  centerText(LEVELS[G.level].name, 52, 13, '#7a4a68', 700);
  bigCat(P, 120, 118, 4, { face: 1, mode: 'stand' }, t);
  bigMouse(M, 196, 118, 2.2, 'sleep', t);
  centerText(`${P.name} is ${P.kind}.`, 140, 7, '#7a4a68', 600);
  centerText(`Eat all ${G.giftsTotal} treats so the ${M.name} mouse wakes up.`, 152, 6, '#7a4a68', 500);
  if (G.timer > 500 && Math.floor(t * 2) % 2 === 0) centerText('Press any key or tap', 172, 6.5, '#c0507a', 600);
}

function drawOverlayText(lines) {
  ctx.fillStyle = 'rgba(255, 246, 250, 0.6)';
  ctx.fillRect(0, 0, PLAY_W, PLAY_H + HUD_H);
  card(46, 58, 220, 74 + (lines.length - 2) * 12);
  lines.forEach(([s, size, color], i) => centerText(s, 80 + i * 17, size, color, 700));
}

function draw(alpha) {
  const t = G.t;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, PLAY_W, PLAY_H + HUD_H);
  switch (G.screen) {
    case 'title': drawTitle(t); break;
    case 'ready': drawReady(t); break;
    case 'congrats':
      drawPlay(1, t); drawHud(t);
      drawOverlayText([['You did it!', 16, '#ff7aa2'], [`Every cat found its mouse in all ${LEVELS.length} rooms.`, 7, '#7a4a68'], ['Press any key to keep playing', 6, '#b06a8a']]);
      break;
    case 'gameover': case 'board':
      drawPlay(1, t); drawHud(t);
      drawOverlayText([['Game over', 16, '#ff7aa2'], [`Score ${G.score}`, 9, '#7a4a68']]);
      break;
    default:
      drawPlay(alpha, t); drawHud(t);
      if (G.paused) drawOverlayText([['Paused', 14, '#ff7aa2'], ['Press P to keep playing', 7, '#7a4a68']]);
  }
  if (G.cheatShown > t) {
    const k = Math.min(1, (G.cheatShown - t) / 0.4);
    ctx.globalAlpha = k;
    centerText('+5 lives!', 90 - (1.8 - (G.cheatShown - t)) * 8, 16, '#ff6a90', 700, '#ffffff');
    ctx.globalAlpha = 1;
  }
}

// ---------- the main loop ----------

let acc = 0, last = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000 || 0);
  last = now;
  if (document.hidden) return;
  G.t += dt;
  G.timer += dt * 1000;
  let alpha = 1;

  if (G.screen === 'play' && !G.paused) {
    acc += dt * 1000;
    const ms = frameMs(G.speed);
    let n = 0;
    while (acc >= ms && n < 5 && G.screen === 'play') { step(); acc -= ms; n++; }
    if (n === 5) acc = 0;
    alpha = Math.min(1, acc / ms);
  } else if (G.screen === 'intro') {
    const moving = ['jet', 'shifter', 'left', 'right', 'up', 'down'].some(isHeld);
    if (G.timer > 1000 && (pressed.length || moving)) { G.screen = 'play'; acc = 0; }
    pressed.length = 0;
  } else if (G.screen === 'flash') {
    // the treats that were left blink, then the level starts again
    G.flashHide = G.timer < 700 && Math.floor(G.timer / 100) % 2 === 0;
    if (G.timer > 1000) {
      G.lives--;
      if (G.lives <= 0) { G.screen = 'gameover'; G.timer = 0; sfx('over'); }
      else toReady();
    }
  } else if (G.screen === 'bonus') {
    // 100 points, one at a time, while the cat and mouse celebrate
    while (G.timer > (G.bonusStep + 1) * 18 && G.bonusStep < 100) {
      G.bonusStep++;
      const before = Math.floor(G.score / 1000);
      G.score++;
      if (Math.floor(G.score / 1000) !== before) { G.lives = Math.min(99, G.lives + 1); sfx('life'); }
      if (G.bonusStep % 4 === 0) sfx('tick');
    }
    if (G.bonusStep >= 100 && G.timer > 100 * 18 + 600) { nextLevel(); toReady(); }
  } else if (G.screen === 'gameover') {
    if (G.timer > 2000) { G.screen = 'board'; showScores(G.score); }
  } else if (G.screen === 'ready' || G.screen === 'title' || G.screen === 'congrats') {
    if (pressed.length) {
      const k = pressed.shift();
      pressed.length = 0;
      if (G.screen === 'title') {
        if (k === 'Enter' || k === 'Space' || k === 'Pointer' || k === 'v-start') newGame();
        else if (k === 'KeyH') showScores();
      } else if (G.screen === 'ready' && G.timer > 300) {
        G.screen = 'intro'; G.timer = 0;
      } else if (G.screen === 'congrats' && G.timer > 800) { G.screen = 'ready'; loadLevel(); G.timer = 0; }
    }
  }

  updateLoops();
  draw(alpha);
}

function onKey(e, down) {
  if (Leaderboard.isOpen()) return;
  const code = e.code;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Tab', 'AltLeft', 'AltRight', 'Enter', 'ControlLeft', 'ControlRight'].includes(code)) e.preventDefault();
  ensureAudio();
  if (audio && audio.state === 'suspended') audio.resume();
  if (!down) { held.delete(code); return; }
  if (e.repeat) return;
  held.add(code);
  if (code === 'KeyM') { muted = !muted; if (muted) stopLoops(); return; }
  if ((code === 'KeyP' || code === 'Pause') && G.screen === 'play') { G.paused = !G.paused; stopLoops(); return; }
  if (code === 'Digit2' && G.screen === 'intro') return;
  if (/^Key[A-Z]$/.test(code)) { typed = (typed + code[3]).slice(-5); if (typed === 'KITTY') { typed = ''; livesCheat(); } }
  pressed.push(code);
}

function resize() {
  const wrap = canvas.parentElement;
  const cssW = wrap.clientWidth;
  const cssH = cssW * (PLAY_H + HUD_H) / PLAY_W;
  const dpr = window.devicePixelRatio || 1;
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  scale = canvas.width / PLAY_W;
  G.staticDirty = true;
}

function wireTouch() {
  document.querySelectorAll('[data-key]').forEach((b) => {
    const code = b.dataset.key;
    const on = (ev) => {
      ev.preventDefault(); ensureAudio();
      if (audio && audio.state === 'suspended') audio.resume();
      if (code === 'KeyP') { if (G.screen === 'play') { G.paused = !G.paused; stopLoops(); } return; }
      held.add(code); pressed.push(code);
    };
    const off = (ev) => { ev.preventDefault(); held.delete(code); };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('pointerleave', off);
  });
}

function start() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  window.addEventListener('keydown', (e) => onKey(e, true));
  window.addEventListener('keyup', (e) => onKey(e, false));
  window.addEventListener('blur', () => { held.clear(); stopLoops(); if (G.screen === 'play') G.paused = true; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopLoops(); if (G.screen === 'play') G.paused = true; } });
  window.addEventListener('resize', resize);
  canvas.addEventListener('pointerdown', (ev) => {
    tapHearts(ev);
    ensureAudio();
    if (audio && audio.state === 'suspended') audio.resume();
    canvas.focus();
    if (G.screen === 'play' && G.paused) { G.paused = false; return; }
    pressed.push('Pointer');
  });
  wireTouch();
  const scoresButton = document.querySelector('[data-scores]');
  scoresButton.hidden = false;
  scoresButton.addEventListener('click', () => { if (G.screen === 'title') showScores(); });
  resize();
  toTitle();
  refreshBest();
  // For checking the game from a script: ?level=3&keys=40:R,60:JD starts that level and holds keys
  // for so many frames each (L R U D J S = left, right, up, down, jump/fly, swipe).
  const q = new URLSearchParams(location.search);
  if (q.get('level')) {
    G.level = +q.get('level') - 1; loadLevel(); G.screen = 'play'; G.cheated = true;
    if (q.get('fuel')) S.fuel = 10000;
    const plan = (q.get('keys') || '').split(',').filter(Boolean).map((p) => p.split(':'));
    const names = { L: 'ArrowLeft', R: 'ArrowRight', U: 'ArrowUp', D: 'ArrowDown', J: 'Space', S: 'KeyX' };
    let n = 0;
    const realStep = step;
    step = function () {
      let f = n++;
      held.clear();
      for (const [frames, keys = ''] of plan) { if (f < +frames) { for (const k of keys) held.add(names[k]); break; } f -= +frames; }
      return realStep();
    };
    for (let i = +(q.get('run') || 0); i > 0 && G.screen === 'play'; i--) step();
    if (q.get('screen')) { G.screen = q.get('screen'); G.timer = 99999; }
  }
  requestAnimationFrame(frame);
}

window.addEventListener('load', start);
