/* =========================================================
   Sumos.app — painel (protótipo de interface)
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const D = () => DB.data;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const moneyShort = (v) => (Math.abs(v) >= 1000 ? 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil' : money(v));
const fmtDate = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const sameDay = (a, b) => a.toDateString() === b.toDateString();
const initials = (n) => n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const client = (id) => D().clients.find((c) => c.id === id) || { name: '—', phone: '' };
const AV_COLORS = ['#007AFF,#4DA3FF', '#0E8FA3,#15C0D8', '#C66A00,#FFB340', '#7c3aed,#c084fc', '#2563eb,#60a5fa', '#db2777,#f472b6'];
// Avatar: foto do usuário (Configurações › Usuários) ou iniciais coloridas
const userByName = (name) => (D().users || []).find((u) => u.name === name);
const avatar = (name, sm = true) => {
  const u = userByName(name);
  if (u && u.photo) return `<img class="avatar avatar-img ${sm ? 'sm' : ''}" src="${u.photo}" alt="${esc(name)}" title="${esc(name)}">`;
  return `<span class="avatar ${sm ? 'sm' : ''}" title="${esc(name)}" style="background:linear-gradient(135deg,${AV_COLORS[name.length % AV_COLORS.length]})">${esc(initials(name))}</span>`;
};
const relTime = (iso) => {
  const diff = (Date.now() - new Date(iso)) / 6e4;
  if (diff < 60) return `há ${Math.max(1, Math.round(diff))} min`;
  if (diff < 1440) return `há ${Math.round(diff / 60)} h`;
  return `há ${Math.round(diff / 1440)} d`;
};
const waLink = (phone, msg) => `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;

function toast(msg, ico = 'check') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = icon(ico) + `<span>${msg}</span>`;
  $('#toasts').append(t);
  setTimeout(() => t.remove(), 3200);
}
function hydrateIcons(root = document) {
  $$('[data-icon]', root).forEach((el) => {
    if (!el.dataset.iconDone) { el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)); el.dataset.iconDone = 1; }
  });
}
function getPref(k, def) { try { const v = localStorage.getItem('sumos-' + k); return v === null ? def : JSON.parse(v); } catch { return def; } }
function setPref(k, v) { try { localStorage.setItem('sumos-' + k, JSON.stringify(v)); } catch {} }

/* ---------------- Navegação ---------------- */
// Menu em grupos (mesma estrutura do sistema antigo). `tone` colore o contador.
const NAV = [
  { group: 'Visão geral', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'agenda', label: 'Agenda', icon: 'calendar' },
  ] },
  { group: 'Operação', items: [
    { id: 'ordens', label: 'Ordens de Serviço', icon: 'file', count: () => D().orders.filter((o) => !CLOSED.includes(o.status)).length },
    { id: 'projetos', label: 'Projetos', icon: 'layout' },
    { id: 'pendencias', label: 'Pendências', icon: 'alert', tone: 'warn', count: () => (D().pendencias || []).filter((p) => p.status !== 'resolvida').length },
    { id: 'melhorias', label: 'Melhorias', icon: 'trendUp' },
    { id: 'rma', label: 'RMA', icon: 'repeat' },
  ] },
  { group: 'Clientes e ativos', items: [
    { id: 'clientes', label: 'Clientes e contatos', icon: 'users' },
    { id: 'fornecedores', label: 'Fornecedores', icon: 'building' },
    { id: 'produtos', label: 'Produtos', icon: 'box' },
    { id: 'estoque', label: 'Estoque', icon: 'box', tone: 'warn', count: () => D().catalogo.filter(isLow).length },
    { id: 'compras', label: 'Solicitações de compra', icon: 'cart', count: () => (D().compras || []).filter((c) => c.status === 'pendente').length },
  ] },
  { group: 'Conhecimento', items: [
    { id: 'acessos', label: 'Acessos', icon: 'key' },
    { id: 'conhecimento', label: 'Conhecimento', icon: 'book' },
  ] },
  { group: 'Relatórios e integração', items: [
    { id: 'relatorios', label: 'Relatórios', icon: 'chart' },
    { id: 'financeiro', label: 'Financeiro', icon: 'wallet' },
  ] },
  // Mesmos itens do sistema real; `path` aponta para subpáginas de #/configuracoes
  { group: 'Configurações', items: [
    { id: 'usuarios', label: 'Usuários', icon: 'users' },
    { id: 'cfg-empresa', path: 'configuracoes/empresa', label: 'Empresa', icon: 'building' },
    { id: 'cfg-api', path: 'configuracoes/api', label: 'API', icon: 'key' },
    { id: 'cfg-mcp', path: 'configuracoes/mcp', label: 'MCP', icon: 'sparkles' },
    { id: 'cfg-smtp', path: 'configuracoes/smtp', label: 'SMTP', icon: 'mail' },
    { id: 'cfg-notificacoes', path: 'configuracoes/notificacoes', label: 'Notificações', icon: 'bell' },
    { id: 'cfg-documentos', path: 'configuracoes/documentos', label: 'Modelos de Doc.', icon: 'file' },
    { id: 'configuracoes', label: 'Preferências', icon: 'settings' },
  ] },
];
const ROUTES = NAV.flatMap((g) => g.items);
const routeHref = (r) => '#/' + (r.path || r.id);
// Item ativo: pelo caminho completo (subpáginas) ou pelo primeiro trecho
function routeActive(r, full) {
  if (r.path) return full === r.path || full.startsWith(r.path + '/');
  if (r.id === 'configuracoes') return full === 'configuracoes';
  return full.split('/')[0] === r.id || (r.id === 'ordens' && full.startsWith('os/'));
}
// Sanfona: só um grupo aberto por vez. Ao trocar de página, abre o grupo dela.
let navOpen = null, navRoute = null;
function renderNav() {
  const full = location.hash.slice(2) || 'dashboard';
  if (full !== navRoute) {
    navRoute = full;
    navOpen = (NAV.find((g) => g.items.some((r) => routeActive(r, full))) || NAV[0]).group;
  }
  $('#nav').innerHTML = NAV.map((g) => {
    const isClosed = g.group !== navOpen;
    return `<div class="nav-group ${isClosed ? 'closed' : ''}">
      <button class="nav-label" data-group="${g.group}" aria-expanded="${!isClosed}">${g.group}${icon('chevD')}</button>
      <div class="nav-items">${g.items.map((r) => {
        const c = r.count ? r.count() : '';
        return `<a href="${routeHref(r)}" class="${routeActive(r, full) ? 'active' : ''}" title="${r.label}">${icon(r.icon)}<span>${r.label}</span>${c ? `<b class="count ${r.tone || ''}">${c}</b>` : ''}</a>`;
      }).join('')}</div>
    </div>`;
  }).join('');
  $$('#nav [data-group]').forEach((b) => (b.onclick = () => {
    navOpen = navOpen === b.dataset.group ? null : b.dataset.group;
    $$('#nav .nav-group').forEach((el) => {
      const open = el.querySelector('[data-group]').dataset.group === navOpen;
      el.classList.toggle('closed', !open);
      el.querySelector('[data-group]').setAttribute('aria-expanded', open);
    });
  }));
}
const PAGES = {};
function router() {
  const [route, param, sub] = (location.hash.slice(2) || 'dashboard').split('/');
  const page = PAGES[route] || PAGES.dashboard;
  $('#view').innerHTML = `<div class="page">${page.render(param, sub)}</div>`;
  hydrateIcons($('#view'));
  page.mount && page.mount(param, sub);
  renderNav();
  $('#sidebar').classList.remove('open');
  $('#overlay').classList.toggle('open', $('#drawer').classList.contains('open'));
  window.scrollTo({ top: 0 });
}
function refresh() { DB.save(); router(); }

/* ---------------- Gráficos SVG ---------------- */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1] || pts[i], [x1, y1] = pts[i], [x2, y2] = pts[i + 1], [x3, y3] = pts[i + 2] || pts[i + 1];
    const c1x = x1 + (x2 - x0) / 6, c1y = y1 + (y2 - y0) / 6, c2x = x2 - (x3 - x1) / 6, c2y = y2 - (y3 - y1) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}`;
  }
  return d;
}
// series: [{ name, color, values: [] }], labels: []
// Desenha no tamanho real do container (sem esticar o texto) e redesenha ao redimensionar.
function lineChart(el, opts) {
  if (el._ro) el._ro.disconnect();
  let lastW = 0;
  el._ro = new ResizeObserver(() => {
    if (!el.isConnected) return el._ro.disconnect();
    if (Math.abs(el.clientWidth - lastW) < 2) return;
    lastW = el.clientWidth;
    drawLineChart(el, opts);
  });
  el._ro.observe(el);
}
// Escala "bonita" para o eixo Y (ex.: 0, 10, 20, 30)
function niceStep(max, count) {
  const raw = max / count, mag = 10 ** Math.floor(Math.log10(raw)), n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
}
function drawLineChart(el, { labels, series, fmt = (v) => v }) {
  const W = Math.max(280, el.clientWidth || 700), H = el.clientHeight || 240, pl = 40, pr = 16, pt = 14, pb = 28;
  const stepY = niceStep(Math.max(...series.flatMap((s) => s.values)) || 1, 4);
  const max = stepY * Math.ceil((Math.max(...series.flatMap((s) => s.values)) * 1.08) / stepY) || 1;
  const x = (i) => pl + (i * (W - pl - pr)) / (labels.length - 1);
  const y = (v) => pt + (H - pt - pb) * (1 - v / max);
  const ticks = [];
  for (let t = 0; t <= max + 1e-9; t += stepY) ticks.push(t);
  const fmtTick = (t) => (t >= 1000 ? (t / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k' : t);
  const gridY = ticks.map((t) => `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}" stroke="var(--border-strong)" stroke-dasharray="3 5"/><text x="${pl - 10}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="var(--text-3)">${fmtTick(t)}</text>`).join('');
  // Rótulos do eixo X: espaçados conforme a largura, contados a partir do último (hoje) para nunca encavalar
  const last = labels.length - 1;
  const step = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor((W - pl - pr) / 64))));
  const xl = labels.map((l, i) => {
    if ((last - i) % step !== 0) return '';
    const anchor = i === last ? 'end' : x(i) - pl < 22 ? 'start' : 'middle';
    return `<text x="${i === last ? W - pr : x(i)}" y="${H - 8}" text-anchor="${anchor}" font-size="11" fill="var(--text-3)">${l}</text>`;
  }).join('');
  const paths = series.map((s, si) => {
    const pts = s.values.map((v, i) => [x(i), y(v)]);
    const line = smoothPath(pts);
    return `<defs><linearGradient id="lg${si}${el.id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".28"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${line} L${x(pts.length - 1)},${H - pb} L${pl},${H - pb}Z" fill="url(#lg${si}${el.id})"/>
      <path d="${line}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linecap="round"/>`;
  }).join('');
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${gridY}${xl}${paths}
    <line class="hover-line" y1="${pt}" y2="${H - pb}" stroke="var(--brand)" stroke-width="1" opacity="0"/>
    ${series.map((s, si) => `<circle class="hover-dot" data-s="${si}" r="5" fill="var(--surface-solid)" stroke="${s.color}" stroke-width="2.5" opacity="0"/>`).join('')}
    <rect x="${pl}" y="0" width="${W - pl - pr}" height="${H}" fill="transparent" class="hit"/></svg><div class="chart-tip"></div>`;
  const svg = $('svg', el), tip = $('.chart-tip', el), hl = $('.hover-line', el);
  $('.hit', el).addEventListener('mousemove', (e) => {
    const r = svg.getBoundingClientRect();
    const vx = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(labels.length - 1, Math.round(((vx - pl) / (W - pl - pr)) * (labels.length - 1))));
    hl.setAttribute('x1', x(i)); hl.setAttribute('x2', x(i)); hl.setAttribute('opacity', 0.4);
    $$('.hover-dot', el).forEach((c) => { const s = series[c.dataset.s]; c.setAttribute('cx', x(i)); c.setAttribute('cy', y(s.values[i])); c.setAttribute('opacity', 1); });
    tip.innerHTML = series.map((s) => `<b style="color:${series.length > 1 ? s.color : '#fff'}">${fmt(s.values[i])}</b>`).join('') + labels[i];
    tip.style.left = (x(i) / W) * r.width + 'px';
    tip.style.top = (y(Math.max(...series.map((s) => s.values[i]))) / H) * r.height + 'px';
    tip.style.opacity = 1;
  });
  $('.hit', el).addEventListener('mouseleave', () => { tip.style.opacity = 0; hl.setAttribute('opacity', 0); $$('.hover-dot', el).forEach((c) => c.setAttribute('opacity', 0)); });
}
function donut(parts) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const R = 52, C = 2 * Math.PI * R;
  let off = 0;
  const arcs = parts.map((p) => {
    const len = (p.value / total) * C;
    const a = `<circle r="${R}" cx="75" cy="75" fill="none" stroke="${p.color}" stroke-width="18" stroke-dasharray="${Math.max(0, len - 3)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 75 75)" stroke-linecap="round"/>`;
    off += len;
    return a;
  }).join('');
  return `<svg viewBox="0 0 150 150"><circle r="${R}" cx="75" cy="75" fill="none" stroke="var(--surface-2)" stroke-width="18"/>${arcs}</svg>`;
}

/* ---------------- Drawer ---------------- */
function openDrawer(html, opts = {}) {
  const d = $('#drawer');
  d.innerHTML = html;
  d.dataset.order = opts.order || '';
  hydrateIcons(d);
  d.classList.add('open');
  $('#overlay').classList.add('open');
  $$('[data-close]', d).forEach((b) => (b.onclick = closeDrawer));
  setTimeout(() => { const f = $('input:not([type=checkbox]), textarea', d); if (f && opts.focus) f.focus(); }, 280);
}
function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#overlay').classList.remove('open');
  $$('#osBody tr.sel').forEach((x) => x.classList.remove('sel'));
}
const drawerHead = (title, sub) => `<div class="drawer-head"><div><h3>${title}</h3>${sub ? `<p class="muted" style="margin:2px 0 0">${sub}</p>` : ''}</div><button class="more" data-close aria-label="Fechar">${icon('x')}</button></div>`;

function openNewTx(type = 'in') {
  openDrawer(`
    ${drawerHead('Novo lançamento')}
    <form class="drawer-body" id="txForm">
      <div class="seg" style="margin:0"><button type="button" data-t="in" class="${type === 'in' ? 'on' : ''}">Entrada</button><button type="button" data-t="out" class="${type === 'out' ? 'on' : ''}">Saída</button></div>
      <div class="form-grid">
        <div class="field full"><label for="tDesc">Descrição</label><input class="input" id="tDesc" required></div>
        <div class="field"><label for="tVal">Valor (R$)</label><input class="input" type="number" min="0" step="0.01" id="tVal" required></div>
        <div class="field"><label for="tCat">Categoria</label><select class="input" id="tCat"><option>Serviços</option><option>Vendas</option><option>Peças</option><option>Fixas</option><option>Outros</option></select></div>
        <div class="field"><label for="tMet">Forma de pagamento</label><select class="input" id="tMet"><option>Pix</option><option>Cartão</option><option>Dinheiro</option><option>Boleto</option><option>Débito</option></select></div>
        <div class="field"><label for="tDate">Data</label><input class="input" type="date" id="tDate" value="${new Date().toISOString().slice(0, 10)}"></div>
      </div>
    </form>
    <div class="drawer-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit" form="txForm">Lançar</button></div>`, { focus: true });
  let t = type;
  $$('#txForm .seg button').forEach((b) => (b.onclick = () => { t = b.dataset.t; $$('#txForm .seg button').forEach((x) => x.classList.toggle('on', x === b)); }));
  $('#txForm').onsubmit = (e) => {
    e.preventDefault();
    D().tx.push({ id: D().nextId.tx++, type: t, desc: $('#tDesc').value.trim(), cat: $('#tCat').value, value: +$('#tVal').value, method: $('#tMet').value, at: new Date($('#tDate').value + 'T12:00').toISOString() });
    closeDrawer(); refresh(); toast('Lançamento registrado', 'wallet');
  };
}

/* ---------------- Financeiro ---------------- */
PAGES.financeiro = {
  render() {
    const tx = [...D().tx].sort((a, b) => new Date(b.at) - new Date(a.at));
    const inn = tx.filter((t) => t.type === 'in').reduce((a, t) => a + t.value, 0);
    const out = tx.filter((t) => t.type === 'out').reduce((a, t) => a + t.value, 0);
    const toReceive = D().orders.filter((o) => ['resolvido', 'finalizada'].includes(o.status)).reduce((a, o) => a + osTotal(o, 'material'), 0);
    const cats = {};
    tx.filter((t) => t.type === 'in').forEach((t) => (cats[t.cat] = (cats[t.cat] || 0) + t.value));
    const palette = ['#007AFF', '#15C0D8', '#99CAFF', '#FF9500', '#FF3B30'];
    const parts = Object.entries(cats).map(([k, v], i) => ({ label: k, value: v, color: palette[i % palette.length] }));
    return `
      <div class="page-head">
        <div><h1>Financeiro</h1><p>Últimos 30 dias</p></div>
        <div class="actions">
          <button class="btn btn-ghost" onclick="openNewTx('out')">${icon('arrowDown')}Saída</button>
          <button class="btn btn-primary" onclick="openNewTx('in')"><span data-icon="plus"></span>Entrada</button>
        </div>
      </div>
      <div class="grid g-4">
        <div class="kpi glass hero"><div class="kpi-top">Saldo do período <span class="kpi-ico">${icon('wallet')}</span></div><div class="val">${money(inn - out)}</div><small style="color:#E5F1FF">Entradas menos saídas</small></div>
        <div class="kpi glass"><div class="kpi-top">Entradas <span class="kpi-ico" style="background:var(--ok-soft);color:var(--ok)">${icon('arrowUp')}</span></div><div class="val">${money(inn)}</div><span class="trend up">▲ 12% vs mês anterior</span></div>
        <div class="kpi glass"><div class="kpi-top">Saídas <span class="kpi-ico" style="background:var(--danger-soft);color:var(--danger)">${icon('arrowDown')}</span></div><div class="val">${money(out)}</div><span class="trend down">▼ 4% vs mês anterior</span></div>
        <div class="kpi glass dark"><div class="kpi-top">A receber <span class="kpi-ico">${icon('clock')}</span></div><div class="val">${money(toReceive)}</div><small style="color:#AEAEB2">Materiais de OS resolvidas/finalizadas</small></div>
      </div>
      <div class="grid g-main">
        <div class="card glass">
          <div class="card-head"><div><h3>Entradas x saídas</h3><p>Acumulado por semana</p></div><div class="legend"><span><i style="background:#007AFF"></i>Entradas</span><span><i style="background:#15C0D8"></i>Saídas</span></div></div>
          <div class="chart-wrap" id="finChart"></div>
        </div>
        <div class="card glass">
          <div class="card-head"><div><h3>Receita por categoria</h3></div></div>
          <div class="donut-wrap">${donut(parts)}<div class="donut-legend">${parts.map((p) => `<div><i style="background:${p.color}"></i>${p.label}<b>${Math.round((p.value / inn) * 100)}%</b></div>`).join('')}</div></div>
        </div>
      </div>
      <div class="card glass">
        <div class="card-head"><div><h3>Lançamentos</h3><p>${tx.length} movimentações</p></div></div>
        <div class="table-wrap"><table class="t">
          <thead><tr><th class="nosort">Descrição</th><th class="nosort">Categoria</th><th class="nosort">Pagamento</th><th class="nosort">Data</th><th class="nosort" style="text-align:right">Valor</th></tr></thead>
          <tbody>${tx.map((t) => `<tr style="cursor:default">
            <td><div class="who"><span class="kpi-ico" style="width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:${t.type === 'in' ? 'var(--ok-soft)' : 'var(--danger-soft)'};color:${t.type === 'in' ? 'var(--ok)' : 'var(--danger)'}">${icon(t.type === 'in' ? 'arrowUp' : 'arrowDown')}</span>${esc(t.desc)}</div></td>
            <td><span class="badge b-muted">${esc(t.cat)}</span></td>
            <td class="muted">${esc(t.method)}</td>
            <td class="muted">${fmtDate(t.at)}</td>
            <td style="text-align:right;font-weight:700;color:${t.type === 'in' ? 'var(--ok)' : 'var(--danger)'}">${t.type === 'in' ? '+' : '−'} ${money(t.value)}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>`;
  },
  mount() {
    const labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];
    lineChart($('#finChart'), {
      labels,
      series: [
        { name: 'Entradas', color: '#007AFF', values: [4200, 5100, 4700, 6300, 5800, 6900, 6400, 7600] },
        { name: 'Saídas', color: '#15C0D8', values: [3100, 2900, 3600, 3300, 4100, 3500, 3900, 4200] },
      ],
      fmt: (v) => money(v),
    });
  },
};

/* ---------------- Configurações ---------------- */
PAGES.configuracoes = {
  render() {
    const tpl = getPref('wa-template', 'Olá {cliente}! Sobre a OS {os} ({servico}): status atual {status}.');
    const sw = (k, label, sub, def = true) => `<div class="set-row"><div><b>${label}</b><small>${sub}</small></div><label class="switch"><input type="checkbox" data-pref="${k}" ${getPref(k, def) ? 'checked' : ''}><span></span></label></div>`;
    return `
      <div class="page-head"><div><small class="eyebrow">Configurações</small><h1>Preferências</h1><p>Aparência, avisos e dados de demonstração deste protótipo</p></div></div>
      <div class="grid g-2" style="align-items:start">
        <div class="card glass">
          <div class="card-head"><h3>Aparência</h3></div>
          <div class="set-row"><div><b>Tema escuro</b><small>Alterna entre claro e escuro</small></div><label class="switch"><input type="checkbox" id="darkSw" ${Theme.isDark() ? 'checked' : ''}><span></span></label></div>
          <div class="set-row"><div><b>Menu lateral recolhido</b><small>Mostra só os ícones no menu</small></div><label class="switch"><input type="checkbox" id="colSw" ${getPref('collapsed', false) ? 'checked' : ''}><span></span></label></div>
        </div>
        <div class="card glass">
          <div class="card-head"><h3>Notificações</h3></div>
          ${sw('n-ready', 'OS finalizada', 'Enviar o relatório ao cliente ao finalizar')}
          ${sw('n-late', 'OS atrasada', 'Alertar a equipe quando passar do prazo')}
          ${sw('n-stock', 'Estoque baixo', 'Alertar quando uma peça chegar ao mínimo')}
          ${sw('n-unassigned', 'OS sem técnico', 'Alertar quando uma OS ficar sem responsável')}
          ${sw('n-rma', 'RMA parado', 'Alertar quando um RMA passar de 7 dias sem retorno', false)}
        </div>
        <div class="card glass">
          <div class="card-head"><div><h3>Mensagem de WhatsApp</h3><p>Use {cliente}, {os}, {servico} e {status}</p></div></div>
          <textarea class="input" id="waTpl" rows="4">${esc(tpl)}</textarea>
          <div class="row-between" style="margin-top:10px"><span class="hint" id="waPrev"></span><button class="btn btn-primary btn-sm" id="waSave">Salvar</button></div>
        </div>
        <div class="card glass">
          <div class="card-head"><div><h3>Dados de demonstração</h3><p>Este protótipo salva tudo no seu navegador</p></div></div>
          <p class="muted" style="margin-top:0">Volta as OS, clientes, cadastros, estoque e financeiro para os dados de exemplo originais.</p>
          <button class="btn btn-ghost" id="resetDb">${icon('trash')}Restaurar dados de exemplo</button>
        </div>
      </div>`;
  },
  mount() {
    $('#darkSw').onchange = () => { Theme.toggle(); paintTheme(); };
    $('#colSw').onchange = (e) => setCollapsed(e.target.checked);
    $$('[data-pref]').forEach((i) => (i.onchange = () => { setPref(i.dataset.pref, i.checked); toast('Preferência salva'); }));
    const prev = () => ($('#waPrev').textContent = 'Prévia: ' + $('#waTpl').value.replace('{cliente}', 'Clínica Bem Estar').replace('{os}', '#9e3779b1').replace('{servico}', 'Configurar VPN').replace('{status}', 'Em atendimento'));
    $('#waTpl').oninput = prev; prev();
    $('#waSave').onclick = () => { setPref('wa-template', $('#waTpl').value); toast('Mensagem salva'); };
    $('#resetDb').onclick = () => { if (confirm('Restaurar todos os dados de exemplo? As alterações feitas serão perdidas.')) { DB.reset(); location.reload(); } };
  },
};

/* ---------------- Busca rápida (Ctrl+K) ---------------- */
let palIdx = 0, palItems = [];
function openPalette() {
  $('#palette').classList.add('open');
  $('#overlay').classList.add('open');
  $('#paletteInput').value = '';
  renderPalette('');
  $('#paletteInput').focus();
}
function closePalette() {
  $('#palette').classList.remove('open');
  if (!$('#drawer').classList.contains('open')) $('#overlay').classList.remove('open');
}
function renderPalette(q) {
  q = q.trim().toLowerCase();
  const actions = [
    { g: 'Ações', ico: 'plus', label: 'Nova ordem de serviço', hint: 'N', run: () => openNewOrder() },
    { g: 'Ações', ico: 'clock', label: 'Ver OS atrasadas', run: () => goOrders({ quick: 'atrasadas' }) },
    { g: 'Ações', ico: 'user', label: 'Ver OS sem técnico', run: () => goOrders({ quick: 'semtec' }) },
    { g: 'Ações', ico: 'user', label: 'Novo cliente', run: () => openNewClient() },
    { g: 'Ações', ico: 'calendar', label: 'Agendar OS', run: () => openSchedule() },
    { g: 'Ações', ico: 'wallet', label: 'Lançar entrada no caixa', run: () => openNewTx('in') },
    { g: 'Ações', ico: Theme.isDark() ? 'sun' : 'moon', label: 'Alternar tema claro/escuro', run: () => { Theme.toggle(); paintTheme(); } },
    ...ROUTES.filter((r) => r.id).map((r) => ({ g: 'Ir para', ico: r.icon, label: r.label, run: () => (location.hash = routeHref(r)) })),
  ];
  const os = D().orders.map((o) => ({ g: 'Ordens de serviço', ico: 'file', label: `${osCode(o, true)} · ${client(o.clientId).name} — ${o.issue}`, hint: STATUS[o.status].label, run: () => openOrder(o.id), s: [o.code, o.issue, o.solution, client(o.clientId).name, o.tech].join(' ') }));
  const cl = D().clients.map((c) => ({ g: 'Clientes', ico: 'user', label: c.name, hint: c.phone, run: () => openClient(c.id), s: [c.name, c.phone, c.doc, c.contact].join(' ') }));
  const sk = D().catalogo.map((p) => ({ g: 'Produtos e estoque', ico: 'box', label: p.name, hint: p.type === 'Produto' ? `${p.stock} un.` : 'Serviço', run: () => (location.hash = p.type === 'Produto' ? '#/estoque/' + p.id : '#/produtos'), s: [p.name, p.category, p.location].join(' ') }));
  palItems = q ? [...actions, ...os, ...cl, ...sk].filter((i) => (i.label + ' ' + (i.s || '')).toLowerCase().includes(q)).slice(0, 14) : actions;
  palIdx = 0;
  let lastG = '';
  $('#paletteResults').innerHTML = palItems.length ? palItems.map((it, i) => {
    const g = it.g !== lastG ? `<div class="group">${it.g}</div>` : '';
    lastG = it.g;
    return `${g}<div class="res ${i === 0 ? 'on' : ''}" data-i="${i}">${icon(it.ico)}<span>${esc(it.label)}</span>${it.hint ? `<small>${esc(it.hint)}</small>` : ''}</div>`;
  }).join('') : `<div class="empty">Nada encontrado para “${esc(q)}”</div>`;
  $$('#paletteResults .res').forEach((el) => {
    el.onclick = () => runPal(+el.dataset.i);
    el.onmousemove = () => setPal(+el.dataset.i);
  });
}
function setPal(i) {
  palIdx = i;
  $$('#paletteResults .res').forEach((el) => el.classList.toggle('on', +el.dataset.i === i));
  $(`#paletteResults .res[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' });
}
function runPal(i) { const it = palItems[i]; if (!it) return; closePalette(); it.run(); }
$('#paletteInput').oninput = (e) => renderPalette(e.target.value);
$('#paletteInput').onkeydown = (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); setPal(Math.min(palItems.length - 1, palIdx + 1)); }
  if (e.key === 'ArrowUp') { e.preventDefault(); setPal(Math.max(0, palIdx - 1)); }
  if (e.key === 'Enter') { e.preventDefault(); runPal(palIdx); }
};

/* ---------------- Notificações ---------------- */
function renderNotifs() {
  const n = D().notifs;
  const tones = { ok: ['var(--ok-soft)', 'var(--ok)'], warn: ['var(--warn-soft)', 'var(--warn)'], danger: ['var(--danger-soft)', 'var(--danger)'], brand: ['var(--brand-soft)', 'var(--brand)'] };
  $('#notifDot').style.display = n.some((x) => x.unread) ? '' : 'none';
  $('#notifPop').innerHTML = `<div class="p-head"><b>Notificações</b><a href="#" id="markAll" style="font-size:12px">Marcar todas como lidas</a></div>
    ${n.map((x) => `<div class="notif ${x.unread ? 'unread' : ''}"><span class="n-ico" style="background:${tones[x.tone][0]};color:${tones[x.tone][1]}">${icon(x.icon)}</span><div><strong style="font-weight:600">${esc(x.text)}</strong><small>${relTime(x.at)}</small></div></div>`).join('')}`;
  $('#markAll').onclick = (e) => { e.preventDefault(); n.forEach((x) => (x.unread = false)); DB.save(); renderNotifs(); };
}

/* ---------------- Shell ---------------- */
function paintTheme() { $('#themeBtn').innerHTML = icon(Theme.isDark() ? 'sun' : 'moon'); }
function setCollapsed(v) { $('#app').classList.toggle('collapsed', v); setPref('collapsed', v); }

function init() {
  hydrateIcons();
  const user = sessionStorage.getItem('sumos-user');
  if (user) {
    const nm = user.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    $('#userName').textContent = nm;
    $('#userAvatar').textContent = initials(nm);
  }
  $('#menuBtn').innerHTML = icon('menu');
  $('#collapseBtn').innerHTML = icon('sidebar');
  paintTheme();
  setCollapsed(getPref('collapsed', false));

  $('#themeBtn').onclick = () => { Theme.toggle(); paintTheme(); if (location.hash.includes('config')) router(); };
  $('#collapseBtn').onclick = () => setCollapsed(!$('#app').classList.contains('collapsed'));
  $('#menuBtn').onclick = () => { $('#sidebar').classList.add('open'); $('#overlay').classList.add('open'); };
  $('#searchBtn').onclick = openPalette;
  $('#quickNew').onclick = () => openNewOrder();
  $('#logoutBtn').onclick = () => { try { sessionStorage.removeItem('sumos-user'); } catch {} location.href = 'index.html'; };
  $('#overlay').onclick = () => { closeDrawer(); closePalette(); $('#sidebar').classList.remove('open'); };
  $('#notifBtn').onclick = (e) => { e.stopPropagation(); $('#notifPop').classList.toggle('open'); };
  document.addEventListener('click', (e) => { if (!e.target.closest('#notifPop')) $('#notifPop').classList.remove('open'); });

  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    const palOpen = $('#palette').classList.contains('open');
    if (palOpen && !typing && e.key.length === 1) { $('#paletteInput').focus(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
    else if (e.key === 'Escape') { closePalette(); closeDrawer(); $('#sidebar').classList.remove('open'); $('#notifPop').classList.remove('open'); }
    else if (!typing && e.key === '/') { e.preventDefault(); openPalette(); }
    else if (!typing && e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openNewOrder(); }
  });

  renderNotifs();
  window.addEventListener('hashchange', router);
  router();
}
// Roda depois de todos os scripts (modules.js registra páginas extras)
document.addEventListener("DOMContentLoaded", init);
