/* =========================================================
   Agenda de Serviços
   Igual ao sistema antigo: semana, técnico (com busca), OS agendadas
   no dia escolhido e lista de OS sem agendamento.
   As cores são da urgência da OS.
   ========================================================= */
// URG, STATUS e CLOSED vêm de data.js; osClosed, osCode, urgBadge e svcColor de os.js
const TECH_PALETTE = ['#007AFF', '#0E8FA3', '#C66A00', '#db2777', '#2563eb', '#7c3aed', '#248A3D', '#D70015'];
const techColor = (t) => (t ? TECH_PALETTE[Math.max(0, D().techs.indexOf(t)) % TECH_PALETTE.length] : '#6E6E73');

const weekStartOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x; };
const dayStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const AG_FILTER_DEFAULT = () => ({ urg: Object.keys(URG), mod: ['Presencial', 'Remoto'], types: SERVICE_TYPES.slice(), closed: true });
const AG_STATE = {
  week: weekStartOf(new Date()),
  sel: dayStart(new Date()),
  tech: getPref('agenda-tech', ''),
  f: Object.assign(AG_FILTER_DEFAULT(), getPref('agenda-f', {})),
};
if (AG_STATE.tech && !D().techs.includes(AG_STATE.tech)) AG_STATE.tech = '';

const agFilterOff = () => {
  const f = AG_STATE.f;
  return (Object.keys(URG).length - f.urg.length) + (2 - f.mod.length) + (SERVICE_TYPES.length - f.types.length) + (f.closed ? 0 : 1);
};
const osInAgenda = (o) => {
  const f = AG_STATE.f;
  return (!AG_STATE.tech || o.tech === AG_STATE.tech) &&
    f.urg.includes(o.urgency || 'normal') && f.mod.includes(o.modality || 'Presencial') &&
    f.types.includes(o.type || 'Outros') && (f.closed || !osClosed(o));
};
const scheduledOn = (d) => D().orders
  .filter((o) => o.scheduledAt && sameDay(new Date(o.scheduledAt), d) && osInAgenda(o))
  .sort((x, y) => new Date(x.scheduledAt) - new Date(y.scheduledAt));
const unscheduled = () => D().orders.filter((o) => !o.scheduledAt && !osClosed(o) && (!AG_STATE.tech || o.tech === AG_STATE.tech));

// Lista suspensa genérica (abre/fecha, fecha ao clicar fora ou com Esc)
function bindDropdown(ddId, btnId) {
  const dd = $(ddId), btn = $(btnId);
  const setOpen = (open) => {
    dd.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    if (open) $('input[type=search]', dd)?.focus();
  };
  btn.onclick = (e) => {
    e.stopPropagation();
    const open = !dd.classList.contains('open');
    $$('.tech-dd.open').forEach((x) => x !== dd && x.classList.remove('open'));
    setOpen(open);
  };
  const close = (e) => {
    if (!dd.isConnected) return document.removeEventListener('click', close);
    if (!dd.contains(e.target)) setOpen(false);
  };
  document.addEventListener('click', close);
  dd.onkeydown = (e) => { if (e.key === 'Escape') { setOpen(false); btn.focus(); } };
}

// Técnico: lista com busca, como no sistema antigo
function techFilter() {
  const cur = AG_STATE.tech;
  const av = (v) => (v
    ? (userByName(v)?.photo ? `<img class="tech-av sm tech-photo" src="${userByName(v).photo}" alt="">` : `<span class="tech-av sm" style="--c:${techColor(v)}">${esc(initials(v))}</span>`)
    : `<span class="tech-av sm all">${icon('users')}</span>`);
  const all = [['', 'Todos os Técnicos'], ...D().techs.map((t) => [t, t])];
  return `<div class="tech-dd" id="techDD">
    <button class="btn btn-ghost tech-dd-btn" id="techDDBtn" aria-haspopup="listbox" aria-expanded="false">${av(cur)}<span>${cur ? esc(cur) : 'Todos os Técnicos'}</span>${icon('chevD', 'dd-chev')}</button>
    <div class="tech-menu" role="listbox" aria-label="Técnico">
      <div class="input-wrap dd-search">${icon('search')}<input class="input" type="search" placeholder="Buscar técnico..." id="techSearch" autocomplete="off"></div>
      <div id="techOpts">${all.map(([v, l]) => `<button role="option" aria-selected="${cur === v}" class="${cur === v ? 'on' : ''}" data-tech="${esc(v)}" data-name="${esc(l.toLowerCase())}">${av(v)}<span class="tech-name">${esc(l)}</span>${cur === v ? icon('check', 'dd-check') : ''}</button>`).join('')}</div>
    </div>
  </div>`;
}

// Filtros com os campos reais da OS: urgência, modalidade, tipo de serviço
function osFilter() {
  const f = AG_STATE.f, off = agFilterOff();
  const row = (group, val, label, checked, dot) => `<label class="dd-check-row"><input type="checkbox" data-g="${group}" value="${esc(val)}" ${checked ? 'checked' : ''}>${dot ? `<i class="dd-dot" style="background:${dot}"></i>` : ''}<span>${esc(label)}</span></label>`;
  return `<div class="tech-dd" id="typeDD">
    <button class="btn btn-ghost tech-dd-btn" id="typeDDBtn" aria-haspopup="true" aria-expanded="false" style="padding:0 12px">${icon('filter')}<span>Filtros</span>${off ? `<b class="dd-count">${off}</b>` : ''}${icon('chevD', 'dd-chev')}</button>
    <div class="tech-menu filters-menu" role="group" aria-label="Filtros">
      <div class="tech-menu-head row-between">Filtrar OS${off ? '<a href="#" id="typeReset" class="dd-reset">Limpar</a>' : ''}</div>
      <div class="dd-section">Urgência</div>
      ${Object.entries(URG).map(([k, u]) => row('urg', k, `${u.label} (${u.sla})`, f.urg.includes(k), u.color)).join('')}
      <div class="dd-section">Modalidade</div>
      ${['Presencial', 'Remoto'].map((m) => row('mod', m, m, f.mod.includes(m))).join('')}
      <div class="dd-section">Tipo de serviço</div>
      <div class="dd-types">${SERVICE_TYPES.map((t) => row('types', t, t, f.types.includes(t))).join('')}</div>
      <div class="dd-sep"></div>
      ${row('closed', '1', 'Mostrar fechadas', f.closed)}
    </div>
  </div>`;
}

// Fotos (ou iniciais) dos técnicos que têm OS no dia — até 3 e um “+n”
function dayTechs(list) {
  const techs = [...new Set(list.map((o) => o.tech).filter(Boolean))];
  if (!techs.length) return '';
  return `<span class="wd-techs" title="${esc(techs.join(', '))}">${techs.slice(0, 3).map((t) => avatar(t)).join('')}${techs.length > 3 ? `<span class="avatar sm more-av">+${techs.length - 3}</span>` : ''}</span>`;
}

function serviceCard(o) {
  return `<a class="svc" href="#" data-os="${o.id}" style="--c:${svcColor(o)}">
    <div class="svc-main">
      <div class="svc-top"><b>${osCode(o)} - ${esc(client(o.clientId).name.toUpperCase())}</b>${badge(o.status)}</div>
      <div class="svc-desc">${esc(o.issue)}${o.computer && o.computer !== "—" ? " · " + esc(o.computer) : ""}</div>
      <div class="svc-meta">
        ${o.scheduledAt ? `<span>${icon('clock')}${fmtTime(o.scheduledAt)}</span>` : ''}
        <span class="svc-tech">${icon('user')}${esc(o.tech || 'Sem técnico')}</span>
        <span>${icon(o.modality === 'Remoto' ? 'devices' : 'pin')}${esc(o.modality || 'Presencial')}</span>
        <span>${icon('tag')}${esc(o.type || '')}</span>
        ${urgBadge(o)}
      </div>
    </div>${svcPhoto(o.tech)}${icon('chevR', 'svc-go')}
  </a>`;
}

PAGES.agenda = {
  render() {
    const w = AG_STATE.week;
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(w); d.setDate(w.getDate() + i); return d; });
    const fmtD = (d) => `${d.getDate()} ${d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').replace(/^./, (c) => c.toUpperCase())}`;
    const today = new Date();
    const week = days.map((d) => {
      const list = scheduledOn(d);
      return `<button class="wday ${sameDay(d, AG_STATE.sel) ? 'sel' : ''} ${sameDay(d, today) ? 'today' : ''}" data-day="${d.getTime()}">
        <span class="wd-name"><span class="wd-long">${d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span><span class="wd-short">${'DSTQQSS'[d.getDay()]}</span></span>
        <span class="wd-num">${d.getDate()}</span>
        ${list.length ? `<span class="wd-count">${list.length}</span>` : ''}
        <span class="wd-dots">${list.slice(0, 6).map((o) => `<i style="background:${svcColor(o)}"></i>`).join('')}${list.length > 4 ? `<b class="wd-more">+${list.length - 4}</b>` : ''}</span>
        ${dayTechs(list)}
      </button>`;
    }).join('');
    const sel = AG_STATE.sel, dayList = scheduledOn(sel), noDate = unscheduled();
    return `
      <div class="page-head">
        <div><h1>Agenda de Serviços</h1><p>${AG_STATE.tech ? `Agenda de <b>${esc(AG_STATE.tech)}</b>` : 'Todos os técnicos'} · OS agendadas por dia</p></div>
        <div class="actions"><button class="btn btn-primary" onclick="openSchedule()"><span data-icon="plus"></span>Agendar OS</button></div>
      </div>
      <div class="card glass">
        <div class="card-head cal-head">
          <div class="week-nav">
            <button class="btn btn-ghost btn-icon" id="prevW" aria-label="Semana anterior">${icon('chevL')}</button>
            <h3>${fmtD(days[0])} - ${fmtD(days[6])}</h3>
            <button class="btn btn-ghost btn-icon" id="nextW" aria-label="Próxima semana">${icon('chevR')}</button>
            <button class="btn btn-ghost btn-sm" id="todayW">Hoje</button>
          </div>
          <div class="cal-filters">${techFilter()}${osFilter()}</div>
        </div>
        <div class="week-grid">${week}</div>
        <div class="legend cal-legend">${Object.values(URG).map((u) => `<span><i style="background:${u.color}"></i>${u.label}</span>`).join('')}<span><i style="background:#AAAAAA"></i>Fechada</span></div>
      </div>
      <div class="grid g-main">
        <div class="card glass">
          <div class="card-head">
            <h3>${sel.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())}</h3>
            <span class="badge b-muted">${dayList.length} ${dayList.length === 1 ? 'serviço' : 'serviços'}</span>
          </div>
          ${dayList.length
            ? `<div class="svc-list">${dayList.map(serviceCard).join('')}</div>`
            : `<div class="empty-state">${icon('calendar')}<div>Nenhuma OS agendada neste dia${agFilterOff() ? ' com esses filtros' : ''}.</div></div>`}
        </div>
        <div class="card glass" style="align-self:start">
          <div class="card-head"><div><h3>OS sem agendamento</h3><p>Abertas e ainda sem data</p></div><span class="badge ${noDate.length ? 'b-warn' : 'b-muted'}">${noDate.length}</span></div>
          ${noDate.length
            ? `<div class="list">${noDate.map((o) => `<div class="list-item"><span class="urg-ring" style="--c:${svcColor(o)}" title="Urgência ${urgOf(o).label}">${o.tech ? avatar(o.tech) : `<span class="avatar sm no-tech">${icon('user')}</span>`}</span><div class="meta" style="cursor:pointer" data-os="${o.id}"><strong>${osCode(o)} - ${esc(client(o.clientId).name)}</strong><small>${esc(o.issue)} · ${esc(o.tech || 'Sem técnico')}</small></div><button class="btn btn-soft btn-sm" data-sched="${o.id}">Agendar</button></div>`).join('')}</div>`
            : `<div class="empty-state">${icon('check')}<div>Nenhuma OS pendente de agendamento.</div></div>`}
        </div>
      </div>`;
  },
  mount() {
    const go = (n) => { AG_STATE.week = new Date(AG_STATE.week.getTime() + n * 7 * 864e5); AG_STATE.sel = new Date(AG_STATE.week); router(); };
    $('#prevW').onclick = () => go(-1);
    $('#nextW').onclick = () => go(1);
    $('#todayW').onclick = () => { AG_STATE.week = weekStartOf(new Date()); AG_STATE.sel = dayStart(new Date()); router(); };
    $$('.wday').forEach((b) => (b.onclick = () => { AG_STATE.sel = new Date(+b.dataset.day); router(); }));
    $$('#view [data-os]').forEach((el) => (el.onclick = (e) => { e.preventDefault(); openOrder(+el.dataset.os); }));
    $$('#view [data-sched]').forEach((b) => (b.onclick = () => openSchedule(+b.dataset.sched)));

    bindDropdown('#techDD', '#techDDBtn');
    $('#techSearch').oninput = (e) => {
      const q = e.target.value.trim().toLowerCase();
      $$('#techOpts [data-tech]').forEach((b) => (b.hidden = !!q && !b.dataset.name.includes(q)));
    };
    $$('#techOpts [data-tech]').forEach((b) => (b.onclick = () => { AG_STATE.tech = b.dataset.tech; setPref('agenda-tech', AG_STATE.tech); router(); }));

    bindDropdown('#typeDD', '#typeDDBtn');
    // Ao marcar/desmarcar, redesenha e mantém a lista de filtros aberta
    const keepOpen = () => { router(); $('#typeDD').classList.add('open'); $('#typeDDBtn').setAttribute('aria-expanded', true); };
    $$('#typeDD [data-g]').forEach((cb) => (cb.onchange = () => {
      const f = AG_STATE.f, g = cb.dataset.g;
      if (g === 'closed') f.closed = cb.checked;
      else f[g] = $$(`#typeDD [data-g="${g}"]:checked`).map((x) => x.value);
      setPref('agenda-f', f);
      keepOpen();
    }));
    const r = $('#typeReset');
    if (r) r.onclick = (e) => { e.preventDefault(); AG_STATE.f = AG_FILTER_DEFAULT(); setPref('agenda-f', AG_STATE.f); keepOpen(); };
  },
};

// Agendar (ou reagendar) uma OS: data, hora, técnico e modalidade
function openSchedule(id, dateStr) {
  const open = D().orders.filter((o) => !osClosed(o)).sort((a, b) => (a.scheduledAt ? 1 : 0) - (b.scheduledAt ? 1 : 0) || b.id - a.id);
  const o = id ? D().orders.find((x) => x.id === id) : null;
  const base = o && o.scheduledAt ? new Date(o.scheduledAt) : dateStr ? new Date(dateStr + 'T09:00') : new Date(AG_STATE.sel.getTime() + 9 * 36e5);
  const pad = (n) => String(n).padStart(2, '0');
  const dVal = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
  const tVal = `${pad(base.getHours())}:${pad(base.getMinutes())}`;
  openDrawer(`
    ${drawerHead(o ? `Agendar ${osCode(o)}` : 'Agendar OS', o ? esc(client(o.clientId).name) : 'Escolha a OS e o horário')}
    <form class="drawer-body" id="schForm">
      <div class="form-grid">
        <div class="field full"><label for="sOs">Ordem de serviço</label>
          <select class="input" id="sOs">${open.map((x) => `<option value="${x.id}" ${o && x.id === o.id ? 'selected' : ''}>${osCode(x)} · ${esc(client(x.clientId).name)} · ${esc(x.issue)}${x.scheduledAt ? '' : ' (sem data)'}</option>`).join('')}</select></div>
        <div class="field"><label for="sDate">Data</label><input class="input" type="date" id="sDate" value="${dVal}" required></div>
        <div class="field"><label for="sTime">Hora</label><input class="input" type="time" id="sTime" value="${tVal}" required></div>
        <div class="field"><label for="sTech">Técnico responsável</label><select class="input" id="sTech">${D().techs.map((t) => `<option>${esc(t)}</option>`).join('')}</select></div>
        <div class="field"><label for="sMod">Modalidade</label><select class="input" id="sMod"><option>Presencial</option><option>Remoto</option></select></div>
      </div>
    </form>
    <div class="drawer-foot">
      ${o && o.scheduledAt ? '<button class="btn btn-ghost btn-sm" id="schClear" style="margin-right:auto">Remover agendamento</button>' : ''}
      <button class="btn btn-ghost" data-close>Cancelar</button>
      <button class="btn btn-primary" type="submit" form="schForm">${icon('check')}Agendar</button>
    </div>`);
  const fill = () => {
    const x = D().orders.find((y) => y.id === +$('#sOs').value);
    if (!x) return;
    $('#sTech').value = x.tech || AG_STATE.tech || D().techs[0];
    $('#sMod').value = x.modality || 'Presencial';
  };
  $('#sOs').onchange = fill;
  fill();
  $('#schForm').onsubmit = (e) => {
    e.preventDefault();
    const x = D().orders.find((y) => y.id === +$('#sOs').value);
    const at = new Date(`${$('#sDate').value}T${$('#sTime').value}`);
    x.scheduledAt = at.toISOString();
    x.tech = $('#sTech').value;
    x.modality = $('#sMod').value;
    x.history.push({ at: new Date().toISOString(), text: `Agendada para ${at.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} · ${x.tech}` });
    AG_STATE.week = weekStartOf(at);
    AG_STATE.sel = dayStart(at);
    closeDrawer(); refresh(); toast(`${osCode(x)} agendada`, 'calendar');
  };
  const c = $('#schClear');
  if (c) c.onclick = () => {
    o.scheduledAt = '';
    o.history.push({ at: new Date().toISOString(), text: 'Agendamento removido' });
    closeDrawer(); refresh(); toast('Agendamento removido');
  };
}
