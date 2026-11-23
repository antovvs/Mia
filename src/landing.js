(() => {
  const root = document.documentElement;
  const SB_URL = '__SB_URL__'.replace(/\/+$/, '');
  const SB_KEY = '__SB_KEY__';
  const REMOTE = /^https:\/\//.test(SB_URL) && SB_KEY.length > 20;
  const params = new URLSearchParams(location.search);
  const PREVIEW = params.get('preview') === '1';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const LINK_KEYS = ['onlyfans', 'instagram', 'x', 'reddit', 'threads'];
  const LOCAL_KEY = 'mia_store';
  const ls = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

  /* ───── tracking ───── */
  const ua = navigator.userAgent || '';
  const TZ_COUNTRY = {
    'Europe/Paris': 'FR', 'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH', 'Europe/Luxembourg': 'LU', 'Europe/Monaco': 'MC',
    'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT',
    'Europe/Amsterdam': 'NL', 'Europe/Lisbon': 'PT', 'Europe/Vienna': 'AT', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO',
    'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Bucharest': 'RO',
    'Europe/Athens': 'GR', 'Europe/Istanbul': 'TR', 'Europe/Moscow': 'RU', 'Europe/Kiev': 'UA', 'Europe/Kyiv': 'UA',
    'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Phoenix': 'US',
    'America/Anchorage': 'US', 'Pacific/Honolulu': 'US', 'America/Detroit': 'US', 'America/Toronto': 'CA', 'America/Vancouver': 'CA',
    'America/Montreal': 'CA', 'America/Edmonton': 'CA', 'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR',
    'America/Argentina/Buenos_Aires': 'AR', 'America/Bogota': 'CO', 'America/Martinique': 'MQ', 'America/Guadeloupe': 'GP',
    'Indian/Reunion': 'RE', 'Africa/Casablanca': 'MA', 'Africa/Algiers': 'DZ', 'Africa/Tunis': 'TN', 'Africa/Abidjan': 'CI',
    'Africa/Dakar': 'SN', 'Africa/Lagos': 'NG', 'Africa/Johannesburg': 'ZA', 'Asia/Dubai': 'AE', 'Asia/Tokyo': 'JP',
    'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Singapore': 'SG', 'Asia/Kolkata': 'IN',
    'Asia/Bangkok': 'TH', 'Asia/Manila': 'PH', 'Asia/Jakarta': 'ID', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
    'Pacific/Auckland': 'NZ'
  };
  const CAT_HOST = { instagram: 'instagram.com', x: 't.co', reddit: 'reddit.com', threads: 'threads.net', tiktok: 'tiktok.com', facebook: 'facebook.com', snapchat: 'snapchat.com' };
  const classify = (host, hint) => {
    const s = `${host} ${hint}`.toLowerCase();
    if (/instagram/.test(s)) return 'instagram';
    if (/(^|[\s.])t\.co(\s|$)|twitter|(^|[\s.])x\.com(\s|$)/.test(s)) return 'x';
    if (/reddit/.test(s)) return 'reddit';
    if (/threads|barcelona/.test(s)) return 'threads';
    if (/tiktok|musical_ly|bytedance/.test(s)) return 'tiktok';
    if (/facebook|fban|fbav|fb_iab|(^|[\s.])fb\.com/.test(s)) return 'facebook';
    if (/snapchat/.test(s)) return 'snapchat';
    if (/google\./.test(s)) return 'google';
    return host ? 'other' : 'direct';
  };

  let refHost = '';
  try { if (document.referrer) refHost = new URL(document.referrer).hostname.replace(/^(www|m|l|lm|out|old)\./, ''); } catch (e) {}
  if (refHost === location.hostname) refHost = '';
  const utm = (params.get('utm_source') || '').slice(0, 40);
  const appHint = (ua.match(/Instagram|Twitter|Barcelona|TikTok|musical_ly|BytedanceWebview|FBAN|FBAV|FB_IAB|Snapchat/i) || [''])[0];
  const referrer = classify(refHost, `${utm} ${appHint}`);
  let sid = '';
  try { sid = sessionStorage.getItem('mia_sid') || ''; if (!sid) { sid = uid(); sessionStorage.setItem('mia_sid', sid); } } catch (e) { sid = uid(); }
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  const ctx = {
    referrer,
    ref_host: (refHost || CAT_HOST[referrer] || 'direct').slice(0, 120),
    device: /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || (matchMedia('(pointer: coarse)').matches && innerWidth < 900) ? 'mobile' : 'desktop',
    country: TZ_COUNTRY[tz] || null,
    path: location.pathname.slice(0, 200),
    sid: sid.slice(0, 40)
  };

  const send = ev => {
    if (PREVIEW) return;
    const row = { ...ctx, ...ev };
    if (REMOTE) {
      fetch(`${SB_URL}/rest/v1/events`, {
        method: 'POST',
        keepalive: true,
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(row)
      }).catch(() => {});
      return;
    }
    const db = ls.get(LOCAL_KEY, {});
    db.events = (db.events || []).concat({ id: uid(), created_at: new Date().toISOString(), is_demo: false, ...row }).slice(-5000);
    ls.set(LOCAL_KEY, db);
  };
  const track = link => { if (LINK_KEYS.includes(link)) send({ type: 'click', link }); };
  send({ type: 'view', link: null });

  /* ───── contenu piloté par le dashboard ───── */
  const DEFAULT_CFG = { name: 'Mia 🍓', handle: '@itsmiaabby', badge: '10K+ Followers', accentPink: '#ff6b9d', accentRose: '#c44569', blocks: 'rounded', gate: true };
  let CFG = { ...DEFAULT_CFG };
  const hexRgb = h => {
    const m = /^#?([\da-f]{6})$/i.exec(h || '');
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
  };
  const nameEl = document.querySelector('.name');
  const setName = name => {
    if (nameEl.getAttribute('aria-label') === name) return;
    nameEl.setAttribute('aria-label', name);
    const chars = typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(name)].map(s => s.segment)
      : Array.from(name);
    nameEl.replaceChildren(...chars.map((c, i) => {
      const s = document.createElement('span');
      s.className = c === ' ' ? 'ch sp' : 'ch';
      s.style.setProperty('--i', i);
      if (c !== ' ') s.dataset.c = c;
      s.setAttribute('aria-hidden', 'true');
      s.textContent = c;
      return s;
    }));
  };
  const applyConfig = (settings, links) => {
    CFG = { ...DEFAULT_CFG, ...(settings || {}) };
    const name = String(CFG.name || DEFAULT_CFG.name).slice(0, 40);
    setName(name);
    document.querySelector('.hero-img').alt = name;
    document.querySelector('.handle').textContent = String(CFG.handle || '').slice(0, 60);
    const fol = document.querySelector('.fol');
    const badge = String(CFG.badge || '').trim().slice(0, 40);
    fol.hidden = !badge;
    const sp = badge.indexOf(' ');
    const b = document.createElement('b');
    b.textContent = sp > 0 ? badge.slice(0, sp) : badge;
    fol.replaceChildren(b, sp > 0 ? badge.slice(sp) : '');
    const pink = hexRgb(CFG.accentPink) ? CFG.accentPink : DEFAULT_CFG.accentPink;
    const rose = hexRgb(CFG.accentRose) ? CFG.accentRose : DEFAULT_CFG.accentRose;
    root.style.setProperty('--pink', pink);
    root.style.setProperty('--rose', rose);
    root.style.setProperty('--pink-rgb', hexRgb(pink));
    root.classList.remove('blocks-sharp', 'blocks-glass');
    if (CFG.blocks === 'sharp' || CFG.blocks === 'glass') root.classList.add(`blocks-${CFG.blocks}`);
    (Array.isArray(links) ? links : []).forEach(l => {
      if (!l || !LINK_KEYS.includes(l.key)) return;
      if (/^https:\/\//i.test(l.url || '')) document.querySelectorAll(`a[data-link="${l.key}"]`).forEach(a => { a.href = l.url; });
      document.querySelectorAll(`.soc[data-link="${l.key}"], [data-cell="${l.key}"]`).forEach(el => { el.hidden = l.enabled === false; });
    });
    const cells = [...document.querySelectorAll('.grid > [data-cell]')];
    cells.forEach(c => c.classList.remove('wide'));
    const vis = cells.filter(c => !c.hidden);
    if (vis.length % 2) vis[vis.length - 1].classList.add('wide');
  };

  const loadRemote = async () => {
    if (PREVIEW) return null;
    if (!REMOTE) {
      const db = ls.get(LOCAL_KEY, {});
      return { settings: db.settings, links: db.links };
    }
    const h = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
    const [s, l] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/settings?id=eq.1&select=data`, { headers: h }).then(r => (r.ok ? r.json() : [])),
      fetch(`${SB_URL}/rest/v1/links?select=key,url,enabled`, { headers: h }).then(r => (r.ok ? r.json() : []))
    ]);
    return { settings: s[0] && s[0].data, links: l };
  };
  if (REMOTE && !PREVIEW) {
    const cached = ls.get('mia_cfg', null);
    if (cached) applyConfig(cached.settings, cached.links);
  }
  const remote = loadRemote()
    .then(r => {
      if (!r) return;
      if (REMOTE) ls.set('mia_cfg', r);
      applyConfig(r.settings, r.links);
    })
    .catch(() => {});
  if (PREVIEW) {
    addEventListener('message', e => {
      if (e.origin !== location.origin || !e.data || e.data.type !== 'mia-preview') return;
      applyConfig(e.data.settings, e.data.links);
    });
  }

  /* ───── écran « ouvrir dans le navigateur » ───── */
  if (root.classList.contains('inapp')) {
    const toast = document.getElementById('toast');
    let timer;
    const say = msg => {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(() => toast.classList.remove('show'), 2000);
    };
    const copy = async text => {
      try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.append(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      return ok;
    };
    document.getElementById('ia-copy').addEventListener('click', async () => {
      const u = new URL(location.href);
      u.searchParams.delete('inapp');
      u.hash = '';
      say((await copy(u.toString())) ? 'Lien copié ✓' : 'Copie impossible — copie le lien à la main');
      if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(10);
    });
    return;
  }

  /* ───── effets partagés : ripple, burst, tilt ───── */
  const ripple = (el, x, y) => {
    const r = el.getBoundingClientRect();
    const s = Math.max(r.width, r.height) * 2.2;
    const n = document.createElement('span');
    n.className = 'ripple';
    n.style.cssText = `width:${s}px;height:${s}px;left:${x - r.left - s / 2}px;top:${y - r.top - s / 2}px`;
    el.append(n);
    n.animate(
      [{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 0 }],
      { duration: 500, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' }
    ).onfinish = () => n.remove();
  };

  const STEPS = 8;
  const burst = (x, y, glyph) => {
    const f = document.createDocumentFragment();
    const n = Math.round(rand(12, 16));
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      if (glyph) {
        p.className = 'spark';
        p.textContent = glyph;
        p.style.cssText = `left:${x}px;top:${y}px;font-size:${rand(12, 18).toFixed(1)}px`;
      } else {
        const s = rand(3, 6);
        const pink = Math.random() < .5;
        p.className = 'spark dot';
        p.style.cssText = `left:${x}px;top:${y}px;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;background:${pink ? 'var(--pink)' : '#fff'};box-shadow:0 0 ${(s * 2).toFixed(0)}px ${pink ? 'rgb(var(--pink-rgb) / .8)' : 'rgba(255,255,255,.7)'}`;
      }
      f.append(p);
      const a = rand(0, Math.PI * 2);
      const v = rand(50, 125);
      const vx = Math.cos(a) * v, vy = Math.sin(a) * v - 20, g = rand(45, 85);
      const spin = rand(-80, 80);
      const frames = [];
      for (let k = 0; k <= STEPS; k++) {
        const t = k / STEPS;
        const e = 1 - (1 - t) * (1 - t);
        frames.push({
          transform: `translate(calc(-50% + ${(vx * e).toFixed(1)}px), calc(-50% + ${(vy * e + g * t * t).toFixed(1)}px)) scale(${(1 - t * .5).toFixed(2)}) rotate(${(t * spin).toFixed(0)}deg)`,
          opacity: t < .45 ? 1 : 1 - (t - .45) / .55,
          offset: t
        });
      }
      p.animate(frames, { duration: 600, easing: 'linear', fill: 'forwards' }).onfinish = () => p.remove();
    }
    document.body.append(f);
  };

  /* ───── gate 18+ ───── */
  const age = document.getElementById('age');
  const ageGo = document.getElementById('age-go');
  const ageCancel = document.getElementById('age-cancel');
  const cta = document.getElementById('cta');
  const page = document.querySelector('.page');
  let lastFocus = null;

  const openAge = () => {
    lastFocus = document.activeElement;
    age.classList.add('open');
    age.setAttribute('aria-hidden', 'false');
    root.classList.add('modal-open');
    page.inert = true;
    setTimeout(() => ageGo.focus({ preventScroll: true }), 60);
  };
  const closeAge = () => {
    age.classList.remove('open');
    age.setAttribute('aria-hidden', 'true');
    root.classList.remove('modal-open');
    page.inert = false;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };
  ageCancel.addEventListener('click', closeAge);
  age.addEventListener('click', e => { if (e.target === age) closeAge(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && age.classList.contains('open')) closeAge(); });
  cta.addEventListener('auxclick', e => { if (CFG.gate === false) return; e.preventDefault(); openAge(); });

  /* ───── intro orchestrée ───── */
  const targets = [...document.querySelectorAll('[data-r]')];
  const markSeen = () => { try { sessionStorage.setItem('mia_seen', '1'); } catch (e) {} };
  let seen = false;
  try { seen = sessionStorage.getItem('mia_seen') === '1' && !/[?&]intro=1(&|$)/.test(location.search); } catch (e) {}

  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(entries => {
      let k = 0;
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.style.setProperty('--d', `${k++ * 100}ms`);
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: .12 });
  }

  let started = false;
  const run = () => {
    if (started) return;
    started = true;
    clearTimeout(window.__failsafe);
    markSeen();
    const quick = seen || reduce || PREVIEW;
    if (quick) {
      root.classList.add('quick', 'st1', 'st2', 'st5');
    } else {
      root.classList.add('st1');
      setTimeout(() => root.classList.add('st2'), 500);
      setTimeout(() => root.classList.add('st5'), 2000);
    }
    let q = 0;
    targets.forEach(t => {
      const visible = t.getBoundingClientRect().top < innerHeight - 40;
      if (!visible && io) { io.observe(t); return; }
      if (quick) {
        t.style.setProperty('--d', `${q++ * 70}ms`);
        t.classList.add('in');
      } else {
        setTimeout(() => t.classList.add('in'), +t.dataset.t || 0);
      }
    });
  };

  const heroImg = document.querySelector('.hero-img');
  document.getElementById('immersive-photo').style.backgroundImage = `url("${heroImg.src}")`;
  const assets = Promise.all([
    document.fonts ? document.fonts.ready : null,
    heroImg.decode ? heroImg.decode().catch(() => {}) : null,
    remote
  ]);
  Promise.race([assets, new Promise(r => setTimeout(r, 700))])
    .then(() => { requestAnimationFrame(() => requestAnimationFrame(run)); setTimeout(run, 150); });

  /* ───── interactions ───── */
  const fx = !reduce;

  if (fx && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const layers = [...document.querySelectorAll('[data-depth]')].map(el => ({ el, d: +el.dataset.depth }));
    let tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    const tick = () => {
      cx += (tx - cx) * .05;
      cy += (ty - cy) * .05;
      layers.forEach(l => { l.el.style.transform = `translate3d(${(cx * l.d).toFixed(2)}px,${(cy * l.d).toFixed(2)}px,0)`; });
      if (Math.abs(tx - cx) > .0008 || Math.abs(ty - cy) > .0008) requestAnimationFrame(tick);
      else running = false;
    };
    addEventListener('pointermove', e => {
      tx = e.clientX / innerWidth - .5;
      ty = e.clientY / innerHeight - .5;
      if (!running) { running = true; requestAnimationFrame(tick); }
    }, { passive: true });
  }

  const vibrate = () => { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(10); };

  const press = (el, glyph, onTap) => {
    let tilt = false;
    const aim = e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width - .5) * 6).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-((e.clientY - r.top) / r.height - .5) * 6).toFixed(2)}deg`);
    };
    const release = () => {
      if (!tilt) return;
      tilt = false;
      el.classList.remove('tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    if (fx) {
      el.addEventListener('pointerdown', e => {
        if (e.button > 0) return;
        ripple(el, e.clientX, e.clientY);
        if (e.pointerType === 'touch' && el.classList.contains('card')) { tilt = true; el.classList.add('tilting'); aim(e); }
      });
      el.addEventListener('pointermove', e => { if (tilt) aim(e); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => el.addEventListener(t, release));
    }
    el.addEventListener('click', e => {
      if (fx) {
        const r = el.getBoundingClientRect();
        const kb = e.detail === 0;
        const x = kb ? r.left + r.width / 2 : e.clientX;
        const y = kb ? r.top + r.height / 2 : e.clientY;
        if (kb) ripple(el, x, y);
        burst(x, y, glyph);
        el.animate({ scale: ['.97', '1'] }, { duration: 260, easing: 'cubic-bezier(.34,1.56,.64,1)' });
        vibrate();
      }
      if (onTap) onTap(e);
    });
  };

  document.querySelectorAll('.card').forEach(card => {
    if (card === cta) {
      press(card, card.dataset.burst || '', e => {
        if (CFG.gate === false) { track('onlyfans'); return; }
        e.preventDefault();
        setTimeout(openAge, fx ? 180 : 0);
      });
    } else {
      press(card, card.dataset.burst || '', () => track(card.dataset.link));
    }
  });
  press(ageGo, '🍓', () => { track('onlyfans'); setTimeout(closeAge, 500); });
  document.querySelectorAll('.soc').forEach(a => a.addEventListener('click', () => track(a.dataset.link)));
})();
