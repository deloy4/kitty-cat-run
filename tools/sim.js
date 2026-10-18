// Runs the game with no screen and a key script, printing where the cat is.
// usage: node tools/sim.js <level 1-10> "frames:keys,frames:keys,..." [f]
// keys are any of L R U D J S (left, right, up, down, jump/fly, swipe); f fills the yarn meter first.
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..');
const ctx = { console, Math, Date, JSON, Set, Uint8Array, localStorage: { getItem: () => null, setItem() {} },
  window: { addEventListener() {} }, document: { addEventListener() {}, hidden: false } };
vm.createContext(ctx);
for (const f of ['levels.js', 'art.js', 'game.js']) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
const [lvl, script = '', ...flags] = process.argv.slice(2);
vm.runInContext(`srand(1); G.level = ${(+lvl || 1) - 1}; loadLevel(); G.screen = 'play'; G.monsters = ${flags.includes('m') ? 'G.monsters' : '[]'};`, ctx);
if (flags.includes('f')) vm.runInContext('S.fuel = 10000', ctx);
const map = { L: 'ArrowLeft', R: 'ArrowRight', U: 'ArrowUp', D: 'ArrowDown', J: 'Space', S: 'KeyX' };
let n = 0;
for (const part of script.split(',').filter(Boolean)) {
  const [frames, keys = ''] = part.split(':');
  vm.runInContext('held.clear()', ctx);
  for (const k of keys) vm.runInContext(`held.add('${map[k]}')`, ctx);
  for (let i = 0; i < +frames; i++) { vm.runInContext('if (G.screen === "play") step()', ctx); n++; }
  const s = vm.runInContext('({x: S.x, y: S.y, fuel: S.fuel, screen: G.screen, gifts: G.gifts, total: G.giftsTotal, pressed: G.pressed.join(""), dying: S.dying})', ctx);
  console.log(String(n).padStart(4), `${keys.padEnd(3)} col=${((s.x / 384) - 1).toFixed(2)} row=${((s.y / 384) - 1).toFixed(2)} fuel=${s.fuel} treats=${s.gifts}/${s.total} ${s.screen}${s.dying ? ' caught' : ''} pressed=${s.pressed}`);
}
