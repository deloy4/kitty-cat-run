// For every cactus pot on ice, starts the cat on each square it could be standing on beside the pot,
// slides it at the pot, and tries every moment to jump. Prints how many frames of jump timing get the
// cat safely over; 0 means there is no way past from that square.
// usage: node tools/ice-jumps.js [level number]
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..');
const ctx = { console, Math, Date, JSON, Set, Uint8Array, localStorage: { getItem: () => null, setItem() {} },
  window: { addEventListener() {} }, document: { addEventListener() {}, hidden: false } };
vm.createContext(ctx);
for (const f of ['levels.js', 'art.js', 'game.js']) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
vm.runInContext('this.MAPS = MAPS', ctx);
const only = +process.argv[2] || 0;
const run = (code) => vm.runInContext(code, ctx);

function attempt(lvl, c, r, d, jumpAt, goal) {
  run(`srand(1); G.level = ${lvl}; loadLevel(); G.screen = 'play'; G.monsters = []; G.pickups = [];
    S.x = S.pxPrev = ${c + 1} * U; S.y = S.pyPrev = ${r + 1} * U; held.clear(); held.add('${d > 0 ? 'ArrowRight' : 'ArrowLeft'}');`);
  for (let f = 0; f < 160; f++) {
    if (f === jumpAt) run("held.add('Space')");
    if (f === jumpAt + 14) run("held.delete('Space')");
    run('if (G.screen === "play") step()');
    const s = run('({ x: S.x / U - 1, dying: S.dying, screen: G.screen })');
    if (s.dying || s.screen !== 'play') return false;
    if ((s.x - goal) * d > 0) return true;
  }
  return false;
}

let worst = Infinity;
run('MAPS').forEach((L, lvl) => {
  if ((only && lvl + 1 !== only) || (!only && lvl < 30)) return;
  const at = (c, r) => (c < 0 || c > 25 || r < 0 || r > 15 ? '#' : L.map[r][c]);
  const solid = (ch) => '#B~_<>456*wvu'.includes(ch);
  L.map.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch !== '^' || at(c, r + 1) !== '~') return;
    for (const d of [1, -1]) {
      const results = [];
      for (let k = 1; k <= 6; k++) {
        const sc = c - d * k;
        if (solid(at(sc, r)) || at(sc, r) === '^' || !solid(at(sc, r + 1))) break;
        // past the pot means a square and a half beyond it, or against whatever stops the cat there
        let goal = c + d * 1.5;
        if (solid(at(c + d, r)) || solid(at(c + 2 * d, r))) continue;
        let good = 0;
        for (let j = 0; j < 60; j++) if (attempt(lvl, sc, r, d, j, goal)) good++;
        results.push(`${k} away: ${good}`);
        worst = Math.min(worst, good);
      }
      if (results.length) console.log(`${lvl + 1}. ${L.name}, pot at row ${r} col ${c}, going ${d > 0 ? 'right' : 'left'}: ${results.join(', ')}`);
    }
  }));
});
console.log(`fewest good jump frames from any square: ${worst}`);
