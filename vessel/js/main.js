/* ==========================================================================
   Vessel Subnet · Hướng 05 · Hai Tông — tương tác & chuyển động
   GSAP 3.15 (ScrollTrigger, SplitText, CustomEase) + Lenis, tải cục bộ.
   ========================================================================== */
(function () {
  'use strict';
  window.__vsReady = true;

  /* Điền URL nhận biểu mẫu trước khi đưa trang lên mạng. */
  const FORM_ENDPOINT = '';

  const root = document.documentElement;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const I18N = window.VS_I18N || { vi: {}, en: {} };

  /* Phần tử dùng chung */
  const hdr = $('#hdr');
  const heroEl = $('.hero');
  const heroPlane = $('#heroPlane');
  const heroChart = $('#heroChart');
  const heroCard = $('#heroCard');
  const pPin = $('#pPin');
  const pSteps = $$('.p-step');
  const ltFill = $('#ltFill');
  const ltVal = $('#ltVal');
  const form = $('#leadForm');
  const fMsg = $('#fMsg');
  const lightSecs = $$('.tone-light');
  const mbtn = $('.menu-btn');
  const mnav = $('#mnav');

  let lang = 'vi';
  let menuOpen = false;
  let lenis = null;
  let heroSplit = null;
  let heroTl = null;                               // hoạt cảnh mở đầu hero, màn chờ sẽ phát
  const SNAP_COOL = 550;                           // ms khoá đầu vào sau mỗi cú khựng
  const snapBus = { busy: false, navUntil: 0 };    // điều phối chung cho mọi điểm khựng (khai báo trước matchMedia)
  window.__snapBus = snapBus; // để kiểm tra trong DevTools

  /* ---------------------------------------------------------------------- */
  /* Ngôn ngữ VI / EN                                                        */
  /* ---------------------------------------------------------------------- */
  const viText = {};
  const viAttr = new Map();
  $$('[data-i18n]').forEach((el) => { const k = el.dataset.i18n; if (!(k in viText)) viText[k] = el.innerHTML; });
  $$('[data-i18n-attr]').forEach((el) => {
    const pairs = el.dataset.i18nAttr.split(';').map((p) => p.split(':'));
    viAttr.set(el, pairs.map(([a, k]) => [a, k, el.getAttribute(a)]));
  });
  const t = (k) => (lang === 'en' ? (I18N.en[k] ?? I18N.vi[k] ?? viText[k] ?? '') : (I18N.vi[k] ?? viText[k] ?? ''));

  function applyLang(l) {
    lang = l === 'en' ? 'en' : 'vi';
    root.lang = lang;
    if (heroSplit) { heroSplit.revert(); heroSplit = null; }
    $$('[data-i18n]').forEach((el) => {
      const k = el.dataset.i18n;
      const v = lang === 'en' ? I18N.en[k] : viText[k];
      if (v == null) return;
      if (el instanceof SVGElement) el.textContent = v; else el.innerHTML = v;
    });
    viAttr.forEach((list, el) => list.forEach(([a, k, vi]) => {
      const v = lang === 'en' ? I18N.en[k] : vi;
      if (v != null) el.setAttribute(a, v);
    }));
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    document.title = t('title');
    $('.sr', mbtn).textContent = menuOpen ? t('menuClose') : t('menuOpen');
    syncRole();
    paintLaytime();
    paintGeo();
    if (window.__netRender) window.__netRender();
    try { localStorage.setItem('vs-lang', lang); } catch (e) { /* bỏ qua */ }
    if (window.ScrollTrigger && ScrollTrigger.getAll().length) ScrollTrigger.refresh();
  }
  $$('.lang button').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));

  /* ---------- Năm ---------- */
  const yr = $('#yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- Menu di động ---------- */
  function setMenu(open) {
    menuOpen = open;
    mnav.hidden = !open;
    mbtn.setAttribute('aria-expanded', String(open));
    $('.sr', mbtn).textContent = open ? t('menuClose') : t('menuOpen');
    if (open) hdr.classList.remove('is-hidden');
  }
  mbtn.addEventListener('click', () => setMenu(!menuOpen));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); mbtn.focus(); } });

  /* ---------- Biểu mẫu ---------- */
  function syncRole() {
    const owner = form.elements.role.value === 'chu-sa-lan';
    $('#fShipLbl').textContent = owner ? t('fShipOwner') : t('fShip2');
  }
  function setErr(input, text) {
    const err = $('#' + input.getAttribute('aria-describedby'));
    input.setAttribute('aria-invalid', text ? 'true' : 'false');
    if (err) err.textContent = text;
    return !text;
  }
  form.addEventListener('change', (e) => { if (e.target.name === 'role') syncRole(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.elements.name, phone = form.elements.phone;
    const okName = setErr(name, name.value.trim() ? '' : t('errName'));
    const okPhone = setErr(phone, phone.value.replace(/\D/g, '').length >= 9 ? '' : t('errPhone'));
    if (!okName) { name.focus(); return; }
    if (!okPhone) { phone.focus(); return; }
    if (!FORM_ENDPOINT) { fMsg.textContent = t('msgNoEndpoint'); return; }
    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    try {
      const res = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), lang }) });
      if (!res.ok) throw new Error(String(res.status));
      form.reset(); syncRole();
      fMsg.textContent = t('msgOk');
    } catch (_) {
      fMsg.textContent = t('msgFail');
    } finally { btn.disabled = false; }
  });

  /* ---------- Laytime (chữ phần trăm) ---------- */
  const lt = { v: 0.15 };
  function paintLaytime() {
    if (window.gsap) gsap.set(ltFill, { scaleX: lt.v });
    ltVal.textContent = t('ltPct').replace('{n}', Math.round(lt.v * 100));
  }

  /* ---------- Hải đồ: phần tử, toạ độ địa lý minh hoạ, đồng hồ ---------- */
  const CH = {
    q: (s) => $$(s, heroChart),
    ship: $('#motherShip'), sweep: $('#sweep'), hud: $('#shipHud'),
    hudNav: $('#hudNav'), hudPos: $('#hudPos'),
    coord: $('#heroCoord'), clock: $('#heroClock'),
    dec: () => (lang === 'en' ? '.' : ','),
  };
  // Quy ước minh hoạ: y=400 là 20°58′N, x=400 là 107°03′E, 400 đơn vị = 1 phút
  function geo(x, y) {
    const fmt = (m) => { const w = Math.floor(m), fr = Math.round((m - w) * 100); return String(w).padStart(2, '0') + CH.dec() + String(fr).padStart(2, '0') + '′'; };
    return '20°' + fmt(58 - (y - 400) / 400) + 'N · 107°' + fmt(3 + (x - 400) / 400) + 'E';
  }
  function paintGeo() {
    const s = geo(1060, 800);
    if (CH.coord) CH.coord.textContent = s;
    if (CH.hudPos) CH.hudPos.textContent = s;
    if (CH.hudNav) CH.hudNav.textContent = t('hudNav').replace('{h}', CH.hudNav.textContent.match(/\d{3}/) ? CH.hudNav.textContent.match(/\d{3}/)[0] : '298');
  }
  function tickClock() {
    if (!CH.clock) return;
    CH.clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }) + ' UTC+7';
    const hm = CH.clock.textContent.slice(0, 5);
    $$('.sb-time').forEach((el) => { el.textContent = hm.replace(/^0/, ''); });
  }
  setInterval(tickClock, 1000); tickClock();

  /* ---------- Mục Vấn đề: sân khấu checkpoint (khai báo trước khi matchMedia chạy) ---------- */
  const stage = $('#pcStage');
  const cpLoops = stage ? [1, 2, 3].map((n) => $('.cp-loop[data-cp="' + n + '"]', stage)) : [];
  const cpTrans = stage ? { '1-2': $('.cp-tr[data-tr="1-2"]', stage), '2-3': $('.cp-tr[data-tr="2-3"]', stage) } : {};
  const cp = { current: 1, target: 1, busy: false, loaded: false };

  /* ---------- Video A1: chỉ hiện khi tải được, lỗi thì gỡ ---------- */
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target; if (!v.isConnected) return;
      if (e.isIntersecting && root.classList.contains('motion-ok')) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
    }), { rootMargin: '200px 0px' });
    $$('.asset-video').forEach((v) => vio.observe(v));
  }
  $$('.asset-video').forEach((v) => {
    const sources = $$('source', v);
    const last = sources[sources.length - 1];
    if (last) last.addEventListener('error', () => v.remove());
    v.addEventListener('loadeddata', () => v.setAttribute('data-ok', ''));
  });

  /* Ngôn ngữ đã lưu */
  if (root.getAttribute('data-lang-init') === 'en') applyLang('en'); else { syncRole(); paintLaytime(); }

  /* ---------- Đường chỉ: vệt sáng chạy một lần khi vào màn hình ---------- */
  if ('IntersectionObserver' in window && root.classList.contains('motion-ok')) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('go'); io.unobserve(e.target); } }), { threshold: 1 });
    $$('.coach').forEach((c) => io.observe(c));
  }

  /* ---------- Không có GSAP: trang vẫn đầy đủ ở trạng thái tĩnh ---------- */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') { root.classList.remove('motion-ok'); return; }

  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create('out', 'M0,0 C0.23,1 0.32,1 1,1');
  CustomEase.create('inOut', 'M0,0 C0.77,0 0.175,1 1,1');
  ScrollTrigger.config({ ignoreMobileResize: true });
  const motionOK = root.classList.contains('motion-ok');

  /* Mặt phẳng hải đồ: đặt transform 3D bằng GSAP để các tween sau đọc đúng giá trị */
  const narrow = window.matchMedia('(max-width: 960px)').matches;
  gsap.set(heroPlane, { x: 0, xPercent: narrow ? -66.25 : -50, rotationX: 70, transformOrigin: '50% 100%' });
  paintLaytime();

  /* ---------- Lenis ---------- */
  if (motionOK && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    window.__lenis = lenis; // để kiểm tra trong DevTools
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((tm) => lenis.raf(tm * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Liên kết neo ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    if (menuOpen) setMenu(false);
    if (a.dataset.role === 'owner') { form.elements.role.value = 'chu-sa-lan'; syncRole(); }
    if (!lenis) return;
    e.preventDefault();
    snapBus.navUntil = Date.now() + 1800; // cuộn theo liên kết: các điểm khựng chỉ theo dõi, không chen vào
    lenis.scrollTo(target, { offset: 0, duration: 1.5, force: true, easing: (x) => 1 - Math.pow(1 - x, 4), onComplete: () => { snapBus.navUntil = Date.now() + 250; } });
    history.replaceState(null, '', id);
    setTimeout(() => { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }, 1550);
  });

  /* ---------- Vẽ nét đứt bằng mask ---------- */
  let maskId = 0;
  function dashDraw(path) {
    const svg = path.ownerSVGElement;
    const vb = svg.viewBox.baseVal;
    let defs = $('defs', svg);
    if (!defs) { defs = document.createElementNS(NS, 'defs'); svg.prepend(defs); }
    const mask = document.createElementNS(NS, 'mask');
    const id = 'vs-m-' + (++maskId);
    mask.setAttribute('id', id);
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('x', vb.x - 100); mask.setAttribute('y', vb.y - 100);
    mask.setAttribute('width', vb.width + 200); mask.setAttribute('height', vb.height + 200);
    const m = document.createElementNS(NS, 'path');
    m.setAttribute('d', path.getAttribute('d'));
    m.setAttribute('pathLength', '1');
    m.setAttribute('fill', 'none');
    m.setAttribute('stroke', '#fff');
    m.setAttribute('stroke-width', String((parseFloat(getComputedStyle(path).strokeWidth) || 2) + 12));
    m.style.strokeDasharray = '1';
    m.style.strokeDashoffset = '0';
    mask.appendChild(m); defs.appendChild(mask);
    path.setAttribute('mask', 'url(#' + id + ')');
    return m;
  }
  const riverMask = dashDraw($('.leg-river', heroChart));
  const callMasks = $$('.p-call').map(dashDraw);

  /* ---------- Header: nền khi cuộn, ẩn/hiện, đổi màu theo tông bên dưới ---------- */
  hdr.addEventListener('focusin', () => hdr.classList.remove('is-hidden'));
  function paintHeader(y, dir) {
    hdr.classList.toggle('is-scrolled', y > 24);
    const mid = 36;
    hdr.classList.toggle('on-light', lightSecs.some((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; }));
    if (menuOpen || hdr.contains(document.activeElement)) hdr.classList.remove('is-hidden');
    else hdr.classList.toggle('is-hidden', y > 720 && dir === 1);
  }
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => paintHeader(self.scroll(), self.direction) });
  paintHeader(window.scrollY, 0);

  /* ======================================================================
     Chuyển động theo điều kiện media
     ====================================================================== */
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    heroIntro();
    problemEnter();
    bandParallax();
    reveals();
    footerReveal();
    return () => root.classList.remove('motion-ok');
  });

  mm.add({ motion: '(prefers-reduced-motion: no-preference)', desk: '(min-width: 961px)' }, (ctx) => {
    const { motion, desk } = ctx.conditions;
    const cleanups = [];
    if (motion && desk) cleanups.push(problemPinned());
    if (motion && desk) cleanups.push(deckStack());
    if (motion && desk) cleanups.push(bandSnap());
    if (motion && !desk) problemOnce();
    if (desk) cleanups.push(howSticky(motion));
    if (motion && desk) ownerParallax();
    return () => cleanups.forEach((fn) => fn && fn());
  });

  mm.add({ fine: '(hover: hover) and (pointer: fine)', motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    if (!ctx.conditions.fine || !ctx.conditions.motion) return;
    return heroPointer();
  });

  /* ======================================================================
     Màn chờ: giữ trang sau lớp đen tới khi phông, ảnh đầu và layout ổn định,
     đo lại ScrollTrigger một lần rồi mới hé màn và phát hoạt cảnh hero.
     Tránh việc đo lại giữa lúc đang cuộn làm điểm ghim/điểm khựng nhảy.
     ====================================================================== */
  function runBoot() {
    const boot = $('#boot'), bar = $('#bootBar');
    const playHero = () => { if (heroTl) heroTl.play(); };
    if (!boot || !root.classList.contains('is-booting')) { playHero(); return; }
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    if (lenis) lenis.stop();
    const keys = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']);
    const blockKeys = (e) => { if (keys.has(e.key)) e.preventDefault(); };
    document.addEventListener('keydown', blockKeys);
    let prog = 0;
    const setP = (v) => { prog = Math.max(prog, v); if (bar) bar.style.setProperty('--p', prog.toFixed(3)); };
    const poster = $('.cp-poster');
    const steps = [
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
      document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => window.addEventListener('load', r, { once: true })),
      new Promise((r) => { if (!poster || poster.complete) return r(); poster.addEventListener('load', r, { once: true }); poster.addEventListener('error', r, { once: true }); }),
    ];
    let n = 0;
    steps.forEach((pr) => pr.then(() => setP((++n / steps.length) * 0.9)));
    setP(0.12);
    let revealed = false;
    const reveal = () => {
      if (revealed) return; revealed = true;
      setP(1);
      ScrollTrigger.refresh();
      window.scrollTo(0, 0);
      root.classList.remove('is-booting');
      document.removeEventListener('keydown', blockKeys);
      if (lenis) { lenis.reset(); lenis.start(); }
      // Liên kết sâu (#muc): nhảy thẳng tới mục sau khi đo xong, điểm khựng chỉ theo dõi
      const deep = location.hash.length > 1 && document.querySelector(location.hash);
      if (deep) { snapBus.navUntil = Date.now() + 800; if (lenis) lenis.scrollTo(deep, { immediate: true, force: true }); else deep.scrollIntoView(); }
      setTimeout(playHero, 120);
      setTimeout(() => boot.remove(), 1400);
    };
    const ready = () => {
      // Tab đang ẩn (mở ở nền): chờ tới khi người xem thật sự nhìn thấy
      if (!document.hidden) { reveal(); return; }
      const once = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', once); reveal(); } };
      document.addEventListener('visibilitychange', once);
      requestAnimationFrame(reveal); // dự phòng: chỉ chạy khi trang thật sự được vẽ
    };
    window.__bootReveal = reveal; // để kiểm tra trong DevTools (tab ẩn không bắn rAF)
    Promise.race([Promise.all(steps), new Promise((r) => setTimeout(r, 4500))]).then(ready, ready);
  }
  runBoot();

  /* ---------------------------------------------------------------------- */
  /* Hero: hải đồ theo dõi tàu                                               */
  /* Lớp 1 vẽ một lần (lưới, đẳng sâu, bờ, luồng, tàu). Lớp 2 chạy liên tục  */
  /* và dừng khi hero ra khỏi màn hình hoặc tab bị ẩn.                        */
  /* ---------------------------------------------------------------------- */
  const heroLoops = [];
  window.__vsLoops = heroLoops; // để kiểm tra trong DevTools
  function heroIntro() {
    const q = CH.q;
    const intro = $$('.hero [data-intro]');
    gsap.set([heroChart, '#heroTitle', heroCard, ...intro], { visibility: 'visible' });
    heroSplit = SplitText.create('#heroTitle', { type: 'lines', linesClass: 'ln' });

    // Mọi nét có pathLength=1: vẽ bằng dasharray/dashoffset, xong thì trả lại kiểu nét của CSS
    const bands = [...q('.iso'), ...q('.iso-f'), ...q('.stip')];
    const ctr = q('.ctr'), fair = q('.fair'), area = q('.anch-area'), hull = q('.sh-hull');
    const coast = q('.coast'), sea = q('.leg-sea');
    gsap.set([...bands, ...ctr, ...fair, ...area, ...hull, ...coast, ...sea], { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(riverMask, { strokeDashoffset: 1 });
    const restore = (els) => () => gsap.set(els, { clearProps: 'strokeDasharray,strokeDashoffset' });

    const fade = (sel) => q(sel);
    const shipDetail = ['.sh-dk', '.sh-cl', '.sh-hatches', '.sh-cranes', '.sh-sup', '.sh-fore', '.sh-bol', '#ship-sym .hl'].map((s) => q(s)).flat();

    // Tạo ở trạng thái dừng; màn chờ (runBoot) phát khi trang đã tải xong và thật sự hiển thị
    const tl = gsap.timeline({ defaults: { ease: 'out' }, delay: 0.15, paused: true, onComplete: heroScroll });
    heroTl = tl;
    // Chữ
    tl.from($('.hero .eyebrow'), { autoAlpha: 0, y: 14, duration: 1 }, 0.1)
      .from(heroSplit.lines, { autoAlpha: 0, y: 34, duration: 1.3, stagger: 0.12 }, 0.25)
      .from($('.hero .lead'), { autoAlpha: 0, y: 18, duration: 1.1 }, 0.75)
      .from($('.hero .cta'), { autoAlpha: 0, y: 18, duration: 1.1 }, 0.9)
      .from($('.hero-foot'), { autoAlpha: 0, duration: 1.2 }, 1.3);
    // Mặt phẳng hải đồ hạ xuống bàn
    tl.from(heroPlane, { rotationX: 82, yPercent: 8, opacity: 0, duration: 2.4 }, 0)
      // Lưới kinh vĩ, vạch phút, nhãn toạ độ
      .from([...fade('.pl-grid'), ...fade('.ch-tick'), ...fade('.ch-geo')], { opacity: 0, duration: 1.8, stagger: 0.15 }, 0.2)
      // Dải đẳng sâu rồi đường đẳng sâu
      .to(bands, { strokeDashoffset: 0, duration: 2.6, stagger: 0.05 }, 0.3)
      .to(ctr, { strokeDashoffset: 0, duration: 2.4, stagger: 0.1, onComplete: restore(ctr) }, 0.7)
      .from(fade('.ctr-lbl'), { opacity: 0, duration: 1, stagger: 0.08 }, 2.2)
      // Bờ, đất liền, đảo, sông
      .to(coast, { strokeDashoffset: 0, duration: 2.4, onComplete: restore(coast) }, 0.5)
      .from(q('.pl-land .land-h, .pl-isl path, .rv-o, .rv-f'), { opacity: 0, duration: 1.4 }, 1)
      // Số đo sâu rải ngẫu nhiên, dòng triều
      .from(q('.pl-snd text'), { opacity: 0, duration: 0.6, stagger: { each: 0.03, from: 'random' } }, 1.3)
      .from(fade('.ch-cur'), { opacity: 0, duration: 1.8 }, 1.5)
      // Khu neo: biên vẽ, neo và vòng cự ly hiện
      .to(area, { strokeDashoffset: 0, duration: 1.8, ease: 'inOut', onComplete: restore(area) }, 1.6)
      .from([...fade('.anc'), ...fade('.rr'), ...fade('.rr-lbl'), ...fade('.anch')], { opacity: 0, duration: 1, stagger: 0.08 }, 2.2)
      // Tàu mẹ: thân vẽ trước, chi tiết boong hiện sau, sà lan cập mạn, nhãn
      .from(CH.ship, { opacity: 0, duration: 0.6 }, 1.9)
      .to(hull, { strokeDashoffset: 0, duration: 1.8, ease: 'inOut', onComplete: restore(hull) }, 1.9)
      .from(shipDetail, { opacity: 0, duration: 1, stagger: 0.09 }, 2.9)
      .from([...fade('.along'), ...fade('.moor')], { opacity: 0, duration: 0.9, stagger: 0.12 }, 3.5)
      .from(CH.hud, { opacity: 0, x: -8, duration: 1 }, 3.9)
      // Luồng và phao
      .to(fair, { strokeDashoffset: 0, duration: 1.8, onComplete: restore(fair) }, 2.1)
      .from([...fade('.fair-lbl'), ...fade('.buoy')], { opacity: 0, duration: 0.8, stagger: 0.1 }, 3.0)
      // Tuyến: đoạn biển liền, cửa sông, đoạn sông đứt, bến
      .to(sea, { strokeDashoffset: 0, duration: 1.4, ease: 'inOut', onComplete: restore(sea) }, 2.4)
      .from(q('.mk-mouth'), { opacity: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.5 }, 3.6)
      .to(riverMask, { strokeDashoffset: 0, duration: 1.1, ease: 'inOut' }, 3.7)
      .from(q('.mk-port'), { opacity: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.5 }, 4.6)
      .from(q('.lbl'), { opacity: 0, duration: 0.8, stagger: 0.15 }, 3.0)
      // Hoa gió, thước, khung tên
      .from([...fade('.rose'), ...fade('.scale'), ...fade('.title')], { opacity: 0, y: 6, duration: 1.2, stagger: 0.18 }, 3.2)
      .from(heroCard, { autoAlpha: 0, y: 40, duration: 1.2 }, 1.6)
      .add(heroAmbient, 4.4);
  }

  // Lớp chạy liên tục: sà lan trên tuyến, vết vị trí, quét radar, vòng cự ly, tàu mẹ xoay nhẹ quanh neo.
  // Trên biển sà lan chạy liên tục (có định vị); trên sông chỉ hiện ở mốc (chưa có định vị liên tục).
  function heroAmbient() {
    const sea = $('#heroSea');
    const L = sea.getTotalLength();
    const end = sea.getPointAtLength(L);
    const port = { x: 1020, y: 140 };
    const place = (el, p) => el.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');

    // Vết vị trí: dấu + mờ dần sau mỗi lần báo vị trí
    const fixes = $('#fixes');
    const pool = Array.from({ length: 12 }, () => { const u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#fix-sym'); fixes.appendChild(u); return u; });
    let fi = 0;
    const dropFix = (p) => { const u = pool[fi++ % pool.length]; place(u, p); gsap.fromTo(u, { opacity: 0.75 }, { opacity: 0, duration: 6, ease: 'none', overwrite: true }); };

    const barges = [['#bg1', 6.1], ['#bg2', 5.8], ['#bg3', 6.4]].map(([sel, kn], i) => {
      const el = $(sel), body = $('.bg-body', el), ring = $('.bg-ring', el), t2 = $('.tag .t2', el);
      const o = { p: 0 }; let lastFix = 0, lastTxt = -1;
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4, delay: i * 5.6 });
      tl.call(() => { o.p = 0; lastFix = 0; lastTxt = -1; place(el, sea.getPointAtLength(0)); body.setAttribute('transform', 'rotate(-96)'); })
        .set(body, { opacity: 1 }).set(ring, { opacity: 0 })
        .to(el, { opacity: 1, duration: 0.8, ease: 'out' })
        .to(o, { p: 1, duration: 11.5, ease: 'power1.inOut', onUpdate: () => {
          const d = o.p * L, a = sea.getPointAtLength(d), b = sea.getPointAtLength(Math.min(L, d + 1));
          const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
          place(el, a); body.setAttribute('transform', 'rotate(' + ang.toFixed(1) + ')');
          if (d - lastFix > L / 9) { lastFix = d; dropFix(a); }
          const now = tl.time();
          if (now - lastTxt > 0.7) {
            lastTxt = now;
            const cog = ((ang + 90) % 360 + 360) % 360;
            const v = kn + Math.sin(now * 0.9 + i) * 0.25;
            t2.textContent = v.toFixed(1).replace('.', CH.dec()) + ' kn · ' + String(Math.round(cog)).padStart(3, '0') + '°';
          }
        } }, '<')
        .call(() => { place(el, end); t2.textContent = t('tagMouth'); })
        .to(body, { opacity: 0, duration: 0.3, ease: 'out' })
        .to(ring, { opacity: 1, duration: 0.3, ease: 'out' }, '<')
        .to(el, { opacity: 0, duration: 0.5, ease: 'out' }, '+=1.8')
        .call(() => { place(el, port); t2.textContent = t('tagPort'); })
        .to(el, { opacity: 1, duration: 0.5, ease: 'out' })
        .to(el, { opacity: 0, duration: 0.7, ease: 'out' }, '+=2');
      return tl;
    });
    heroLoops.push(...barges);

    // Quét radar quanh tàu mẹ, một vòng 9 giây
    heroLoops.push(gsap.to(CH.sweep, { rotation: 360, duration: 9, ease: 'none', repeat: -1, svgOrigin: '1060 800' }));
    // Vòng cự ly lan ra từ tàu mẹ
    ['#pulseA', '#pulseB'].forEach((s, i) => heroLoops.push(
      gsap.fromTo(s, { attr: { r: 62 }, opacity: 0.4 }, { attr: { r: 150 }, opacity: 0, duration: 4.8, ease: 'power1.out', repeat: -1, delay: i * 2.4 })));
    // Tàu mẹ đảo nhẹ quanh neo, hướng mũi hiện trên nhãn
    let lastHdg = -1;
    heroLoops.push(gsap.to(CH.ship, { rotation: -142, duration: 24, ease: 'sine.inOut', yoyo: true, repeat: -1, svgOrigin: '1060 800', onUpdate() {
      const h = Math.round((((gsap.getProperty(CH.ship, 'rotation') + 90) % 360) + 360) % 360);
      if (h !== lastHdg) { lastHdg = h; CH.hudNav.textContent = t('hudNav').replace('{h}', String(h).padStart(3, '0')); }
    } }));
    // Thỉnh thoảng một số đo sâu được "đo lại"
    const snd = CH.q('.pl-snd text');
    const refresh = gsap.timeline({ repeat: -1, repeatDelay: 2.6 });
    refresh.call(() => { const el = snd[Math.floor(Math.random() * snd.length)]; gsap.fromTo(el, { opacity: 0.1 }, { opacity: 1, duration: 1.4, ease: 'out', clearProps: 'opacity' }); }).to({}, { duration: 0.1 });
    heroLoops.push(refresh);

    const toggle = (on) => heroLoops.forEach((l) => (on ? l.resume() : l.pause()));
    ScrollTrigger.create({ trigger: heroEl, start: 'top bottom', end: 'bottom top', onToggle: (s) => toggle(s.isActive && !document.hidden) });
    document.addEventListener('visibilitychange', () => toggle(!document.hidden && ScrollTrigger.isInViewport(heroEl)));
  }

  // Cuộn ra khỏi hero: "máy quay" hạ xuống mặt hải đồ, chữ lùi lên.
  function heroScroll() {
    const st = { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to(heroPlane, { rotationX: 56, scale: 1.18, ease: 'none', scrollTrigger: st });
    gsap.to('.hero-in', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '60% top' } });
    gsap.to(heroCard, { y: -80, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '50% top' } });
  }

  // Chuột trên hero: mặt phẳng nghiêng nhẹ theo, thẻ trôi theo, toạ độ góc dưới đọc theo vị trí con trỏ trên hải đồ.
  function heroPointer() {
    const rz = gsap.quickTo(heroPlane, 'rotationZ', { duration: 1.2, ease: 'out' });
    const px = gsap.quickTo(heroPlane, 'x', { duration: 1.2, ease: 'out' });
    const cx = gsap.quickTo(heroCard, 'x', { duration: 0.9, ease: 'out' });
    const cy = gsap.quickTo(heroCard, 'y', { duration: 0.9, ease: 'out' });
    function move(e) {
      const r = heroEl.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      rz(nx * -3); px(nx * -30); cx(nx * 14); cy(ny * 10);
      CH.coord.textContent = geo(800 + nx * 1200, 620 + ny * 560);
    }
    const leave = () => { rz(0); px(0); cx(0); cy(0); paintGeo(); };
    heroEl.addEventListener('pointermove', move);
    heroEl.addEventListener('pointerleave', leave);
    return () => { heroEl.removeEventListener('pointermove', move); heroEl.removeEventListener('pointerleave', leave); };
  }

  /* ---------------------------------------------------------------------- */
  /* 01 · Vấn đề: ba checkpoint bằng ảnh/video, máy trạng thái theo cuộn      */
  /* Mỗi checkpoint có một video lặp; đi tới thì phát clip nối rồi vào loop   */
  /* kế tiếp; cuộn ngược thì crossfade thẳng về loop trước. Thanh thời gian  */
  /* làm hàng và chữ ba ý vẫn chạy theo cuộn như cũ.                          */
  /* ---------------------------------------------------------------------- */

  function cpShow(el, on) { if (el) gsap.to(el, { autoAlpha: on ? 1 : 0, duration: 0.5, ease: 'out', overwrite: true }); }
  function cpPlay(v) { if (!v) return; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
  function cpLoad() {
    if (cp.loaded) return; cp.loaded = true;
    [...cpLoops, ...Object.values(cpTrans)].forEach((v) => { if (v) { v.preload = 'auto'; v.load(); } });
  }
  // Chuyển trạng thái: tiến thì qua clip nối, lùi thì về thẳng
  function cpGo(target) {
    cp.target = target;
    if (cp.busy || target === cp.current) return;
    if (target > cp.current) {
      const key = cp.current + '-' + (cp.current + 1), tr = cpTrans[key], next = cpLoops[cp.current];
      if (!tr || tr.readyState < 2) { cpSwap(cp.current + 1); return; }
      cp.busy = true;
      tr.currentTime = 0;
      gsap.set(tr, { autoAlpha: 1 });
      cpPlay(tr);
      const done = () => {
        tr.removeEventListener('ended', done);
        gsap.set(next, { autoAlpha: 1 }); cpPlay(next);
        gsap.to(tr, { autoAlpha: 0, duration: 0.25, ease: 'out', delay: 0.05 });
        const prev = cpLoops[cp.current - 1];
        gsap.set(prev, { autoAlpha: 0 }); if (prev) prev.pause();
        cp.current += 1; cp.busy = false;
        if (cp.target !== cp.current) cpGo(cp.target);
      };
      tr.addEventListener('ended', done);
    } else {
      cpSwap(target);
    }
  }
  function cpSwap(target) {
    const next = cpLoops[target - 1], prev = cpLoops[cp.current - 1];
    Object.values(cpTrans).forEach((v) => { if (v) { gsap.set(v, { autoAlpha: 0 }); v.pause(); } });
    if (next) { cpPlay(next); cpShow(next, true); }
    if (prev && prev !== next) { cpShow(prev, false); setTimeout(() => prev.pause(), 520); }
    cp.current = target; cp.busy = false;
    if (cp.target !== cp.current) cpGo(cp.target);
  }
  function cpStateAt(time) { return time < 1.0 ? 1 : time < 3.05 ? 2 : 3; }

  function problemInitial() {
    lt.v = 1;
    paintLaytime();
    if (stage) {
      gsap.set(cpLoops.slice(1), { autoAlpha: 0 });
      gsap.set(Object.values(cpTrans), { autoAlpha: 0 });
      gsap.set(cpLoops[0], { autoAlpha: 1 });
      cp.current = 1; cp.target = 1; cp.busy = false;
    }
    return () => { lt.v = 0.15; paintLaytime(); };
  }

  // Tải video khi mục sắp vào màn hình; dừng/chạy loop theo tầm nhìn và tab ẩn
  function problemEnter() {
    if (!stage) return;
    ScrollTrigger.create({ trigger: '.problem', start: 'top 150%', once: true, onEnter: cpLoad });
    const toggle = (on) => {
      const v = cpLoops[cp.current - 1];
      if (!v) return;
      if (on) cpPlay(v); else v.pause();
    };
    ScrollTrigger.create({ trigger: '.problem', start: 'top bottom', end: 'bottom top', onToggle: (s) => toggle(s.isActive && !document.hidden) });
    document.addEventListener('visibilitychange', () => toggle(!document.hidden && ScrollTrigger.isInViewport($('.problem'))));
  }

  function problemPinned() {
    pPin.classList.add('is-pinned');
    gsap.set(pSteps, { autoAlpha: 0, y: 30 });
    gsap.set(pSteps[0], { autoAlpha: 1, y: 0 });
    const reset = problemInitial();
    const snap = makeSnap([0, 0.45, 0.85, 1]);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: pPin, start: 'top top', end: () => '+=' + Math.round(window.innerHeight * 3.1), pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => { if (stage) cpGo(cpStateAt(self.progress * 4.8)); snap.update(self); },
        onLeaveBack: () => snap.leaveBack(),
      },
    });
    tl.to(lt, { v: 0.15, duration: 4.3, onUpdate: paintLaytime }, 0)
      .to(pSteps[0], { autoAlpha: 0, y: -30, duration: 0.3, ease: 'inOut' }, 0.9)
      .to(pSteps[1], { autoAlpha: 1, y: 0, duration: 0.3, ease: 'inOut' }, 1.05)
      .to(pSteps[1], { autoAlpha: 0, y: -30, duration: 0.3, ease: 'inOut' }, 2.95)
      .to(pSteps[2], { autoAlpha: 1, y: 0, duration: 0.3, ease: 'inOut' }, 3.1)
      .to({}, { duration: 0.5 }, 4.3);
    return () => { pPin.classList.remove('is-pinned'); reset(); };
  }

  // Màn hẹp: chạy một lần theo thời gian khi thẻ vào màn hình
  function problemOnce() {
    problemInitial();
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.p-vis', start: 'top 70%', once: true } });
    tl.to(lt, { v: 0.15, duration: 14, ease: 'none', onUpdate: paintLaytime }, 0)
      .call(() => cpGo(2), null, 3.5)
      .call(() => cpGo(3), null, 9.5);
  }

  /* ---------------------------------------------------------------------- */
  /* Cuộn khựng theo mốc (dùng chung cho Vấn đề, dải A1, Cam kết).            */
  /* Một bộ điều phối duy nhất: không bao giờ có hai cú khựng chạy cùng lúc.  */
  /* Đi xuống: vừa vượt mốc kế tiếp là dừng ngay tại mốc đó (không để trôi xa */
  /* rồi kéo ngược). Đi lên: tự do, ngừng cuộn thì về mốc gần nhất. Sau mỗi   */
  /* cú khựng khoá đầu vào ~0,55 s để quán tính trackpad không đẩy tiếp.       */
  /* Khi cuộn theo liên kết neo (snapBus.navUntil) chỉ theo dõi, không chen.  */
  /* ---------------------------------------------------------------------- */
  function makeSnap(SNAPS) {
    const last = SNAPS.length - 1;
    let settled = 0, timer = 0;
    const passed = (p) => { let i = 0; SNAPS.forEach((v, k) => { if (v <= p + 0.01) i = k; }); return i; };
    const run = (self, idx) => {
      snapBus.busy = true;
      const guard = setTimeout(() => { snapBus.busy = false; }, 1600); // phòng khi animation bị cắt ngang
      lenis.scrollTo(self.start + (self.end - self.start) * SNAPS[idx], {
        duration: 0.9, lock: true, force: true, easing: (x) => 1 - Math.pow(1 - x, 3),
        onComplete: () => {
          clearTimeout(guard); settled = idx;
          lenis.isLocked = true; // nuốt quán tính còn lại của bánh xe/trackpad
          setTimeout(() => { lenis.isLocked = false; snapBus.busy = false; }, SNAP_COOL);
        },
      });
    };
    const idle = (self) => {
      const p = self.progress;
      if (!lenis || snapBus.busy || Date.now() < snapBus.navUntil) return;
      let idx;
      if (p <= 0.002) { settled = 0; return; }
      if (p >= 0.998) {
        if (self.direction === 1 && settled < last - 1 && window.scrollY < self.end + window.innerHeight * 0.6) idx = settled + 1;
        else { settled = last; return; }
      } else {
        idx = SNAPS.reduce((best, v, i) => (Math.abs(v - p) < Math.abs(SNAPS[best] - p) ? i : best), 0);
        if (self.direction === 1 && SNAPS[idx] < p) idx += 1;
        if (self.direction === -1 && SNAPS[idx] > p) idx -= 1;
        idx = Math.max(0, Math.min(last, idx));
        if (self.direction === 1) idx = Math.min(idx, settled + 1);
      }
      if (Math.abs(SNAPS[idx] - p) < 0.01) { settled = idx; return; }
      run(self, idx);
    };
    return {
      update(self) {
        clearTimeout(timer);
        if (!lenis) return;
        const p = self.progress;
        if (Date.now() < snapBus.navUntil) { settled = passed(p); return; }
        if (snapBus.busy) return;
        if (self.direction === 1 && settled < last && p > SNAPS[settled + 1] + 0.012 && p < 0.998) { run(self, settled + 1); return; }
        timer = setTimeout(() => idle(self), 160);
      },
      leaveBack() { settled = 0; },
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Cam kết: thẻ dính ở đỉnh khi cuộn tới, thẻ sau trượt lên đè thẻ trước;   */
  /* thẻ bị đè thu nhỏ và tối dần theo số thẻ đã phủ lên nó. Cuộn khựng ở     */
  /* từng thẻ bằng makeSnap.                                                   */
  /* ---------------------------------------------------------------------- */
  function deckStack() {
    const deck = $('#deck');
    const cards = deck ? $$('.dcard', deck) : [];
    if (cards.length < 2) return () => {};
    const n = cards.length;
    const stickyTop = (k) => parseFloat(getComputedStyle(cards[k]).top) || 0;
    const setters = cards.map((c) => ({ scale: gsap.quickSetter(c, 'scale'), dim: gsap.quickSetter(c, '--dim') }));
    function apply() {
      const vh = window.innerHeight;
      const prog = cards.map((c, k) => { const top = c.getBoundingClientRect().top, st = stickyTop(k); return Math.max(0, Math.min(1, (vh - top) / Math.max(1, vh - st))); });
      cards.forEach((c, i) => {
        let cover = 0;
        for (let k = i + 1; k < n; k++) cover += prog[k];
        cover = Math.min(3, cover);
        setters[i].scale(1 - 0.028 * cover);
        setters[i].dim(Math.min(0.62, 0.24 * cover));
      });
    }
    // Mốc dừng: lúc mỗi thẻ vừa chạm vị trí dính của nó
    let snap = null;
    const st = ScrollTrigger.create({
      trigger: deck,
      start: () => 'top ' + stickyTop(0) + 'px',
      end: () => '+=' + Math.round(cards[n - 1].offsetTop - stickyTop(n - 1) + stickyTop(0)),
      invalidateOnRefresh: true,
      onRefresh: (self) => {
        const len = self.end - self.start || 1;
        const pts = cards.map((c, k) => Math.max(0, Math.min(1, (c.offsetTop - stickyTop(k) + stickyTop(0)) / len)));
        snap = makeSnap([...new Set([...pts, 1])].sort((p, q) => p - q));
        apply();
      },
      onUpdate: (self) => { apply(); if (snap) snap.update(self); },
      onLeaveBack: () => { if (snap) snap.leaveBack(); },
    });
    apply();
    return () => { st.kill(); gsap.set(cards, { clearProps: 'transform,--dim' }); };
  }

  /* ---------------------------------------------------------------------- */
  /* Dải A1: khựng lại khi dải vào đúng một màn hình                          */
  /* ---------------------------------------------------------------------- */
  function bandSnap() {
    const band = $('.band'); if (!band) return () => {};
    const snap = makeSnap([0, 1]);
    const st = ScrollTrigger.create({ trigger: band, start: 'top bottom', end: 'top top', onUpdate: (self) => snap.update(self), onLeaveBack: () => snap.leaveBack() });
    return () => st.kill();
  }

  /* ---------------------------------------------------------------------- */
  /* Dải ảnh: parallax                                                        */
  /* ---------------------------------------------------------------------- */
  function bandParallax() {
    gsap.fromTo('.band-media', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.band-copy', { y: 36 }, { y: -36, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------------------------------------------------------------------- */
  /* 02 · Cách vận hành: thiết bị 3D dính, đổi trạng thái theo bước          */
  /* ---------------------------------------------------------------------- */
  function howSticky(motion) {
    const stepsWrap = $('#steps'), steps = $$('.step', stepsWrap), device = $('#device'), states = $$('.state', device);
    let drawn = false;
    function setActive(n) {
      if (device.dataset.active === n) return;
      device.dataset.active = n;
      steps.forEach((s) => s.classList.toggle('is-active', s.dataset.step === n));
      states.forEach((s) => s.setAttribute('aria-hidden', String(s.dataset.state !== n)));
      if (n === '3' && motion && !drawn) {
        drawn = true;
        gsap.fromTo('.trk-sea', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: 'out', delay: 0.2 });
      }
    }
    stepsWrap.classList.add('is-live');
    setActive('1');
    steps.forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => { if (self.isActive) setActive(s.dataset.step); } }));
    if (motion) {
      // Thiết bị xoay dần về chính diện khi đi qua ba bước
      gsap.fromTo(device, { rotationY: -14, rotationX: 5 }, { rotationY: -2, rotationX: 0, ease: 'none', scrollTrigger: { trigger: stepsWrap, start: 'top 60%', end: 'bottom 60%', scrub: 0.6 } });
    }
    return () => {
      stepsWrap.classList.remove('is-live');
      delete device.dataset.active;
      steps.forEach((s) => s.classList.remove('is-active'));
      states.forEach((s) => s.removeAttribute('aria-hidden'));
    };
  }

  /* ---------------------------------------------------------------------- */
  /* 03 · Mạng lưới                                                           */
  /* ---------------------------------------------------------------------- */
  function netBoard() {
    const board = $('#netBoard'), svg = $('.net-svg'), card = $('#netCard'), dataEl = $('#netData');
    if (!board || !svg || !card || !dataEl) return;
    let data; try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    const barges = data.barges, els = $$('.nb', svg), body = $('.nc-body', card);
    const motion = root.classList.contains('motion-ok');
    const fixes = $('#nbFixes');
    const pool = Array.from({ length: 14 }, () => { const u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#fix-sym'); fixes.appendChild(u); return u; });
    const fmtN = (n) => (lang === 'en' ? n.toLocaleString('en-US') : n.toLocaleString('vi-VN'));
    const fmtD = (n) => n.toFixed(1).replace('.', CH.dec());
    const owners = () => (lang === 'en' ? ['Private owner', 'Shipping company', 'Agent fleet'] : ['Hộ tư nhân', 'Công ty vận tải', 'Đội tàu đại lý']);
    const loops = [];
    let cur = -1, timer = 0, routeTl = null, craneTl = null, paused = false;
    const tripsObj = { v: 0 };

    function render(b, animateCount) {
      $('.nc-id', card).textContent = (lang === 'en' ? 'Barge ' : 'Sà lan ') + b.id;
      $('#ncWharf').textContent = (lang === 'en' ? 'Wharf ' : 'Bến ') + b.w;
      $('#ncOwner').textContent = owners()[b.owner];
      $('#ncCap').textContent = fmtN(b.cap) + (lang === 'en' ? ' t' : ' tấn');
      $('#ncDr').textContent = fmtD(b.dr) + ' m';
      $('#ncRegV').textContent = (lang === 'en' ? '· to ' : '· đến ') + b.reg;
      $('#ncInsV').textContent = (lang === 'en' ? '· to ' : '· đến ') + b.ins;
      const tripsEl = $('#ncTrips');
      if (animateCount && motion) gsap.to(tripsObj, { v: b.trips, duration: 0.8, ease: 'power2.out', onUpdate: () => { tripsEl.textContent = String(Math.round(tripsObj.v)); } });
      else { tripsObj.v = b.trips; tripsEl.textContent = String(b.trips); }
      $('#ncLast').innerHTML = b.last.map(([d, ship, t]) => '<li><span>' + d + '</span><span>' + ship + '</span><span>' + fmtN(t) + (lang === 'en' ? ' t' : ' tấn') + '</span></li>').join('');
    }
    // Tuyến của bến đang chọn: sông vẽ trước (nét đứt), biển vẽ sau (nét liền), rồi rải vết vị trí của các chuyến trước
    function drawRoute(w) {
      $$('.nb-route', svg).forEach((r) => r.classList.toggle('is-on', r.dataset.w === w));
      if (routeTl) routeTl.kill();
      const g = $('.nb-route[data-w="' + w + '"]', svg); if (!g) return;
      const river = $('.nb-river', g), sea = $('.nb-sea', g);
      if (!motion) { gsap.set([river, sea].filter(Boolean), { clearProps: 'strokeDasharray,strokeDashoffset' }); return; }
      routeTl = gsap.timeline();
      gsap.set(pool, { opacity: 0 });
      if (river) routeTl.fromTo(river, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, ease: 'none', onComplete: () => gsap.set(river, { clearProps: 'strokeDasharray,strokeDashoffset' }) }, 0);
      routeTl.fromTo(sea, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power1.inOut', onComplete: () => gsap.set(sea, { clearProps: 'strokeDasharray,strokeDashoffset' }) }, river ? 0.6 : 0);
      const L = sea.getTotalLength();
      pool.forEach((u, i) => {
        const p = sea.getPointAtLength(L * ((i + 1) / (pool.length + 1)));
        const jit = ((i * 7919) % 11 - 5) * 1.2;
        u.setAttribute('transform', 'translate(' + (p.x + jit).toFixed(1) + ' ' + (p.y - jit).toFixed(1) + ')');
        routeTl.to(u, { opacity: 0.7, duration: 0.25 }, (river ? 0.6 : 0) + 1.1 * ((i + 1) / (pool.length + 1)));
      });
      // Cẩu ở bến đang chọn quay chậm như đang làm hàng
      if (craneTl) { craneTl.kill(); craneTl = null; }
      $$('.nb-wharf .pier-j', svg).forEach((j) => gsap.set(j, { clearProps: 'transform' }));
      const jib = $('.nb-wharf[data-w="' + w + '"] .pier-j', svg);
      if (jib) craneTl = gsap.to(jib, { rotation: -34, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '0% 100%' });
    }
    function select(i, byUser) {
      if (i === cur) return;
      cur = i; const b = barges[i];
      els.forEach((el) => el.classList.toggle('is-sel', el.dataset.id === b.id));
      if (motion) {
        body.classList.add('is-swap');
        setTimeout(() => { render(b, true); body.classList.remove('is-swap'); }, 220);
      } else render(b, false);
      drawRoute(b.w);
      if (byUser) restart(9000);
    }
    function next() { select((cur + 1) % barges.length, false); }
    function stopCycle() { clearInterval(timer); clearTimeout(timer); timer = 0; }
    function restart(delay) { stopCycle(); if (!motion || paused) return; if (delay) timer = setTimeout(() => { timer = setInterval(next, 5200); }, delay); else timer = setInterval(next, 5200); }
    els.forEach((el) => {
      const i = barges.findIndex((b) => b.id === el.dataset.id);
      el.addEventListener('pointerenter', () => select(i, true));
      el.addEventListener('click', () => select(i, true));
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i, true); } });
    });
    board.addEventListener('focusin', () => { paused = true; stopCycle(); });
    board.addEventListener('focusout', () => { paused = false; restart(); });
    select(0, false);
    window.__netRender = () => render(barges[Math.max(0, cur)], false);

    if (!motion || !window.ScrollTrigger) return;

    /* Lớp chạy liên tục */
    // Sà lan đậu bến nhấp nhô nhẹ, mỗi chiếc một nhịp
    els.forEach((el, i) => loops.push(gsap.to($('g', el), { y: 1.4, duration: 2.2 + (i % 4) * 0.35, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: -(i * 0.53) })));
    // Khu neo: quét radar và vòng cự ly lan ra
    loops.push(gsap.to('#nbSweep', { rotation: 360, duration: 8, ease: 'none', repeat: -1, svgOrigin: data.anchor[0] + ' ' + data.anchor[1] }));
    loops.push(gsap.fromTo('#nbPulse', { attr: { r: 38 }, opacity: 0.4 }, { attr: { r: 70 }, opacity: 0, duration: 4, ease: 'power1.out', repeat: -1 }));
    // Số đo sâu thỉnh thoảng đo lại
    const snd = $$('.pc-snd text', svg);
    const refresh = gsap.timeline({ repeat: -1, repeatDelay: 2.4 });
    refresh.call(() => { const el = snd[Math.floor(Math.random() * snd.length)]; gsap.fromTo(el, { opacity: 0.1 }, { opacity: 1, duration: 1.2, ease: 'out', clearProps: 'opacity' }); }).to({}, { duration: 0.1 });
    loops.push(refresh);
    // Hai sà lan đang chạy: trên sông chỉ hiện ở hai mốc (bến, cửa sông), trên biển chạy liên tục có định vị
    function mover(el) {
      const g = $('.nb-route[data-w="' + el.dataset.w + '"]', svg); if (!g) return null;
      const river = $('.nb-river', g), sea = $('.nb-sea', g), bodyEl = $('.mv-body', el), dir = Number(el.dataset.dir) || 1;
      const L = sea.getTotalLength();
      const place = (p) => {
        const d = p * L, a = sea.getPointAtLength(d), b = sea.getPointAtLength(Math.min(L, d + 1));
        let ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI; if (dir < 0) ang += 180;
        el.setAttribute('transform', 'translate(' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ')'); bodyEl.setAttribute('transform', 'rotate(' + ang.toFixed(1) + ')');
      };
      const wharfPt = river ? river.getPointAtLength(river.getTotalLength()) : null;
      const atWharf = () => { if (!wharfPt) return; el.setAttribute('transform', 'translate(' + wharfPt.x.toFixed(1) + ' ' + wharfPt.y.toFixed(1) + ')'); bodyEl.setAttribute('transform', 'rotate(' + (dir > 0 ? -60 : 120) + ')'); };
      const o = { p: dir > 0 ? 0 : 1 };
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
      if (dir > 0) {
        if (river) tl.call(atWharf).to(el, { opacity: 1, duration: 0.5 }).to(el, { opacity: 0, duration: 0.5 }, '+=1.2');
        tl.call(() => { o.p = 0; place(0); }).to(el, { opacity: 1, duration: 0.5 })
          .to(o, { p: 1, duration: 10, ease: 'power1.inOut', onUpdate: () => place(o.p) }, '<')
          .to(el, { opacity: 0, duration: 0.6 }, '-=0.6');
      } else {
        tl.call(() => { o.p = 1; place(1); }).to(el, { opacity: 1, duration: 0.5 })
          .to(o, { p: 0, duration: 9, ease: 'power1.inOut', onUpdate: () => place(o.p) }, '<')
          .to(el, { opacity: 0, duration: 0.5 }, '-=0.5');
        if (river) tl.call(atWharf).to(el, { opacity: 1, duration: 0.5 }, '+=0.3').to(el, { opacity: 0, duration: 0.5 }, '+=1.2');
      }
      return tl;
    }
    const m1 = mover($('#nbMover1')), m2 = mover($('#nbMover2'));
    if (m1) loops.push(m1);
    if (m2) { m2.delay(6); loops.push(m2); }

    const toggleLoops = (on) => loops.forEach((l) => (on ? l.resume() : l.pause()));
    ScrollTrigger.create({ trigger: board, start: 'top bottom', end: 'bottom top', onToggle: (st) => { const on = st.isActive && !document.hidden; toggleLoops(on); if (on) restart(); else stopCycle(); } });
    document.addEventListener('visibilitychange', () => { const on = !document.hidden && ScrollTrigger.isInViewport(board); toggleLoops(on); if (on) restart(); else stopCycle(); });
    window.__netLoops = loops;
  }
  netBoard();

  /* ---------------------------------------------------------------------- */
  /* Hiện dần khi cuộn tới (một lần)                                          */
  /* ---------------------------------------------------------------------- */
  function reveals() {
    const els = $$('[data-reveal]');
    gsap.set(els, { autoAlpha: 0, y: 30 });
    ScrollTrigger.batch(els, {
      start: 'top 88%', once: true,
      onEnter: (batch) => {
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'out', stagger: 0.08, overwrite: true });
        batch.forEach((el) => {
          const line = $('.rule-line', el);
          if (line) gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'inOut', delay: 0.05 });
        });
      },
    });
  }

  function ownerParallax() {
    gsap.fromTo('#oCard', { y: 70 }, { y: -40, ease: 'none', scrollTrigger: { trigger: '.o-vis', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  function footerReveal() {
    gsap.from('.ftr-mark-wrap', { yPercent: 30, autoAlpha: 0, duration: 1.4, ease: 'out', scrollTrigger: { trigger: '.ftr-mark-wrap', start: 'top 90%', once: true } });
  }


  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
