// Checks every level can be finished: each treat and the mouse can be reached from the start, and
// the cat can never get stuck where it can no longer reach them (behind a cat flap, say, or with the
// light switch the wrong way and no way back to it).
// It moves the cat a whole square at a time (walk, fall, climb, a short hop, swipe a box, press a
// button, pick up a key, use a tunnel, flip the light switch, and fly anywhere open once a yarn ball
// has been reached), so it is a little kinder than the real game. Each place the cat can be is a
// square plus what it has done so far: keys, buttons, yarn and which way the switch is.
// With --needs it also says which keys, buttons, switches and yarn balls a level can't be finished without.
// usage: node tools/check-levels.js [level number] [--needs]
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../levels.js'), 'utf8') + ';this.MAPS = MAPS;', ctx);

const only = +process.argv.find((a) => +a) || 0, needs = process.argv.includes('--needs');
let failed = false;
ctx.MAPS.forEach((L, n) => {
  if (only && n + 1 !== only) return;
  const { problems, size, canFly, treatCount } = check(L.map);
  let need = '';
  if (needs && !problems.length) {
    const names = { r: 'red key', o: 'gold key', p: 'purple key', 1: 'button 1', 2: 'button 2', 3: 'button 3', s: 'switch', y: 'yarn', Y: 'big yarn', B: 'boxes', T: 'tunnel T', U: 'tunnel U', V: 'tunnel V', W: 'tunnel W', X: 'tunnel X', Z: 'tunnel Z' };
    const used = Object.keys(names).filter((ch) => L.map.join('').includes(ch));
    const must = used.filter((ch) => check(L.map.map((row) => row.split(ch).join(ch === 'B' ? '#' : '.'))).problems.some((p) => p.startsWith('CANNOT')));
    need = `\n     needs: ${must.map((ch) => names[ch]).join(', ') || 'nothing'}`;
  }
  console.log(`${n + 1}. ${L.name}: ${treatCount} treats, ${size} places${canFly ? ', yarn reachable' : ''}${problems.length ? '  ' + problems.join(', ') : '  ok'}${need}`);
  if (problems.length) failed = true;
});
process.exit(failed ? 1 : 0);

function check(map) {
  const m = map.map((row) => [...row]);
  const at = (c, r) => (c < 0 || c > 25 || r < 0 || r > 15 ? '#' : m[r][c]);
  const cell = (c, r) => r * 26 + c;
  const removed = new Set();
  // state bits: 1 switch flipped, 2 4 8 keys, 16 32 64 buttons, 128 yarn
  const solid = (c, r, st) => {
    const ch = at(c, r);
    if (removed.has(cell(c, r))) return false;
    if ('wvu'.includes(ch)) return !(st & (16 << 'wvu'.indexOf(ch)));
    if ('456'.includes(ch)) return !(st & (2 << '456'.indexOf(ch)));
    if (ch === '*') return !(st & 1);
    if (ch === '+') return !!(st & 1);
    return '#B~_<>'.includes(ch);
  };
  const post = (c, r) => at(c, r) === 'H';
  const deadly = (c, r) => at(c, r) === '^';
  const held = (c, r, st) => solid(c, r + 1, st) || post(c, r + 1) || post(c, r);
  // a cat flap ")" lets the cat through going right only, "(" going left only
  const flapStops = (c, r, d) => (d < 0 ? at(c, r) === ')' || at(c - 1, r) === ')' : at(c, r) === '(' || at(c + 1, r) === '(');
  let start, mouse;
  m.forEach((row, r) => row.forEach((ch, c) => { if (ch === 'C') start = [c, r]; if (ch === 'M' && !mouse) mouse = [c, r]; }));
  const problems = [];
  // the switch must not be right next to a pink or mint block, or flipping it could shut the cat inside one
  m.forEach((row, r) => row.forEach((ch, c) => {
    if (ch !== 's') return;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if ('*+'.includes(at(c + a, r + b))) problems.push(`switch at row ${r} col ${c} is touching a block it swaps`);
  }));

  let nodes, edges, touches, stands;
  for (let round = 0; round < 50; round++) {
    nodes = new Map(); edges = []; touches = []; stands = [];
    const queue = [];
    let changed = false;
    // arrive at a square: fall until something holds the cat, pick up what is there, flip the switch
    const visit = (c, r, st, from, touched) => {
      if (solid(c, r, st) || deadly(c, r)) return;
      while (!held(c, r, st) && !solid(c, r + 1, st) && r < 15) {
        touched.add(cell(c, r)); r++;
        if (deadly(c, r)) return;
        if ('yY'.includes(at(c, r))) st |= 128;
        if ('rop'.includes(at(c, r))) st |= 2 << 'rop'.indexOf(at(c, r));
      }
      const ch = at(c, r);
      if ('yY'.includes(ch)) st |= 128;
      if ('rop'.includes(ch)) st |= 2 << 'rop'.indexOf(ch);
      if ('123'.includes(ch)) st |= 16 << '123'.indexOf(ch);
      if (ch === 's' && (from < 0 || from % 416 !== cell(c, r))) st ^= 1;
      add(c, r, st, from, touched);
    };
    const add = (c, r, st, from, touched) => {
      const id = st * 416 + cell(c, r);
      touched.add(cell(c, r));
      if (from >= 0) edges[from].add(id);
      if (!nodes.has(id)) { nodes.set(id, [c, r, st]); edges[id] = new Set(); queue.push(id); }
    };
    visit(start[0], start[1], 0, -1, new Set());
    while (queue.length) {
      const id = queue.shift();
      const [c, r, st] = nodes.get(id);
      const t = new Set([cell(c, r)]);
      const go = (cc, rr) => visit(cc, rr, st, id, t);
      for (const d of [-1, 1]) {
        if (!flapStops(c, r, d)) go(c + d, r);
        // a hop: up one square and over, or across a gap of up to two
        if (!solid(c, r - 1, st)) {
          t.add(cell(c, r - 1));
          if (!solid(c + d, r - 1, st) && !flapStops(c, r - 1, d)) {
            go(c + d, r - 1);
            if (!solid(c + 2 * d, r - 1, st) && !flapStops(c + d, r - 1, d)) {
              go(c + 2 * d, r - 1); go(c + 2 * d, r);
              if (!solid(c + 3 * d, r - 1, st) && !flapStops(c + 2 * d, r - 1, d)) go(c + 3 * d, r);
            }
          }
        }
        // swipe a box beside
        if (at(c + d, r) === 'B' && !removed.has(cell(c + d, r))) { removed.add(cell(c + d, r)); changed = true; }
      }
      // a box underfoot is swiped to drop through it; it stays in the map for every other route,
      // because a hole in a floor can cut off the squares beside it
      if (at(c, r + 1) === 'B' && !removed.has(cell(c, r + 1))) { t.add(cell(c, r + 1)); if (!solid(c, r + 2, st)) go(c, r + 2); }
      if (post(c, r) && at(c, r - 1) === 'B' && !removed.has(cell(c, r - 1))) { removed.add(cell(c, r - 1)); changed = true; }
      if (post(c, r) || post(c, r + 1)) { if (!solid(c, r - 1, st) && post(c, r)) go(c, r - 1); if (post(c, r + 1)) go(c, r + 1); }
      if ('TUVWXZ'.includes(at(c, r))) m.forEach((row, rr) => row.forEach((x, cc) => { if (x === at(c, r) && (cc !== c || rr !== r)) go(cc, rr); }));
      // standing on the switch, a jump straight up and down flips it again
      if (at(c, r) === 's' && !solid(c, r - 1, st)) add(c, r, st ^ 1, id, t);
      if (st & 128) for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]]) {
        const nc = c + dc, nr = r + dr;
        if (solid(nc, nr, st) || deadly(nc, nr) || (dc && flapStops(c, dr ? nr : r, dc))) continue;
        // flying through open squares: follow them until something to stand on
        const stack = [[nc, nr]], air = new Set();
        while (stack.length) {
          const [x, y] = stack.pop(), k = cell(x, y);
          if (air.has(k) || x < 0 || x > 25 || y < 0 || y > 15 || solid(x, y, st) || deadly(x, y)) continue;
          air.add(k); t.add(k);
          if (held(x, y, st)) go(x, y);
          else for (const [a, b] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) if (!a || !flapStops(x, y, a)) stack.push([x + a, y + b]);
        }
      }
      touches[id] = t;
      stands[id] = cell(c, r);
    }
    if (!changed) break;
  }

  // Everything the cat can touch from each place: group the places it can go back and forth between
  // (Tarjan), then add up what each group can reach.
  const treats = [];
  m.forEach((row, r) => row.forEach((ch, c) => { if (ch === 't') treats.push(cell(c, r)); }));
  const home = [cell(mouse[0], mouse[1] + 1), cell(mouse[0] + 1, mouse[1] + 1)];
  const ids = [...nodes.keys()], index = new Map(), low = new Map(), onStack = new Set(), stack = [], group = new Map(), groups = [];
  let counter = 0;
  for (const root of ids) {
    if (index.has(root)) continue;
    const work = [[root, 0]];
    index.set(root, counter); low.set(root, counter); counter++; stack.push(root); onStack.add(root);
    while (work.length) {
      const top = work[work.length - 1], [v] = top, out = [...edges[v]];
      if (top[1] < out.length) {
        const w = out[top[1]++];
        if (!index.has(w)) { index.set(w, counter); low.set(w, counter); counter++; stack.push(w); onStack.add(w); work.push([w, 0]); }
        else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)));
      } else {
        work.pop();
        if (work.length) { const u = work[work.length - 1][0]; low.set(u, Math.min(low.get(u), low.get(v))); }
        if (low.get(v) === index.get(v)) {
          const members = [];
          let w;
          do { w = stack.pop(); onStack.delete(w); group.set(w, groups.length); members.push(w); } while (w !== v);
          groups.push(members);
        }
      }
    }
  }
  // Tarjan finishes a group only after every group it leads to, so one pass in that order adds them up
  const reachT = [], reachS = [];
  groups.forEach((members, g) => {
    const t = new Set(), s = new Set();
    for (const v of members) {
      touches[v].forEach((k) => t.add(k)); s.add(stands[v]);
      for (const w of edges[v]) { const h = group.get(w); if (h !== g) { reachT[h].forEach((k) => t.add(k)); reachS[h].forEach((k) => s.add(k)); } }
    }
    reachT[g] = t; reachS[g] = s;
  });
  const startGroup = group.get(ids[0]);
  for (const k of treats) if (!reachT[startGroup].has(k)) problems.push(`CANNOT REACH treat at row ${Math.floor(k / 26)} col ${k % 26}`);
  if (!home.some((k) => reachS[startGroup].has(k))) problems.push('CANNOT REACH the mouse');
  if (!problems.length) {
    const stuck = new Set();
    for (const [id, [c, r, st]] of nodes) {
      const g = group.get(id);
      if (treats.every((k) => reachT[g].has(k)) && home.some((k) => reachS[g].has(k))) continue;
      const k = `row ${r} col ${c}`;
      if (!stuck.has(k)) stuck.add(k);
    }
    if (stuck.size) problems.push(`STUCK: the cat can get to ${[...stuck].slice(0, 4).join('; ')}${stuck.size > 4 ? ` and ${stuck.size - 4} more` : ''} and then cannot finish`);
  }
  return { problems, size: nodes.size, canFly: [...nodes.values()].some(([, , st]) => st & 128), treatCount: treats.length };
}
