import { $, copy } from '../lib/ui.js';

const SETS = { upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower: 'abcdefghijklmnopqrstuvwxyz', digits: '0123456789', symbols: '!@#$%^&*()-_=+[]{};:,.?/' };
const WORDS = 'apple river stone cloud maple tiger lemon ocean pixel candle rocket garden silver forest planet window copper meadow harbor falcon velvet quartz ember lantern orbit prism canyon willow thunder cactus breeze marble glacier nectar saddle violet walnut zephyr bamboo cobalt dune fable ginger hazel ivory jasmine kettle lagoon mango nimbus olive pepper quiver raven saffron tundra umber vortex wander yonder zinnia amber bronze cedar delta echo fjord granite horizon island jungle kiwi lotus mosaic nova onyx pebble radar sierra tango unity valley wafer yacht atlas beacon comet dragon elm frost grove hollow indigo jade koala lunar mirth north opal plume quest ridge summit timber ultra vista whisk'.split(' ');

// Unbiased random integer in [0, n) via rejection sampling.
function rand(n) {
  const max = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= max);
  return buf[0] % n;
}

function show(pw, bits) {
  $('#out').textContent = pw;
  const pct = Math.min(100, (bits / 128) * 100);
  const m = $('#meter');
  m.style.width = `${pct}%`;
  m.style.background = bits < 50 ? 'var(--danger)' : bits < 80 ? '#F5C542' : 'var(--accent)';
  $('#strength').textContent = `${bits < 50 ? 'Weak' : bits < 80 ? 'Good' : 'Very strong'} · about ${Math.round(bits)} bits of entropy`;
}

function generate() {
  const chosen = Object.keys(SETS).filter((k) => $(`#${k}`).checked);
  if (!chosen.length) { $('#out').textContent = 'Pick at least one character set.'; return; }
  const strip = (s) => ($('#ambig').checked ? s.replace(/[l1IO0o]/g, '') : s);
  const sets = chosen.map((k) => strip(SETS[k]));
  const pool = sets.join('');
  const len = Number($('#len').value);
  // Guarantee one of each chosen set, then fill and shuffle.
  const chars = sets.map((s) => s[rand(s.length)]);
  while (chars.length < len) chars.push(pool[rand(pool.length)]);
  for (let i = chars.length - 1; i > 0; i--) { const j = rand(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  show(chars.join(''), len * Math.log2(pool.length));
}

$('#len').addEventListener('input', (e) => { $('#len-val').textContent = e.target.value; generate(); });
['upper', 'lower', 'digits', 'symbols', 'ambig'].forEach((id) => $(`#${id}`).addEventListener('change', generate));
$('#regen').addEventListener('click', generate);
$('#copy').addEventListener('click', () => copy($('#out').textContent, 'Password copied'));
$('#phrase').addEventListener('click', () => {
  const words = Array.from({ length: 5 }, () => WORDS[rand(WORDS.length)]);
  show(`${words.join('-')}-${rand(100)}`, 5 * Math.log2(WORDS.length) + Math.log2(100));
});
generate();
