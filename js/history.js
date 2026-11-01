/* SecurePass: history stores ONLY non-sensitive metadata (date, length, rating, bits). Never passwords. */
(function (g) {
  'use strict';
  const KEY = 'securepass.history', MAX = 20;
  function list() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function add(e) {
    const item = { at: new Date().toISOString(), length: +e.length || 0, rating: String(e.rating), bits: +e.bits || 0 };
    try { localStorage.setItem(KEY, JSON.stringify([item, ...list()].slice(0, MAX))); } catch (err) { /* storage unavailable */ }
  }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
  g.SP.history = { list, add, clear };
})(globalThis);
