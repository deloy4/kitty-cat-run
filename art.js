// Art for Kitty Cat Run. Everything is drawn with canvas paths in map pixels (a square is 12 x 12),
// so the caller scales the context and the shapes stay smooth at any size. The look follows a soft,
// pastel kitten: big eyes, pink nose and ears, rounded shapes, no hard outlines.

const T = 12;

// ---------- the cats and mice, one of each per level, in this order ----------

const CATS = [
  { name: 'Pumpkin', kind: 'an orange tabby', pattern: 'tabby', base: '#f4a95a', shade: '#d9823c', light: '#ffd9ac', stripe: '#c8692b',
    belly: '#fff0dc', paw: '#ffe4c4', ear: '#f7b3ae', nose: '#ef8b98', eye: '#9fd36b' },
  { name: 'Smokey', kind: 'a grey tabby', pattern: 'tabby', base: '#aab0bb', shade: '#848b97', light: '#dadee5', stripe: '#6b717d',
    belly: '#f0f2f5', paw: '#e9ecf0', ear: '#f2b6bb', nose: '#e88c9a', eye: '#f2c443' },
  { name: 'Midnight', kind: 'a black cat', pattern: 'solid', base: '#3b3742', shade: '#26232b', light: '#5f5a69', stripe: '#26232b',
    belly: '#46414e', paw: '#4a4552', ear: '#c98a98', nose: '#d07f8f', eye: '#ffd23a' },
  { name: 'Snowball', kind: 'a white cat', pattern: 'solid', base: '#fbf9f6', shade: '#ddd7cf', light: '#ffffff', stripe: '#ddd7cf',
    belly: '#ffffff', paw: '#ffffff', ear: '#f8b9c4', nose: '#f39aab', eye: '#7cc4ef' },
  { name: 'Tux', kind: 'a tuxedo cat', pattern: 'tuxedo', base: '#36333c', shade: '#232026', light: '#59546160', stripe: '#232026',
    belly: '#fbfaf8', paw: '#fbfaf8', ear: '#d896a3', nose: '#ee9aa8', eye: '#9be27a', muzzle: '#fbfaf8' },
  { name: 'Patches', kind: 'a calico', pattern: 'calico', base: '#fbf5ec', shade: '#e3d8c8', light: '#ffffff', stripe: '#4a4048',
    patch: '#f0a050', belly: '#ffffff', paw: '#ffffff', ear: '#f6b2b8', nose: '#ef93a3', eye: '#f2b33a' },
  { name: 'Butterscotch', kind: 'a cream cat', pattern: 'tabby', base: '#f6ddb2', shade: '#e2bf8a', light: '#fff1d8', stripe: '#e3b878',
    belly: '#fffaf0', paw: '#fff4e2', ear: '#f6b8b0', nose: '#ef9aa0', eye: '#e8a040' },
  { name: 'Cocoa', kind: 'a brown tabby', pattern: 'tabby', base: '#a77d55', shade: '#7e5b3a', light: '#d2ad85', stripe: '#4f3522',
    belly: '#eedcc2', paw: '#e6d2b6', ear: '#e8a7a4', nose: '#d98a90', eye: '#bcd35e' },
  { name: 'Luna', kind: 'a Siamese', pattern: 'pointed', base: '#f4e8d4', shade: '#dccab0', light: '#fffaf0', stripe: '#5b4232',
    belly: '#fffaf2', paw: '#5b4232', ear: '#8a6a58', nose: '#7a5a50', eye: '#5aa8f0', leg: '#6d5040', legFar: '#4d3628', tail: '#5b4232' },
  { name: 'Candy', kind: 'a candy-striped kitten', pattern: 'candy', base: '#fdfbfb', shade: '#e6e1e6', light: '#ffffff', stripe: '#f2a3b4',
    stripe2: '#a6d6ea', belly: '#ffffff', paw: '#ffffff', ear: '#f5aebd', nose: '#f19bb0', eye: '#68b6e2' },
  { name: 'Ginger', kind: 'an orange and white cat', pattern: 'tuxedo', base: '#f2a04e', shade: '#d27f34', light: '#ffd3a0', stripe: '#c76a28',
    belly: '#fffaf4', paw: '#fffaf4', ear: '#f6b2ac', nose: '#ef8a98', eye: '#8fd06a', muzzle: '#fffaf4' },
  { name: 'Bluebell', kind: 'a Russian Blue', pattern: 'solid', base: '#8d9bb0', shade: '#6c7a90', light: '#b6c2d4', stripe: '#6c7a90',
    belly: '#a3b0c3', paw: '#9eabbe', ear: '#d8a6b4', nose: '#9a8aa0', eye: '#7fd36a' },
  { name: 'Tortie', kind: 'a tortoiseshell', pattern: 'calico', base: '#3d3238', shade: '#2a2226', light: '#5e4c54', stripe: '#8a5430',
    patch: '#d77a34', belly: '#4a3c42', paw: '#4a3c42', ear: '#c88a96', nose: '#c27a88', eye: '#f0b030' },
  { name: 'Silver', kind: 'a silver tabby', pattern: 'tabby', base: '#d3d8de', shade: '#aab1ba', light: '#f2f4f7', stripe: '#4c535c',
    belly: '#f6f7f9', paw: '#eef0f3', ear: '#f3b6be', nose: '#e98d9c', eye: '#8fd06a' },
  { name: 'Socks', kind: 'a grey and white cat', pattern: 'tuxedo', base: '#8f939c', shade: '#6e737c', light: '#b7bbc3', stripe: '#6e737c',
    belly: '#ffffff', paw: '#ffffff', ear: '#f2b2bc', nose: '#ee93a6', eye: '#f2c443', muzzle: '#ffffff' },
  { name: 'Mocha', kind: 'a chocolate cat', pattern: 'solid', base: '#7a5240', shade: '#5a3a2c', light: '#a07462', stripe: '#5a3a2c',
    belly: '#8a6050', paw: '#8a6050', ear: '#c78e90', nose: '#b07a7c', eye: '#e8a040' },
  { name: 'Sunny', kind: 'a flame point Siamese', pattern: 'pointed', base: '#fbf1e2', shade: '#e6d6bc', light: '#ffffff', stripe: '#e08a4a',
    belly: '#fffaf2', paw: '#e89a5c', ear: '#e8a07a', nose: '#e8908c', eye: '#5aa8f0', leg: '#eaa266', legFar: '#c87a40', tail: '#e08a4a' },
  { name: 'Domino', kind: 'a black and white cat', pattern: 'calico', base: '#fbfaf8', shade: '#e0dcd6', light: '#ffffff', stripe: '#2e2a32',
    patch: '#2e2a32', belly: '#ffffff', paw: '#ffffff', ear: '#f4b2bc', nose: '#ee93a6', eye: '#9be27a' },
  { name: 'Lilac', kind: 'a lilac cat', pattern: 'solid', base: '#cfc2c8', shade: '#b0a2aa', light: '#ebe2e6', stripe: '#b0a2aa',
    belly: '#e2d8dc', paw: '#e2d8dc', ear: '#f2b8c6', nose: '#e8a0b4', eye: '#e8b040' },
  { name: 'Sprinkles', kind: 'a rainbow-striped kitten', pattern: 'candy', base: '#fdfbff', shade: '#e6e1ee', light: '#ffffff', stripe: '#c9b2f2',
    stripe2: '#a8e6c8', belly: '#ffffff', paw: '#ffffff', ear: '#f5aebd', nose: '#f19bb0', eye: '#9a7ae0' },
  { name: 'Cinnamon', kind: 'a cinnamon tabby', pattern: 'tabby', base: '#c9825a', shade: '#a6623e', light: '#e8b08c', stripe: '#86452a',
    belly: '#f6e2d0', paw: '#f0d6c0', ear: '#f0a8a4', nose: '#e08890', eye: '#8fd06a' },
  { name: 'Peaches', kind: 'a peach and white cat', pattern: 'tuxedo', base: '#f6c09a', shade: '#e09e76', light: '#ffdcc4', stripe: '#d88c64',
    belly: '#fffaf6', paw: '#fffaf6', ear: '#f8b4b4', nose: '#f090a0', eye: '#68b6e2', muzzle: '#fffaf6' },
  { name: 'Frost', kind: 'a blue point Siamese', pattern: 'pointed', base: '#f2f2f6', shade: '#d6d8e2', light: '#ffffff', stripe: '#7c8698',
    belly: '#fafbfd', paw: '#7c8698', ear: '#8a94a8', nose: '#8a8ea0', eye: '#4aa0f0', leg: '#8a94a6', legFar: '#646e82', tail: '#7c8698' },
  { name: 'Pepper', kind: 'a dark grey tabby', pattern: 'tabby', base: '#6e6c74', shade: '#54525a', light: '#96949c', stripe: '#36343a',
    belly: '#c8c6cc', paw: '#bcbac0', ear: '#d8a0aa', nose: '#c88894', eye: '#e8c040' },
  { name: 'Maple', kind: 'a maple calico', pattern: 'calico', base: '#f8eedc', shade: '#e2d2b8', light: '#ffffff', stripe: '#5a3a28',
    patch: '#c0703a', belly: '#ffffff', paw: '#ffffff', ear: '#f4b0b0', nose: '#e8909c', eye: '#9ac860' },
  { name: 'Biscuit', kind: 'a fawn cat', pattern: 'solid', base: '#e2c4a4', shade: '#c8a684', light: '#f4dcc4', stripe: '#c8a684',
    belly: '#f2e2d0', paw: '#f2e2d0', ear: '#f2b4b0', nose: '#e49a9c', eye: '#7cc4ef' },
  { name: 'Clover', kind: 'a soft grey calico', pattern: 'calico', base: '#fbf7f2', shade: '#e4ddd4', light: '#ffffff', stripe: '#8e96a6',
    patch: '#e8c49c', belly: '#ffffff', paw: '#ffffff', ear: '#f6b6c0', nose: '#ee98a8', eye: '#8fd06a' },
  { name: 'Hazel', kind: 'a golden tabby', pattern: 'tabby', base: '#e6b866', shade: '#c89644', light: '#f8d898', stripe: '#a87428',
    belly: '#fff4dc', paw: '#fcecd0', ear: '#f4b2a8', nose: '#e8909a', eye: '#5aa8f0' },
  { name: 'Mittens', kind: 'a brown and white cat', pattern: 'tuxedo', base: '#8a6448', shade: '#6a4a32', light: '#b08a6c', stripe: '#6a4a32',
    belly: '#fffaf4', paw: '#fffaf4', ear: '#e8a8a8', nose: '#e0909c', eye: '#9be27a', muzzle: '#fffaf4' },
  { name: 'Twinkle', kind: 'a lemon and sky striped kitten', pattern: 'candy', base: '#fffdf6', shade: '#ece6da', light: '#ffffff', stripe: '#ffd86a',
    stripe2: '#96d2f4', belly: '#ffffff', paw: '#ffffff', ear: '#f5aebd', nose: '#f19bb0', eye: '#f2a43a' },
];

const MICE = [
  { name: 'grey', fur: '#a9a9b3', shade: '#878791', belly: '#dcdce2' },
  { name: 'brown', fur: '#a07656', shade: '#7c573c', belly: '#dcc2a8' },
  { name: 'white', fur: '#f7f5f2', shade: '#dcd7d0', belly: '#ffffff' },
  { name: 'tan', fur: '#d9b98c', shade: '#b8966a', belly: '#f3e4cc' },
  { name: 'charcoal', fur: '#5e5b63', shade: '#45424a', belly: '#8f8b94' },
  { name: 'fawn', fur: '#e2c09a', shade: '#c49e76', belly: '#f6e8d6' },
  { name: 'cinnamon', fur: '#c07a4c', shade: '#9a5a32', belly: '#ecc9a8' },
  { name: 'silver', fur: '#c9ccd3', shade: '#a6aab3', belly: '#eceef2' },
  { name: 'chocolate', fur: '#7a5038', shade: '#5a3826', belly: '#c4a088' },
  { name: 'cream', fur: '#f3e3c3', shade: '#dcc69e', belly: '#fffaf0' },
  { name: 'agouti', fur: '#8c7656', shade: '#6c5838', belly: '#cdbb9c' },
  { name: 'lilac', fur: '#b9aab8', shade: '#9a8a98', belly: '#e2d8e0' },
  { name: 'champagne', fur: '#e9d6b2', shade: '#cdb88e', belly: '#fbf1de' },
  { name: 'blue', fur: '#7f8aa0', shade: '#626c82', belly: '#b8c0d0' },
  { name: 'black', fur: '#3f3a42', shade: '#2a262c', belly: '#6a646e' },
  { name: 'dove', fur: '#c9bdb6', shade: '#aa9e96', belly: '#ece4de' },
  { name: 'ivory', fur: '#fff8e8', shade: '#e8dcc4', belly: '#ffffff' },
  { name: 'smoke', fur: '#8e8e98', shade: '#70707a', belly: '#c4c4cc' },
  { name: 'honey', fur: '#d9a860', shade: '#b88a42', belly: '#f2d8a8' },
  { name: 'pearl', fur: '#e4e2ec', shade: '#c6c4d0', belly: '#f8f7fb' },
  { name: 'russet', fur: '#b0663e', shade: '#8c4c2a', belly: '#e6c0a4' },
  { name: 'snow', fur: '#ffffff', shade: '#e4e4ea', belly: '#ffffff' },
  { name: 'ash', fur: '#9c9692', shade: '#7c7672', belly: '#d6d0cc' },
  { name: 'caramel', fur: '#c89458', shade: '#a6743a', belly: '#f0d6b0' },
  { name: 'peach', fur: '#f0c0a0', shade: '#d6a080', belly: '#fde6d8' },
  { name: 'slate', fur: '#6e7684', shade: '#545c6a', belly: '#a8aebb' },
  { name: 'butter', fur: '#f4dc98', shade: '#d8be74', belly: '#fff4d4' },
  { name: 'mink', fur: '#8e7464', shade: '#6e5646', belly: '#cbb6a8' },
  { name: 'rose', fur: '#e6c0c4', shade: '#c8a0a6', belly: '#f8e4e6' },
  { name: 'sable', fur: '#5a4438', shade: '#422e24', belly: '#968070' },
];

// The room behind each level: wallpaper, then the colour and kind of the walls and floors.
const THEMES = [
  { bg: ['#fff6e8', '#f8e4c8'], paper: 'checks', ink: 'rgba(236, 160, 120, 0.13)', block: ['#b8def4', '#8cc2e6', '#5f98c4'], kind: 'tile' },
  { bg: ['#eefaf2', '#d6efe0'], paper: 'stripes', ink: 'rgba(120, 190, 150, 0.16)', block: ['#e2b07a', '#c08850', '#8e6034'], kind: 'wood' },
  { bg: ['#f4f0ff', '#e2dcf6'], paper: 'dots', ink: 'rgba(160, 140, 220, 0.18)', block: ['#fafafd', '#d9dae6', '#a9abc0'], kind: 'tile' },
  { bg: ['#e8f9fb', '#cdeef2'], paper: 'tiles', ink: 'rgba(110, 190, 205, 0.22)', block: ['#fcc7d4', '#ef9fb4', '#cd7690'], kind: 'tile' },
  { bg: ['#cdebff', '#e8f8ff'], paper: 'sky', ink: 'rgba(255, 255, 255, 0.85)', block: ['#a6e07c', '#6fbd4e', '#468f34'], kind: 'hedge' },
  { bg: ['#fffbe2', '#fff0b8'], paper: 'dots', ink: 'rgba(255, 170, 90, 0.2)', block: ['#ffd27a', '#f6a94e', '#cf7f2e'], kind: 'toy' },
  { bg: ['#f0dcc4', '#d8bc9a'], paper: 'boards', ink: 'rgba(120, 80, 40, 0.18)', block: ['#c99a6a', '#a3734a', '#76502e'], kind: 'wood' },
  { bg: ['#e6ecf2', '#cdd6e0'], paper: 'brick', ink: 'rgba(120, 135, 160, 0.2)', block: ['#d5d9e0', '#b0b6c0', '#868d99'], kind: 'concrete' },
  { bg: ['#2c3466', '#4a3f7e'], paper: 'stars', ink: 'rgba(255, 246, 200, 0.85)', block: ['#d6c6f6', '#b19ce6', '#8770c4'], kind: 'pillow' },
  { bg: ['#fff0e6', '#fbd9c4'], paper: 'stripes', ink: 'rgba(240, 150, 130, 0.14)', block: ['#f7cc94', '#e6a866', '#bb8040'], kind: 'wood' },
  { bg: ['#fffae6', '#f6e8c0'], paper: 'checks', ink: 'rgba(220, 170, 90, 0.14)', block: ['#e8c08a', '#cf9c5e', '#a07038'], kind: 'wood' },
  { bg: ['#fffde8', '#fff3c4'], paper: 'stripes', ink: 'rgba(255, 200, 90, 0.18)', block: ['#ffffff', '#e6e8ee', '#b8bcc8'], kind: 'tile' },
  { bg: ['#f3e8dc', '#e0ceb8'], paper: 'boards', ink: 'rgba(110, 70, 40, 0.15)', block: ['#b4704e', '#8e5034', '#62341e'], kind: 'wood' },
  { bg: ['#f6efff', '#e6dafc'], paper: 'dots', ink: 'rgba(150, 110, 220, 0.16)', block: ['#5a5468', '#36323f', '#1e1c28'], kind: 'tile' },
  { bg: ['#e2f7ec', '#f4fff6'], paper: 'sky', ink: 'rgba(255, 255, 255, 0.85)', block: ['#b8e890', '#86c860', '#5a9e3e'], kind: 'hedge' },
  { bg: ['#fff1f6', '#ffe0ec'], paper: 'dots', ink: 'rgba(255, 120, 170, 0.16)', block: ['#ffd27a', '#f6a94e', '#cf7f2e'], kind: 'toy' },
  { bg: ['#e2e6ee', '#c8cfdc'], paper: 'brick', ink: 'rgba(100, 110, 140, 0.22)', block: ['#c0c4cc', '#9aa0aa', '#737a86'], kind: 'concrete' },
  { bg: ['#d6f0ff', '#f0faff'], paper: 'sky', ink: 'rgba(255, 255, 255, 0.9)', block: ['#c48e5a', '#9c683a', '#6e4422'], kind: 'wood' },
  { bg: ['#cfe4f8', '#eaf4ff'], paper: 'snow', ink: 'rgba(255, 255, 255, 0.95)', block: ['#ffffff', '#e4eef8', '#b8cce0'], kind: 'pillow' },
  { bg: ['#ffd9b8', '#ffc0cc'], paper: 'sky', ink: 'rgba(255, 255, 255, 0.7)', block: ['#f09a8a', '#d06e5c', '#9e4636'], kind: 'tile' },
  { bg: ['#fdf3e7', '#f3dfc6'], paper: 'stripes', ink: 'rgba(200, 140, 100, 0.14)', block: ['#d9b48a', '#b88a5c', '#8a6038'], kind: 'wood' },
  { bg: ['#eef4ea', '#d8e6d0'], paper: 'brick', ink: 'rgba(110, 140, 100, 0.2)', block: ['#c8d0c0', '#a2ac98', '#78826e'], kind: 'concrete' },
  { bg: ['#f6eefa', '#e6d8f0'], paper: 'dots', ink: 'rgba(170, 120, 200, 0.16)', block: ['#f4e6d0', '#dcc4a0', '#b09870'], kind: 'wood' },
  { bg: ['#fff4ec', '#f6dccb'], paper: 'checks', ink: 'rgba(200, 110, 110, 0.12)', block: ['#c8806a', '#a45e4a', '#7a3e30'], kind: 'wood' },
  { bg: ['#283058', '#3e3670'], paper: 'stars', ink: 'rgba(255, 240, 210, 0.85)', block: ['#c6d4f6', '#9aaee6', '#6e84c4'], kind: 'pillow' },
  { bg: ['#eceae4', '#d6d2c8'], paper: 'boards', ink: 'rgba(90, 80, 60, 0.16)', block: ['#9aa4b0', '#78828e', '#56606c'], kind: 'concrete' },
  { bg: ['#e4dccf', '#c9bba6'], paper: 'brick', ink: 'rgba(110, 80, 50, 0.22)', block: ['#b49a7a', '#8e7454', '#64503a'], kind: 'concrete' },
  { bg: ['#e8f0ff', '#d0dcf4'], paper: 'tiles', ink: 'rgba(110, 140, 200, 0.2)', block: ['#e0c890', '#c4a462', '#94783c'], kind: 'wood' },
  { bg: ['#d8f2ff', '#effbea'], paper: 'sky', ink: 'rgba(255, 255, 255, 0.85)', block: ['#9ad87e', '#62b04a', '#3e8030'], kind: 'hedge' },
  { bg: ['#fff0f6', '#f2e2ff'], paper: 'stripes', ink: 'rgba(200, 150, 240, 0.14)', block: ['#ffd27a', '#f6a94e', '#cf7f2e'], kind: 'toy' },
];

const TOY = ['#ff9aa8', '#ffc66b', '#9ad98a', '#84c6f2', '#c2a2f0'];
const WATER_HEAD = [['#9fd2ff', '#3f95e8', '#1f5aa8'], ['#ffb0cb', '#ee5f92', '#a8305c'], ['#a8eaa4', '#3fbf5a', '#20803a']];
const KEY = [['#ffa0a8', '#e8475a', '#a82838'], ['#ffe08a', '#f2b632', '#b07a10'], ['#dcc0ff', '#9a62e6', '#5e34a0']];
const SWAP = [['#ffc2d8', '#ff86b0', '#d0507e'], ['#c4f4de', '#5fd6a4', '#2a9a6c']];
const TUNNEL = [['#ffc285', '#f28a2c', '#a8541a'], ['#d6b4ff', '#9a62e6', '#5e34a0'], ['#a6eec0', '#36b878', '#1d7a4c']];

// Small fixed hash so textures don't shimmer between redraws.
function hash(x, y, k = 0) {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function grad(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  return gr;
}

function rrect(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

function ell(g, x, y, rx, ry, rot = 0) {
  g.beginPath();
  g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2);
}

function heartPath(g, x, y, s) {
  g.beginPath();
  g.moveTo(x, y + s * 0.9);
  g.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.2, x, y - s * 0.45);
  g.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
  g.closePath();
}

function sparkle(g, x, y, s, color) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s);
  g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s);
  g.fill();
}

// ---------- wallpaper ----------

function drawRoom(g, cols, rows, th) {
  const W = cols * T, H = rows * T;
  g.fillStyle = grad(g, 0, 0, 0, H, [[0, th.bg[0]], [1, th.bg[1]]]);
  g.fillRect(0, 0, W, H);
  g.fillStyle = th.ink;
  g.strokeStyle = th.ink;
  if (th.paper === 'checks') {
    for (let y = 0; y < H; y += 6) for (let x = (y / 6) % 2 ? 6 : 0; x < W; x += 12) g.fillRect(x, y, 6, 6);
  } else if (th.paper === 'stripes') {
    for (let x = 0; x < W; x += 12) g.fillRect(x, 0, 5, H);
  } else if (th.paper === 'dots') {
    for (let y = 4; y < H; y += 9) for (let x = (y / 9) % 2 ? 9 : 4.5; x < W; x += 9) { g.beginPath(); g.arc(x, y, 1.3, 0, 7); g.fill(); }
  } else if (th.paper === 'tiles') {
    g.lineWidth = 0.4;
    for (let x = 0; x <= W; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y <= H; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  } else if (th.paper === 'boards') {
    g.lineWidth = 0.5;
    for (let x = 0; x <= W; x += 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let i = 0; i < 60; i++) { g.beginPath(); g.arc(hash(i, 1) * W, hash(i, 2) * H, 0.6, 0, 7); g.fill(); }
  } else if (th.paper === 'brick') {
    g.lineWidth = 0.4;
    for (let y = 0, row = 0; y < H; y += 5, row++) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      for (let x = row % 2 ? 5 : 0; x < W; x += 10) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 5); g.stroke(); }
    }
  } else if (th.paper === 'sky') {
    // clouds, a far row of trees and grass along the bottom
    for (let i = 0; i < 7; i++) {
      const cx = hash(i, 3) * W, cy = 10 + hash(i, 4) * 60, s = 5 + hash(i, 5) * 6;
      [[0, 0, 1], [s * 0.9, 1, 0.8], [-s * 0.9, 1.2, 0.75], [s * 0.3, -s * 0.5, 0.8]].forEach(([dx, dy, k]) => {
        g.beginPath(); g.arc(cx + dx, cy + dy, s * k, 0, 7); g.fill();
      });
    }
    g.fillStyle = 'rgba(150, 210, 140, 0.35)';
    for (let x = -6; x < W + 12; x += 14) { g.beginPath(); g.arc(x + hash(x, 9) * 6, H - 20, 10 + hash(x, 8) * 5, 0, 7); g.fill(); }
  } else if (th.paper === 'snow') {
    for (let i = 0; i < 110; i++) {
      g.globalAlpha = 0.45 + hash(i, 14) * 0.55;
      g.beginPath(); g.arc(hash(i, 11) * W, hash(i, 12) * H, 0.4 + hash(i, 13) * 1.2, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  } else if (th.paper === 'stars') {
    for (let i = 0; i < 70; i++) {
      const sx = hash(i, 6) * W, sy = hash(i, 7) * H, s = 0.4 + hash(i, 8) * 1.1;
      g.globalAlpha = 0.4 + hash(i, 9) * 0.6;
      if (s > 1.2) sparkle(g, sx, sy, s * 1.4, th.ink); else { g.beginPath(); g.arc(sx, sy, s * 0.6, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1;
    g.fillStyle = '#fff6cc';
    g.beginPath(); g.arc(W - 30, 20, 9, 0, 7); g.fill();
    g.fillStyle = th.bg[0];
    g.beginPath(); g.arc(W - 26, 17, 8, 0, 7); g.fill();
  }
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, th.paper === 'stars' ? 'rgba(0,0,30,0.35)' : 'rgba(120,80,60,0.12)');
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
}

// ---------- walls and floors ----------

// Tiles that join into one wall: plain walls and the special floors.
const WALLISH = (v) => v === 60 || v === 95 || v === 98 || v === 115 || v === 118 || v === 28 || v === 29;

// One square of wall with its corners rounded wherever it sticks out.
function drawWall(g, x, y, cx, cy, look, th) {
  const open = (dx, dy) => !WALLISH(look(dx, dy));
  const r = 3.5;
  const corners = [open(0, -1) && open(-1, 0) ? r : 0, open(0, -1) && open(1, 0) ? r : 0, open(0, 1) && open(1, 0) ? r : 0, open(0, 1) && open(-1, 0) ? r : 0];
  const [light, base, dark] = th.kind === 'toy' ? toyShades(TOY[Math.floor(hash(cx >> 1, cy, 3) * TOY.length)]) : th.block;
  g.save();
  g.beginPath(); g.roundRect(x, y, T, T, corners); g.clip();
  g.fillStyle = grad(g, 0, y, 0, y + T, [[0, light], [0.35, base], [1, dark]]);
  g.fillRect(x, y, T, T);
  if (th.kind === 'tile') {
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 0.5;
    g.beginPath(); g.moveTo(x + 6, y); g.lineTo(x + 6, y + T); g.moveTo(x, y + 6); g.lineTo(x + T, y + 6); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(x + 1, y + 1, 2, 0.6); g.fillRect(x + 7, y + 7, 2, 0.6);
  } else if (th.kind === 'wood') {
    g.strokeStyle = 'rgba(80,45,20,0.28)'; g.lineWidth = 0.45;
    for (const yy of [4, 8]) { g.beginPath(); g.moveTo(x, y + yy); g.lineTo(x + T, y + yy); g.stroke(); }
    g.strokeStyle = 'rgba(255,230,190,0.3)';
    for (let i = 0; i < 3; i++) { const yy = y + 1.5 + i * 4; const sx = x + hash(cx, cy, i) * 8; g.beginPath(); g.moveTo(sx, yy + 0.6); g.quadraticCurveTo(sx + 2, yy, sx + 4, yy + 0.6); g.stroke(); }
    if (hash(cx, cy, 9) < 0.5) { g.fillStyle = 'rgba(80,45,20,0.35)'; g.beginPath(); g.arc(x + (cx % 2 ? 3 : 9), y + 6, 0.45, 0, 7); g.fill(); }
  } else if (th.kind === 'hedge') {
    for (let i = 0; i < 7; i++) {
      g.fillStyle = i % 2 ? 'rgba(210,255,170,0.35)' : 'rgba(40,110,40,0.25)';
      g.beginPath(); g.arc(x + hash(cx, cy, i) * T, y + hash(cy, cx, i) * T, 1.6 + hash(i, cx, cy) * 1.4, 0, 7); g.fill();
    }
    if (hash(cx, cy, 20) < 0.25) { g.fillStyle = '#ffd1e0'; g.beginPath(); g.arc(x + 4 + hash(cx, cy, 21) * 4, y + 4 + hash(cx, cy, 22) * 4, 0.9, 0, 7); g.fill(); }
  } else if (th.kind === 'toy') {
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 0.5;
    g.strokeRect(x + (cx % 2 ? -0.25 : 0.25), y + 0.25, T, T - 0.5);
    if (open(0, -1)) { g.fillStyle = light; for (const sx of [3, 9]) { ell(g, x + sx, y + 1.6, 1.6, 0.8); g.fill(); } }
  } else if (th.kind === 'concrete') {
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.12)'; g.beginPath(); g.arc(x + hash(cx, cy, i) * T, y + hash(cy, cx, i + 3) * T, 0.45, 0, 7); g.fill(); }
  } else if (th.kind === 'pillow') {
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.4; g.setLineDash([0.9, 0.8]);
    g.strokeRect(x + 1.2, y + 1.2, T - 2.4, T - 2.4);
    g.setLineDash([]);
  }
  // light along an exposed top, shade along an exposed bottom
  if (open(0, -1)) { g.fillStyle = grad(g, 0, y, 0, y + 2.6, [[0, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(x, y, T, 2.6); }
  if (open(0, 1)) { g.fillStyle = grad(g, 0, y + T - 3, 0, y + T, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.22)']]); g.fillRect(x, y + T - 3, T, 3); }
  g.restore();
}

function toyShades(c) { return [mix(c, '#ffffff', 0.35), c, mix(c, '#000000', 0.25)]; }

function mix(a, b, k) {
  const p = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('');
}

// Tile 95: a wet, shiny floor the cat slides on.
function drawSlippery(g, x, y, cx) {
  g.fillStyle = grad(g, 0, y, 0, y + 4.5, [[0, '#f4fdff'], [0.5, '#a9e2fb'], [1, '#6cc2ec']]);
  rrect(g, x, y, T, 4.2, [1.2, 1.2, 0.5, 0.5]); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 0.5; g.lineCap = 'round';
  const s = x + 2 + hash(cx, 1, 5) * 5;
  g.beginPath(); g.moveTo(s, y + 1.3); g.lineTo(s + 2.6, y + 1.3); g.moveTo(s + 3.6, y + 1.3); g.lineTo(s + 4.2, y + 1.3); g.stroke();
  g.fillStyle = 'rgba(160, 220, 255, 0.6)';
  ell(g, x + 6 + (hash(cx, 2, 5) - 0.5) * 4, y + 4.5, 2.4, 0.6); g.fill();
}

// Tile 98: sticky tape across the floor; it slows the cat down.
function drawSticky(g, x, y, cx) {
  g.fillStyle = 'rgba(240, 205, 130, 0.92)';
  g.fillRect(x, y - 0.2, T, 3.6);
  g.strokeStyle = 'rgba(190, 140, 60, 0.6)'; g.lineWidth = 0.35;
  for (let i = 0; i < 4; i++) { const sx = x + i * 3 + 0.5; g.beginPath(); g.moveTo(sx, y + 3.4); g.lineTo(sx + 1.6, y - 0.2); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.45)';
  g.fillRect(x, y + 0.3, T, 0.5);
  if (cx % 3 === 0) { g.fillStyle = 'rgba(240, 205, 130, 0.92)'; ell(g, x + 4, y + 3.8, 0.6, 1.1); g.fill(); }
}

// Treadmill floors 115 (carries left) and 118 (carries right): a belt with arrows sliding along.
function drawTreadmill(g, x, y, dir, t) {
  g.fillStyle = '#4b4f63';
  rrect(g, x, y, T, 4, 0.8); g.fill();
  g.save();
  g.beginPath(); g.rect(x, y, T, 4); g.clip();
  const off = (((t * 14 * dir) % 6) + 6) % 6;
  g.strokeStyle = '#ffd36b'; g.lineWidth = 0.8; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = -1; i < 3; i++) {
    const ax = x + i * 6 + off + (dir > 0 ? 1 : 3);
    g.beginPath(); g.moveTo(ax, y + 0.9); g.lineTo(ax + 1.5 * dir, y + 2); g.lineTo(ax, y + 3.1); g.stroke();
  }
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.25)';
  g.fillRect(x, y + 0.2, T, 0.4);
}

// ---------- things in the rooms ----------

// Tile 1: a scratching post wrapped in rope, with a carpet cap on top and a base at the bottom.
function drawPost(g, x, y, look) {
  const top = look(0, -1) !== 1, bottom = !look || WALLISH(look(0, 1)) || look(0, 1) === 70;
  g.fillStyle = grad(g, x + 3, 0, x + 9, 0, [[0, '#b58a56'], [0.45, '#ecd2a0'], [1, '#a07848']]);
  g.fillRect(x + 3.3, y, 5.4, T);
  g.strokeStyle = 'rgba(125, 85, 40, 0.5)'; g.lineWidth = 0.45;
  for (let i = 0; i < 7; i++) { const yy = y + i * 1.8; g.beginPath(); g.moveTo(x + 3.3, yy + 0.9); g.lineTo(x + 8.7, yy); g.stroke(); }
  if (top) {
    g.fillStyle = grad(g, 0, y - 1.4, 0, y + 1.4, [[0, '#ffc2d2'], [1, '#e98aa6']]);
    rrect(g, x + 0.6, y - 1.2, 10.8, 2.6, 1.2); g.fill();
  }
  if (bottom) {
    g.fillStyle = grad(g, 0, y + T - 2, 0, y + T, [[0, '#ffc2d2'], [1, '#e98aa6']]);
    rrect(g, x + 1.2, y + T - 1.8, 9.6, 1.8, [1, 1, 0, 0]); g.fill();
  }
}

// Tile 70: a cardboard box the cat can swipe away.
function drawBox(g, x, y) {
  g.fillStyle = grad(g, x, y, x + T, y + T, [[0, '#ecc590'], [0.5, '#d6a466'], [1, '#b98446']]);
  rrect(g, x + 0.3, y + 0.3, T - 0.6, T - 0.6, 0.9); g.fill();
  g.fillStyle = 'rgba(255, 244, 220, 0.75)';
  g.fillRect(x + 5, y + 0.3, 2, T - 0.6);
  g.strokeStyle = 'rgba(120, 75, 30, 0.45)'; g.lineWidth = 0.4;
  g.beginPath(); g.moveTo(x + 0.6, y + 3); g.lineTo(x + T - 0.6, y + 3); g.stroke();
  // a little paw print stamped on the side
  g.fillStyle = 'rgba(120, 75, 30, 0.35)';
  ell(g, x + 2.8, y + 8, 1, 0.8); g.fill();
  [[1.6, 6.4], [2.8, 6], [4, 6.4]].forEach(([a, b]) => { ell(g, x + a, y + b, 0.42, 0.5); g.fill(); });
}

// Tile 4: a fish-shaped cat treat that bobs and twinkles.
function drawTreat(g, x, y, t) {
  const bob = Math.sin(t * 3 + x * 0.37) * 0.6;
  g.save();
  g.translate(x + 6, y + 7.5 + bob);
  g.shadowColor = 'rgba(255, 190, 90, 0.8)'; g.shadowBlur = 3;
  g.fillStyle = grad(g, 0, -2, 0, 2, [[0, '#f8b46c'], [1, '#c2702e']]);
  ell(g, -0.7, 0, 2.7, 1.8); g.fill();
  g.beginPath(); g.moveTo(1.4, 0); g.lineTo(3.8, -1.8); g.quadraticCurveTo(3.2, 0, 3.8, 1.8); g.closePath(); g.fill();
  g.restore();
  g.save();
  g.translate(x + 6, y + 7.5 + bob);
  g.fillStyle = 'rgba(255, 236, 200, 0.8)'; ell(g, -1.2, -0.8, 1.2, 0.45, -0.2); g.fill();
  g.fillStyle = '#6a3412'; g.beginPath(); g.arc(-2.2, -0.3, 0.32, 0, 7); g.fill();
  g.strokeStyle = 'rgba(110, 55, 20, 0.5)'; g.lineWidth = 0.3;
  g.beginPath(); g.arc(-0.6, 0, 0.9, -1, 1); g.moveTo(0.6, -0.9); g.arc(0.3, 0, 0.9, -1, 1); g.stroke();
  const tw = (Math.sin(t * 4 + x) + 1) / 2;
  g.globalAlpha = tw;
  sparkle(g, 3, -3.4, 1.2, '#ffffff');
  g.restore();
}

// Tiles 15 and 16: a ball of yarn; the big one fills the whole yarn meter.
function drawYarn(g, x, y, big, t) {
  const r = big ? 4.4 : 3.4, cx = x + 6, cy = y + T - r - 0.2;
  const [l, m, d] = big ? ['#ffc4da', '#ff86b2', '#d2507e'] : ['#d6c4ff', '#a48af0', '#7058c4'];
  g.strokeStyle = m; g.lineWidth = 0.6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx + r * 0.7, cy + r * 0.6); g.quadraticCurveTo(cx + r + 2, cy + r, cx + r + 2.6, y + T - 0.4); g.stroke();
  g.save();
  g.translate(cx, cy); g.rotate(Math.sin(t * 2 + x) * 0.15);
  g.fillStyle = grad(g, -r, -r, r, r, [[0, l], [0.5, m], [1, d]]);
  g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
  g.clip();
  g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 0.45;
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.ellipse(i * r * 0.35, 0, r * 0.35, r * 1.1, 0.5, 0, 7); g.stroke(); }
  g.strokeStyle = 'rgba(0,0,0,0.12)';
  for (let i = -1; i <= 1; i++) { g.beginPath(); g.ellipse(0, i * r * 0.4, r * 1.1, r * 0.3, -0.3, 0, 7); g.stroke(); }
  g.restore();
}

function drawFeather(g, x, y, t) {
  g.save();
  g.translate(x + 6, y + 7 + Math.sin(t * 2 + x) * 0.5);
  g.rotate(-0.6 + Math.sin(t * 1.6) * 0.15);
  g.fillStyle = grad(g, 0, -5, 0, 5, [[0, '#9fe6ff'], [1, '#c6a6ff']]);
  g.beginPath(); g.moveTo(0, -5); g.quadraticCurveTo(3, -1, 0.4, 4); g.quadraticCurveTo(-2.6, -1, 0, -5); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = 0.4;
  g.beginPath(); g.moveTo(0, -4.5); g.lineTo(0.3, 5.2); g.stroke();
  g.restore();
}

function drawBell(g, x, y, t) {
  g.save();
  g.translate(x + 6, y + 3.5); g.rotate(Math.sin(t * 5 + x) * 0.25);
  g.fillStyle = '#e84a6a'; rrect(g, -3, -1.6, 6, 1.4, 0.7); g.fill();
  g.shadowColor = 'rgba(255, 220, 110, 0.8)'; g.shadowBlur = 3;
  g.fillStyle = grad(g, -3, 0, 3, 0, [[0, '#c88e16'], [0.4, '#fff0a0'], [1, '#c88e16']]);
  g.beginPath(); g.arc(0, 3, 3.2, 0, 7); g.fill();
  g.shadowBlur = 0;
  g.fillStyle = '#7a520a'; g.fillRect(-1.8, 3.4, 3.6, 0.5); g.beginPath(); g.arc(0, 4.7, 0.6, 0, 7); g.fill();
  g.restore();
}

function drawFish(g, x, y, t) {
  g.save();
  g.translate(x + 6, y + 8 + Math.sin(t * 3 + x) * 0.4);
  g.rotate(Math.sin(t * 6) * 0.06);
  g.fillStyle = grad(g, 0, -3, 0, 3, [[0, '#a8dcff'], [1, '#3a86d8']]);
  ell(g, -0.8, 0, 3.8, 2.3); g.fill();
  g.beginPath(); g.moveTo(2.4, 0); g.lineTo(5, -2.4); g.quadraticCurveTo(4.2, 0, 5, 2.4); g.closePath(); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(-3, -0.6, 0.7, 0, 7); g.fill();
  g.fillStyle = '#1a2a50'; g.beginPath(); g.arc(-2.9, -0.6, 0.35, 0, 7); g.fill();
  g.restore();
}

function drawHeartItem(g, x, y, t) {
  const s = 3 * (1 + Math.sin(t * 5) * 0.08);
  g.save();
  g.shadowColor = 'rgba(255, 90, 130, 0.8)'; g.shadowBlur = 4;
  g.fillStyle = grad(g, x + 3, y + 3, x + 9, y + 10, [[0, '#ff9ab4'], [1, '#e8345e']]);
  heartPath(g, x + 6, y + 6.5, s); g.fill();
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.7)'; ell(g, x + 4.4, y + 4.8, 0.9, 0.5, -0.6); g.fill();
}

function drawBone(g, x, y, t) {
  g.save();
  g.translate(x + 6, y + 8.5 + Math.sin(t * 3 + x) * 0.4);
  g.rotate(-0.3);
  g.fillStyle = '#fffaf0';
  g.strokeStyle = 'rgba(160, 130, 90, 0.6)'; g.lineWidth = 0.35;
  g.beginPath();
  g.rect(-3, -0.9, 6, 1.8);
  for (const [a, b] of [[-3.2, -1], [-3.2, 1], [3.2, -1], [3.2, 1]]) g.moveTo(a + 1.1, b), g.arc(a, b, 1.1, 0, 7);
  g.fill(); g.stroke();
  g.restore();
}

// Tiles 6-8: a fabric cat tunnel opening, one colour per pair.
function drawTunnel(g, x, y, c, t) {
  const [l, m, d] = TUNNEL[c];
  const cx = x + 6, cy = y + 6.6;
  g.fillStyle = grad(g, 0, cy - 5.5, 0, cy + 5.5, [[0, l], [0.5, m], [1, d]]);
  ell(g, cx, cy, 5.9, 5.4); g.fill();
  g.fillStyle = grad(g, 0, cy - 4, 0, cy + 4, [[0, '#2a2030'], [1, '#4a3a52']]);
  ell(g, cx, cy + 0.3, 4.3, 4); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 0.45;
  ell(g, cx, cy, 5.1, 4.7); g.stroke();
  // little lights inside, drifting
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.6 + i / 3) % 1;
    g.globalAlpha = Math.sin(k * Math.PI) * 0.8;
    g.fillStyle = l;
    g.beginPath(); g.arc(cx + (hash(i, c, 4) - 0.5) * 5, cy + 2 - k * 4, 0.45, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
}

// Tiles 33-35: a button with a paw on it. Pounce on it and the same colour sprinkler turns off.
function drawPounceButton(g, x, y, c, pressed, t) {
  const [l, m, d] = WATER_HEAD[c];
  g.fillStyle = '#9aa0b0';
  rrect(g, x + 1.5, y + 10.4, 9, 1.6, 0.6); g.fill();
  if (pressed) {
    g.fillStyle = d; ell(g, x + 6, y + 10.4, 3.6, 0.8); g.fill();
    return;
  }
  const lift = 1.9 + Math.sin(t * 4) * 0.25;
  g.save();
  g.shadowColor = m; g.shadowBlur = 3;
  g.fillStyle = grad(g, 0, y + 10.4 - lift * 1.6, 0, y + 10.6, [[0, l], [0.6, m], [1, d]]);
  g.beginPath(); g.ellipse(x + 6, y + 10.5, 3.7, lift * 1.4, 0, Math.PI, 0); g.fill();
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.85)';
  const py = y + 10.4 - lift * 0.7;
  ell(g, x + 6, py + 0.3, 0.9, 0.6); g.fill();
  [[-1.1, -0.6], [0, -1], [1.1, -0.6]].forEach(([a, b]) => { ell(g, x + 6 + a, py + b * 0.8, 0.35, 0.3); g.fill(); });
}

// Tiles 74-79: sprinkler water, a colour per sprinkler. The head sits on the top square of the
// column; once its button is pressed only the head is left, dripping.
function drawWater(g, x, y, c, on, look, t) {
  const [l, m, d] = WATER_HEAD[c];
  const same = (v) => v >= 0 && ((v & 0x7f) - 74) >> 1 === c && (v & 0x7f) >= 74 && (v & 0x7f) <= 79;
  const head = !same(look(0, -1));
  const foot = !same(look(0, 1));
  if (on) {
    g.save();
    g.beginPath(); g.rect(x, y, T, T); g.clip();
    g.fillStyle = grad(g, x + 1, 0, x + 11, 0, [[0, 'rgba(150, 215, 255, 0.25)'], [0.5, 'rgba(110, 195, 255, 0.6)'], [1, 'rgba(150, 215, 255, 0.25)']]);
    g.fillRect(x + 1.2, y, T - 2.4, T);
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 0.5; g.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const sx = x + 2.2 + i * 1.9, k = (t * 3 + hash(i, c, 2)) % 1;
      const sy = y - 3 + ((k * 15 + i * 2.7) % 15);
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx, sy + 2.4); g.stroke();
    }
    if (foot) {
      g.fillStyle = 'rgba(200, 235, 255, 0.85)';
      for (let i = 0; i < 4; i++) {
        const k = (t * 2.5 + i / 4) % 1;
        g.globalAlpha = 1 - k;
        g.beginPath(); g.arc(x + 6 + (i - 1.5) * 2.6 * (0.6 + k), y + T - 0.6 - Math.sin(k * Math.PI) * 2.6, 0.6, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
    }
    g.restore();
  } else if (head) {
    const k = (t * 0.7 + c * 0.3) % 1;
    g.fillStyle = 'rgba(120, 200, 255, 0.8)';
    g.beginPath(); g.arc(x + 6, y + 4.4 + k * 7, 0.6 * (1 - k * 0.5), 0, 7); g.fill();
  }
  if (head) {
    g.fillStyle = grad(g, x + 4.5, 0, x + 7.5, 0, [[0, '#9aa0b0'], [0.5, '#e8ecf2'], [1, '#9aa0b0']]);
    g.fillRect(x + 4.6, y, 2.8, 2.2);
    g.fillStyle = grad(g, 0, y + 1.6, 0, y + 4.4, [[0, l], [0.5, m], [1, d]]);
    rrect(g, x + 2, y + 1.6, 8, 2.6, 1.3); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x + 3, y + 2.1, 3, 0.5);
    g.fillStyle = d;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x + 3.3 + i * 1.8, y + 4.1, 0.3, 0, 7); g.fill(); }
  }
}

// Tile 38: a little cactus in a pot. Touching it costs a life.
function drawCactus(g, x, y) {
  g.fillStyle = grad(g, 0, y + 3, 0, y + 9, [[0, '#8ddc7a'], [1, '#4c9e46']]);
  rrect(g, x + 4.4, y + 2.4, 3.2, 7.4, 1.6); g.fill();
  rrect(g, x + 1.8, y + 4.4, 1.9, 3.6, 0.95); g.fill();
  rrect(g, x + 2.2, y + 6.6, 2.8, 1.5, 0.7); g.fill();
  rrect(g, x + 8.3, y + 3.4, 1.9, 3.4, 0.95); g.fill();
  rrect(g, x + 7, y + 5.4, 2.8, 1.5, 0.7); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = 0.3; g.lineCap = 'round';
  [[5, 4, -1], [7, 5, 1], [5, 7, -1], [7, 8, 1], [2.2, 5.5, -1], [9.8, 4.6, 1]].forEach(([a, b, s]) => {
    g.beginPath(); g.moveTo(x + a, y + b); g.lineTo(x + a + s * 0.9, y + b - 0.4); g.stroke();
  });
  g.fillStyle = '#ff8fb8';
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.beginPath(); g.arc(x + 6 + Math.cos(a) * 0.9, y + 2.2 + Math.sin(a) * 0.9, 0.6, 0, 7); g.fill(); }
  g.fillStyle = '#ffe26a'; g.beginPath(); g.arc(x + 6, y + 2.2, 0.45, 0, 7); g.fill();
  g.fillStyle = grad(g, x + 3, 0, x + 9, 0, [[0, '#c0643c'], [0.5, '#ec9a6c'], [1, '#b05634']]);
  g.beginPath(); g.moveTo(x + 2.6, y + 9.2); g.lineTo(x + 9.4, y + 9.2); g.lineTo(x + 8.6, y + 12); g.lineTo(x + 3.4, y + 12); g.closePath(); g.fill();
  g.fillStyle = '#f2b088'; g.fillRect(x + 2.4, y + 8.8, 7.2, 1.1);
}

// Tiles 24-26: a key with a heart for a handle. It opens every gate of its colour.
function drawKey(g, x, y, c, t) {
  const [l, m, d] = KEY[c];
  g.save();
  g.translate(x + 6, y + 6 + Math.sin(t * 3 + x * 0.3) * 0.7);
  g.rotate(-0.5 + Math.sin(t * 2 + x) * 0.12);
  g.shadowColor = m; g.shadowBlur = 4;
  g.fillStyle = grad(g, -4, -3, 4, 3, [[0, l], [0.5, m], [1, d]]);
  g.save(); g.translate(-2.4, 0); g.rotate(-Math.PI / 2); heartPath(g, 0, -0.2, 2.4); g.fill(); g.restore();
  g.shadowBlur = 0;
  rrect(g, -1, -0.65, 6.2, 1.3, 0.6); g.fill();
  g.fillRect(3.1, 0.4, 0.9, 1.5); g.fillRect(4.4, 0.4, 0.8, 1.1);
  g.fillStyle = 'rgba(255,255,255,0.75)'; ell(g, -3.4, -1.3, 0.8, 0.45, -0.6); g.fill();
  g.restore();
  g.globalAlpha = (Math.sin(t * 4 + x) + 1) / 2;
  sparkle(g, x + 9.5, y + 2.5, 1.3, '#ffffff');
  g.globalAlpha = 1;
}

// Tiles 80-82: a pet gate, white bars in a frame of the key's colour, with a padlock on the bottom square.
function drawGate(g, x, y, c, look) {
  const [l, m, d] = KEY[c];
  const same = (v) => v === 80 + c;
  const top = !same(look(0, -1)), bottom = !same(look(0, 1));
  g.fillStyle = 'rgba(255, 255, 255, 0.28)';
  g.fillRect(x + 0.5, y, T - 1, T);
  g.fillStyle = grad(g, x, 0, x + T, 0, [[0, '#ffffff'], [0.5, '#f2eef2'], [1, '#d6d0d8']]);
  for (const bx of [2.6, 5.2, 7.8]) g.fillRect(x + bx, y, 1.3, T);
  g.fillStyle = grad(g, x, 0, x + T, 0, [[0, l], [0.5, m], [1, d]]);
  g.fillRect(x, y, 1.6, T); g.fillRect(x + T - 1.6, y, 1.6, T);
  if (top) { rrect(g, x, y, T, 1.8, 0.8); g.fill(); }
  if (bottom) {
    rrect(g, x, y + T - 1.8, T, 1.8, 0.8); g.fill();
    g.strokeStyle = d; g.lineWidth = 0.9;
    g.beginPath(); g.arc(x + 6, y + 5.4, 1.7, Math.PI, 0); g.stroke();
    g.fillStyle = grad(g, 0, y + 5.4, 0, y + 9.4, [[0, l], [1, m]]);
    rrect(g, x + 3.4, y + 5.4, 5.2, 4, 1); g.fill();
    g.fillStyle = d; g.beginPath(); g.arc(x + 6, y + 7, 0.65, 0, 7); g.fill(); g.fillRect(x + 5.7, y + 7, 0.6, 1.4);
  }
}

// Tiles 28 and 29: a cat flap set in the wall. It swings only one way, shown by the arrow:
// 28 lets the cat through going right, 29 going left. Dogs and vacuums don't fit.
function drawFlap(g, x, y, dir) {
  g.fillStyle = 'rgba(60, 35, 30, 0.55)';
  rrect(g, x + 1.4, y + 1.6, T - 2.8, T - 1.6, [3, 3, 0, 0]); g.fill();
  g.save();
  g.translate(x + 6, y + 2.2);
  g.transform(1, 0, dir * 0.18, 1, 0, 0);
  g.fillStyle = grad(g, 0, 0, 0, 9.5, [[0, '#fff8ee'], [1, '#e8dccc']]);
  rrect(g, -4.2, 0, 8.4, 9.6, [2.4, 2.4, 1, 1]); g.fill();
  g.fillStyle = 'rgba(150, 120, 100, 0.35)';
  ell(g, 0, 7, 1.3, 1); g.fill();
  [[-1.5, 5.3], [0, 4.8], [1.5, 5.3]].forEach(([a, b]) => { ell(g, a, b, 0.5, 0.6); g.fill(); });
  g.restore();
  g.strokeStyle = '#ff7aa2'; g.lineWidth = 1; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x + 6 - dir * 1.4, y + 2.4); g.lineTo(x + 6 + dir * 0.6, y + 4); g.lineTo(x + 6 - dir * 1.4, y + 5.6); g.stroke();
}

// Tiles 84 and 85: the pink and mint blocks the light switch swaps. Solid ones are full blocks with a
// star or a dot; open ones are only a dashed outline.
function drawSwapBlock(g, x, y, c, on) {
  const [l, m, d] = SWAP[c];
  if (on) {
    g.fillStyle = grad(g, 0, y, 0, y + T, [[0, l], [0.4, m], [1, d]]);
    rrect(g, x + 0.3, y + 0.3, T - 0.6, T - 0.6, 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x + 1.5, y + 1.2, T - 3, 1);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    if (c === 0) sparkle(g, x + 6, y + 6.4, 3, 'rgba(255,255,255,0.9)');
    else { g.beginPath(); g.arc(x + 6, y + 6.4, 2, 0, 7); g.fill(); }
  } else {
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.fillRect(x + 1, y + 1, T - 2, T - 2);
    g.strokeStyle = m; g.lineWidth = 0.6; g.setLineDash([1.2, 1]);
    rrect(g, x + 1, y + 1, T - 2, T - 2, 2); g.stroke();
    g.setLineDash([]);
  }
}

// Tiles 30 and 31: the light switch on the floor. The lit half shows which blocks are solid now
// (30 pink, 31 mint); walking onto it swaps them.
function drawSwitch(g, x, y, mint, t) {
  g.fillStyle = '#9aa0b0';
  rrect(g, x + 1, y + 10.4, 10, 1.6, 0.6); g.fill();
  g.fillStyle = grad(g, 0, y + 4, 0, y + 10.6, [[0, '#ffffff'], [1, '#dcdce6']]);
  rrect(g, x + 2, y + 4, 8, 6.6, 1.6); g.fill();
  const glow = 0.6 + Math.sin(t * 5) * 0.25;
  [0, 1].forEach((c) => {
    const [l, m] = SWAP[c], lit = c === (mint ? 1 : 0);
    g.save();
    if (lit) { g.shadowColor = m; g.shadowBlur = 4 * glow; }
    g.fillStyle = lit ? grad(g, 0, y + 5, 0, y + 9.6, [[0, l], [1, m]]) : 'rgba(170, 170, 185, 0.5)';
    rrect(g, x + 2.8 + c * 3.4, y + 4.8, 3, 5, 1); g.fill();
    g.restore();
  });
  g.strokeStyle = '#7a7f90'; g.lineWidth = 0.8; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x + 6, y + 9.4); g.lineTo(x + 6 + (mint ? 2.6 : -2.6), y + 2.6); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + 6 + (mint ? 2.6 : -2.6), y + 2.6, 1.1, 0, 7); g.fill();
}

// ---------- tile dispatch ----------

// Tiles drawn every frame instead of into the level's backing picture, because they move or change.
const LIVE = new Set([4, 6, 7, 8, 15, 16, 19, 20, 21, 22, 23, 24, 25, 26, 30, 31, 33, 34, 35, 74, 75, 76, 77, 78, 79, 115, 118]);

// cell is the raw map byte: bit 0x80 marks a swiped box or a sprinkler turned off.
// look(dx, dy) gives a neighbouring cell (-1 off the map). pressed[c] says a button colour is done.
function drawTile(g, cell, x, y, cx, cy, t, look, th, pressed) {
  const tile = cell & 0x7f, off = cell & 0x80;
  if (tile >= 74 && tile <= 79) return drawWater(g, x, y, (tile - 74) >> 1, !off, look, t);
  if (tile === 84 || tile === 85) return drawSwapBlock(g, x, y, tile - 84, !off);
  if (off) return;
  switch (tile) {
    case 0: return;
    case 1: case 2: case 3: return drawPost(g, x, y, look);
    case 4: return drawTreat(g, x, y, t);
    case 6: case 7: case 8: return drawTunnel(g, x, y, tile - 6, t);
    case 15: return drawYarn(g, x, y, true, t);
    case 16: return drawYarn(g, x, y, false, t);
    case 19: return drawBone(g, x, y, t);
    case 20: return drawFeather(g, x, y, t);
    case 21: return drawBell(g, x, y, t);
    case 22: return drawFish(g, x, y, t);
    case 23: return drawHeartItem(g, x, y, t);
    case 24: case 25: case 26: return drawKey(g, x, y, tile - 24, t);
    case 28: case 29: return drawFlap(g, x, y, tile === 28 ? 1 : -1);
    case 30: case 31: return drawSwitch(g, x, y, tile === 31, t);
    case 80: case 81: case 82: return drawGate(g, x, y, tile - 80, look);
    case 33: case 34: case 35: return drawPounceButton(g, x, y, tile - 33, pressed && pressed[tile - 33], t);
    case 38: return drawCactus(g, x, y);
    case 70: return drawBox(g, x, y);
    case 115: return drawTreadmill(g, x, y, -1, t);
    case 118: return drawTreadmill(g, x, y, 1, t);
  }
}

// The whole room for one level, minus the live tiles. tileAt(cx, cy) gives a cell, or -1 off the map.
function drawLevelStatic(g, cols, rows, tileAt, th) {
  drawRoom(g, cols, rows, th);
  // soft shadows under walls and boxes
  g.save();
  g.shadowColor = 'rgba(60, 30, 40, 0.28)';
  g.shadowBlur = 3;
  g.shadowOffsetY = 1.2 * (g.getTransform().a || 1);
  g.fillStyle = 'rgba(0,0,0,0.25)';
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
    const v = tileAt(cx, cy);
    if (v < 0 || v & 0x80 || !(WALLISH(v) || v === 70 || (v >= 80 && v <= 82) || v === 84 || v === 85)) continue;
    g.fillRect(cx * T + 0.5, cy * T + 0.5, T - 1, T - 1);
  }
  g.restore();
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
    const v = tileAt(cx, cy);
    if (v < 0) continue;
    const look = (dx, dy) => tileAt(cx + dx, cy + dy);
    const x = cx * T, y = cy * T;
    if (WALLISH(v)) {
      drawWall(g, x, y, cx, cy, look, th);
      if (v === 95) drawSlippery(g, x, y, cx);
      if (v === 98) drawSticky(g, x, y, cx);
      if (v === 28 || v === 29) drawFlap(g, x, y, v === 28 ? 1 : -1);
    } else if (!LIVE.has(v & 0x7f)) drawTile(g, v, x, y, cx, cy, 0, look, th);
  }
}

// ---------- the cat ----------

// x, y is the top-left of the cat's 12 x 12 square. s: { face: 1 right / -1 left, mode: 'stand' |
// 'walk' | 'fly' | 'jump' | 'climb', walk: step phase in radians, swipe: 'fwd' | 'up' | 'down',
// swipeK: 0..1 through one swipe, puff: 0..1 fur standing on end, happy: bool }
function drawCat(g, x, y, P, s, t) {
  g.save();
  g.translate(x + 6, y + 12);
  // a soft shadow on the floor
  if (s.mode !== 'fly' && s.mode !== 'jump' && s.mode !== 'climb') {
    g.fillStyle = 'rgba(40, 20, 40, 0.16)';
    ell(g, 0, 0.1, 5, 0.8); g.fill();
  }
  if (s.mode === 'climb') { catClimbing(g, P, s, t); g.restore(); return; }
  g.scale(s.face, 1);
  const walking = s.mode === 'walk', air = s.mode === 'fly' || s.mode === 'jump';
  const w = s.walk || 0;
  g.translate(0, walking ? -Math.abs(Math.sin(w)) * 0.45 : 0);
  if (s.puff) g.scale(1 + s.puff * 0.12, 1 + s.puff * 0.12);
  if (s.mode === 'fly') catRotor(g, P, t);
  else catTail(g, P, t, air, s.puff);
  catLegs(g, P, w, walking, air, true);
  catBody(g, P, s.puff);
  catLegs(g, P, w, walking, air, false);
  catHead(g, P, t, s);
  if (s.swipe) catSwipe(g, P, s.swipe, s.swipeK || 0);
  g.restore();
}

function catTail(g, P, t, air, puff) {
  const sway = Math.sin(t * 2.6) * 0.9;
  g.save();
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-4.4, -5.2);
  if (air) g.bezierCurveTo(-6.6, -5.6, -8.4, -6.6, -9.2 + sway * 0.4, -8.2);
  else g.bezierCurveTo(-7.2, -5.6, -7.6 + sway * 0.3, -9.6, -5.8 + sway, -11);
  g.strokeStyle = P.shade; g.lineWidth = 1.9 + (puff || 0) * 1.2; g.stroke();
  g.strokeStyle = P.tail || P.base; g.lineWidth = 1.4 + (puff || 0) * 1.2; g.stroke();
  if (P.pattern === 'tabby' || P.pattern === 'candy') {
    g.setLineDash([0.8, 1]);
    g.strokeStyle = P.stripe; g.lineWidth = 1.4; g.stroke();
    if (P.pattern === 'candy') { g.lineDashOffset = 0.9; g.strokeStyle = P.stripe2; g.stroke(); }
    g.setLineDash([]);
  }
  g.restore();
}

// Flying: the tail sticks straight up over the cat's back and its fluffy tip spins like a rotor.
function catRotor(g, P, t) {
  g.save();
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(-4.2, -5.4); g.bezierCurveTo(-6.4, -7.4, -4.6, -11.4, -1.6, -12.4);
  g.strokeStyle = P.shade; g.lineWidth = 1.8; g.stroke();
  g.strokeStyle = P.tail || P.base; g.lineWidth = 1.3; g.stroke();
  const a = t * 40, hx = -1.4, hy = -12.8;
  g.fillStyle = 'rgba(255, 255, 255, 0.38)';
  ell(g, hx, hy, 6.4, 1.2); g.fill();
  for (const k of [0, Math.PI]) {
    const c = Math.cos(a + k);
    g.fillStyle = c > 0 ? (P.tail || P.base) : P.shade;
    ell(g, hx + c * 3.1, hy, Math.abs(c) * 2.9 + 0.5, 0.85); g.fill();
  }
  g.fillStyle = P.tail || P.base;
  g.beginPath(); g.arc(hx, hy, 0.9, 0, 7); g.fill();
  // whoosh lines
  g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 0.35;
  for (const s of [-1, 1]) { g.beginPath(); g.arc(hx, hy, 7.2, s > 0 ? -0.5 : Math.PI - 0.3, s > 0 ? 0.3 : Math.PI + 0.5); g.stroke(); }
  g.restore();
}

function catLegs(g, P, w, walking, air, far) {
  const legs = far ? [[-2.5, w], [3.2, w + Math.PI]] : [[-3.7, w + Math.PI], [2.3, w]];
  g.lineCap = 'round';
  for (const [hx, ph] of legs) {
    let fx = hx, fy = 0;
    if (walking) { fx += Math.sin(ph) * 1.3; fy = -Math.max(0, Math.cos(ph)) * 0.9; }
    if (air) { fx += hx < 0 ? -1.3 : 1.3; fy = -0.9; }
    g.strokeStyle = far ? (P.legFar || P.shade) : (P.leg || P.base);
    g.lineWidth = 1.75;
    g.beginPath(); g.moveTo(hx, -3.4); g.lineTo(fx, fy - 0.7); g.stroke();
    g.fillStyle = far ? mix(P.paw, '#000000', 0.12) : P.paw;
    ell(g, fx + 0.35, fy - 0.55, 1.08, 0.62); g.fill();
  }
}

function catBody(g, P, puff) {
  g.save();
  if (puff) {
    // fur standing on end
    g.fillStyle = P.base;
    g.beginPath();
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI + (i / 16) * Math.PI, r = i % 2 ? 1 : 1 + puff * 0.35;
      g.lineTo(-0.6 + Math.cos(a) * 4.8 * r, -4.8 + Math.sin(a) * 3.1 * r);
    }
    g.fill();
  }
  ell(g, -0.6, -4.8, 4.7, 2.8);
  g.fillStyle = grad(g, 0, -7.6, 0, -2, [[0, P.light], [0.4, P.base], [1, P.shade]]);
  g.fill();
  g.strokeStyle = 'rgba(60, 30, 50, 0.16)'; g.lineWidth = 0.35; g.stroke();
  g.clip();
  g.lineCap = 'round';
  if (P.pattern === 'tabby') {
    g.strokeStyle = P.stripe; g.lineWidth = 0.75;
    for (let i = 0; i < 4; i++) {
      const x0 = -4.2 + i * 1.9;
      g.beginPath(); g.moveTo(x0, -7.9); g.quadraticCurveTo(x0 + 0.9, -6.2, x0 + 0.2, -4.3); g.stroke();
    }
  } else if (P.pattern === 'candy') {
    for (let i = 0; i < 5; i++) {
      const x0 = -5 + i * 2.1;
      g.strokeStyle = i % 2 ? P.stripe2 : P.stripe; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(x0, -8); g.quadraticCurveTo(x0 + 1, -6, x0 + 0.3, -2.8); g.stroke();
    }
  } else if (P.pattern === 'calico') {
    g.fillStyle = P.patch; ell(g, -3.2, -6.4, 2.4, 1.6); g.fill();
    g.fillStyle = P.stripe; ell(g, 0.8, -7, 1.9, 1.2, 0.3); g.fill();
    g.fillStyle = P.patch; ell(g, 2.8, -4.4, 1.2, 0.9); g.fill();
  } else if (P.pattern === 'pointed') {
    g.globalAlpha = 0.45;
    g.fillStyle = grad(g, 1, 0, -5.4, 0, [[0, P.base], [1, P.stripe]]);
    g.fillRect(-6, -8, 8, 6);
    g.globalAlpha = 1;
  }
  g.fillStyle = P.belly; g.globalAlpha = P.pattern === 'tuxedo' ? 1 : 0.85;
  ell(g, 0.6, -2.5, 3.5, 1.35); g.fill();
  g.restore();
}

function catHead(g, P, t, s) {
  const hx = 3.7, hy = -8.4;
  g.save();
  if (s.happy) { g.translate(hx, hy); g.rotate(Math.sin(t * 8) * 0.12); g.translate(-hx, -hy); }
  // ears
  const ear = (a, b, c, inner) => {
    g.fillStyle = P.pattern === 'pointed' ? P.stripe : P.base;
    g.beginPath(); g.moveTo(...a); g.quadraticCurveTo(b[0] - 0.2, b[1] + 0.4, ...b); g.lineTo(...c); g.closePath(); g.fill();
    g.fillStyle = P.ear;
    g.beginPath(); g.moveTo(...inner[0]); g.lineTo(...inner[1]); g.lineTo(...inner[2]); g.closePath(); g.fill();
  };
  ear([hx - 3, hy - 1.2], [hx - 2.5, hy - 5], [hx - 0.4, hy - 2.8], [[hx - 2.4, hy - 1.9], [hx - 2.2, hy - 4], [hx - 1.1, hy - 2.7]]);
  ear([hx + 0.7, hy - 2.9], [hx + 2.9, hy - 5], [hx + 3.3, hy - 1.3], [[hx + 1.4, hy - 2.8], [hx + 2.6, hy - 4], [hx + 2.8, hy - 1.9]]);
  // head and cheek fluff
  g.fillStyle = grad(g, 0, hy - 3.2, 0, hy + 3, [[0, P.light], [0.45, P.base], [1, P.shade]]);
  ell(g, hx, hy, 3.55, 3.05); g.fill();
  g.strokeStyle = 'rgba(60, 30, 50, 0.16)'; g.lineWidth = 0.35; g.stroke();
  g.save();
  ell(g, hx, hy, 3.55, 3.05); g.clip();
  g.lineCap = 'round';
  if (P.pattern === 'tabby') {
    g.strokeStyle = P.stripe; g.lineWidth = 0.5;
    g.beginPath();
    g.moveTo(hx - 0.6, hy - 3); g.lineTo(hx - 0.3, hy - 1.7);
    g.moveTo(hx + 0.6, hy - 3.1); g.lineTo(hx + 0.6, hy - 1.7);
    g.moveTo(hx + 1.8, hy - 2.8); g.lineTo(hx + 1.4, hy - 1.7);
    g.moveTo(hx - 3.6, hy - 0.2); g.lineTo(hx - 2.2, hy + 0.2);
    g.stroke();
  } else if (P.pattern === 'candy') {
    g.lineWidth = 0.9;
    [[hx - 2.4, P.stripe], [hx - 0.4, P.stripe2], [hx + 1.6, P.stripe]].forEach(([sx, col]) => {
      g.strokeStyle = col; g.beginPath(); g.moveTo(sx, hy - 3.4); g.quadraticCurveTo(sx + 0.6, hy - 2.4, sx + 0.2, hy - 1.6); g.stroke();
    });
    g.strokeStyle = P.stripe; g.beginPath(); g.moveTo(hx - 3.8, hy + 0.4); g.lineTo(hx - 2.4, hy + 0.6); g.stroke();
  } else if (P.pattern === 'calico') {
    g.fillStyle = P.patch; ell(g, hx - 2, hy - 1.6, 2, 1.8); g.fill();
    g.fillStyle = P.stripe; ell(g, hx + 2.2, hy - 2.4, 1.4, 1.1); g.fill();
  } else if (P.pattern === 'pointed') {
    g.fillStyle = P.stripe; g.globalAlpha = 0.75; ell(g, hx + 0.6, hy + 1.1, 2.6, 2); g.fill(); g.globalAlpha = 1;
  } else if (P.pattern === 'tuxedo') {
    g.fillStyle = P.muzzle;
    g.beginPath(); g.moveTo(hx + 0.3, hy - 1.6); g.lineTo(hx + 2.6, hy + 3); g.lineTo(hx - 2, hy + 3); g.closePath(); g.fill();
  }
  g.restore();
  // muzzle
  g.fillStyle = P.muzzle || P.belly; g.globalAlpha = P.pattern === 'pointed' ? 0.25 : 0.75;
  ell(g, hx + 0.7, hy + 1.35, 1.7, 1.05); g.fill();
  g.globalAlpha = 1;
  // eyes, with a blink every few seconds
  const blink = s.happy || (t % 3.7) < 0.13;
  catEye(g, hx - 0.85, hy - 0.4, 0.98, 1.2, P, blink);
  catEye(g, hx + 1.75, hy - 0.4, 0.9, 1.12, P, blink);
  // nose and mouth
  g.fillStyle = P.nose;
  g.beginPath(); g.moveTo(hx + 0.15, hy + 0.75); g.lineTo(hx + 1.15, hy + 0.75); g.lineTo(hx + 0.65, hy + 1.3); g.closePath(); g.fill();
  g.strokeStyle = P.pattern === 'solid' && P.base < '#5' ? 'rgba(255,255,255,0.4)' : 'rgba(90, 50, 60, 0.55)';
  g.lineWidth = 0.28;
  g.beginPath(); g.arc(hx + 0.35, hy + 1.45, 0.32, 0, Math.PI); g.arc(hx + 0.99, hy + 1.45, 0.32, 0, Math.PI); g.stroke();
  // whiskers
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 0.18;
  g.beginPath();
  for (const d of [-0.5, 0, 0.5]) { g.moveTo(hx + 2, hy + 1.2 + d * 0.5); g.lineTo(hx + 5.2, hy + 0.8 + d * 1.2); }
  for (const d of [-0.5, 0.5]) { g.moveTo(hx - 0.8, hy + 1.3 + d * 0.4); g.lineTo(hx - 3.6, hy + 1 + d * 1); }
  g.stroke();
  if (s.happy) {
    g.fillStyle = 'rgba(255, 140, 170, 0.45)';
    ell(g, hx - 1.6, hy + 1, 0.9, 0.5); g.fill(); ell(g, hx + 2.7, hy + 1, 0.7, 0.45); g.fill();
  }
  g.restore();
}

function catEye(g, ex, ey, rx, ry, P, closed) {
  if (closed) {
    g.strokeStyle = 'rgba(60, 30, 50, 0.8)'; g.lineWidth = 0.32; g.lineCap = 'round';
    g.beginPath(); g.arc(ex, ey + 0.3, rx * 0.8, Math.PI + 0.3, -0.3); g.stroke();
    return;
  }
  g.fillStyle = '#ffffff'; ell(g, ex, ey, rx, ry); g.fill();
  g.fillStyle = grad(g, 0, ey - ry, 0, ey + ry, [[0, mix(P.eye, '#000000', 0.25)], [1, mix(P.eye, '#ffffff', 0.25)]]);
  ell(g, ex + 0.12, ey + 0.08, rx * 0.86, ry * 0.88); g.fill();
  g.fillStyle = '#1d1b26'; ell(g, ex + 0.18, ey + 0.12, rx * 0.46, ry * 0.7); g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(ex + 0.42, ey - 0.42, rx * 0.34, 0, 7); g.fill();
  g.beginPath(); g.arc(ex - 0.2, ey + 0.45, rx * 0.15, 0, 7); g.fill();
}

// The swipe: one front paw shoots out and back, with a white swish where it lands.
function catSwipe(g, P, dir, k) {
  const ext = Math.sin(Math.min(1, k) * Math.PI);
  const [ex, ey] = dir === 'up' ? [7.4 + ext * 0.4, -9.4 - ext * 4] : dir === 'down' ? [4.6 + ext * 0.4, -2 + ext * 3.4] : [3.8 + ext * 5, -6.2 - ext * 0.6];
  g.lineCap = 'round';
  g.strokeStyle = P.leg || P.base; g.lineWidth = 1.75;
  g.beginPath(); g.moveTo(dir === 'up' ? 4.6 : 2.6, dir === 'up' ? -4.8 : -4.6); g.lineTo(ex, ey); g.stroke();
  g.fillStyle = P.paw; g.beginPath(); g.arc(ex, ey, 1.15, 0, 7); g.fill();
  g.fillStyle = P.nose;
  ell(g, ex + 0.2, ey + 0.15, 0.45, 0.35); g.fill();
  if (ext > 0.35) {
    g.strokeStyle = `rgba(255,255,255,${ext})`; g.lineWidth = 0.45;
    const [ax, ay, a0] = dir === 'up' ? [ex, ey - 1.6, Math.PI * 1.1] : dir === 'down' ? [ex, ey + 1.6, 0.1] : [ex + 1.6, ey, -0.9];
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(ax, ay, 1.6 + i * 1.1, a0, a0 + 1.6); g.stroke(); }
  }
}

// Climbing a post, seen from behind.
function catClimbing(g, P, s, t) {
  const k = Math.sin(s.walk || 0);
  g.lineCap = 'round';
  g.strokeStyle = P.tail || P.base; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(0, -2.6); g.quadraticCurveTo(0.6, 0.2, 1.8 + Math.sin(t * 3) * 0.9, 1.4); g.stroke();
  for (const [sx, d] of [[-2.2, k], [2.2, -k]]) {
    g.fillStyle = P.leg || P.base; ell(g, sx, -1.6 + d * 1.1, 1.3, 1.6); g.fill();
    g.fillStyle = P.paw; ell(g, sx * 1.05, -0.4 + d * 1.1, 1, 0.6); g.fill();
  }
  ell(g, 0, -5.2, 3.4, 3.7);
  g.fillStyle = grad(g, -3, 0, 3, 0, [[0, P.shade], [0.5, P.light], [1, P.shade]]);
  g.fill();
  g.save(); g.clip();
  if (P.pattern === 'tabby' || P.pattern === 'candy') {
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = P.pattern === 'candy' && i % 2 ? P.stripe2 : P.stripe; g.lineWidth = P.pattern === 'candy' ? 1 : 0.7;
      g.beginPath(); g.moveTo(-3.4, -7.8 + i * 1.7); g.quadraticCurveTo(0, -7 + i * 1.7, 3.4, -7.8 + i * 1.7); g.stroke();
    }
  } else if (P.pattern === 'calico') {
    g.fillStyle = P.patch; ell(g, -1.6, -6, 1.8, 1.4); g.fill();
    g.fillStyle = P.stripe; ell(g, 1.8, -4.2, 1.4, 1.2); g.fill();
  }
  g.restore();
  for (const [sx, d] of [[-2.6, -k], [2.6, k]]) {
    g.strokeStyle = P.leg || P.base; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(sx * 0.8, -7.4); g.lineTo(sx * 1.15, -9.8 + d * 1.3); g.stroke();
    g.fillStyle = P.paw; g.beginPath(); g.arc(sx * 1.15, -10 + d * 1.3, 0.9, 0, 7); g.fill();
  }
  g.fillStyle = P.pattern === 'pointed' ? P.stripe : P.base;
  for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(s2 * 2.9, -10.4); g.lineTo(s2 * 2.3, -13.6); g.lineTo(s2 * 0.6, -11.8); g.closePath(); g.fill(); }
  ell(g, 0, -9.9, 3.1, 2.7);
  g.fillStyle = grad(g, -3, 0, 3, 0, [[0, P.shade], [0.5, P.light], [1, P.shade]]);
  g.fill();
  if (P.pattern === 'tabby') {
    g.strokeStyle = P.stripe; g.lineWidth = 0.5;
    g.beginPath(); for (const sx of [-0.9, 0, 0.9]) { g.moveTo(sx, -12.4); g.lineTo(sx * 0.8, -10.6); } g.stroke();
  }
}

// Caught: the cat's fur stands on end, it leaps, then vanishes in a puff. k runs 0..1.
function drawCatScared(g, x, y, P, k, t, face) {
  if (k < 0.55) {
    const j = k / 0.55;
    const lift = Math.sin(j * Math.PI) * 6;
    drawCat(g, x, y - lift, P, { face, mode: 'stand', puff: Math.min(1, j * 3) }, t);
    g.save();
    g.font = '700 6px "Fredoka", sans-serif';
    g.textAlign = 'center';
    g.lineWidth = 1.2; g.strokeStyle = '#ffffff'; g.fillStyle = '#ff4f7a';
    g.strokeText('!', x + 6, y - 4 - lift); g.fillText('!', x + 6, y - 4 - lift);
    g.restore();
    return;
  }
  const j = (k - 0.55) / 0.45;
  g.save();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3, d = 2 + j * 7;
    g.globalAlpha = 1 - j;
    g.fillStyle = i % 3 === 0 ? P.base : '#ffffff';
    g.beginPath(); g.arc(x + 6 + Math.cos(a) * d, y + 6 + Math.sin(a) * d * 0.8, 2.6 * (1 - j * 0.4), 0, 7); g.fill();
  }
  for (let i = 0; i < 4; i++) {
    g.globalAlpha = 1 - j;
    sparkle(g, x + 6 + Math.cos(i * 1.6 + 0.4) * (4 + j * 9), y + 4 + Math.sin(i * 1.6 + 0.4) * (4 + j * 7), 1.3, '#ffe36a');
  }
  g.restore();
}

// A new life: sparkles swirl in and the cat fades in among them. k runs 0..1.
function drawCatArrive(g, x, y, P, k, t) {
  g.save();
  g.globalAlpha = Math.max(0, (k - 0.5) / 0.5);
  drawCat(g, x, y, P, { face: 1, mode: 'stand' }, t);
  g.restore();
  for (let i = 0; i < 18; i++) {
    const a = hash(i, 3, 3) * Math.PI * 2 + k * 4, d = (1 - k) * (30 + hash(i, 4, 3) * 40);
    g.globalAlpha = Math.min(1, k * 3) * (1 - Math.max(0, (k - 0.8) / 0.2));
    sparkle(g, x + 6 + Math.cos(a) * d, y + 6 + Math.sin(a) * d, 1.1, [P.base === '#fbf9f6' ? '#ffd0e0' : P.base, '#ffffff', '#ffe36a'][i % 3]);
  }
  g.globalAlpha = 1;
}

// ---------- the mouse ----------

// x, y is the top-left of the mouse's 2 x 2 squares. state: 'sleep', 'waking' (k 0..1), 'awake', 'happy'.
function drawMouseHome(g, x, y, M, state, k, t) {
  // the mouse hole behind it
  const bx = x + 12, by = y + 24;
  g.fillStyle = grad(g, 0, by - 12, 0, by, [[0, '#8a5a3a'], [1, '#6a4028']]);
  g.beginPath(); g.moveTo(bx - 7.4, by); g.lineTo(bx - 7.4, by - 6); g.arc(bx, by - 6, 7.4, Math.PI, 0); g.lineTo(bx + 7.4, by); g.closePath(); g.fill();
  g.fillStyle = grad(g, 0, by - 11, 0, by, [[0, '#1e1420'], [1, '#3a2830']]);
  g.beginPath(); g.moveTo(bx - 5.8, by); g.lineTo(bx - 5.8, by - 6); g.arc(bx, by - 6, 5.8, Math.PI, 0); g.lineTo(bx + 5.8, by); g.closePath(); g.fill();
  g.save();
  g.translate(bx, by);
  g.scale(1.3, 1.3);
  if (state === 'sleep' || (state === 'waking' && k < 0.4)) mouseAsleep(g, M, t);
  else mouseAwake(g, M, t, state === 'happy', state === 'waking' ? k : 1);
  g.restore();
  if (state === 'sleep') {
    g.save();
    g.font = '700 4px "Fredoka", sans-serif';
    g.fillStyle = '#7a86c8';
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.5 + i / 3) % 1;
      g.globalAlpha = Math.sin(p * Math.PI);
      g.font = `700 ${2.6 + p * 2.4}px "Fredoka", sans-serif`;
      g.fillText('z', bx + 4 + p * 5, by - 7 - p * 9);
    }
    g.restore();
  }
  if (state === 'waking' && k < 0.8) {
    g.save();
    g.font = '700 7px "Fredoka", sans-serif'; g.textAlign = 'center';
    g.lineWidth = 1.2; g.strokeStyle = '#ffffff'; g.fillStyle = '#ff6a8a';
    const lift = Math.sin(Math.min(1, k * 3) * Math.PI / 2) * 3;
    g.strokeText('!', bx + 3, by - 13 - lift); g.fillText('!', bx + 3, by - 13 - lift);
    g.restore();
  }
}

function mouseAsleep(g, M, t) {
  const br = 1 + Math.sin(t * 2.2) * 0.04;
  g.scale(br, 1 / br);
  // tail curled round the front
  g.strokeStyle = '#f2a8b8'; g.lineWidth = 0.6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-3.6, -1); g.quadraticCurveTo(-5.6, 0.2, -3, 0.2); g.lineTo(2, 0.2); g.stroke();
  g.fillStyle = grad(g, 0, -5.4, 0, 0, [[0, mix(M.fur, '#ffffff', 0.25)], [1, M.shade]]);
  ell(g, -0.6, -2.5, 4, 2.6); g.fill();
  ell(g, 2.4, -2.2, 2.3, 1.9); g.fill();
  g.fillStyle = M.fur; g.beginPath(); g.arc(1.5, -4.2, 1.6, 0, 7); g.fill();
  g.fillStyle = '#f7b8c6'; g.beginPath(); g.arc(1.5, -4.2, 1, 0, 7); g.fill();
  g.strokeStyle = 'rgba(60,40,50,0.8)'; g.lineWidth = 0.3;
  g.beginPath(); g.arc(2.9, -2.4, 0.55, 0.2, Math.PI - 0.2); g.stroke();
  g.fillStyle = '#f48aa2'; g.beginPath(); g.arc(4.6, -1.8, 0.45, 0, 7); g.fill();
}

function mouseAwake(g, M, t, happy, k) {
  const hop = happy ? Math.abs(Math.sin(t * 7)) * 2.5 : Math.abs(Math.sin(t * 3)) * 0.6;
  g.translate(0, -hop);
  g.scale(0.8 + k * 0.2, 0.8 + k * 0.2);
  g.strokeStyle = '#f2a8b8'; g.lineWidth = 0.6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(1.8, -1.2); g.bezierCurveTo(5, -0.8, 5.6, -4, 4.2 + Math.sin(t * 3) * 0.6, -5.4); g.stroke();
  g.fillStyle = M.shade; ell(g, -1.4, -0.3, 1.1, 0.5); g.fill(); ell(g, 1.4, -0.3, 1.1, 0.5); g.fill();
  g.fillStyle = grad(g, 0, -7, 0, 0, [[0, mix(M.fur, '#ffffff', 0.2)], [1, M.shade]]);
  ell(g, 0, -3.2, 2.9, 3.1); g.fill();
  g.fillStyle = M.belly; ell(g, 0, -2.6, 1.8, 2.1); g.fill();
  // ears
  for (const s of [-1, 1]) {
    g.fillStyle = M.fur; g.beginPath(); g.arc(s * 2.3, -9.3, 1.9, 0, 7); g.fill();
    g.fillStyle = '#f7b8c6'; g.beginPath(); g.arc(s * 2.3, -9.3, 1.2, 0, 7); g.fill();
  }
  g.fillStyle = grad(g, 0, -10, 0, -5, [[0, mix(M.fur, '#ffffff', 0.2)], [1, M.fur]]);
  ell(g, 0, -7.3, 2.6, 2.3); g.fill();
  // eyes, nose, whiskers
  g.fillStyle = '#1d1b26';
  for (const s of [-1, 1]) { ell(g, s * 0.95, -7.7, 0.48, 0.62); g.fill(); }
  g.fillStyle = '#ffffff';
  for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 0.95 + 0.18, -7.95, 0.18, 0, 7); g.fill(); }
  g.fillStyle = '#f48aa2'; g.beginPath(); g.arc(0, -6.4, 0.5, 0, 7); g.fill();
  g.strokeStyle = 'rgba(80,60,70,0.5)'; g.lineWidth = 0.16;
  g.beginPath(); for (const s of [-1, 1]) for (const d of [-0.4, 0.4]) { g.moveTo(s * 0.8, -6.3); g.lineTo(s * 3.6, -6.4 + d); } g.stroke();
  if (happy) { g.fillStyle = 'rgba(255,140,170,0.5)'; for (const s of [-1, 1]) { ell(g, s * 1.7, -6.6, 0.55, 0.35); g.fill(); } }
  // paws: one waving
  g.fillStyle = M.fur;
  const wave = Math.sin(t * (happy ? 12 : 6)) * 0.5;
  ell(g, -1.4, -3.6, 0.7, 0.55); g.fill();
  g.save(); g.translate(2.2, -4.2); g.rotate(-1.1 + wave); ell(g, 0, -1.4, 0.6, 1.4); g.fill(); g.restore();
}

// ---------- the dog, the vacuum and the bouncy ball ----------

const DOG = { body: '#d49a5c', light: '#f0c890', shade: '#a86e38', ear: '#7a4a28', white: '#fff8ee', nose: '#2a2226', collar: '#e8475a' };

// x, y is the top-left of the dog's square. pose: 'run' (step 0..), 'climb', 'fall', 'sit'.
function drawDog(g, x, y, face, pose, step, t) {
  g.save();
  g.translate(x + 6, y + 12);
  if (pose !== 'climb' && pose !== 'fall') { g.fillStyle = 'rgba(40, 20, 40, 0.16)'; ell(g, 0, 0.1, 5, 0.8); g.fill(); }
  if (pose === 'climb') { dogClimbing(g, step, t); g.restore(); return; }
  g.scale(face, 1);
  if (pose === 'sit') { dogSitting(g, t); g.restore(); return; }
  const w = step * Math.PI / 2;
  g.translate(0, -Math.abs(Math.sin(w)) * 0.5);
  // tail, wagging
  g.strokeStyle = DOG.body; g.lineWidth = 1.3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-4.6, -5.6); g.quadraticCurveTo(-6.4, -7, -6.4 + Math.sin(t * 14) * 1.2, -9.2); g.stroke();
  g.fillStyle = DOG.white; g.beginPath(); g.arc(-6.4 + Math.sin(t * 14) * 1.2, -9.2, 0.65, 0, 7); g.fill();
  const leg = (hx, ph, far) => {
    const fx = hx + (pose === 'run' ? Math.sin(ph) * 1.4 : 0), fy = pose === 'run' ? -Math.max(0, Math.cos(ph)) * 0.9 : 0;
    g.strokeStyle = far ? DOG.shade : DOG.body; g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(hx, -3.6); g.lineTo(fx, fy - 0.7); g.stroke();
    g.fillStyle = far ? '#e8dccb' : DOG.white; ell(g, fx + 0.3, fy - 0.5, 1.05, 0.6); g.fill();
  };
  leg(-2.4, w, true); leg(3.4, w + Math.PI, true);
  g.fillStyle = grad(g, 0, -7.4, 0, -2, [[0, DOG.light], [0.45, DOG.body], [1, DOG.shade]]);
  ell(g, -0.4, -4.8, 4.9, 2.7); g.fill();
  g.fillStyle = DOG.white; ell(g, 0.8, -2.8, 3.2, 1.1); g.fill();
  g.fillStyle = DOG.ear; ell(g, -2.4, -6.2, 1.8, 1.2, 0.2); g.fill();
  leg(-3.6, w + Math.PI, false); leg(2.4, w, false);
  dogHead(g, t, pose === 'run', false);
  g.restore();
}

function dogHead(g, t, panting, happy) {
  const hx = 3.9, hy = -8;
  g.fillStyle = DOG.collar; g.save(); g.translate(2.6, -5.9); g.rotate(-0.5); rrect(g, -1.6, -0.5, 3.2, 1, 0.4); g.fill(); g.restore();
  g.fillStyle = '#ffd34a'; g.beginPath(); g.arc(3.2, -5, 0.5, 0, 7); g.fill();
  g.fillStyle = grad(g, 0, hy - 3, 0, hy + 3, [[0, DOG.light], [1, DOG.body]]);
  ell(g, hx, hy, 3, 2.7); g.fill();
  g.fillStyle = DOG.white; ell(g, hx + 2.3, hy + 1, 2, 1.4); g.fill();
  g.fillStyle = DOG.nose; ell(g, hx + 3.9, hy + 0.3, 0.75, 0.6); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(hx + 3.7, hy + 0.05, 0.22, 0, 7); g.fill();
  if (happy) {
    g.strokeStyle = '#2a2226'; g.lineWidth = 0.35; g.lineCap = 'round';
    g.beginPath(); g.arc(hx + 0.9, hy - 0.4, 0.55, Math.PI + 0.3, -0.3); g.stroke();
  } else {
    g.fillStyle = '#2a2226'; ell(g, hx + 0.9, hy - 0.6, 0.6, 0.72); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(hx + 1.1, hy - 0.85, 0.22, 0, 7); g.fill();
  }
  if (panting) { g.fillStyle = '#ff8aa4'; ell(g, hx + 2.6, hy + 2.3 + Math.sin(t * 16) * 0.2, 0.7, 1); g.fill(); }
  // floppy ear
  g.save(); g.translate(hx - 1.2, hy - 1.6); g.rotate(0.35 + Math.sin(t * 9) * 0.15);
  g.fillStyle = DOG.ear; ell(g, 0, 1.8, 1.25, 2.4); g.fill();
  g.restore();
}

function dogSitting(g, t) {
  g.strokeStyle = DOG.body; g.lineWidth = 1.3; g.lineCap = 'round';
  const wag = Math.sin(t * 18) * 1.4;
  g.beginPath(); g.moveTo(-3.4, -1.4); g.quadraticCurveTo(-5.6, -1.6, -6 + wag * 0.3, -3.6 - Math.abs(wag) * 0.4); g.stroke();
  g.fillStyle = DOG.shade; ell(g, -2, -1.6, 2.4, 1.6); g.fill();
  g.fillStyle = grad(g, 0, -8, 0, 0, [[0, DOG.light], [1, DOG.shade]]);
  ell(g, 0.2, -4, 3.2, 3.6, -0.25); g.fill();
  g.fillStyle = DOG.white; ell(g, 1.4, -3.4, 1.6, 2.4, -0.25); g.fill();
  g.strokeStyle = DOG.body; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(1.8, -3); g.lineTo(2.4, -0.6); g.stroke();
  g.fillStyle = DOG.white; ell(g, 2.6, -0.4, 1, 0.55); g.fill();
  g.save(); g.translate(-0.4, -1.4); dogHead(g, t, false, true); g.restore();
  // a bone in its mouth
  g.save(); g.translate(6.4, -7.4); g.rotate(0.2);
  g.fillStyle = '#fffaf0';
  g.fillRect(-1.8, -0.5, 3.6, 1);
  for (const [a, b] of [[-1.9, -0.5], [-1.9, 0.5], [1.9, -0.5], [1.9, 0.5]]) { g.beginPath(); g.arc(a, b, 0.6, 0, 7); g.fill(); }
  g.restore();
}

function dogClimbing(g, step, t) {
  const k = step % 2 ? 1 : -1;
  g.strokeStyle = DOG.body; g.lineWidth = 1.3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -2.4); g.lineTo(Math.sin(t * 14) * 1.4, 0.6); g.stroke();
  for (const s of [-1, 1]) { g.fillStyle = DOG.shade; ell(g, s * 2.2, -1.6 + s * k * 0.8, 1.3, 1.5); g.fill(); }
  g.fillStyle = grad(g, -3, 0, 3, 0, [[0, DOG.shade], [0.5, DOG.light], [1, DOG.shade]]);
  ell(g, 0, -5.2, 3.4, 3.6); g.fill();
  g.fillStyle = DOG.ear; ell(g, 1, -5.6, 1.6, 1.2); g.fill();
  for (const s of [-1, 1]) {
    g.strokeStyle = DOG.body; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(s * 2.2, -7.2); g.lineTo(s * 3, -9.6 - s * k * 1.2); g.stroke();
    g.fillStyle = DOG.white; g.beginPath(); g.arc(s * 3, -9.8 - s * k * 1.2, 0.85, 0, 7); g.fill();
  }
  g.fillStyle = DOG.collar; rrect(g, -2, -8.4, 4, 0.9, 0.4); g.fill();
  g.fillStyle = grad(g, -3, 0, 3, 0, [[0, DOG.body], [0.5, DOG.light], [1, DOG.body]]);
  ell(g, 0, -10, 2.8, 2.5); g.fill();
  for (const s of [-1, 1]) { g.fillStyle = DOG.ear; ell(g, s * 2.6, -9.4, 1.1, 2, s * 0.3); g.fill(); }
}

// A robot vacuum on its rounds. stopped while the dogs are busy with a bone.
function drawVacuum(g, x, y, face, t, stopped) {
  g.save();
  g.translate(x + 6, y + 12);
  g.fillStyle = 'rgba(40, 20, 40, 0.16)'; ell(g, 0, 0.1, 6, 0.8); g.fill();
  g.scale(face, 1);
  // brushes at the front, spinning
  const a = stopped ? 0 : t * 20;
  g.strokeStyle = '#8a90a0'; g.lineWidth = 0.35;
  for (let i = 0; i < 3; i++) { const b = a + i * 2.1; g.beginPath(); g.moveTo(5, -0.6); g.lineTo(5 + Math.cos(b) * 1.4, -0.6 + Math.sin(b) * 0.5); g.stroke(); }
  g.fillStyle = grad(g, 0, -4.6, 0, 0, [[0, '#ffffff'], [0.5, '#dfe3ea'], [1, '#9aa1ae']]);
  rrect(g, -5.8, -4.4, 11.6, 4, 2); g.fill();
  g.fillStyle = '#6e7a92';
  rrect(g, -5.8, -1.6, 11.6, 1.2, 0.6); g.fill();
  g.fillStyle = '#c7ccd6'; ell(g, 0, -4.4, 4.2, 0.9); g.fill();
  // sleepy little face
  g.fillStyle = stopped ? '#9aa1ae' : (Math.floor(t * 3) % 2 ? '#5ac8ff' : '#2a9ae0');
  g.save(); if (!stopped) { g.shadowColor = '#5ac8ff'; g.shadowBlur = 2; }
  rrect(g, 2.4, -3.3, 1.2, 0.8, 0.4); g.fill(); rrect(g, 4.2, -3.3, 1.2, 0.8, 0.4); g.fill();
  g.restore();
  g.fillStyle = '#3a3f4e'; g.beginPath(); g.arc(-3.4, 0.1, 0.8, 0, 7); g.fill(); g.beginPath(); g.arc(3.4, 0.1, 0.8, 0, 7); g.fill();
  g.restore();
  if (stopped) {
    g.save(); g.font = '700 3.5px "Fredoka", sans-serif'; g.fillStyle = '#7a86c8';
    g.globalAlpha = 0.5 + Math.sin(t * 3) * 0.4; g.fillText('z', x + 9, y + 5);
    g.restore();
  }
}

// A beach ball bouncing between floor and ceiling; squashed where it touches.
function drawBall(g, x, y, frame, t) {
  const r = 4.6;
  let cx = x + 6, cy = y + 6, sx = 1, sy = 1;
  if (frame === 12) { sy = 0.78; sx = 1.18; cy = y + 12 - r * sy; }
  if (frame === 15) { sy = 0.78; sx = 1.18; cy = y + r * sy; }
  g.save();
  g.fillStyle = 'rgba(40, 20, 40, 0.12)'; ell(g, cx, y + 12, 3.6 * sx, 0.6); g.fill();
  g.translate(cx, cy); g.scale(sx, sy); g.rotate(t * 2.5);
  g.beginPath(); g.arc(0, 0, r, 0, 7); g.clip();
  const cols = ['#ff6a7a', '#ffffff', '#ffd23a', '#ffffff', '#4aa8ff', '#ffffff'];
  cols.forEach((c, i) => {
    g.fillStyle = c;
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, (i / 6) * Math.PI * 2, ((i + 1) / 6) * Math.PI * 2); g.closePath(); g.fill();
  });
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 0.9, 0, 7); g.fill();
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.55)'; ell(g, cx - 1.6 * sx, cy - 1.8 * sy, 1.3, 0.7, -0.6); g.fill();
}

// Pop-up pickups that appear now and then: 0 bubble (shield), 1 bone (dogs sit), 2 yarn ball.
function drawPickup(g, kind, x, y, t, fading) {
  if (fading && Math.floor(t * 10) % 2) return;
  const s = 1 + Math.sin(t * 6) * 0.06;
  g.save();
  g.translate(x + 6, y + 6); g.scale(s, s); g.translate(-x - 6, -y - 6);
  if (kind === 0) {
    const gr = g.createRadialGradient(x + 5, y + 5, 0.5, x + 6, y + 6, 5);
    gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.6, 'rgba(170, 220, 255, 0.35)'); gr.addColorStop(1, 'rgba(200, 160, 255, 0.75)');
    g.fillStyle = gr; g.beginPath(); g.arc(x + 6, y + 6, 4.6, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.9)'; ell(g, x + 4.4, y + 4.2, 1.2, 0.6, -0.7); g.fill();
  } else if (kind === 1) drawBone(g, x, y - 2.5, t);
  else drawYarn(g, x, y, false, t);
  g.restore();
}

// The bubble round the cat while the shield lasts.
function drawBubble(g, x, y, t, blink) {
  if (blink && Math.floor(t * 12) % 2) return;
  const r = 8.2 + Math.sin(t * 4) * 0.4;
  g.save();
  const gr = g.createRadialGradient(x + 6, y + 6, r * 0.6, x + 6, y + 6, r);
  gr.addColorStop(0, 'rgba(180, 230, 255, 0)'); gr.addColorStop(0.85, 'rgba(180, 230, 255, 0.22)'); gr.addColorStop(1, 'rgba(230, 200, 255, 0.7)');
  g.fillStyle = gr; g.beginPath(); g.arc(x + 6, y + 6, r, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.75)'; ell(g, x + 2.4, y + 1.6, 2, 0.8, -0.7); g.fill();
  g.restore();
}

// A box being knocked away: it tips over and flies off the way it was swiped. k runs 0..1.
function drawBoxKnocked(g, x, y, k, dir) {
  const [dx, dy] = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]][dir] || [0, 0];
  g.save();
  g.globalAlpha = 1 - k;
  g.translate(x + 6 + dx * k * 10, y + 6 + dy * k * 10 - Math.sin(k * Math.PI) * 4);
  g.rotate((dx || 1) * k * 1.6);
  g.scale(1 - k * 0.4, 1 - k * 0.4);
  drawBox(g, -6, -6);
  g.restore();
  for (let i = 0; i < 6; i++) {
    g.globalAlpha = 1 - k;
    g.fillStyle = i % 2 ? '#d6a466' : '#fff0d0';
    g.beginPath(); g.arc(x + 6 + (hash(i, 1, 9) - 0.5) * 14 * k, y + 6 + (hash(i, 2, 9) - 0.5) * 14 * k, 0.7, 0, 7); g.fill();
  }
  g.globalAlpha = 1;
}

// Floating hearts, for the happy ending of a level.
function drawHearts(g, x, y, t) {
  for (let i = 0; i < 5; i++) {
    const p = (t * 0.6 + i / 5) % 1;
    g.globalAlpha = Math.sin(p * Math.PI);
    g.fillStyle = ['#ff7aa0', '#ffb0c8', '#ff5a88'][i % 3];
    heartPath(g, x + Math.sin(p * 6 + i) * 4 + (i - 2) * 3, y - p * 20, 1.4 + (i % 2) * 0.6);
    g.fill();
  }
  g.globalAlpha = 1;
}
