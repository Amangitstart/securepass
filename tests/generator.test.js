// Run: node tests/generator.test.js  (Node 19+)
require('../js/security.js'); require('../js/generator.js');
const SP = globalThis.SP, assert = require('assert');
const all = { length: 20, lower: true, upper: true, digits: true, symbols: true, avoid: false };
const has = { lower: /[a-z]/, upper: /[A-Z]/, digits: /[0-9]/, symbols: /[^A-Za-z0-9]/ };
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('PASS', name); };

ok('all categories present in 3000 passwords', () => { for (let i = 0; i < 3000; i++) { const p = SP.generate(all); Object.values(has).forEach((re) => assert(re.test(p))); assert.equal(p.length, 20); } });
ok('lowercase only', () => { for (let i = 0; i < 500; i++) assert(/^[a-z]{20}$/.test(SP.generate({ ...all, upper: false, digits: false, symbols: false }))); });
ok('numbers only', () => { for (let i = 0; i < 500; i++) assert(/^[0-9]{20}$/.test(SP.generate({ ...all, lower: false, upper: false, symbols: false }))); });
ok('symbols disabled', () => { for (let i = 0; i < 500; i++) assert(/^[A-Za-z0-9]{20}$/.test(SP.generate({ ...all, symbols: false }))); });
ok('look-alikes excluded', () => { for (let i = 0; i < 2000; i++) assert(!/[Il1O0]/.test(SP.generate({ ...all, avoid: true }))); });
ok('lengths 8 and 128', () => { assert.equal(SP.generate({ ...all, length: 8 }).length, 8); assert.equal(SP.generate({ ...all, length: 128 }).length, 128); });
ok('empty selection throws', () => assert.throws(() => SP.generate({ ...all, lower: false, upper: false, digits: false, symbols: false })));
ok('entropy ~ length * log2(pool)', () => assert(Math.abs(SP.entropy(all) - 20 * Math.log2(SP.poolSize(all))) < 1e-9));
ok('ratings', () => { assert.equal(SP.rate(10).label, 'Very Weak'); assert.equal(SP.rate(30).label, 'Weak'); assert.equal(SP.rate(50).label, 'Medium'); assert.equal(SP.rate(70).label, 'Strong'); assert.equal(SP.rate(128).label, 'Excellent'); });
ok('randomInt unbiased (chi-square, 6 buckets)', () => { const c = Array(6).fill(0), N = 60000; for (let i = 0; i < N; i++) c[SP.randomInt(6)]++; const chi = c.reduce((s, x) => s + (x - N / 6) ** 2 / (N / 6), 0); assert(chi < 20.5, 'chi=' + chi); });
ok('no Math.random in source', () => { const fs = require('fs'); ['security', 'generator', 'history', 'app'].forEach((f) => assert(!/Math\.random|console\./.test(fs.readFileSync(`js/${f}.js`, 'utf8')))); });
console.log(`\nALL ${n} TESTS PASSED`);
