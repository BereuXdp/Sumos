/* =========================================================
   Ordens de Serviço, Dashboard (Visão operacional) e Clientes
   Estrutura copiada do sistema antigo (sumos.devmais.com):
   status, urgência/SLA, tipo de serviço, modalidade, agendamento,
   tempo de atendimento, pendências, peças e serviços, assinatura
   e finalização.
   ========================================================= */

/* ---------- Helpers de OS (usados também pela Agenda) ---------- */
const osClosed = (o) => CLOSED.includes(o.status);
const osCode = (o, long) => '#' + (long ? o.code : o.code.slice(0, 4));
const urgOf = (o) => URG[o.urgency] || URG.normal;
const urgBadge = (o) => `<span class="urg" style="--c:${urgOf(o).color}">${urgOf(o).label.toUpperCase()}</span>`;
const urgPill = (o) => `<span class="pill-solid" style="--c:${urgOf(o).color}">${urgOf(o).label}</span>`;
const statusPill = (o) => `<span class="pill-solid" style="--c:${STATUS[o.status].color}">${STATUS[o.status].label}</span>`;
const isLate = (o) => !osClosed(o) && new Date(o.dueAt) < new Date();
const slaPill = (o) => (osClosed(o) ? '' : isLate(o) ? '<span class="pill-solid" style="--c:#FF3B30">Atrasada</span>' : '<span class="pill-solid" style="--c:#34C759">Em dia</span>');
const svcColor = (o) => (osClosed(o) ? '#AAAAAA' : urgOf(o).color);
const osTotal = (o, kind) => (o.items || []).filter((i) => !kind || i.kind === kind).reduce((a, i) => a + i.qty * i.price, 0);
const fmtDT = (iso) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).replace(',', '');
const fmtMin = (m) => { m = Math.round(m); return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}min`; };
const mapsLink = (addr) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
const orderById = (id) => D().orders.find((o) => o.id === +id);
const addHistory = (o, text) => o.history.push({ at: new Date().toISOString(), text });
const badge = (st) => `<span class="badge ${STATUS[st].cls}">${STATUS[st].label}</span>`;

// Foto do técnico no canto do cartão de OS (iniciais quando não há foto)
const svcPhoto = (tech) => `<span class="svc-photo" title="${esc(tech || 'Sem técnico')}">${tech ? avatar(tech, false) : `<span class="avatar no-tech">${icon('user')}</span>`}</span>`;

function openOrder(id) { location.hash = '#/os/' + id; }

function setStatus(id, st, silent) {
  const o = orderById(id);
  if (!o || o.status === st) return;
  o.status = st;
  if (st === 'atendimento' && !o.timerStart) o.timerStart = new Date().toISOString();
  if (osClosed(o) && o.timerStart) { o.timeSpent += (Date.now() - new Date(o.timerStart)) / 6e4; o.timerStart = ''; }
  o.closedAt = osClosed(o) ? o.closedAt || new Date().toISOString() : '';
  addHistory(o, `Status alterado para “${STATUS[st].label}”`);
  DB.save();
  if (!silent) toast(`${osCode(o)} → ${STATUS[st].label}`);
  router();
}

function exportCsv(list) {
  const rows = [['OS', 'Cliente', 'Solicitante', 'Tipo', 'Modalidade', 'Urgência', 'Status', 'Técnico', 'Aberta em', 'Prazo (SLA)', 'Agendamento', 'Descrição', 'Total (R$)']];
  list.forEach((o) => rows.push([osCode(o, true), client(o.clientId).name, o.requester, o.type, o.modality, urgOf(o).label, STATUS[o.status].label, o.tech || 'Sem técnico', fmtDT(o.openedAt), fmtDT(o.dueAt), o.scheduledAt ? fmtDT(o.scheduledAt) : '', o.issue, osTotal(o)]));
  const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `ordens-de-servico-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  toast(`${list.length} OS exportadas para planilha`, 'download');
}

// "Exportar PDF": abre a impressão do navegador (dá para salvar como PDF)
function printOrder(id) {
  const o = orderById(id), c = client(o.clientId);
  const rows = (kind) => (o.items || []).filter((i) => i.kind === kind).map((i) => `<tr><td>${esc(i.name)}</td><td>${i.qty}</td><td>${money(i.price)}</td><td>${money(i.qty * i.price)}</td></tr>`).join('') || '<tr><td colspan="4">Nenhum item</td></tr>';
  const pa = $('#printArea');
  pa.hidden = false;
  pa.innerHTML = `<div style="font-family:system-ui;max-width:720px;font-size:13px">
    <h2 style="margin:0">Ordem de Serviço ${osCode(o, true)}</h2>
    <p>Aberta em ${fmtDT(o.openedAt)} · ${STATUS[o.status].label} · Urgência ${urgOf(o).label} (${urgOf(o).sla})</p><hr>
    <p><b>Cliente:</b> ${esc(c.name)} · CNPJ ${esc(c.doc || '')}<br><b>Endereço:</b> ${esc(c.address || '')}<br><b>Solicitante:</b> ${esc(o.requester || '')}</p>
    <p><b>Tipo:</b> ${esc(o.type)} · <b>Modalidade:</b> ${esc(o.modality)} · <b>Técnico:</b> ${esc(o.tech || 'Sem técnico')}<br><b>Computador afetado:</b> ${esc(o.computer || '-')}</p>
    <p><b>Descrição do problema:</b><br>${esc(o.issue)}</p>
    <p><b>Materiais utilizados</b></p><table border="1" cellpadding="4" cellspacing="0" width="100%"><tr><th>Item</th><th>Qtd</th><th>Valor</th><th>Total</th></tr>${rows('material')}</table>
    <p><b>Solução:</b><br>${esc(o.solution || '—')}</p>
    <p><b>Tempo de atendimento:</b> ${fmtMin(o.timeSpent || 0)} · <b>Total:</b> ${money(osTotal(o, 'material'))}</p>
    ${o.signature ? `<p><img src="${o.signature.img}" style="height:70px"><br>${esc(o.signature.name)}</p>` : '<p style="margin-top:50px">______________________________<br>Assinatura do responsável</p>'}
  </div>`;
  window.print();
  setTimeout(() => (pa.hidden = true), 500);
}

/* =========================================================
   Lista de Ordens de Serviço
   ========================================================= */
const OS_ADV_DEFAULT = () => ({ status: '', urg: '', tech: '', client: '', from: '', to: '', text: '' });
const OS_STATE = { scope: 'abertas', quick: '', q: '', adv: OS_ADV_DEFAULT(), layout: getPref('os-layout', 'lista'), sel: new Set() };
const SCOPES = {
  abertas: (o) => !osClosed(o),
  aberto: (o) => o.status === 'aberto',
  atendimento: (o) => o.status === 'atendimento',
  aguardando: (o) => o.status === 'aguardando',
  fechadas: (o) => osClosed(o),
  todas: () => true,
};
const QUICK = {
  hoje: { label: 'Hoje', icon: 'calendar', fn: (o) => o.scheduledAt && sameDay(new Date(o.scheduledAt), new Date()) },
  atrasadas: { label: 'Atrasadas', icon: 'clock', fn: isLate },
  alta: { label: 'Alta Prioridade', icon: 'alert', fn: (o) => ['alta', 'critica'].includes(o.urgency) },
  semtec: { label: 'Sem técnico', icon: 'user', fn: (o) => !o.tech && !osClosed(o) },
};
const advCount = () => Object.values(OS_STATE.adv).filter(Boolean).length;
// Atalhos usados pelo Dashboard e pela busca
function goOrders(opts = {}) {
  Object.assign(OS_STATE, { scope: 'abertas', quick: '', q: '', adv: OS_ADV_DEFAULT() }, opts);
  location.hash = '#/ordens';
  if (location.hash === '#/ordens') router();
}
function osFiltered() {
  const a = OS_STATE.adv, q = (OS_STATE.q + ' ' + a.text).trim().toLowerCase();
  return D().orders.filter((o) => {
    if (!SCOPES[OS_STATE.scope](o)) return false;
    if (OS_STATE.quick && !QUICK[OS_STATE.quick].fn(o)) return false;
    if (a.status && o.status !== a.status) return false;
    if (a.urg && o.urgency !== a.urg) return false;
    if (a.tech && (a.tech === '-' ? o.tech : o.tech !== a.tech)) return false;
    if (a.client && o.clientId !== +a.client) return false;
    if (a.from && (!o.scheduledAt || o.scheduledAt.slice(0, 10) < a.from)) return false;
    if (a.to && (!o.scheduledAt || o.scheduledAt.slice(0, 10) > a.to)) return false;
    if (q && !q.split(/\s+/).every((w) => [o.code, client(o.clientId).name, o.issue, o.solution, o.requester, o.computer, o.tech, o.type].join(' ').toLowerCase().includes(w))) return false;
    return true;
  }).sort((x, y) => (y.pinned ? 1 : 0) - (x.pinned ? 1 : 0)
    || (osClosed(x) ? 1 : 0) - (osClosed(y) ? 1 : 0)
    || ['critica', 'alta', 'normal'].indexOf(x.urgency) - ['critica', 'alta', 'normal'].indexOf(y.urgency)
    || (x.scheduledAt || '9').localeCompare(y.scheduledAt || '9'));
}

function osCardMenu(o) {
  return `<div class="tech-dd os-menu" id="m${o.id}">
    <button class="more" data-menu="${o.id}" aria-label="Abrir menu" aria-haspopup="true" aria-expanded="false">${icon('dots')}</button>
    <div class="tech-menu" role="menu">
      <div class="tech-menu-head">Ações</div>
      <button role="menuitem" data-act="ver" data-id="${o.id}">${icon('file')}Ver detalhes</button>
      <button role="menuitem" data-act="pdf" data-id="${o.id}">${icon('download')}Exportar PDF</button>
      <button role="menuitem" data-act="editar" data-id="${o.id}">${icon('edit')}Editar</button>
      <button role="menuitem" data-act="agendar" data-id="${o.id}">${icon('calendar')}${o.scheduledAt ? 'Reagendar' : 'Agendar'}</button>
      <a role="menuitem" href="${mapsLink(client(o.clientId).address || client(o.clientId).name)}" target="_blank" rel="noopener">${icon('pin')}Ver endereço</a>
    </div>
  </div>`;
}
// Selo suave (mesma altura para todos): urgência, status e atraso numa linha só
const softChip = (color, label, ico) => `<span class="oc-chip" style="--k:${color}">${ico ? icon(ico) : '<i></i>'}${label}</span>`;
const shortDT = (iso) => { const d = new Date(iso); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} · ${fmtTime(iso)}`; };

function osCard(o) {
  const c = client(o.clientId);
  const when = o.scheduledAt || o.openedAt;
  return `<article class="os-card oc ${OS_STATE.sel.has(o.id) ? 'selected' : ''} ${o.pinned ? 'pinned' : ''}" data-id="${o.id}" style="--c:${svcColor(o)}">
    <header class="oc-head">
      <label class="os-check" title="Selecionar"><input type="checkbox" data-sel="${o.id}" ${OS_STATE.sel.has(o.id) ? 'checked' : ''} aria-label="Selecionar OS ${osCode(o, true)}"></label>
      <span class="oc-code">${osCode(o, true)}</span>
      <span class="oc-tools">
        <button class="oc-icon ${o.pinned ? 'on' : ''}" data-pin="${o.id}" title="${o.pinned ? 'Desafixar' : 'Fixar no topo'}" aria-label="${o.pinned ? 'Desafixar' : 'Fixar no topo'}">${icon('pushpin')}</button>
        ${osCardMenu(o)}
      </span>
    </header>
    <div class="oc-body">
      <h4 title="${esc(c.name)}">${esc(c.name)}</h4>
      <span class="oc-addr" title="${esc(c.address || '')}">${icon('pin')}${esc(c.address || 'Sem endereço')}</span>
      <p class="oc-desc">${esc(o.issue)}</p>
    </div>
    <div class="oc-chips">
      ${softChip(urgOf(o).color, urgOf(o).label)}
      ${softChip(STATUS[o.status].color, STATUS[o.status].label)}
      ${isLate(o) ? softChip('#FF3B30', 'Atrasada', 'clock') : ''}
    </div>
    <footer class="oc-foot">
      <span class="oc-tech">${o.tech ? avatar(o.tech) + `<span>${esc(o.tech)}</span>` : `<span class="avatar sm no-tech">${icon('user')}</span><span class="muted">Sem técnico</span>`}</span>
      <span class="oc-when" title="${o.scheduledAt ? 'Agendamento' : 'Abertura'}: ${fmtDT(when)}">${icon(o.scheduledAt ? 'calendar' : 'clock')}${shortDT(when)}</span>
    </footer>
  </article>`;
}

PAGES.ordens = {
  render() {
    const all = D().orders;
    const n = (k) => all.filter(SCOPES[k]).length;
    const tiles = [['abertas', 'Abertas'], ['atendimento', 'Em atendimento'], ['aguardando', 'Aguardando cliente'], ['fechadas', 'Fechadas'], ['todas', 'Todas']];
    const off = advCount();
    return `
      <div class="page-head">
        <div><h1>Ordens de Serviço</h1><p>${n('abertas')} abertas · ${all.filter(isLate).length} atrasadas · ${all.filter(QUICK.semtec.fn).length} sem técnico</p></div>
        <div class="actions">
          <div class="tabs-inline" style="padding:4px">
            <button data-layout="lista" class="${OS_STATE.layout === 'lista' ? 'on' : ''}">${icon('list')} Lista</button>
            <button data-layout="quadro" class="${OS_STATE.layout === 'quadro' ? 'on' : ''}">${icon('kanban')} Quadro</button>
          </div>
          <button class="btn btn-ghost" id="batchBtn"><span data-icon="list"></span>Abrir em lote</button>
          <button class="btn btn-primary" onclick="openNewOrder()"><span data-icon="plus"></span>Nova O.S.</button>
        </div>
      </div>
      <div class="os-kpis">${tiles.map(([k, l]) => `<button class="os-kpi glass ${OS_STATE.scope === k ? 'on' : ''}" data-scope="${k}"><small>${l}</small><b>${n(k)}</b></button>`).join('')}</div>
      <div class="card glass">
        <div class="os-toolbar">
          <div class="os-quick"><span class="muted">Filtros rápidos:</span>${Object.entries(QUICK).map(([k, q]) => `<button class="chip ${OS_STATE.quick === k ? 'on' : ''}" data-quick="${k}">${icon(q.icon)}${q.label}</button>`).join('')}</div>
          <div class="os-quick"><span class="muted">Visão:</span><div class="tabs-inline">${[['abertas', 'Abertas'], ['fechadas', 'Fechadas'], ['todas', 'Todas']].map(([k, l]) => `<button data-view="${k}" class="${OS_STATE.scope === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        </div>
        <div class="toolbar">
          <div class="input-wrap">${icon('search')}<input class="input" id="osSearch" placeholder="Buscar por nº, cliente, problema ou solução" value="${esc(OS_STATE.q)}"></div>
          <button class="btn btn-ghost" id="advBtn" style="height:38px">${icon('filter')}Filtros avançados${off ? `<b class="dd-count">${off}</b>` : ''}</button>
          ${off || OS_STATE.quick || OS_STATE.q ? '<button class="btn btn-ghost btn-sm" id="clearAll">Limpar</button>' : ''}
          <button class="btn btn-ghost" id="exportCsv" style="height:38px;margin-left:auto">${icon('download')}Exportar</button>
        </div>
        <div id="bulkBar"></div>
        <div id="osBody"></div>
      </div>`;
  },
  mount() {
    $$('[data-layout]').forEach((b) => (b.onclick = () => { OS_STATE.layout = b.dataset.layout; setPref('os-layout', OS_STATE.layout); router(); }));
    $$('[data-scope]').forEach((b) => (b.onclick = () => { OS_STATE.scope = b.dataset.scope; router(); }));
    $$('[data-view]').forEach((b) => (b.onclick = () => { OS_STATE.scope = b.dataset.view; router(); }));
    $$('[data-quick]').forEach((b) => (b.onclick = () => { OS_STATE.quick = OS_STATE.quick === b.dataset.quick ? '' : b.dataset.quick; router(); }));
    $('#osSearch').oninput = (e) => { OS_STATE.q = e.target.value; this.body(); };
    $('#advBtn').onclick = openAdvFilters;
    $('#batchBtn').onclick = openBatch;
    $('#exportCsv').onclick = () => exportCsv(OS_STATE.sel.size ? D().orders.filter((o) => OS_STATE.sel.has(o.id)) : osFiltered());
    const ca = $('#clearAll');
    if (ca) ca.onclick = () => { OS_STATE.quick = ''; OS_STATE.q = ''; OS_STATE.adv = OS_ADV_DEFAULT(); router(); };
    this.body();
  },
  body() {
    const list = osFiltered();
    this.bulk();
    if (!list.length) {
      $('#osBody').innerHTML = `<div class="empty-state">${icon('search')}<div>Nenhuma OS encontrada com esses filtros.</div></div>`;
      return;
    }
    if (OS_STATE.layout === 'quadro') return this.kanban(list);
    $('#osBody').innerHTML = `<div class="os-list">${list.map(osCard).join('')}</div><p class="hint" style="margin:12px 0 0">${list.length} OS · as fixadas aparecem primeiro, depois por urgência.</p>`;
    $$('#osBody .os-card').forEach((card) => (card.onclick = (e) => {
      if (e.target.closest('button, a, label, input')) return;
      openOrder(card.dataset.id);
    }));
    $$('#osBody [data-sel]').forEach((cb) => (cb.onchange = () => {
      const id = +cb.dataset.sel;
      cb.checked ? OS_STATE.sel.add(id) : OS_STATE.sel.delete(id);
      cb.closest('.os-card').classList.toggle('selected', cb.checked);
      this.bulk();
    }));
    $$('#osBody [data-pin]').forEach((b) => (b.onclick = () => {
      const o = orderById(b.dataset.pin);
      o.pinned = !o.pinned; DB.save(); this.body();
      toast(o.pinned ? 'OS fixada no topo' : 'OS desafixada', 'pushpin');
    }));
    $$('#osBody [data-menu]').forEach((b) => bindDropdown('#m' + b.dataset.menu, `[data-menu="${b.dataset.menu}"]`));
    $$('#osBody [data-act]').forEach((b) => (b.onclick = () => {
      const id = +b.dataset.id;
      ({ ver: () => openOrder(id), pdf: () => printOrder(id), editar: () => openNewOrder(null, id), agendar: () => openSchedule(id) })[b.dataset.act]();
    }));
  },
  bulk() {
    const n = OS_STATE.sel.size, bar = $('#bulkBar');
    if (!n) { bar.innerHTML = ''; return; }
    bar.innerHTML = `<div class="bulk-bar">
      <b>${n} selecionada${n > 1 ? 's' : ''}</b>
      <select class="input" id="bulkTech" style="height:34px;width:auto"><option value="">Atribuir técnico...</option>${D().techs.map((t) => `<option>${esc(t)}</option>`).join('')}</select>
      <select class="input" id="bulkStatus" style="height:34px;width:auto"><option value="">Mudar status...</option>${Object.entries(STATUS).map(([k, s]) => `<option value="${k}">${s.label}</option>`).join('')}</select>
      <button class="btn btn-ghost btn-sm" id="bulkClear">Limpar seleção</button>
    </div>`;
    const apply = (fn, msg) => { D().orders.filter((o) => OS_STATE.sel.has(o.id)).forEach(fn); DB.save(); toast(msg); OS_STATE.sel.clear(); router(); };
    $('#bulkTech').onchange = (e) => e.target.value && apply((o) => { o.tech = e.target.value; addHistory(o, 'Técnico definido: ' + o.tech); }, `${n} OS atribuídas a ${e.target.value}`);
    $('#bulkStatus').onchange = (e) => e.target.value && apply((o) => { if (o.status !== e.target.value) { o.status = e.target.value; addHistory(o, `Status alterado para “${STATUS[o.status].label}”`); } }, `${n} OS → ${STATUS[e.target.value].label}`);
    $('#bulkClear').onclick = () => { OS_STATE.sel.clear(); router(); };
  },
  kanban(list) {
    const cols = ['aberto', 'atendimento', 'aguardando', 'resolvido'];
    $('#osBody').innerHTML = `<div class="kanban" style="grid-template-columns:repeat(4,minmax(240px,1fr))">${cols.map((s) => {
      const items = list.filter((o) => o.status === s);
      return `<div class="col" data-col="${s}">
        <div class="col-head"><i style="background:${STATUS[s].color}"></i>${STATUS[s].label}<span>${items.length}</span></div>
        ${items.map((o) => `
          <div class="kcard" draggable="true" data-id="${o.id}" style="border-left:3px solid ${svcColor(o)}">
            <div class="k-top"><span>${osCode(o)}</span>${urgBadge(o)}</div>
            <strong>${esc(client(o.clientId).name)}</strong>
            <small class="muted">${esc(o.issue)}</small>
            <div class="k-foot"><span>${esc(o.tech || 'Sem técnico')}</span><span class="${isLate(o) ? 'stock-low' : ''}">${o.scheduledAt ? fmtDate(o.scheduledAt) : '—'}</span></div>
          </div>`).join('')}
      </div>`;
    }).join('')}</div><p class="hint" style="margin:10px 0 0">Arraste os cartões entre as colunas para mudar o status. Finalizadas e canceladas ficam só na lista.</p>`;
    let dragId = null;
    $$('.kcard').forEach((c) => {
      c.ondragstart = () => { dragId = +c.dataset.id; c.classList.add('dragging'); };
      c.ondragend = () => c.classList.remove('dragging');
      c.onclick = () => openOrder(c.dataset.id);
    });
    $$('.col').forEach((col) => {
      col.ondragover = (e) => { e.preventDefault(); col.classList.add('over'); };
      col.ondragleave = () => col.classList.remove('over');
      col.ondrop = () => { col.classList.remove('over'); if (dragId) setStatus(dragId, col.dataset.col); };
    });
  },
};

function openAdvFilters() {
  const a = OS_STATE.adv;
  const sel = (id, opts, v) => `<select class="input" id="${id}">${opts.map(([val, l]) => `<option value="${esc(val)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  openDrawer(`
    ${drawerHead('Filtros avançados')}
    <form class="drawer-body" id="advForm">
      <div class="form-grid">
        <div class="field"><label for="aSt">Status específico</label>${sel('aSt', [['', 'Todos'], ...Object.entries(STATUS).map(([k, s]) => [k, s.label])], a.status)}</div>
        <div class="field"><label for="aUrg">Urgência</label>${sel('aUrg', [['', 'Todas Urgências'], ...Object.entries(URG).map(([k, u]) => [k, `${u.label} (${u.sla})`])], a.urg)}</div>
        <div class="field full"><label for="aTech">Responsável</label>${sel('aTech', [['', 'Todos os técnicos'], ['-', 'Sem técnico'], ...D().techs.map((t) => [t, t])], a.tech)}</div>
        <div class="field full"><label for="aCli">Cliente</label>${sel('aCli', [['', 'Todos Clientes'], ...D().clients.map((c) => [c.id, c.name])], a.client)}</div>
        <div class="field"><label for="aFrom">Agendamento de</label><input class="input" type="date" id="aFrom" value="${a.from}"></div>
        <div class="field"><label for="aTo">Agendamento até</label><input class="input" type="date" id="aTo" value="${a.to}"></div>
        <div class="field full"><label for="aText">Texto na OS</label><input class="input" id="aText" placeholder="Problema, solução ou pendência" value="${esc(a.text)}"></div>
      </div>
    </form>
    <div class="drawer-foot"><button class="btn btn-ghost" id="advClear">Limpar</button><button class="btn btn-primary" type="submit" form="advForm">Aplicar</button></div>`);
  $('#advForm').onsubmit = (e) => {
    e.preventDefault();
    OS_STATE.adv = { status: $('#aSt').value, urg: $('#aUrg').value, tech: $('#aTech').value, client: $('#aCli').value, from: $('#aFrom').value, to: $('#aTo').value, text: $('#aText').value.trim() };
    if (OS_STATE.adv.status) OS_STATE.scope = 'todas';
    closeDrawer(); router();
  };
  $('#advClear').onclick = () => { OS_STATE.adv = OS_ADV_DEFAULT(); closeDrawer(); router(); };
}

// "Abrir em lote": várias OS de uma vez, uma por linha
function openBatch() {
  openDrawer(`
    ${drawerHead('Abrir OS em lote', 'Uma OS para cada linha da descrição')}
    <form class="drawer-body" id="batchForm">
      <div class="form-grid">
        <div class="field full"><label for="bCli">Cliente</label><select class="input" id="bCli">${D().clients.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="bTech">Técnico responsável</label><select class="input" id="bTech"><option value="">Sem técnico</option>${D().techs.map((t) => `<option>${esc(t)}</option>`).join('')}</select></div>
        <div class="field"><label for="bType">Tipo de serviço</label><select class="input" id="bType">${SERVICE_TYPES.map((t) => `<option>${t}</option>`).join('')}</select></div>
        <div class="field"><label for="bMod">Modalidade</label><select class="input" id="bMod"><option>Presencial</option><option>Remoto</option></select></div>
        <div class="field"><label for="bUrg">Nível de urgência</label><select class="input" id="bUrg">${Object.entries(URG).map(([k, u]) => `<option value="${k}">${u.label} (${u.sla})</option>`).join('')}</select></div>
        <div class="field full"><label for="bLines">Descrições (uma por linha)</label><textarea class="input" id="bLines" rows="8" placeholder="Instalar antivírus no PC do caixa&#10;Trocar cabo de rede da sala 2&#10;Configurar impressora do RH" required></textarea></div>
      </div>
      <p class="hint" id="bCount">0 OS serão criadas</p>
    </form>
    <div class="drawer-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit" form="batchForm">${icon('check')}Abrir OS</button></div>`, { focus: true });
  const lines = () => $('#bLines').value.split('\n').map((l) => l.trim()).filter(Boolean);
  $('#bLines').oninput = () => ($('#bCount').textContent = `${lines().length} OS serão criadas`);
  $('#batchForm').onsubmit = (e) => {
    e.preventDefault();
    const ls = lines();
    if (!ls.length) return;
    ls.forEach((issue) => createOrder({ clientId: +$('#bCli').value, tech: $('#bTech').value, type: $('#bType').value, modality: $('#bMod').value, urgency: $('#bUrg').value, issue }));
    closeDrawer(); refresh(); toast(`${ls.length} OS abertas em lote`);
  };
}

function createOrder(f) {
  const id = D().nextId.order++;
  const now = new Date();
  const o = {
    id, code: ((id * 2654435761) >>> 0).toString(16).padStart(8, '0'),
    clientId: f.clientId, requester: f.requester || '', tech: f.tech || '', supplier: f.supplier || '',
    type: f.type || 'Outros', computer: f.computer || '', modality: f.modality || 'Presencial', urgency: f.urgency || 'normal',
    status: 'aberto', issue: f.issue,
    openedAt: now.toISOString(),
    dueAt: f.dueAt || new Date(now.getTime() + URG[f.urgency || 'normal'].hours * 36e5).toISOString(),
    scheduledAt: f.scheduledAt || '', pinned: false, solution: '', timeSpent: 0, timerStart: '', items: [], signature: null,
    history: [{ at: now.toISOString(), text: 'OS aberta' + (f.requester ? ' a pedido de ' + f.requester : '') }],
  };
  if (o.scheduledAt) addHistory(o, 'Atendimento agendado para ' + fmtDT(o.scheduledAt));
  D().orders.push(o);
  return o;
}

/* ---------- Nova OS / Editar OS (campos do formulário real) ---------- */
function openNewOrder(prefClientId, editId) {
  const o = editId ? orderById(editId) : null;
  const v = o || { clientId: prefClientId || '', urgency: 'normal', modality: 'Presencial', type: 'Informática' };
  const local = (iso) => { if (!iso) return ''; const x = new Date(iso); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
  const slaFor = (u) => local(new Date(Date.now() + URG[u].hours * 36e5).toISOString());
  openDrawer(`
    ${drawerHead(o ? `Editar ${osCode(o, true)}` : 'Nova ordem de serviço', o ? esc(client(o.clientId).name) : '')}
    <form class="drawer-body" id="osForm">
      <div class="form-grid">
        <div class="field full"><label for="fCli">Cliente</label>
          <div class="row-between" style="gap:8px"><select class="input" id="fCli" required><option value="">Selecione um cliente</option>${D().clients.map((c) => `<option value="${c.id}" ${+v.clientId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
          <button type="button" class="btn btn-ghost btn-sm" id="fNewCli" style="height:42px" title="Cadastrar cliente">${icon('plus')}</button></div></div>
        <div class="field"><label for="fReq">Solicitante (contato)</label><input class="input" id="fReq" value="${esc(v.requester || '')}" placeholder="Opcional"></div>
        <div class="field"><label for="fTech">Técnico responsável</label><select class="input" id="fTech"><option value="">Selecione (opcional)</option>${D().techs.map((t) => `<option ${v.tech === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>
        <div class="field"><label for="fSup">Fornecedor (se houver)</label><select class="input" id="fSup"><option value="">Nenhum fornecedor</option>${(D().fornecedores || []).map((s) => `<option ${v.supplier === s.name ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="fType">Tipo de serviço</label><select class="input" id="fType">${SERVICE_TYPES.map((t) => `<option ${v.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="field"><label for="fComp">Computador com problema</label><input class="input" id="fComp" value="${esc(v.computer || '')}" placeholder="Ex.: PC do caixa 1"></div>
        <div class="field"><label for="fMod">Modalidade</label><select class="input" id="fMod">${['Presencial', 'Remoto'].map((m) => `<option ${v.modality === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
        <div class="field"><label for="fUrg">Nível de urgência</label><select class="input" id="fUrg">${Object.entries(URG).map(([k, u]) => `<option value="${k}" ${v.urgency === k ? 'selected' : ''}>${u.label} (${u.sla})</option>`).join('')}</select></div>
        <div class="field"><label for="fSla">Previsão de atendimento (SLA)</label><input class="input" type="datetime-local" id="fSla" value="${o ? local(o.dueAt) : slaFor(v.urgency)}"></div>
        <div class="field"><label for="fSched">Agendamento</label><input class="input" type="datetime-local" id="fSched" value="${local(v.scheduledAt)}"></div>
        <div class="field full"><label for="fIssue">Descrição do problema/solicitação</label><textarea class="input" id="fIssue" rows="5" required>${esc(v.issue || '')}</textarea></div>
      </div>
    </form>
    <div class="drawer-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit" form="osForm">${icon('check')}${o ? 'Salvar alterações' : 'Abrir OS'}</button></div>`, { focus: !o });
  // A urgência recalcula a previsão (SLA) ao abrir uma OS nova
  $('#fUrg').onchange = (e) => { if (!o) $('#fSla').value = slaFor(e.target.value); };
  $('#fNewCli').onclick = () => openNewClient((c) => openNewOrder(c.id));
  $('#osForm').onsubmit = (e) => {
    e.preventDefault();
    const f = {
      clientId: +$('#fCli').value, requester: $('#fReq').value.trim(), tech: $('#fTech').value, supplier: $('#fSup').value,
      type: $('#fType').value, computer: $('#fComp').value.trim(), modality: $('#fMod').value, urgency: $('#fUrg').value,
      dueAt: $('#fSla').value ? new Date($('#fSla').value).toISOString() : '', scheduledAt: $('#fSched').value ? new Date($('#fSched').value).toISOString() : '',
      issue: $('#fIssue').value.trim(),
    };
    if (!f.clientId || !f.issue) return;
    if (o) {
      if (o.tech !== f.tech) addHistory(o, 'Técnico definido: ' + (f.tech || 'Sem técnico'));
      if ((o.scheduledAt || '') !== f.scheduledAt) addHistory(o, f.scheduledAt ? 'Atendimento agendado para ' + fmtDT(f.scheduledAt) : 'Agendamento removido');
      Object.assign(o, f, { dueAt: f.dueAt || o.dueAt });
      addHistory(o, 'OS editada');
      closeDrawer(); refresh(); toast('Alterações salvas');
    } else {
      const n = createOrder(f);
      closeDrawer(); DB.save(); openOrder(n.id); toast(`${osCode(n, true)} aberta para ${client(n.clientId).name}`);
    }
  };
}

/* =========================================================
   Ficha da OS (#/os/<id>) — mesma ordem de seções do sistema antigo
   ========================================================= */
let osTimer = null;
PAGES.os = {
  render(id) {
    const o = orderById(id);
    if (!o) return `<div class="empty-state">${icon('search')}<div>OS não encontrada.</div><p><a href="#/ordens">Voltar para as ordens de serviço</a></p></div>`;
    const c = client(o.clientId);
    const pend = (D().pendencias || []).filter((p) => p.ref === 'OS ' + osCode(o));
    const products = D().catalogo.map((p) => p.name);
    const itemsOf = (kind) => (o.items || []).map((it, i) => ({ ...it, i })).filter((it) => it.kind === kind);
    const itemRows = (kind) => {
      const list = itemsOf(kind);
      return list.length ? list.map((it) => `<div class="item-row"><div><b>${esc(it.name)}</b>${it.obs ? `<small>${esc(it.obs)}</small>` : ''}</div><span class="muted">${it.qty} × ${money(it.price)}</span><b>${money(it.qty * it.price)}</b>${osClosed(o) ? '' : `<button class="more" data-rmitem="${it.i}" title="Remover">${icon('x')}</button>`}</div>`).join('') : '<div class="muted" style="padding:6px 0">Nenhum item nesta categoria</div>';
    };
    const running = !!o.timerStart;
    const closed = osClosed(o);
    return `
      <a href="#/ordens" class="back-link">${icon('chevL')}Ordens de Serviço</a>
      <div class="os-hero glass">
        <div>
          <small class="eyebrow">Ordem de serviço</small>
          <h1>OS ${osCode(o, true)}</h1>
          <p class="os-hero-client">${esc(c.name.toUpperCase())}</p>
          <p class="muted" style="margin:0 0 10px">Aberta em ${new Date(o.openedAt).toLocaleDateString('pt-BR')} às ${fmtTime(o.openedAt)}</p>
          <div class="os-badges row">${urgPill(o)}${statusPill(o)}${slaPill(o)}${o.pinned ? `<span class="badge b-brand">Fixada</span>` : ''}</div>
        </div>
        <div class="os-hero-actions">
          <button class="icon-btn" id="oEdit" title="Editar">${icon('edit')}</button>
          <button class="icon-btn" id="oPdf" title="Exportar PDF">${icon('download')}</button>
          <a class="icon-btn" id="oWa" title="WhatsApp do cliente" target="_blank" rel="noopener" href="${waLink(c.phone || '', `Olá! Sobre a OS ${osCode(o, true)} (${o.issue}): status atual “${STATUS[o.status].label}”.`)}" style="color:#16a34a">${icon('whatsapp')}</a>
          <div class="tech-dd" id="oMore"><button class="icon-btn" id="oMoreBtn" aria-haspopup="true" aria-expanded="false" title="Mais ações">${icon('dots')}</button>
            <div class="tech-menu" role="menu">
              <button role="menuitem" id="oSched">${icon('calendar')}${o.scheduledAt ? 'Reagendar' : 'Agendar'}</button>
              <button role="menuitem" id="oPin">${icon('pushpin')}${o.pinned ? 'Desafixar' : 'Fixar no topo'}</button>
              <button role="menuitem" id="oCopy">${icon('copy')}Copiar resumo</button>
              <button role="menuitem" id="oDoc">${icon('file')}Emitir documento</button>
              <button role="menuitem" id="oDup">${icon('plus')}Duplicar OS</button>
            </div></div>
        </div>
      </div>

      <div class="grid g-main">
        <div class="grid">
          <div class="grid os-cli-row">
            <section class="card glass">
              <div class="card-head"><h3>Dados do cliente</h3><a href="#" id="oCli">Ver cliente</a></div>
              <dl class="kv">
                <dt>Nome</dt><dd>${esc(c.name)}</dd>
                <dt>CNPJ</dt><dd>${esc(c.doc || '-')}</dd>
                <dt>Endereço</dt><dd>${esc(c.address || '-')}${c.address ? ` <a href="${mapsLink(c.address)}" target="_blank" rel="noopener">Ver no mapa</a>` : ''}</dd>
              </dl>
            </section>
            <section class="card glass">
              <div class="card-head"><h3>Contato</h3></div>
              <dl class="kv">
                <dt>Nome</dt><dd>${esc(c.contact || '-')}</dd>
                <dt>Telefone</dt><dd>${c.phone ? `<a href="tel:${c.phone.replace(/\D/g, '')}">${esc(c.phone)}</a>` : '-'}</dd>
                <dt>E-mail</dt><dd>${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '-'}</dd>
              </dl>
            </section>
          </div>
          <section class="card glass">
            <div class="card-head"><h3>Detalhes do serviço</h3>
              <select class="input" id="oStatus" style="height:36px;width:auto">${Object.entries(STATUS).map(([k, s]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div>
            <dl class="detail-grid">
              <div><dt>Modalidade</dt><dd>${esc(o.modality)}</dd></div>
              <div><dt>Tipo</dt><dd>${esc(o.type)}</dd></div>
              <div><dt>Computador afetado</dt><dd>${esc(o.computer || '-')}</dd></div>
              <div><dt>Técnico</dt><dd>${esc(o.tech || 'Sem técnico')}</dd></div>
              <div><dt>Solicitante</dt><dd>${esc(o.requester || '-')}</dd></div>
              <div><dt>Fornecedor</dt><dd>${esc(o.supplier || '-')}</dd></div>
              <div><dt>Previsão (SLA ${urgOf(o).sla})</dt><dd class="${isLate(o) ? 'stock-low' : ''}">${fmtDT(o.dueAt)}</dd></div>
              <div><dt>Agendamento</dt><dd>${o.scheduledAt ? fmtDT(o.scheduledAt) : '<span class="muted">Sem agendamento</span>'}</dd></div>
            </dl>
            <p class="section-title" style="margin-top:14px">Descrição do problema</p>
            <div class="desc-box">${esc(o.issue)}</div>
          </section>

          <section class="card glass">
            <div class="card-head"><div><h3>Tempo de atendimento</h3><p>${running ? 'Em andamento desde ' + fmtTime(o.timerStart) : o.timeSpent ? 'Tempo registrado' : 'Atendimento ainda não iniciado.'}</p></div>
              <button class="btn btn-ghost btn-sm" id="oAdjust">Ajuste manual</button></div>
            <div class="timer-row">
              <div class="timer ${running ? 'on' : ''}" id="oTimer">${fmtMin(o.timeSpent || 0)}</div>
              ${closed ? '' : `<button class="btn ${running ? 'btn-ghost' : 'btn-primary'}" id="oTimerBtn">${icon(running ? 'clock' : 'check')}${running ? 'Pausar atendimento' : o.timeSpent ? 'Retomar atendimento' : 'Iniciar atendimento'}</button>`}
            </div>
          </section>

          <section class="card glass">
            <div class="card-head"><h3>Pendências</h3><span class="muted">Em aberto: ${pend.filter((p) => p.status !== 'resolvida').length} · Resolvidas: ${pend.filter((p) => p.status === 'resolvida').length}</span></div>
            <div class="checklist">${pend.length ? pend.map((p) => `<label><input type="checkbox" data-pend="${p.id}" ${p.status === 'resolvida' ? 'checked' : ''}><span style="${p.status === 'resolvida' ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(p.title)}</span></label>`).join('') : '<div class="muted">Nenhuma pendência registrada</div>'}</div>
            <div class="row-between" style="gap:8px;margin-top:10px"><input class="input" id="oPendIn" placeholder="Nova pendência desta OS" style="height:38px"><button class="btn btn-ghost btn-sm" id="oPendAdd" style="height:38px">${icon('plus')}Adicionar</button></div>
            <p class="hint" style="margin:6px 0 0">Também aparece na página Pendências, com a referência OS ${osCode(o)}.</p>
          </section>

          <section class="card glass">
            <div class="card-head"><h3>Peças e serviços</h3>
              <div class="totals"><span>Materiais <b>${money(osTotal(o, 'material'))}</b></span><span>Compras <b>${money(osTotal(o, 'compra'))}</b></span><span>Total <b>${money(osTotal(o))}</b></span></div></div>
            ${closed ? '' : `<div class="item-form">
              <input class="input" id="iName" list="iProd" placeholder="Produto / serviço"><datalist id="iProd">${products.map((p) => `<option value="${esc(p)}">`).join('')}</datalist>
              <select class="input" id="iKind"><option value="material">Material utilizado</option><option value="compra">Solicitação de compra</option></select>
              <input class="input" id="iQty" type="number" min="1" value="1" title="Quantidade">
              <input class="input" id="iPrice" type="number" min="0" step="0.01" placeholder="Valor (R$)">
              <input class="input" id="iObs" placeholder="Observação (opcional)">
              <button class="btn btn-primary btn-sm" id="iAdd" style="height:42px">${icon('plus')}Adicionar</button>
            </div><p class="hint" id="iStockHint" style="margin:6px 0 0">Materiais do catálogo dão baixa automática no estoque.</p>`}
            <p class="section-title" style="margin-top:14px">Materiais utilizados <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:500">· tudo que foi usado no atendimento</span></p>
            <div class="items">${itemRows('material')}</div>
            <p class="section-title" style="margin-top:14px">Solicitações de compra <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:500">· itens para providenciar ou cobrar depois</span></p>
            <div class="items">${itemRows('compra')}</div>
          </section>

          <section class="card glass">
            <div class="card-head"><h3>Fotos e vídeos do serviço</h3><label class="btn btn-ghost btn-sm" style="cursor:pointer">${icon('plus')}Adicionar fotos<input type="file" id="oPhotos" accept="image/*" multiple hidden></label></div>
            <div class="photos" id="oPhotoGrid">${(o.photos || []).length ? o.photos.map((p, i) => `<figure><img src="${p}" alt="Foto ${i + 1} da OS"><button class="more" data-rmphoto="${i}" title="Remover">${icon('x')}</button></figure>`).join('') : '<div class="muted">Nenhuma foto adicionada.</div>'}</div>
          </section>

          <section class="card glass">
            <div class="card-head"><h3>Finalização do serviço</h3></div>
            <div class="field"><label for="oSol">Descrição da solução</label><textarea class="input" id="oSol" rows="4" placeholder="O que foi feito para resolver" ${o.status === 'finalizada' || o.status === 'cancelado' ? 'disabled' : ''}>${esc(o.solution || '')}</textarea></div>
            ${o.status === 'cancelado' && o.cancelReason ? `<div class="cancel-note">${icon('alert')}<div><strong>Motivo do cancelamento: ${esc(o.cancelReason.reason)}</strong>${o.cancelReason.detail ? `<p>${esc(o.cancelReason.detail)}</p>` : ''}<small>${esc(o.cancelReason.by || '')}${o.cancelReason.by ? ' · ' : ''}${fmtDT(o.cancelReason.at)}</small></div></div>` : ''}
            ${o.status === 'finalizada' || o.status === 'cancelado' ? `<p class="hint" style="margin-bottom:0">OS ${STATUS[o.status].label.toLowerCase()}. Para reabrir, mude o status em “Detalhes do serviço”.</p>` : ''}
          </section>

          <section class="card glass">
            <div class="card-head"><h3>Coletar assinatura</h3>${o.signature ? `<span class="badge b-ok">Assinada por ${esc(o.signature.name)}</span>` : ''}</div>
            ${o.signature ? `<img class="sig-img" src="${o.signature.img}" alt="Assinatura de ${esc(o.signature.name)}"><div class="row-between" style="margin-top:8px"><small class="muted">${fmtDT(o.signature.at)}</small><button class="btn btn-ghost btn-sm" id="sigRedo">Coletar novamente</button></div>` : `
              <div class="field"><label for="sigName">Nome do responsável</label><input class="input" id="sigName" value="${esc(o.requester || '')}"></div>
              <canvas class="sig-pad" id="sigPad" width="600" height="180" aria-label="Área para assinar"></canvas>
              <div class="row-between" style="margin-top:8px"><span class="hint">Assine com o mouse ou o dedo</span><span style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" id="sigClear">Limpar</button><button class="btn btn-primary btn-sm" id="sigSave">Salvar assinatura</button></span></div>`}
          </section>
        </div>

        <div class="grid" style="align-content:start">
          <section class="card glass tl-card${getPref("timelineOpen", false) ? " open" : ""}" id="tlCard">
            <button class="card-head tl-toggle" id="tlToggle" type="button" aria-expanded="${getPref("timelineOpen", false)}" aria-controls="tlBody"><div><h3>Timeline operacional</h3><p>Tudo o que aconteceu neste atendimento</p></div><span class="tl-meta"><span class="badge b-muted">${o.history.length} eventos</span><span class="tl-chev">${icon("chevR")}</span></span></button>
            <div class="tl-body" id="tlBody">
            <div class="history">${[...o.history].reverse().map((h) => `<div>${esc(h.text)}<small>${fmtDT(h.at)}</small></div>`).join('')}</div>
            <div class="row-between" style="gap:8px"><input class="input" id="noteIn" placeholder="Adicionar observação..." style="height:38px"><button class="btn btn-ghost btn-sm" style="height:38px" id="noteBtn">Anotar</button></div>
            </div>
          </section>
        </div>
      </div>
      ${o.status === 'finalizada' || o.status === 'cancelado' ? '' : `
      <div class="os-finish-bar glass">
        <div class="ofb-text"><strong>Pronto para encerrar?</strong><small>Confira a solução e a assinatura antes de finalizar.</small></div>
        <div class="ofb-actions"><button class="btn btn-ghost ofb-cancel" id="oCancel">${icon('x')}Cancelar OS</button><button class="btn ofb-finish" id="oFinish">${icon('check')}Finalizar e enviar</button></div>
      </div>`}`;
  },
  mount(id) {
    const o = orderById(id);
    clearInterval(osTimer);
    if (!o) return;
    const save = (msg) => { DB.save(); router(); if (msg) toast(msg); };

    $('#oEdit').onclick = () => openNewOrder(null, o.id);
    $('#oPdf').onclick = () => printOrder(o.id);
    bindDropdown('#oMore', '#oMoreBtn');
    $('#oSched').onclick = () => openSchedule(o.id);
    $('#oPin').onclick = () => { o.pinned = !o.pinned; save(o.pinned ? 'OS fixada no topo' : 'OS desafixada'); };
    $('#oCopy').onclick = () => {
      const txt = `OS ${osCode(o, true)} · ${client(o.clientId).name}\n${o.issue}\nStatus: ${STATUS[o.status].label} · Urgência: ${urgOf(o).label} · Técnico: ${o.tech || 'Sem técnico'}${o.scheduledAt ? '\nAgendamento: ' + fmtDT(o.scheduledAt) : ''}`;
      navigator.clipboard?.writeText(txt).then(() => toast('Resumo copiado', 'copy'), () => toast('Não foi possível copiar', 'alert'));
    };
    $('#oDoc').onclick = () => openGenerateDoc({ clientId: o.clientId, osId: o.id });
    $('#oDup').onclick = () => { const n = createOrder({ ...o, scheduledAt: '', dueAt: '' }); DB.save(); openOrder(n.id); toast(`${osCode(n, true)} criada a partir de ${osCode(o)}`); };
    $('#oStatus').onchange = (e) => {
      // cancelar sempre passa pelo popup com o motivo
      if (e.target.value === 'cancelado') { e.target.value = o.status; return openCancelOrder(o); }
      setStatus(o.id, e.target.value);
    };
    $('#oCli').onclick = (e) => { e.preventDefault(); openClient(o.clientId); };

    // Tempo de atendimento
    const tick = () => { const t = $('#oTimer'); if (!t) return clearInterval(osTimer); t.textContent = fmtMin((o.timeSpent || 0) + (o.timerStart ? (Date.now() - new Date(o.timerStart)) / 6e4 : 0)); };
    if (o.timerStart) { tick(); osTimer = setInterval(tick, 15000); }
    const tb = $('#oTimerBtn');
    if (tb) tb.onclick = () => {
      if (o.timerStart) {
        const m = (Date.now() - new Date(o.timerStart)) / 6e4;
        o.timeSpent = (o.timeSpent || 0) + m; o.timerStart = '';
        addHistory(o, `Atendimento pausado (+${fmtMin(m)})`);
        save('Atendimento pausado');
      } else {
        o.timerStart = new Date().toISOString();
        if (o.status === 'aberto') o.status = 'atendimento';
        addHistory(o, 'Atendimento iniciado');
        save('Atendimento iniciado');
      }
    };
    $('#oAdjust').onclick = () => {
      const v = prompt('Tempo total de atendimento, em minutos:', Math.round(o.timeSpent || 0));
      if (v === null || isNaN(+v)) return;
      o.timeSpent = Math.max(0, +v);
      addHistory(o, 'Tempo ajustado manualmente para ' + fmtMin(o.timeSpent));
      save('Tempo ajustado');
    };

    // Pendências (ficam junto com a página Pendências)
    const addPend = () => {
      const t = $('#oPendIn').value.trim();
      if (!t) return;
      D().pendencias.push({ id: D().nextId.pendencias++, title: t, desc: '', prio: 'media', status: 'aberta', due: '', ref: 'OS ' + osCode(o), resp: o.tech || D().techs[0] });
      addHistory(o, 'Pendência adicionada: ' + t);
      save('Pendência adicionada');
    };
    $('#oPendAdd').onclick = addPend;
    $('#oPendIn').onkeydown = (e) => e.key === 'Enter' && addPend();
    $$('[data-pend]').forEach((cb) => (cb.onchange = () => {
      const p = D().pendencias.find((x) => x.id === +cb.dataset.pend);
      p.status = cb.checked ? 'resolvida' : 'aberta';
      save();
    }));

    // Peças e serviços
    const iAdd = $('#iAdd');
    if (iAdd) {
      $('#iName').onchange = () => {
        const n = $('#iName').value.toLowerCase();
        const p = catByName(n);
        if (p && !$('#iPrice').value) $('#iPrice').value = p.price || '';
        $('#iStockHint').textContent = p && isProduct(p) ? `Saldo em estoque: ${p.stock} un.` : p ? 'Serviço (sem controle de estoque)' : 'Item fora do catálogo';
      };
      iAdd.onclick = () => {
        const name = $('#iName').value.trim();
        if (!name) return $('#iName').focus();
        const it = { name, kind: $('#iKind').value, qty: Math.max(1, +$('#iQty').value || 1), price: +$('#iPrice').value || 0, obs: $('#iObs').value.trim() };
        (o.items ||= []).push(it);
        const cp = catByName(name);
        if (it.kind === 'material' && cp && isProduct(cp)) {
          if (cp.stock < it.qty) toast(`Atenção: saldo de ${cp.name} era ${cp.stock}`, 'alert');
          stockMove(cp, -it.qty, 'saida', 'OS ' + osCode(o, true));
          cp.moves.at(-1).osId = o.id;
          it.stocked = true;
        }
        if (it.kind === 'compra' && D().compras) {
          D().compras.push({ id: D().nextId.compras++, item: name, qty: it.qty, value: it.qty * it.price, supplier: o.supplier || '', prio: o.urgency === 'normal' ? 'media' : 'alta', status: 'pendente', requester: o.tech || D().techs[0], reason: 'OS ' + osCode(o) + (it.obs ? ' · ' + it.obs : ''), date: new Date().toISOString() });
        }
        addHistory(o, `${it.kind === 'compra' ? 'Solicitação de compra' : 'Material'}: ${it.qty}× ${name}`);
        save(it.kind === 'compra' ? 'Item adicionado e solicitação de compra criada' : 'Material adicionado');
      };
    }
    $$('[data-rmitem]').forEach((b) => (b.onclick = () => {
      const [it] = o.items.splice(+b.dataset.rmitem, 1);
      const cp = catByName(it.name);
      if (it.stocked && cp) { stockMove(cp, it.qty, 'entrada', 'Estorno OS ' + osCode(o, true)); cp.moves.at(-1).osId = o.id; }
      addHistory(o, 'Item removido: ' + it.name);
      save();
    }));

    // Fotos: reduzidas para caber no armazenamento do navegador
    $('#oPhotos').onchange = async (e) => {
      const files = [...e.target.files].slice(0, 6);
      for (const f of files) {
        const img = await new Promise((res) => { const r = new FileReader(); r.onload = () => { const i = new Image(); i.onload = () => res(i); i.src = r.result; }; r.readAsDataURL(f); });
        const s = Math.min(1, 640 / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = img.width * s; cv.height = img.height * s;
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        (o.photos ||= []).push(cv.toDataURL('image/jpeg', 0.7));
      }
      addHistory(o, `${files.length} foto(s) adicionada(s)`);
      try { save(`${files.length} foto(s) adicionada(s)`); } catch { toast('Sem espaço no navegador para mais fotos', 'alert'); }
    };
    $$('[data-rmphoto]').forEach((b) => (b.onclick = () => { o.photos.splice(+b.dataset.rmphoto, 1); save(); }));

    // Assinatura
    const pad = $('#sigPad');
    if (pad) {
      const ctx = pad.getContext('2d');
      let drawing = false, dirty = false;
      ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.strokeStyle = '#1D1D1F';
      const pos = (e) => { const r = pad.getBoundingClientRect(); return [(e.clientX - r.left) * (pad.width / r.width), (e.clientY - r.top) * (pad.height / r.height)]; };
      pad.onpointerdown = (e) => { drawing = true; dirty = true; pad.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(...pos(e)); };
      pad.onpointermove = (e) => { if (!drawing) return; ctx.lineTo(...pos(e)); ctx.stroke(); };
      pad.onpointerup = () => (drawing = false);
      $('#sigClear').onclick = () => { ctx.clearRect(0, 0, pad.width, pad.height); dirty = false; };
      $('#sigSave').onclick = () => {
        const name = $('#sigName').value.trim();
        if (!name) return $('#sigName').focus();
        if (!dirty) return toast('Peça para o responsável assinar no quadro', 'alert');
        o.signature = { name, img: pad.toDataURL('image/png'), at: new Date().toISOString() };
        addHistory(o, 'Assinatura coletada de ' + name);
        save('Assinatura salva');
      };
    }
    const redo = $('#sigRedo');
    if (redo) redo.onclick = () => { o.signature = null; save(); };

    // Finalização
    $('#oSol').onchange = (e) => { o.solution = e.target.value.trim(); DB.save(); };
    const fin = $('#oFinish');
    if (fin) fin.onclick = () => {
      o.solution = $('#oSol').value.trim();
      if (!o.solution) { $('#oSol').classList.add('invalid'); $('#oSol').focus(); return toast('Descreva a solução antes de finalizar', 'alert'); }
      if (o.timerStart) { o.timeSpent = (o.timeSpent || 0) + (Date.now() - new Date(o.timerStart)) / 6e4; o.timerStart = ''; }
      o.status = 'finalizada';
      o.closedAt = new Date().toISOString();
      addHistory(o, 'OS finalizada e relatório enviado ao cliente');
      DB.save(); router();
      openFinishSuccess(o);
    };
    const cancel = $('#oCancel');
    if (cancel) cancel.onclick = () => openCancelOrder(o);

    const addNote = () => { const v = $('#noteIn').value.trim(); if (!v) return; addHistory(o, '📝 ' + v); save(); };
    $('#noteBtn').onclick = addNote;
    // clicar em qualquer parte do card abre/fecha (menos nos campos e botões de dentro)
    $('#tlCard').onclick = (e) => {
      if (e.target.closest('.tl-body input, .tl-body button, .tl-body a, .tl-body textarea')) return;
      const open = $('#tlCard').classList.toggle('open');
      $('#tlToggle').setAttribute('aria-expanded', open);
      setPref('timelineOpen', open);
    };
    $('#noteIn').onkeydown = (e) => e.key === 'Enter' && addNote();
  },
};

/* =========================================================
   Dashboard · Visão operacional
   ========================================================= */
// Filtro do Dashboard (técnico + urgência) e estado das listas/abas
const DASH_STATE = { tech: getPref('dash-tech', ''), urg: '', tab: 'fila', more: { fila: false, hoje: false } };
const DASH_LIMIT = 5;

// Linha compacta de OS: barra de cor, cliente, descrição em 1 linha, quando e foto do técnico
function dashRow(x, { tag, tagCls, when, color }) {
  return `<a class="dash-row" href="#/os/${x.id}" style="--c:${color}">
    <div class="dr-main">
      <div class="dr-top"><b>${esc(client(x.clientId).name)}</b>${tag ? `<span class="badge ${tagCls}">${tag}</span>` : ''}</div>
      <div class="dr-desc">${esc(x.issue)}</div>
    </div>
    <div class="dr-side"><span class="dr-when"><small>${when}</small>${tag ? `<em class="dr-tag" style="--t:${color}">${tag}</em>` : ''}</span>${x.tech ? avatar(x.tech) : `<span class="avatar sm no-tech" title="Sem técnico">${icon('user')}</span>`}</div>
  </a>`;
}

PAGES.dashboard = {
  render() {
    if (DASH_STATE.tech && DASH_STATE.tech !== '-' && !D().techs.includes(DASH_STATE.tech)) DASH_STATE.tech = '';
    const f = DASH_STATE;
    const match = (x) => (!f.tech || (f.tech === '-' ? !x.tech : x.tech === f.tech)) && (!f.urg || x.urgency === f.urg);
    const o = D().orders.filter(match);
    const open = o.filter((x) => !osClosed(x));
    const late = open.filter(isLate);
    const stuck = f.tech || f.urg ? [] : rmaStuck(); // RMA não tem técnico nem urgência
    const today = new Date();
    const todayList = o.filter((x) => x.scheduledAt && sameDay(new Date(x.scheduledAt), today)).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    const outside = rmaOutside().length;
    const queue = [
      ...late.map((x) => ({ x, tag: 'Atrasada', tagCls: 'b-danger', when: x.scheduledAt || x.dueAt, color: '#FF3B30' })),
      ...open.filter((x) => !x.tech && !isLate(x)).map((x) => ({ x, tag: 'Sem técnico', tagCls: 'b-warn', when: x.openedAt, color: '#FF9500' })),
    ].sort((a, b) => ['critica', 'alta', 'normal'].indexOf(a.x.urgency) - ['critica', 'alta', 'normal'].indexOf(b.x.urgency) || new Date(a.when) - new Date(b.when));
    const kpi = (cls, title, val, sub, ico, go) => `<button class="op-kpi ${cls}" data-go="${go}"><div class="op-kpi-top"><span>${title}</span>${icon(ico)}</div><b>${val}</b><small>${sub}</small></button>`;
    const filtered = !!(f.tech || f.urg);
    const av = (v) => (v && v !== '-' ? avatar(v) : `<span class="tech-av sm all">${icon(v === '-' ? 'user' : 'users')}</span>`);
    const techOpts = [['', 'Todos os técnicos'], ['-', 'Sem técnico'], ...D().techs.map((t) => [t, t])];
    const qShown = f.more.fila ? queue : queue.slice(0, DASH_LIMIT);
    const tShown = f.more.hoje ? todayList : todayList.slice(0, DASH_LIMIT);
    const moreBtn = (key, total) => (total > DASH_LIMIT ? `<button class="btn btn-ghost btn-sm dash-more" data-more="${key}">${f.more[key] ? 'Mostrar menos' : `Ver mais ${total - DASH_LIMIT}`}${icon(f.more[key] ? 'arrowUp' : 'chevD')}</button>` : '');
    return `
      <div class="page-head">
        <div><h1><span class="ok-dot">${icon('check')}</span>Visão operacional</h1><p>O essencial para decidir o que fazer agora.</p></div>
        <div class="actions">
          <button class="btn btn-primary" onclick="openNewOrder()"><span data-icon="plus"></span>Nova OS</button>
          <button class="btn btn-ghost" id="dNewRma"><span data-icon="plus"></span>Novo RMA</button>
          <button class="btn btn-ghost" onclick="location.hash='#/fornecedores'"><span data-icon="building"></span>Fornecedores</button>
        </div>
      </div>

      <div class="dash-filter glass">
        <div class="tech-dd" id="dashTechDD">
          <button class="btn btn-ghost tech-dd-btn" id="dashTechBtn" aria-haspopup="listbox" aria-expanded="false">${av(f.tech)}<span>${f.tech ? esc(f.tech === '-' ? 'Sem técnico' : f.tech) : 'Todos os técnicos'}</span>${icon('chevD', 'dd-chev')}</button>
          <div class="tech-menu" role="listbox" aria-label="Técnico">
            <div class="tech-menu-head">Filtrar por técnico</div>
            <div id="dashTechOpts">${techOpts.map(([v, l]) => `<button role="option" aria-selected="${f.tech === v}" class="${f.tech === v ? 'on' : ''}" data-dtech="${esc(v)}">${av(v)}<span class="tech-name">${esc(l)}</span>${f.tech === v ? icon('check', 'dd-check') : ''}</button>`).join('')}</div>
          </div>
        </div>
        <div class="dash-urg" role="group" aria-label="Urgência">
          ${[['', 'Todas'], ...Object.entries(URG).map(([k, u]) => [k, u.label])].map(([k, l]) => `<button class="chip ${f.urg === k ? 'on' : ''}" data-durg="${k}">${k ? `<i style="background:${URG[k].color}"></i>` : ''}${l}</button>`).join('')}
        </div>
        ${filtered ? '<button class="btn btn-ghost btn-sm" id="dashClear">Limpar</button>' : ''}
      </div>

      <div class="grid g-4 dash-kpis">
        ${kpi('k-neutral', 'Fila aberta', open.length, 'OS em andamento', 'wrench', 'abertas')}
        ${kpi('k-danger', 'Atenção imediata', late.length + stuck.length, filtered ? 'OS atrasadas' : 'Atrasos e RMAs parados', 'alert', 'atrasadas')}
        ${kpi('k-brand', 'Agenda de hoje', todayList.length, 'Atendimentos marcados', 'calendar', 'hoje')}
        ${kpi('k-ok', 'Fora da empresa', outside, 'Equipamentos em fornecedor', 'building', 'rma')}
      </div>

      <div class="dash-tabs" role="tablist">
        <button role="tab" class="${f.tab === 'fila' ? 'on' : ''}" data-dtab="fila">${icon('alert')}Fila de atenção <span>${queue.length}</span></button>
        <button role="tab" class="${f.tab === 'hoje' ? 'on' : ''}" data-dtab="hoje">${icon('calendar')}Agenda de hoje <span>${todayList.length}</span></button>
      </div>
      <div class="grid g-main dash-panels" data-active="${f.tab}">
        <section class="card glass" data-panel="fila">
          <div class="card-head"><h3 class="h-ico">${icon('alert')}Fila de atenção</h3><span class="badge b-muted">${queue.length}</span></div>
          ${queue.length ? `<div class="dash-list">${qShown.map((q) => dashRow(q.x, { tag: q.tag, tagCls: q.tagCls, when: fmtDate(q.when), color: q.color })).join('')}</div>${moreBtn('fila', queue.length)}`
            : `<div class="empty-state">${icon('check')}<div>Nada precisando de atenção${filtered ? ' com esse filtro' : ''}.</div></div>`}
        </section>
        <section class="card glass" data-panel="hoje" style="align-self:start">
          <div class="card-head"><h3 class="h-ico">${icon('calendar')}Agenda de hoje</h3><a href="#/agenda" class="hint">Abrir agenda</a></div>
          ${todayList.length ? `<div class="dash-list">${tShown.map((x) => dashRow(x, { tag: osClosed(x) ? STATUS[x.status].label : '', tagCls: 'b-muted', when: fmtTime(x.scheduledAt), color: svcColor(x) })).join('')}</div>${moreBtn('hoje', todayList.length)}`
            : `<div class="empty-state">${icon('calendar')}<div>Nenhum atendimento hoje${filtered ? ' com esse filtro' : ''}.</div></div>`}
        </section>
      </div>
      <div class="quick-links"><span class="muted">Acessos rápidos:</span>
        <button class="chip" data-go="atrasadas">${icon('clock')}Ver atrasadas</button>
        <button class="chip" data-go="semtec">${icon('user')}OS sem técnico</button>
        <button class="chip" data-go="rma">${icon('repeat')}RMAs e equipamentos</button>
        <button class="chip" data-go="relatorios">${icon('chart')}Relatórios completos</button>
      </div>`;
  },
  mount() {
    const f = DASH_STATE;
    // atalhos levam o filtro do Dashboard para a lista de OS
    const adv = () => ({ ...OS_ADV_DEFAULT(), tech: f.tech, urg: f.urg });
    const routes = {
      abertas: () => goOrders({ adv: adv() }),
      atrasadas: () => goOrders({ quick: 'atrasadas', adv: adv() }),
      hoje: () => goOrders({ quick: 'hoje', scope: 'todas', adv: adv() }),
      semtec: () => goOrders({ quick: 'semtec' }),
      rma: () => (location.hash = '#/rma'),
      relatorios: () => (location.hash = '#/relatorios'),
    };
    $$('#view [data-go]').forEach((b) => (b.onclick = () => routes[b.dataset.go]()));
    $('#dNewRma').onclick = () => { location.hash = '#/rma'; setTimeout(() => $('[data-new]')?.click(), 50); };
    bindDropdown('#dashTechDD', '#dashTechBtn');
    $$('[data-dtech]').forEach((b) => (b.onclick = () => { f.tech = b.dataset.dtech; setPref('dash-tech', f.tech); f.more = { fila: false, hoje: false }; router(); }));
    $$('[data-durg]').forEach((b) => (b.onclick = () => { f.urg = b.dataset.durg; f.more = { fila: false, hoje: false }; router(); }));
    const c = $('#dashClear');
    if (c) c.onclick = () => { f.tech = ''; f.urg = ''; setPref('dash-tech', ''); router(); };
    $$('[data-dtab]').forEach((b) => (b.onclick = () => {
      f.tab = b.dataset.dtab;
      $('.dash-panels').dataset.active = f.tab;
      $$('[data-dtab]').forEach((x) => x.classList.toggle('on', x === b));
    }));
    $$('[data-more]').forEach((b) => (b.onclick = () => { f.more[b.dataset.more] = !f.more[b.dataset.more]; const y = window.scrollY; router(); window.scrollTo({ top: y }); }));
  },
};

/* =========================================================
   Clientes
   ========================================================= */
const CLI_STATE = { q: '', tab: 'clientes' };
// Contatos de um cliente = contatos cuja empresa é o nome do cliente
const clientContacts = (c) => (D().contatos || []).filter((x) => (x.clients ? contactLinksClient(x, c) : (x.company || '').trim().toLowerCase() === c.name.trim().toLowerCase()));

// Uma vez: o contato principal de cada cliente vira um contato do tipo “Cliente”
// (chamado ao abrir a página/ficha, porque os contatos são criados depois deste arquivo)
function linkClientContacts() {
  const d = DB.data;
  if (!Array.isArray(d.contatos) || d.contatosClientes) return;
  d.clients.forEach((c) => {
    if (!c.contact || clientContacts(c).length) return;
    const name = c.contact.replace(/\s*\(.*\)\s*/, '').trim();
    const role = (c.contact.match(/\((.*)\)/) || [])[1] || 'Responsável';
    d.contatos.push({ id: d.nextId.contatos++, name, company: c.name, role, phone: c.phone || '', email: c.email || '', type: 'Cliente', notes: '', clients: [{ clientId: c.id, branches: (c.filiais || []).map((b) => b.name) }] });
  });
  d.contatosClientes = 1;
  DB.save();
}

// Filiais dos clientes (exemplos na primeira vez)
(function ensureFiliais() {
  const d = DB.data;
  if (d.clients.every((c) => Array.isArray(c.filiais))) return;
  const ex = {
    'Mercado Bom Preço': [{ name: 'Matriz - São Gerardo', address: 'Av. Bezerra de Menezes, 3300' }, { name: 'Filial Messejana', address: 'Av. Frei Cirilo, 2100' }],
    'Farmácia Saúde Já': [{ name: 'Loja 1 - Edson Queiroz', address: 'Av. Washington Soares, 1500' }, { name: 'Loja 2 - Aldeota', address: 'R. Silva Paulet, 800' }],
    'Restaurante Sabor da Terra': [{ name: 'Dionísio Torres', address: 'R. Tibúrcio Cavalcante, 2100' }, { name: 'Shopping Iguatemi', address: 'Av. Washington Soares, 85' }],
    'Colégio Novo Saber': [{ name: 'Unidade Aldeota', address: 'R. Monsenhor Bruno, 1800' }],
  };
  d.clients.forEach((c) => { if (!Array.isArray(c.filiais)) c.filiais = ex[c.name] ? ex[c.name].map((b) => ({ ...b })) : []; });
  DB.save();
})();

// Clientes e Contatos numa página só, com abas (#/clientes e #/clientes/contatos)
PAGES.clientes = {
  render(param) {
    linkClientContacts();
    CLI_STATE.tab = param === 'contatos' ? 'contatos' : 'clientes';
    const isC = CLI_STATE.tab === 'contatos';
    const nCli = D().clients.length, nCon = (D().contatos || []).length;
    return `
      <div class="page-head">
        <div><h1>Clientes e contatos</h1><p>${nCli} clientes · ${nCon} contatos</p></div>
        <div class="actions">${isC
          ? `<button class="btn btn-primary" id="cliNewContact"><span data-icon="plus"></span>Novo contato</button>`
          : `<button class="btn btn-primary" onclick="openNewClient()"><span data-icon="plus"></span>Novo cliente</button>`}</div>
      </div>
      <div class="page-tabs" role="tablist">
        <a role="tab" href="#/clientes" class="${isC ? '' : 'on'}" aria-selected="${!isC}">${icon('users')}Clientes<span>${nCli}</span></a>
        <a role="tab" href="#/clientes/contatos" class="${isC ? 'on' : ''}" aria-selected="${isC}">${icon('contact')}Contatos<span>${nCon}</span></a>
      </div>
      ${isC ? PAGES.contatos.render(null, null, true) : `
      <div class="card glass">
        <div class="toolbar"><div class="input-wrap">${icon('search')}<input class="input" id="cliSearch" placeholder="Buscar por nome, CNPJ, contato ou endereço" value="${esc(CLI_STATE.q)}"></div></div>
        <div id="cliBody"></div>
      </div>`}`;
  },
  mount(param) {
    if (CLI_STATE.tab === 'contatos') {
      PAGES.contatos.mount();
      $('#cliNewContact').onclick = () => openContact();
      return;
    }
    $('#cliSearch').oninput = (e) => { CLI_STATE.q = e.target.value; this.body(); };
    this.body();
  },
  body() {
    const q = CLI_STATE.q.toLowerCase();
    const list = D().clients.filter((c) => [c.name, c.doc, c.contact, c.phone, c.address, c.email].join(' ').toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
    $('#cliBody').innerHTML = list.length ? `<div class="table-wrap"><table class="t">
      <thead><tr><th class="nosort">Cliente</th><th class="nosort">Endereço</th><th class="nosort">Contato principal</th><th class="nosort">Contatos</th><th class="nosort">OS abertas</th><th class="nosort">Total de OS</th><th class="nosort"></th></tr></thead>
      <tbody>${list.map((c) => {
        const os = D().orders.filter((o) => o.clientId === c.id);
        const open = os.filter((o) => !osClosed(o));
        const cc = clientContacts(c).length;
        return `<tr data-id="${c.id}">
          <td><div class="who">${avatar(c.name)}<div><b>${esc(c.name)}</b><small>${esc(c.doc || '')}</small></div></div></td>
          <td><span class="muted">${esc(c.address || '—')}</span></td>
          <td>${esc(c.contact || '—')}<small>${esc(c.phone || '')}</small></td>
          <td>${cc ? `<span class="badge b-muted">${cc}</span>` : '<span class="muted">0</span>'}</td>
          <td>${open.length ? `<span class="badge b-brand">${open.length}</span>${open.some(isLate) ? ' <span class="badge b-danger">atrasada</span>' : ''}` : '<span class="muted">0</span>'}</td>
          <td>${os.length}</td>
          <td><a class="more" target="_blank" rel="noopener" href="${waLink(c.phone || '', 'Olá!')}" title="WhatsApp" onclick="event.stopPropagation()">${icon('whatsapp')}</a></td>
        </tr>`;
      }).join('')}</tbody></table></div>` : `<div class="empty-state">${icon('users')}<div>Nenhum cliente encontrado.</div></div>`;
    $$('#cliBody tbody tr').forEach((tr) => (tr.onclick = () => openClient(+tr.dataset.id)));
  },
};

// Endereço antigo #/contatos abre a aba Contatos
window.addEventListener('hashchange', () => { if (location.hash === '#/contatos') location.replace('#/clientes/contatos'); });
document.addEventListener('DOMContentLoaded', () => { if (location.hash === '#/contatos') location.replace('#/clientes/contatos'); });

function openClient(id) {
  linkClientContacts();
  const c = client(id);
  const contacts = clientContacts(c);
  const os = D().orders.filter((o) => o.clientId === id).sort((a, b) => (osClosed(a) ? 1 : 0) - (osClosed(b) ? 1 : 0) || b.id - a.id);
  openDrawer(`
    ${drawerHead(esc(c.name), `Cliente desde ${new Date(c.since).toLocaleDateString('pt-BR')}`)}
    <div class="drawer-body">
      <dl class="kv">
        <dt>CNPJ</dt><dd>${esc(c.doc || '—')}</dd>
        <dt>Contato</dt><dd>${esc(c.contact || '—')}</dd>
        <dt>Telefone</dt><dd>${esc(c.phone || '—')}</dd>
        <dt>E-mail</dt><dd>${esc(c.email || '—')}</dd>
        <dt>Endereço</dt><dd>${esc(c.address || '—')}${c.address ? ` <a href="${mapsLink(c.address)}" target="_blank" rel="noopener">Mapa</a>` : ''}</dd>
      </dl>
      <div>
        <p class="section-title">Filiais (${(c.filiais || []).length})</p>
        <div class="list">${(c.filiais || []).length ? c.filiais.map((b, i) => `<div class="list-item">${icon('building')}<div class="meta"><strong>${esc(b.name)}</strong><small>${esc(b.address || 'Sem endereço')} · ${contacts.filter((x) => contactBranchesFor(x, c).includes(b.name)).length} contato(s)</small></div><button class="more" data-rmbranch="${i}" title="Remover filial">${icon('x')}</button></div>`).join('') : '<div class="muted">Nenhuma filial cadastrada.</div>'}</div>
        <form class="branch-add" id="branchForm"><input class="input" id="brName" placeholder="Nome da filial" required><input class="input" id="brAddr" placeholder="Endereço (opcional)"><button class="btn btn-ghost" type="submit">${icon('plus')}Adicionar</button></form>
      </div>
      <div>
        <div class="row-between"><p class="section-title" style="margin:0">Contatos (${contacts.length})</p><button class="btn btn-ghost btn-sm" id="cliAddContact">${icon('plus')}Novo contato</button></div>
        <div class="list" style="margin-top:6px">${contacts.length ? contacts.map((x) => `<div class="list-item" style="cursor:pointer" data-contact="${x.id}">${avatar(x.name)}<div class="meta"><strong>${esc(x.name)}${(() => { const b = contactBranchesFor(x, c), all = (c.filiais || []).length; return all && b.length && b.length < all ? ` <span class="tag" style="margin:0 0 0 4px">${esc(b.join(', '))}</span>` : ''; })()}</strong><small>${esc([x.role, x.phone, x.email].filter(Boolean).join(' · '))}</small></div>${x.phone ? `<a class="more" href="${waLink(x.phone, 'Olá!')}" target="_blank" rel="noopener" title="WhatsApp" onclick="event.stopPropagation()">${icon('whatsapp')}</a>` : ''}</div>`).join('') : '<div class="muted">Nenhum contato cadastrado.</div>'}</div>
      </div>
      <div>
        <p class="section-title">Ordens de serviço (${os.length})</p>
        <div class="list">${os.length ? os.map((o) => `<div class="list-item" style="cursor:pointer" data-os="${o.id}"><i class="dd-dot" style="background:${svcColor(o)}"></i><div class="meta"><strong>${osCode(o, true)} · ${esc(o.issue)}</strong><small>${esc(o.type)} · ${fmtDate(o.openedAt)} · ${esc(o.tech || 'Sem técnico')}</small></div>${badge(o.status)}</div>`).join('') : '<div class="muted">Nenhuma OS ainda.</div>'}</div>
      </div>
    </div>
    <div class="drawer-foot">
      <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${waLink(c.phone || '', 'Olá!')}">${icon('whatsapp')}WhatsApp</a>
      <button class="btn btn-primary btn-sm" id="cliNewOs">${icon('plus')}Nova OS para este cliente</button>
    </div>`);
  $$('[data-os]', $('#drawer')).forEach((el) => (el.onclick = () => { closeDrawer(); openOrder(+el.dataset.os); }));
  $('#cliNewOs').onclick = () => openNewOrder(id);
  // filiais: adicionar / remover (contatos da filial removida passam para “todas”)
  $('#branchForm').onsubmit = (e) => {
    e.preventDefault();
    const n = $('#brName').value.trim();
    if (!n) return;
    if ((c.filiais ||= []).some((b) => b.name.toLowerCase() === n.toLowerCase())) return toast('Essa filial já existe', 'alert');
    const before = c.filiais.length;
    clientContacts(c).forEach((x) => { const l = contactClients(x).find((k) => k.clientId === c.id); if (l && (l.branches || []).length === before) l.branches.push(n); });
    c.filiais.push({ name: n, address: $('#brAddr').value.trim() });
    DB.save(); openClient(id); toast('Filial adicionada', 'building');
  };
  $$('[data-rmbranch]', $('#drawer')).forEach((b) => (b.onclick = () => {
    const br = c.filiais[+b.dataset.rmbranch];
    if (!confirm(`Remover a filial “${br.name}”?`)) return;
    c.filiais.splice(+b.dataset.rmbranch, 1);
    clientContacts(c).forEach((x) => { const l = contactClients(x).find((k) => k.clientId === c.id); if (l) l.branches = (l.branches || []).filter((n) => n !== br.name); if (x.branch === br.name) x.branch = ''; });
    DB.save(); openClient(id); toast('Filial removida', 'trash');
  }));
  // novo contato já vinculado a este cliente
  $('#cliAddContact').onclick = () => openContact(null, { clientId: c.id });
  $$('[data-contact]', $('#drawer')).forEach((el) => (el.onclick = () => openContact(D().contatos.find((x) => x.id === +el.dataset.contact))));
}

function openNewClient(afterSave) {
  openDrawer(`
    ${drawerHead('Novo cliente')}
    <form class="drawer-body" id="cliForm">
      <div class="form-grid">
        <div class="field full"><label for="cName">Nome / razão social</label><input class="input" id="cName" required></div>
        <div class="field"><label for="cDoc">CNPJ / CPF</label><input class="input" id="cDoc" placeholder="00.000.000/0000-00"></div>
        <div class="field"><label for="cContact">Contato principal</label><input class="input" id="cContact"></div>
        <div class="field"><label for="cPhone">Telefone / WhatsApp</label><input class="input" id="cPhone" placeholder="(85) 90000-0000"></div>
        <div class="field"><label for="cEmail">E-mail</label><input class="input" id="cEmail" type="email"></div>
        <div class="field full"><label for="cAddr">Endereço</label><input class="input" id="cAddr" placeholder="Rua, número - bairro, cidade - UF"></div>
      </div>
    </form>
    <div class="drawer-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit" form="cliForm">Salvar cliente</button></div>`, { focus: true });
  $('#cPhone').oninput = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = v.replace(/(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d+)/, '($1) $2');
    e.target.value = v;
  };
  $('#cliForm').onsubmit = (e) => {
    e.preventDefault();
    const addr = $('#cAddr').value.trim();
    const nc = { id: D().nextId.client++, name: $('#cName').value.trim(), doc: $('#cDoc').value.trim(), contact: $('#cContact').value.trim(), phone: $('#cPhone').value, email: $('#cEmail').value.trim(), address: addr, city: addr.split(',').slice(-1)[0]?.trim() || '', since: new Date().toISOString() };
    D().clients.push(nc);
    closeDrawer(); refresh(); toast('Cliente cadastrado');
    if (afterSave) afterSave(nc);
  };
}


/* ---------- Cancelar OS: popup de confirmação com o motivo ---------- */
const CANCEL_REASONS = ['Cliente desistiu do serviço', 'Problema resolvido pelo cliente', 'OS duplicada', 'Aberta por engano', 'Sem peça ou fornecedor', 'Fora do escopo do contrato', 'Outro motivo'];
function openCancelOrder(o) {
  document.getElementById('cancelDlg')?.remove();
  const dlg = document.createElement('dialog');
  dlg.id = 'cancelDlg';
  dlg.className = 'confirm-dlg';
  dlg.setAttribute('aria-labelledby', 'cdTitle');
  dlg.innerHTML = `
    <form method="dialog" id="cdForm" novalidate>
      <button class="icon-btn cd-x" type="button" id="cdClose" aria-label="Fechar">${icon('x')}</button>
      <span class="cd-ico">${icon('alert')}</span>
      <h2 id="cdTitle">Cancelar Ordem de Serviço</h2>
      <p class="cd-sub">Tem certeza que deseja cancelar a OS <b>${esc(osCode(o, true))}</b>? Ela ficará registrada como cancelada.</p>
      <div class="field">
        <label for="cdReason">Por que a OS está sendo cancelada?</label>
        <select class="input" id="cdReason"><option value="">Selecione o motivo</option>${CANCEL_REASONS.map((r) => `<option>${r}</option>`).join('')}</select>
        <div class="err" id="cdReasonErr"></div>
      </div>
      <div class="field">
        <label for="cdDetail">Detalhes <span class="muted" id="cdOpt">(opcional)</span></label>
        <textarea class="input" id="cdDetail" rows="3" placeholder="Explique o que aconteceu"></textarea>
        <div class="err" id="cdDetailErr"></div>
      </div>
      <div class="cd-actions">
        <button class="btn cd-confirm" type="submit">${icon('x')}Confirmar cancelamento</button>
        <button class="btn btn-ghost" type="button" id="cdBack">Voltar</button>
      </div>
    </form>`;
  document.body.append(dlg);
  const close = () => { dlg.close(); dlg.remove(); };
  const reason = dlg.querySelector('#cdReason'), detail = dlg.querySelector('#cdDetail');
  const isOther = () => reason.value === 'Outro motivo';
  reason.onchange = () => {
    reason.classList.remove('invalid'); dlg.querySelector('#cdReasonErr').textContent = '';
    dlg.querySelector('#cdOpt').textContent = isOther() ? '(obrigatório)' : '(opcional)';
  };
  detail.oninput = () => { detail.classList.remove('invalid'); dlg.querySelector('#cdDetailErr').textContent = ''; };
  dlg.querySelector('#cdClose').onclick = close;
  dlg.querySelector('#cdBack').onclick = close;
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.querySelector('#cdForm').onsubmit = (e) => {
    e.preventDefault();
    if (!reason.value) { reason.classList.add('invalid'); dlg.querySelector('#cdReasonErr').textContent = 'Escolha o motivo do cancelamento.'; return reason.focus(); }
    const d = detail.value.trim();
    if (isOther() && !d) { detail.classList.add('invalid'); dlg.querySelector('#cdDetailErr').textContent = 'Descreva o motivo.'; return detail.focus(); }
    if (o.timerStart) { o.timeSpent = (o.timeSpent || 0) + (Date.now() - new Date(o.timerStart)) / 6e4; }
    o.status = 'cancelado'; o.timerStart = ''; o.closedAt = new Date().toISOString();
    o.cancelReason = { reason: reason.value, detail: d, at: o.closedAt, by: document.getElementById('userName')?.textContent || '' };
    addHistory(o, `OS cancelada · ${reason.value}${d ? ': ' + d : ''}`);
    close();
    DB.save(); router(); toast('OS cancelada');
  };
  dlg.showModal();
  reason.focus();
}

/* ---------- Finalizar OS: popup de sucesso ---------- */
function openFinishSuccess(o) {
  document.getElementById('finishDlg')?.remove();
  const c = client(o.clientId);
  const mins = Math.round(o.timeSpent || 0);
  const tempo = mins ? (mins >= 60 ? `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}min` : `${mins} min`) : 'Não registrado';
  const dlg = document.createElement('dialog');
  dlg.id = 'finishDlg';
  dlg.className = 'confirm-dlg ok-dlg';
  dlg.setAttribute('aria-labelledby', 'fdTitle');
  dlg.innerHTML = `
    <div class="fd-body">
      <button class="icon-btn cd-x" type="button" data-fd-close aria-label="Fechar">${icon('x')}</button>
      <span class="cd-ico ok">${icon('check')}</span>
      <h2 id="fdTitle">OS finalizada com sucesso!</h2>
      <p class="cd-sub">A OS <b>${esc(osCode(o, true))}</b> foi encerrada e o relatório foi enviado ao cliente.</p>
      <dl class="fd-sum">
        <div><dt>Cliente</dt><dd>${esc(c.name)}</dd></div>
        <div><dt>Técnico</dt><dd>${esc(o.tech || 'Sem técnico')}</dd></div>
        <div><dt>Tempo de atendimento</dt><dd>${tempo}</dd></div>
        <div><dt>Finalizada em</dt><dd>${fmtDT(o.closedAt)}</dd></div>
      </dl>
      <div class="cd-actions">
        <button class="btn fd-ok" type="button" data-fd-close>${icon('check')}Ok, entendi</button>
        <button class="btn btn-ghost" type="button" id="fdList">Voltar para Ordens de Serviço</button>
      </div>
    </div>`;
  document.body.append(dlg);
  const close = () => { dlg.close(); dlg.remove(); };
  dlg.querySelectorAll('[data-fd-close]').forEach((b) => (b.onclick = close));
  dlg.querySelector('#fdList').onclick = () => { close(); location.hash = '#/os'; };
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.showModal();
  dlg.querySelector('.fd-ok').focus();
}
