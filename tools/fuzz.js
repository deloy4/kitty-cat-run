// Random play on every level with no screen, checking nothing throws and the cat stays in the map.
// usage: node tools/fuzz.js [frames per level]
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..');
const ctx = { console, Math, Date, JSON, Set, Uint8Array, localStorage: { getItem: () => null, setItem() {} },
  window: { addEventListener() {} }, document: { addEventListener() {}, hidden: false } };
vm.createContext(ctx);
for (const f of ['levels.js', 'art.js', 'game.js']) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyX'];
let rs = 7; const r = () => (rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const frames = +process.argv[2] || 30000;
const count = vm.runInContext('LEVELS.length', ctx);
for (let lvl = 0; lvl < count; lvl++) {
  const st = { caught: {}, treats: 0, boxes: 0, tunnels: 0, buttons: 0, wins: 0 };
  vm.runInContext(`srand(${lvl + 1}); G.level = ${lvl}; loadLevel(); G.screen = 'play'; S.fuel = 10000;`, ctx);
  for (let f = 0; f < frames; f++) {
    if (f % 15 === 0) {
      vm.runInContext('held.clear()', ctx);
      for (const k of keys) if (r() < (k === 'Space' ? 0.3 : k === 'KeyX' ? 0.15 : 0.3)) vm.runInContext(`held.add('${k}')`, ctx);
    }
    const b = vm.runInContext('({tp: S.teleport, digs: G.digs.length, gifts: G.gifts, pressed: G.pressed.filter(Boolean).length})', ctx);
    vm.runInContext('step()', ctx);
    const s = vm.runInContext('({x: S.x, y: S.y, screen: G.screen, tp: S.teleport, digs: G.digs.length, gifts: G.gifts, cause: S.cause, pressed: G.pressed.filter(Boolean).length})', ctx);
    if (s.tp && !b.tp) st.tunnels++;
    if (s.digs > b.digs) st.boxes++;
    if (s.pressed > b.pressed) st.buttons++;
    if (s.gifts > b.gifts) st.treats++;
    if (s.x < 0 || s.y < 0 || s.x > 27 * 384 || s.y > 17 * 384) throw new Error(`level ${lvl + 1} frame ${f}: the cat left the map at ${s.x},${s.y}`);
    if (s.screen !== 'play') {
      if (s.screen === 'bonus') st.wins++; else st.caught[s.cause] = (st.caught[s.cause] || 0) + 1;
      vm.runInContext(`G.screen = 'play'; G.level = ${lvl}; loadLevel(); S.fuel = 10000;`, ctx);
    }
  }
  console.log(`level ${lvl + 1}:`, JSON.stringify(st));
}
