/* =========================================================
   Animações com Motion (motion.dev · github.com/motiondivision/motion)
   - entrada das páginas e listas (mola suave, em cascata)
   - formulários laterais deslizando, menus e avisos surgindo
   - números dos indicadores contando
   - blocos abaixo da dobra aparecem ao rolar
   Respeita “reduzir movimento” do sistema. Sem a biblioteca, nada muda.
   ========================================================= */
(function () {
  const M = window.Motion;
  if (!M || !M.animate) return;
  const { animate, stagger, inView } = M;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const ok = () => !reduce.matches;
  const SPRING = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 };
  const SOFT = { type: 'spring', stiffness: 300, damping: 30 };
  const isMobile = () => innerWidth <= 640;
  document.documentElement.classList.add('has-motion');

  // anima e depois devolve o controle ao CSS (hover, estados…)
  function run(els, keyframes, opts) {
    const list = (Array.isArray(els) ? els : [els]).filter(Boolean);
    if (!list.length) return Promise.resolve();
    const a = animate(list, keyframes, opts);
    const clear = () => list.forEach((el) => { el.style.opacity = ''; el.style.transform = ''; });
    (a.finished || a).then?.(clear, clear);
    return a;
  }
  const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.top < innerHeight + 40; };

  /* ---------- números dos indicadores contando ---------- */
  function countUp(root) {
    root.querySelectorAll('.op-kpi > b, .os-kpi > b, .kpi .val, .rep-kpi > b').forEach((el) => {
      const node = [...el.childNodes].find((n) => n.nodeType === 3 && /^\s*\d+\s*$/.test(n.textContent));
      if (!node) return;
      const end = +node.textContent.trim();
      if (end < 2) return;
      animate(0, end, { duration: Math.min(0.9, 0.35 + end / 120), ease: [0.16, 1, 0.3, 1], onUpdate: (v) => (node.textContent = Math.round(v)) });
    });
  }

  /* ---------- entrada da página ---------- */
  let lastRoute = null;
  function enterPage() {
    const page = document.querySelector('#view .page');
    if (!page || !ok()) return;
    const route = location.hash;
    const changed = route !== lastRoute;
    lastRoute = route;
    if (!changed) return; // re-render na mesma página (filtro, salvar): sem animar tudo de novo
    page.style.animation = 'none';
    const blocks = [...page.children].filter(onScreen).slice(0, 10);
    run(blocks, { opacity: [0, 1], y: [14, 0] }, { ...SPRING, delay: stagger(0.045) });
    const items = [...page.querySelectorAll('.os-card, .svc, .dash-row, .t tbody tr, .rcard, .wday, .kcard, .item-row, .op-kpi, .os-kpi')]
      .filter(onScreen).slice(0, 28);
    if (items.length) run(items, { opacity: [0, 1], y: [10, 0] }, { ...SOFT, delay: stagger(0.022, { startDelay: 0.06 }) });
    countUp(page);
    // o que está abaixo da dobra aparece ao rolar
    if (inView) {
      page.querySelectorAll('.card, .os-card, .rcard, .dash-row, .svc').forEach((el) => {
        if (onScreen(el)) return;
        el.style.opacity = '0';
        inView(el, () => { run(el, { opacity: [0, 1], y: [18, 0] }, SOFT); }, { margin: '0px 0px -30px 0px' });
      });
    }
  }
  const baseRouter = window.router;
  window.router = function () { const r = baseRouter.apply(this, arguments); enterPage(); return r; };

  /* ---------- formulário lateral (gaveta) ---------- */
  // Uma animação por vez na gaveta; ela sempre termina limpa (nada fica a meio caminho)
  const baseOpen = window.openDrawer, baseClose = window.closeDrawer;
  let drawerAnim = null, closingArgs = null;
  const drawerEl = () => document.getElementById('drawer');
  function animDrawer(keyframes, opts, onDone) {
    const d = drawerEl();
    if (drawerAnim) { const prev = drawerAnim; drawerAnim = null; prev.stop?.(); }
    d.style.opacity = ''; d.style.transform = '';
    const mine = animate(d, keyframes, opts);
    drawerAnim = mine;
    const finish = () => {
      if (drawerAnim !== mine) return; // outra animação assumiu
      drawerAnim = null;
      d.style.opacity = ''; d.style.transform = '';
      onDone && onDone();
    };
    (mine.finished || mine).then(finish, finish);
    setTimeout(finish, 900); // garantia
    return mine;
  }
  window.openDrawer = function () {
    const d = drawerEl();
    const wasOpen = d.classList.contains('open') && !closingArgs;
    closingArgs = null;
    const r = baseOpen.apply(this, arguments);
    if (ok()) {
      if (wasOpen) { if (drawerAnim) { const p = drawerAnim; drawerAnim = null; p.stop?.(); d.style.opacity = ''; d.style.transform = ''; } }
      else animDrawer(isMobile() ? { y: [60, 0], opacity: [0, 1] } : { x: [56, 0], opacity: [0, 1] }, SPRING);
      run([...d.querySelectorAll('.drawer-body > *')].slice(0, 8), { opacity: [0, 1], y: [10, 0] }, { ...SOFT, delay: stagger(0.035, { startDelay: wasOpen ? 0 : 0.05 }) });
    }
    return r;
  };
  window.closeDrawer = function () {
    const d = drawerEl(), self = this, args = arguments;
    if (!ok() || !d.classList.contains('open')) return baseClose.apply(self, args);
    document.getElementById('overlay').classList.remove('open');
    closingArgs = args;
    animDrawer(isMobile() ? { y: [0, 50], opacity: [1, 0] } : { x: [0, 48], opacity: [1, 0] }, { duration: 0.18, ease: 'easeIn' }, () => {
      if (closingArgs !== args) return; // outro formulário abriu no meio
      closingArgs = null;
      baseClose.apply(self, args);
    });
  };

  /* ---------- menus, busca rápida, avisos e menu do “+” ---------- */
  const seen = new WeakSet();
  new MutationObserver((muts) => {
    if (!ok()) return;
    muts.forEach((m) => {
      const el = m.target;
      if (m.type === 'attributes' && m.attributeName === 'class') {
        const opened = el.classList.contains('open') && !(m.oldValue || '').split(' ').includes('open');
        if (!opened) return;
        if (el.classList.contains('tech-dd')) {
          const menu = el.querySelector(':scope > .tech-menu');
          run(menu, isMobile() ? { y: [40, 0], opacity: [0, 1] } : { y: [-6, 0], scale: [0.97, 1], opacity: [0, 1] }, SPRING);
          run([...menu.querySelectorAll('[role=option], [role=menuitem], .dd-check-row')].slice(0, 12), { opacity: [0, 1], x: [-6, 0] }, { ...SOFT, delay: stagger(0.018) });
        } else if (el.classList.contains('fab-wrap')) {
          run(el.querySelector('.fab-menu'), { y: [12, 0], scale: [0.95, 1], opacity: [0, 1] }, SPRING);
          run([...el.querySelectorAll('.fab-menu button')], { opacity: [0, 1], y: [8, 0] }, { ...SOFT, delay: stagger(0.04, { startDelay: 0.04 }) });
        } else if (el.id === 'palette') {
          run(el, { y: [-14, 0], scale: [0.97, 1], opacity: [0, 1] }, SPRING);
        } else if (el.id === 'notifPop') {
          run(el, { y: [-8, 0], scale: [0.97, 1], opacity: [0, 1] }, SPRING);
          run([...el.querySelectorAll('.notif')], { opacity: [0, 1], x: [10, 0] }, { ...SOFT, delay: stagger(0.04) });
        } else if (el.classList.contains('sidebar')) {
          run([...el.querySelectorAll('.nav-group:not(.closed) .nav-items a')].slice(0, 10), { opacity: [0, 1], x: [-10, 0] }, { ...SOFT, delay: stagger(0.03, { startDelay: 0.05 }) });
        } else if (el.classList.contains('nav-group') && !el.classList.contains('closed')) {
          // (grupo do menu abrindo: tratado abaixo, pela classe “closed” saindo)
        }
      }
      if (m.type === 'attributes' && m.attributeName === 'class' && el.classList.contains('nav-group')) {
        const wasClosed = (m.oldValue || '').split(' ').includes('closed');
        if (wasClosed && !el.classList.contains('closed')) {
          const items = el.querySelector('.nav-items');
          const h = items.scrollHeight;
          const a = animate(items, { height: [0, h + 'px'], opacity: [0, 1] }, { duration: 0.24, ease: [0.16, 1, 0.3, 1] });
          (a.finished || a).then(() => { items.style.height = ''; items.style.opacity = ''; });
          run([...items.children], { opacity: [0, 1], x: [-8, 0] }, { ...SOFT, delay: stagger(0.025) });
        }
      }
      if (m.type === 'childList' && el.id === 'toasts') {
        m.addedNodes.forEach((t) => { if (t.nodeType === 1 && !seen.has(t)) { seen.add(t); run(t, { y: [18, 0], scale: [0.94, 1], opacity: [0, 1] }, SPRING); } });
      }
    });
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true, childList: true });

  /* ---------- gráficos e barras ---------- */
  // linhas se desenham, donuts giram até o valor, barras crescem da esquerda
  // na tela: anima já; abaixo da dobra: anima quando aparecer ao rolar
  function whenVisible(el, fn, hide) {
    if (onScreen(el) || !inView) return fn();
    if (hide) hide();
    let done = false;
    inView(el, () => { if (!done) { done = true; fn(); } }, { margin: '0px 0px -40px 0px' });
  }
  function animateCharts(root) {
    root.querySelectorAll('.hbar i, .progress i, .bar i').forEach((el) => {
      el.style.transformOrigin = 'left center';
      const sib = [...el.closest('.hbars, .rcard, .card, .page').querySelectorAll('.hbar i, .progress i, .bar i')].indexOf(el);
      // observa o trilho (a barra em scaleX(0) não tem área visível)
      whenVisible(el.parentElement, () => run(el, { scaleX: [0, 1] }, { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 + Math.min(Math.max(sib, 0), 10) * 0.045 }),
        () => (el.style.transform = 'scaleX(0)'));
    });
    root.querySelectorAll('svg path[stroke-width="2.4"]').forEach((p) => whenVisible(p, () => {
      if (!p.isConnected || !p.getTotalLength) return;
      const len = p.getTotalLength();
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      const a = animate(p, { strokeDashoffset: [len, 0] }, { duration: 1.1, ease: [0.65, 0, 0.35, 1], delay: 0.15 });
      (a.finished || a).then(() => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; });
      const area = p.previousElementSibling;
      if (area && area.tagName === 'path') run(area, { opacity: [0, 1] }, { duration: 0.8, delay: 0.5 });
    }));
    root.querySelectorAll('.donut-wrap svg').forEach((svg) => whenVisible(svg, () => {
      run(svg, { rotate: [-90, 0], scale: [0.85, 1], opacity: [0, 1] }, { ...SOFT, delay: 0.1 });
      run([...svg.parentElement.querySelectorAll('.donut-legend > div')], { opacity: [0, 1], x: [10, 0] }, { ...SOFT, delay: stagger(0.05, { startDelay: 0.25 }) });
    }));
  }

  /* ---------- re-render na mesma página (filtro, aba, salvar) ---------- */
  // troca suave do conteúdo, bem mais leve que a entrada da página
  let lastQuick = 0;
  function softRefresh() {
    const page = document.querySelector('#view .page');
    if (!page || !ok() || Date.now() - lastQuick < 250) return;
    lastQuick = Date.now();
    const items = [...page.querySelectorAll('.os-card, .svc, .dash-row, .t tbody tr, .rcard, .kcard, .item-row')].filter(onScreen).slice(0, 18);
    if (items.length) run(items, { opacity: [0.35, 1], y: [6, 0] }, { duration: 0.28, ease: 'easeOut', delay: stagger(0.015) });
    // aba ou filtro ativo “salta”
    page.querySelectorAll('.tabs-inline button.on, .page-tabs .on, .chip.on').forEach((b) => {
      const key = b.textContent.trim();
      if (b.parentElement.dataset.lastOn === key) return;
      b.parentElement.dataset.lastOn = key;
      run(b, { scale: [0.9, 1] }, { type: 'spring', stiffness: 600, damping: 22 });
    });
  }

  /* ---------- contadores do menu “pulam” quando mudam ---------- */
  const navCounts = new Map();
  function popNavCounts() {
    document.querySelectorAll('.nav a').forEach((a) => {
      const b = a.querySelector('.count');
      const v = b ? b.textContent : '';
      const prev = navCounts.get(a.getAttribute('href'));
      navCounts.set(a.getAttribute('href'), v);
      if (b && prev !== undefined && prev !== v && ok()) run(b, { scale: [1.5, 1] }, { type: 'spring', stiffness: 500, damping: 15 });
    });
  }

  const routedRouter = window.router;
  window.router = function () {
    const route = location.hash, same = route === lastRoute;
    const r = routedRouter.apply(this, arguments);
    const page = document.querySelector('#view .page');
    if (page && ok()) {
      if (same) softRefresh();
      else setTimeout(() => animateCharts(page), 60); // espera o gráfico ser desenhado no tamanho certo
      if (!same) page.querySelectorAll('.tabs-inline, .page-tabs').forEach((t) => (t.dataset.lastOn = t.querySelector('.on')?.textContent.trim() || ''));
    }
    popNavCounts();
    return r;
  };

  /* ---------- cartões “levantam” ao passar o mouse ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const LIFT = '.os-card:not(.os-row), .rcard, .op-kpi, .os-kpi, .kcard, .rep-kpi';
    document.addEventListener('pointerover', (e) => {
      const c = e.target.closest(LIFT);
      if (!c || !ok() || c.contains(e.relatedTarget)) return;
      animate(c, { y: -4, scale: 1.012 }, { type: 'spring', stiffness: 400, damping: 24 });
    });
    document.addEventListener('pointerout', (e) => {
      const c = e.target.closest(LIFT);
      if (!c || c.contains(e.relatedTarget)) return;
      const a = animate(c, { y: 0, scale: 1 }, { type: 'spring', stiffness: 400, damping: 26 });
      (a.finished || a).then(() => { c.style.transform = ''; });
    });
  }

  /* ---------- popups (cancelar / finalizar OS) ---------- */
  function animDialog(dlg) {
    run(dlg, { opacity: [0, 1], y: [24, 0], scale: [0.94, 1] }, { type: 'spring', stiffness: 380, damping: 28 });
    const body = dlg.querySelector('form, .fd-body');
    if (body) run([...body.children].filter((el) => !el.classList.contains('cd-x')), { opacity: [0, 1], y: [10, 0] }, { ...SOFT, delay: stagger(0.045, { startDelay: 0.08 }) });
    const ico = dlg.querySelector('.cd-ico');
    if (ico) run(ico, { scale: [0.3, 1.15, 1], rotate: dlg.id === 'cancelDlg' ? [0, -12, 12, -6, 0] : [-30, 0, 0] }, { duration: 0.6, ease: 'easeOut', delay: 0.1 });
    if (dlg.id === 'finishDlg') confetti(dlg);
    // fechar com animação
    const baseClose = dlg.close.bind(dlg);
    let closing = false;
    dlg.close = () => {
      if (closing) return; closing = true;
      const a = animate(dlg, { opacity: [1, 0], y: [0, 12], scale: [1, 0.96] }, { duration: 0.16, ease: 'easeIn' });
      (a.finished || a).then(baseClose, baseClose);
    };
    const baseRemove = dlg.remove.bind(dlg);
    dlg.remove = () => setTimeout(baseRemove, 180);
  }

  // chuva de confete saindo do ícone de sucesso
  function confetti(dlg) {
    const ico = dlg.querySelector('.cd-ico');
    if (!ico) return;
    const colors = ['#34C759', '#15C0D8', '#007AFF', '#FFCC00', '#FF9500', '#AF52DE'];
    const layer = document.createElement('div');
    layer.className = 'confetti';
    dlg.append(layer);
    const r = ico.getBoundingClientRect(), d = dlg.getBoundingClientRect();
    const cx = r.left - d.left + r.width / 2, cy = r.top - d.top + r.height / 2;
    for (let i = 0; i < 34; i++) {
      const p = document.createElement('i');
      p.style.cssText = `left:${cx}px;top:${cy}px;background:${colors[i % colors.length]};width:${6 + Math.random() * 5}px;height:${4 + Math.random() * 6}px;border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`;
      layer.append(p);
      const ang = (Math.PI * 2 * i) / 34 + Math.random() * 0.4, dist = 70 + Math.random() * 120;
      animate(p, {
        x: [0, Math.cos(ang) * dist, Math.cos(ang) * dist * 1.1],
        y: [0, Math.sin(ang) * dist - 30, Math.sin(ang) * dist + 140],
        rotate: [0, Math.random() * 540 - 270],
        opacity: [1, 1, 0],
        scale: [0.4, 1, 0.8],
      }, { duration: 1.3 + Math.random() * 0.5, ease: [0.2, 0.7, 0.4, 1], delay: 0.15 + Math.random() * 0.1 });
    }
    setTimeout(() => layer.remove(), 2200);
  }

  /* ---------- timeline da OS abrindo ---------- */
  function animTimeline(card) {
    const body = card.querySelector('.tl-body');
    if (!body) return;
    const h = body.scrollHeight;
    const a = animate(body, { height: [0, h + 'px'], opacity: [0, 1] }, { duration: 0.32, ease: [0.16, 1, 0.3, 1] });
    (a.finished || a).then(() => { body.style.height = ''; body.style.opacity = ''; });
    run([...body.querySelectorAll('.history > div')].slice(0, 12), { opacity: [0, 1], x: [-10, 0] }, { ...SOFT, delay: stagger(0.04, { startDelay: 0.06 }) });
  }

  new MutationObserver((muts) => {
    if (!ok()) return;
    muts.forEach((m) => {
      if (m.type === 'childList') {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1 && n.matches('dialog.confirm-dlg')) requestAnimationFrame(() => n.open && animDialog(n));
        });
      } else if (m.target.classList.contains('tl-card')) {
        const was = (m.oldValue || '').split(' ').includes('open');
        if (!was && m.target.classList.contains('open')) animTimeline(m.target);
      }
    });
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });

  /* ---------- avisos saem deslizando ---------- */
  const baseToast = window.toast;
  if (baseToast) {
    window.toast = function () {
      const r = baseToast.apply(this, arguments);
      const t = document.querySelector('#toasts')?.lastElementChild;
      if (t && ok()) setTimeout(() => animate(t, { opacity: [1, 0], x: [0, 40], scale: [1, 0.95] }, { duration: 0.25, ease: 'easeIn' }), 2900);
      return r;
    };
  }

  /* ---------- barra de progresso de rolagem no topo ---------- */
  if (M.scroll) {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.append(bar);
    M.scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));
  }

  /* ---------- toques: leve “afundar” nos botões principais ---------- */
  document.addEventListener('pointerdown', (e) => {
    if (!ok()) return;
    const b = e.target.closest('.btn-primary, .fab, .op-kpi, .os-kpi, .chip');
    if (b) run(b, { scale: [1, 0.96, 1] }, { duration: 0.28, ease: 'easeOut' });
  }, { passive: true });
})();
