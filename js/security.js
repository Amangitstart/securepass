/* SecurePass: security primitives. Everything runs locally; nothing is logged, sent or stored. */
(function (g) {
  'use strict';
  const SP = (g.SP = g.SP || {});

  /**
   * Unbiased random integer in [0, max) using the Web Crypto CSPRNG.
   * Rejection sampling: values in the uneven tail of the 32-bit range are discarded,
   * so `% max` never favours small numbers (no modulo bias).
   */
  SP.randomInt = function (max) {
    if (!Number.isInteger(max) || max <= 0 || max > 4294967296) throw new RangeError('max out of range');
    const buf = new Uint32Array(1);
    const limit = Math.floor(4294967296 / max) * max;
    do { g.crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % max;
  };

  /** Fisher-Yates shuffle driven by SP.randomInt (secure and unbiased). Mutates and returns the array. */
  SP.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = SP.randomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
})(globalThis);
