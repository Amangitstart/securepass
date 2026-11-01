/* SecurePass: UI wiring. No passwords are logged or persisted. */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const state = { pws: [] };
  const meter = $('#meter'), demoMeter = $('#demo-meter');
  [meter, demoMeter].forEach((m) => { for (let i = 0; i < 5; i++) m.append(document.createElement('span')); });

  const readOpts = () => ({
    length: +$('#len').value, lower: $('#o-lower').checked, upper: $('#o-upper').checked,
    digits: $('#o-digits').checked, symbols: $('#o-symbols').checked, avoid: $('#o-avoid').checked
  });
  const readCount = () => { const n = Math.floor(+$('#count').value); return Math.min(20, Math.max(1, isNaN(n) ? 5 : n)); };
  const setMeter = (el, n) => { [...el.children].forEach((s, i) => s.classList.toggle('on', i < n)); el.dataset.level = n; };

  /* ---------- clipboard + toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 1800);
  }
  async function copy(text, label) {
    if (!text) return toast('Nothing to copy');
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.readOnly = true; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.append(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove();
      if (!ok) return toast('Copy failed. Select the text instead.');
    }
    toast(label || 'Copied');
  }

  /* ---------- generator ---------- */
  function renderList() {
    const ul = $('#list'); ul.replaceChildren();
    const more = state.pws.slice(1);
    $('#morecard').hidden = more.length === 0;
    more.forEach((pw, i) => {
      const li = document.createElement('li'), s = document.createElement('span'), b = document.createElement('button');
      s.className = 'mono'; s.textContent = pw;
      b.type = 'button'; b.className = 'icon'; b.dataset.copy = String(i + 1);
      b.setAttribute('aria-label', 'Copy password ' + (i + 2));
      b.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-copy"/></svg>';
      li.append(s, b); ul.append(li);
    });
  }
  function refresh(record) {
    const o = readOpts(), n = readCount(), pwEl = $('#pw'), verdict = $('#verdict');
    try {
      const list = Array.from({ length: n }, () => SP.generate(o));
      const bits = SP.entropy(o), r = SP.rate(bits);
      state.pws = list;
      pwEl.textContent = list[0]; pwEl.classList.remove('err');
      setMeter(meter, r.segments);
      verdict.textContent = '';
      const b = document.createElement('strong'); b.textContent = r.label;
      verdict.append(b, ` · ${Math.round(bits)} bits of entropy · ${r.note}`);
      if (record) SP.history.add({ length: list[0].length, rating: r.label, bits: Math.round(bits) });
    } catch (e) {
      state.pws = [];
      pwEl.textContent = e.message; pwEl.classList.add('err');
      setMeter(meter, 0); verdict.textContent = 'Turn on a character type to generate.';
    }
    renderList();
  }

  $('#len').addEventListener('input', () => { $('#lenout').textContent = $('#len').value; refresh(false); });
  $$('.opt').forEach((el) => el.addEventListener('change', () => refresh(false)));
  $('#count').addEventListener('input', () => refresh(false));
  $('#count').addEventListener('change', () => { $('#count').value = readCount(); refresh(false); });
  $('#new').addEventListener('click', () => refresh(true));
  $('#copy-main').addEventListener('click', () => copy(state.pws[0]));
  $('#copyall').addEventListener('click', () => copy(state.pws.map((p, i) => `${i + 1}. ${p}`).join('\n'), 'Copied all'));
  $('#list').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-copy]'); if (b) copy(state.pws[+b.dataset.copy]);
  });

  /* ---------- history views ---------- */
  const fmt = (h) => `${h.length} chars · ${h.rating} · ${h.bits} bits`;
  function fillHistory(ul, items, emptyMsg) {
    ul.replaceChildren();
    if (!items.length) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = emptyMsg; ul.append(li); return; }
    items.forEach((h) => {
      const li = document.createElement('li'), a = document.createElement('strong'), b = document.createElement('span');
      a.textContent = new Date(h.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); b.textContent = fmt(h);
      li.append(a, b); ul.append(li);
    });
  }
  const renderRecent = () => fillHistory($('#recent-list'), SP.history.list(), 'Nothing yet. Press New on the generator.');
  const renderHome = () => {
    const o = { length: 12, lower: true, upper: true, digits: true, symbols: true, avoid: false };
    $('#demo-pw').textContent = SP.generate(o);
    setMeter(demoMeter, SP.rate(SP.entropy(o)).segments);
    fillHistory($('#home-recent'), SP.history.list().slice(0, 3), 'No activity yet.');
  };
  const clearHistory = () => { SP.history.clear(); renderRecent(); renderHome(); toast('History cleared'); };
  $('#clear-1').addEventListener('click', clearHistory);
  $('#clear-2').addEventListener('click', clearHistory);

  /* ---------- theme (non-sensitive preference) ---------- */
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('securepass.theme', t); } catch (e) { /* ignore */ }
    $('#th-light').setAttribute('aria-pressed', String(t === 'light'));
    $('#th-dark').setAttribute('aria-pressed', String(t === 'dark'));
  }
  $('#th-light').addEventListener('click', () => setTheme('light'));
  $('#th-dark').addEventListener('click', () => setTheme('dark'));
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  /* ---------- hash router ---------- */
  const ROUTES = { '': 'home', '/': 'home', '/generate': 'generate', '/recent': 'recent', '/settings': 'settings' };
  function route() {
    const name = ROUTES[location.hash.slice(1)] || 'home';
    $$('.view').forEach((v) => v.classList.toggle('on', v.id === 'view-' + name));
    $$('.tabs a').forEach((a) => { const on = a.dataset.v === name; on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    if (name === 'home') renderHome();
    if (name === 'recent') renderRecent();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  refresh(false);
  route();
})();
