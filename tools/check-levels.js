// Checks every level can be finished: each treat and the mouse can be reached from the start.
// It moves the cat a whole square at a time (walk, fall, climb, a short hop, swipe a box, press a
// button, use a tunnel, and fly anywhere open once a yarn ball has been reached), so it is a
// little kinder than the real game. usage: node tools/check-levels.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../levels.js'), 'utf8') + ';this.MAPS = MAPS;', ctx);

let failed = false;
ctx.MAPS.forEach((L, n) => {
  const m = L.map.map((row) => [...row]);
  const at = (c, r) => (c < 0 || c > 25 || r < 0 || r > 15 ? '#' : m[r][c]);
  const removed = new Set(), pressed = new Set();
  let canFly = false;
  const key = (c, r) => `${c},${r}`;
  const solid = (c, r) => {
    const ch = at(c, r);
    if (removed.has(key(c, r))) return false;
    if ('wvu'.includes(ch)) return !pressed.has('wvu'.indexOf(ch));
    return '#B~_<>'.includes(ch);
  };
  const post = (c, r) => at(c, r) === 'H';
  const deadly = (c, r) => at(c, r) === '^';
  const held = (c, r) => solid(c, r + 1) || post(c, r + 1) || post(c, r);
  let start, mouse;
  m.forEach((row, r) => row.forEach((ch, c) => { if (ch === 'C') start = [c, r]; if (ch === 'M' && !mouse) mouse = [c, r]; }));

  let seen, touched;
  for (let round = 0; round < 50; round++) {
    seen = new Set(); touched = new Set();
    const queue = [];
    const fall = (c, r) => {
      while (!held(c, r) && !solid(c, r + 1) && r < 15) { touched.add(key(c, r)); r++; if (deadly(c, r)) return null; }
      return [c, r];
    };
    const visit = (c, r) => {
      if (solid(c, r) || deadly(c, r)) return;
      const p = fall(c, r);
      if (!p) return;
      const k = key(...p);
      if (seen.has(k)) return;
      seen.add(k); touched.add(k); queue.push(p);
    };
    visit(...start);
    let changed = false;
    while (queue.length) {
      const [c, r] = queue.shift();
      const ch = at(c, r);
      if ('yY'.includes(ch) && !canFly) { canFly = true; changed = true; }
      if ('123'.includes(ch) && !pressed.has(+ch - 1)) { pressed.add(+ch - 1); changed = true; }
      for (const d of [-1, 1]) {
        visit(c + d, r);
        // a hop: up one square and over, or across a gap of up to two
        if (!solid(c, r - 1)) {
          touched.add(key(c, r - 1));
          if (!solid(c + d, r - 1)) {
            visit(c + d, r - 1);
            if (!solid(c + 2 * d, r - 1)) { visit(c + 2 * d, r - 1); visit(c + 2 * d, r); if (!solid(c + 3 * d, r - 1)) visit(c + 3 * d, r); }
          }
        }
        // swipe a box beside
        if (at(c + d, r) === 'B' && !removed.has(key(c + d, r))) { removed.add(key(c + d, r)); changed = true; }
      }
      // a box underfoot is swiped to drop through it; it stays in the map for every other route,
      // because a hole in a floor can cut off the squares beside it
      if (at(c, r + 1) === 'B' && !removed.has(key(c, r + 1))) { touched.add(key(c, r + 1)); const p = fall(c, r + 2); if (p && !solid(c, r + 2)) visit(...p); }
      if (post(c, r) && at(c, r - 1) === 'B' && !removed.has(key(c, r - 1))) { removed.add(key(c, r - 1)); changed = true; }
      if (post(c, r) || post(c, r + 1)) { if (!solid(c, r - 1) && post(c, r)) visit(c, r - 1); if (post(c, r + 1)) visit(c, r + 1); }
      if ('TUV'.includes(ch)) m.forEach((row, rr) => row.forEach((x, cc) => { if (x === ch) visit(cc, rr); }));
      if (canFly) for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]]) {
        const nc = c + dc, nr = r + dr;
        if (solid(nc, nr) || deadly(nc, nr)) continue;
        // flying through open squares: follow them until something to stand on
        const stack = [[nc, nr]], air = new Set();
        while (stack.length) {
          const [x, y] = stack.pop(), k = key(x, y);
          if (air.has(k) || solid(x, y) || deadly(x, y) || x < 0 || x > 25 || y < 0 || y > 15) continue;
          air.add(k); touched.add(k);
          if (held(x, y)) visit(x, y);
          else for (const [a, b] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) stack.push([x + a, y + b]);
        }
      }
    }
    if (!changed) break;
  }
  const missing = [];
  m.forEach((row, r) => row.forEach((ch, c) => { if (ch === 't' && !touched.has(key(c, r))) missing.push(`treat at row ${r} col ${c}`); }));
  const home = seen.has(key(mouse[0], mouse[1] + 1)) || seen.has(key(mouse[0] + 1, mouse[1] + 1));
  if (!home) missing.push('the mouse');
  const treats = L.map.join('').split('t').length - 1;
  console.log(`${n + 1}. ${L.name}: ${treats} treats${canFly ? ', yarn reachable' : ''}${missing.length ? '  CANNOT REACH: ' + missing.join(', ') : '  ok'}`);
  if (missing.length) failed = true;
});
process.exit(failed ? 1 : 0);
