/* SecurePass: password generation, entropy and strength rating. */
(function (g) {
  'use strict';
  const SP = g.SP;
  const SETS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.?'
  };
  const LOOKALIKES = 'Il1O0';

  /** One character pool per enabled category (look-alikes removed if requested). */
  SP.buildPools = function (o) {
    return Object.keys(SETS)
      .filter((k) => o[k])
      .map((k) => (o.avoid ? [...SETS[k]].filter((c) => !LOOKALIKES.includes(c)).join('') : SETS[k]))
      .filter((p) => p.length > 0);
  };

  SP.poolSize = (o) => new Set(SP.buildPools(o).join('')).size;

  /** Entropy (bits) = length x log2(pool size). An estimate only. */
  SP.entropy = function (o) {
    const size = SP.poolSize(o);
    return size > 1 ? o.length * Math.log2(size) : 0;
  };

  /**
   * Generates one password. Guarantees at least one character from every enabled category,
   * fills the rest from the combined pool, then shuffles so the guaranteed ones are not at the front.
   */
  SP.generate = function (o) {
    const pools = SP.buildPools(o);
    if (!pools.length) throw new Error('Pick at least one character type.');
    const length = Math.min(128, Math.max(pools.length, Math.floor(o.length) || 20));
    const all = pools.join('');
    const chars = pools.map((p) => p[SP.randomInt(p.length)]);
    while (chars.length < length) chars.push(all[SP.randomInt(all.length)]);
    return SP.shuffle(chars).join('');
  };

  const LEVELS = [
    { max: 28, label: 'Very Weak', segments: 1, note: 'Easy to guess. Add length and more character types.' },
    { max: 36, label: 'Weak', segments: 2, note: 'Only for throwaway accounts.' },
    { max: 60, label: 'Medium', segments: 3, note: 'Fine for low-risk accounts. Longer is better.' },
    { max: 80, label: 'Strong', segments: 4, note: 'Good for most accounts.' },
    { max: Infinity, label: 'Excellent', segments: 5, note: 'Far beyond what offline brute force can reach today.' }
  ];
  SP.rate = (bits) => LEVELS.find((l) => bits < l.max);
})(globalThis);
