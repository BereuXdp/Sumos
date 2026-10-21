/* =========================================================
   Relatórios — mapa de desempenho por cliente, técnico, status e urgência
   Mesma estrutura do sistema antigo: filtros de período, cliente, técnico,
   status e urgência; indicadores, gráficos, rankings e exportar PDF.
   ========================================================= */
const REP_DEFAULT = () => ({ period: '30', from: '', to: '', client: '', tech: '', status: '', urg: '' });
const REP_STATE = REP_DEFAULT();

function repRange(f) {
  const now = new Date(), start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (f.period === '7') start.setDate(start.getDate() - 6);
  else if (f.period === '30') start.setDate(start.getDate() - 29);
  else if (f.period === 'mes') start.setDate(1);
  else if (f.period === 'ultimo') {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1), e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return [s, e, 'Último mês'];
  } else if (f.period === 'custom') {
    return [f.from ? new Date(f.from + 'T00:00') : new Date(0), f.to ? new Date(f.to + 'T23:59:59') : now, `${f.from ? new Date(f.from + 'T12:00').toLocaleDateString('pt-BR') : 'início'} a ${f.to ? new Date(f.to + 'T12:00').toLocaleDateString('pt-BR') : 'hoje'}`];
  }
  const label = { 7: 'Últimos 7 dias', 30: 'Últimos 30 dias', mes: 'Este mês' }[f.period];
  return [start, now, label];
}
function repData(f) {
  const [s, e, label] = repRange(f);
  const list = D().orders.filter((o) => {
    const t = new Date(o.openedAt);
    return t >= s && t <= e && (!f.client || o.clientId === +f.client) && (!f.tech || (f.tech === '-' ? !o.tech : o.tech === f.tech)) && (!f.status || o.status === f.status) && (!f.urg || o.urgency === f.urg);
  });
  return { list, label };
}
const hours = (ms) => ms / 36e5;
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const fmtH = (h) => (h >= 10 ? Math.round(h) : Math.round(h * 10) / 10).toLocaleString('pt-BR');
const countBy = (list, key) => { const m = {}; list.forEach((x) => { const k = key(x); if (k != null) m[k] = (m[k] || 0) + (typeof k === 'object' ? 0 : 1); }); return m; };
function hbars(entries, opts = {}) {
  const top = entries.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, opts.limit || 8);
  if (!top.length) return '<p class="muted" style="margin:0">Sem dados no período.</p>';
  const max = Math.max(...top.map(([, v]) => v));
  return `<div class="hbars">${top.map(([k, v]) => `<div class="hbar"><span title="${esc(k)}">${esc(k)}</span><div><i style="width:${(v / max) * 100}%;${opts.color ? 'background:' + (typeof opts.color === 'function' ? opts.color(k) : opts.color) : ''}"></i></div><b>${opts.fmt ? opts.fmt(v) : v}</b></div>`).join('')}</div>`;
}

PAGES.relatorios = {
  render() {
    const f = REP_STATE;
    const { list, label } = repData(f);
    const closed = list.filter(osClosed);
    const done = closed.filter((o) => o.status !== 'cancelado');
    const inSla = done.filter((o) => o.closedAt && new Date(o.closedAt) <= new Date(o.dueAt));
    const sla = done.length ? Math.round((inSla.length / done.length) * 100) : 0;
    const by = (k) => list.filter((o) => o.status === k).length;
    const attend = done.map((o) => (o.timeSpent || 0) / 60).filter((h) => h > 0);
    const queue = list.map((o) => hours((o.closedAt ? new Date(o.closedAt) : new Date()) - new Date(o.openedAt)));
    const cname = (o) => client(o.clientId).name;
    const mats = list.flatMap((o) => (o.items || []).filter((i) => i.kind === 'material').map((i) => ({ ...i, o })));
    const sumBy = (arr, key, val) => { const m = {}; arr.forEach((x) => (m[key(x)] = (m[key(x)] || 0) + val(x))); return Object.entries(m); };
    const avgBy = (arr, key, val) => { const m = {}; arr.forEach((x) => (m[key(x)] ||= []).push(val(x))); return Object.entries(m).map(([k, v]) => [k, avg(v)]); };
    const techs = [...new Set(list.map((o) => o.tech || 'Sem técnico'))];
    const ranking = techs.filter((t) => t !== 'Sem técnico').map((t) => {
      const mine = list.filter((o) => o.tech === t), d2 = mine.filter((o) => osClosed(o) && o.status !== 'cancelado');
      const ok = d2.filter((o) => o.closedAt && new Date(o.closedAt) <= new Date(o.dueAt)).length;
      return { t, total: mine.length, closed: d2.length, sla: d2.length ? Math.round((ok / d2.length) * 100) : null, avgH: avg(d2.map((o) => (o.timeSpent || 0) / 60)) };
    }).sort((a, b) => b.closed - a.closed || (b.sla ?? -1) - (a.sla ?? -1));
    const urgParts = Object.entries(URG).map(([k, u]) => ({ label: u.label, value: list.filter((o) => o.urgency === k).length, color: u.color }));
    const kpi = (l, v, cls = '') => `<div class="rep-kpi ${cls}"><small>${l}</small><b>${v}</b></div>`;
    const sel = (id, opts, cur) => `<select class="input" id="${id}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(cur) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    return `
      <div class="page-head">
        <div><h1>Relatórios</h1><p>Mapa de desempenho por cliente, técnico, status e urgência.</p></div>
        <div class="actions"><button class="btn btn-ghost" id="repCsv">${icon('download')}Exportar planilha</button><button class="btn btn-primary" id="repPdf">${icon('printer')}Exportar PDF</button></div>
      </div>
      <div class="card glass">
        <div class="card-head"><h3>Filtros</h3></div>
        <div class="tabs-inline rep-periods" style="margin-bottom:12px">${[['7', '7 dias'], ['30', '30 dias'], ['mes', 'Este mês'], ['ultimo', 'Último mês'], ['custom', 'Personalizado']].map(([k, l]) => `<button data-period="${k}" class="${f.period === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="rep-filters">
          ${f.period === 'custom' ? `<div class="field"><label for="repFrom">De</label><input class="input" type="date" id="repFrom" value="${f.from}"></div><div class="field"><label for="repTo">Até</label><input class="input" type="date" id="repTo" value="${f.to}"></div>` : ''}
          <div class="field"><label for="repCli">Cliente</label>${sel('repCli', [['', 'Todos'], ...D().clients.map((c) => [c.id, c.name])], f.client)}</div>
          <div class="field"><label for="repTech">Técnico</label>${sel('repTech', [['', 'Todos'], ['-', 'Sem técnico'], ...D().techs.map((t) => [t, t])], f.tech)}</div>
          <div class="field"><label for="repSt">Status</label>${sel('repSt', [['', 'Todos'], ...Object.entries(STATUS).map(([k, s]) => [k, s.label])], f.status)}</div>
          <div class="field"><label for="repUrg">Urgência</label>${sel('repUrg', [['', 'Todas'], ...Object.entries(URG).map(([k, u]) => [k, u.label])], f.urg)}</div>
        </div>
        <div class="row-between" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn btn-ghost" id="repClear">Limpar</button><button class="btn btn-primary" id="repApply">Aplicar filtros</button></div>
      </div>

      <div id="repArea" class="grid">
        <div class="card glass">
          <div class="card-head"><div><h3>Relatório de atendimentos</h3><p>Período: ${label}${f.client ? ' · ' + esc(client(+f.client).name) : ''}${f.tech ? ' · ' + esc(f.tech === '-' ? 'Sem técnico' : f.tech) : ''} · gerado em ${fmtDT(new Date().toISOString())}</p></div></div>
          <div class="rep-kpis">
            ${kpi('Total', list.length)}${kpi('Abertas', by('aberto'))}${kpi('Em atendimento', by('atendimento'))}${kpi('Aguard. cliente', by('aguardando'))}${kpi('Fechadas', closed.length)}
            ${kpi('Resolvidas', by('resolvido'))}${kpi('Finalizadas', by('finalizada'))}${kpi('Canceladas', by('cancelado'))}${kpi('SLA (%)', done.length ? sla + '%' : '—', sla >= 80 ? 'good' : sla >= 60 ? 'mid' : done.length ? 'bad' : '')}
          </div>
        </div>
        <div class="grid g-3">
          <section class="card glass"><div class="card-head"><div><h3>OS por status</h3><p>Distribuição do volume por status</p></div></div>${hbars(Object.entries(STATUS).map(([k, s]) => [s.label, by(k)]), { color: (l) => Object.values(STATUS).find((s) => s.label === l).color })}</section>
          <section class="card glass"><div class="card-head"><div><h3>OS por urgência</h3><p>Distribuição do volume por urgência</p></div></div>
            <div class="donut-wrap">${donut(urgParts)}<div class="donut-legend">${urgParts.map((p) => `<div><i style="background:${p.color}"></i>${p.label}<b>${p.value}</b></div>`).join('')}</div></div></section>
          <section class="card glass"><div class="card-head"><div><h3>Atendimentos por técnico</h3><p>Participação por técnico</p></div></div>${hbars(Object.entries(countBy(list, (o) => o.tech || 'Sem técnico')))}</section>
        </div>
        <div class="grid g-4">
          <div class="rep-kpi big"><small>Tempo médio de atendimento</small><b>${fmtH(avg(attend))} h</b><span class="hint">Entre iniciar e finalizar</span></div>
          <div class="rep-kpi big"><small>Mediana de atendimento</small><b>${fmtH(median(attend))} h</b></div>
          <div class="rep-kpi big"><small>Tempo médio na fila</small><b>${fmtH(avg(queue))} h</b><span class="hint">Da abertura ao fechamento (ou até agora)</span></div>
          <div class="rep-kpi big"><small>Fechadas no prazo</small><b>${inSla.length} de ${done.length}</b></div>
        </div>
        <p class="section-title" style="margin:8px 4px 0">Rankings · clientes</p>
        <div class="grid g-3">
          <section class="card glass"><div class="card-head"><div><h3>TOP clientes (total)</h3><p>Maior volume no período</p></div></div>${hbars(Object.entries(countBy(list, cname)))}</section>
          <section class="card glass"><div class="card-head"><div><h3>TOP clientes (fechadas)</h3><p>Mais OS fechadas</p></div></div>${hbars(Object.entries(countBy(closed, cname)), { color: '#34C759' })}</section>
          <section class="card glass"><div class="card-head"><div><h3>TOP clientes (críticas)</h3><p>Mais OS críticas</p></div></div>${hbars(Object.entries(countBy(list.filter((o) => o.urgency === 'critica'), cname)), { color: '#FF3B30' })}</section>
        </div>
        <p class="section-title" style="margin:8px 4px 0">Consumo e tempo</p>
        <div class="grid g-3">
          <section class="card glass"><div class="card-head"><div><h3>Itens mais consumidos (un.)</h3></div></div>${hbars(sumBy(mats, (i) => i.name, (i) => i.qty), { color: '#15C0D8' })}</section>
          <section class="card glass"><div class="card-head"><div><h3>Consumo por cliente (un.)</h3></div></div>${hbars(sumBy(mats, (i) => cname(i.o), (i) => i.qty), { color: '#15C0D8' })}</section>
          <section class="card glass"><div class="card-head"><div><h3>OS com maior consumo (un.)</h3></div></div>${hbars(sumBy(mats, (i) => 'OS ' + osCode(i.o, true), (i) => i.qty), { color: '#15C0D8' })}</section>
          <section class="card glass"><div class="card-head"><div><h3>Tempo médio por técnico (h)</h3></div></div>${hbars(avgBy(done.filter((o) => o.tech), (o) => o.tech, (o) => (o.timeSpent || 0) / 60), { fmt: fmtH })}</section>
          <section class="card glass"><div class="card-head"><div><h3>Tempo médio por cliente (h)</h3></div></div>${hbars(avgBy(done, cname, (o) => (o.timeSpent || 0) / 60), { fmt: fmtH })}</section>
          <section class="card glass"><div class="card-head"><div><h3>Tempo médio por tipo (h)</h3></div></div>${hbars(avgBy(done, (o) => o.type, (o) => (o.timeSpent || 0) / 60), { fmt: fmtH })}</section>
        </div>
        <section class="card glass">
          <div class="card-head"><div><h3>Ranking de eficiência</h3><p>Técnicos por OS fechadas e cumprimento do SLA</p></div></div>
          ${ranking.length ? `<div class="table-wrap"><table class="t" style="min-width:520px"><thead><tr><th class="nosort">#</th><th class="nosort">Técnico</th><th class="nosort">OS no período</th><th class="nosort">Fechadas</th><th class="nosort">No prazo (SLA)</th><th class="nosort">Tempo médio</th></tr></thead><tbody>
            ${ranking.map((r, i) => `<tr style="cursor:default"><td><b>${i + 1}.</b></td><td><div class="who">${avatar(r.t)}${esc(r.t)}</div></td><td>${r.total}</td><td>${r.closed}</td><td>${r.sla == null ? '<span class="muted">—</span>' : `<span class="badge ${r.sla >= 80 ? 'b-ok' : r.sla >= 60 ? 'b-warn' : 'b-danger'}">${r.sla}%</span>`}</td><td>${r.closed ? fmtH(r.avgH) + ' h' : '<span class="muted">—</span>'}</td></tr>`).join('')}
          </tbody></table></div>` : '<p class="muted" style="margin:0">Sem técnicos no período.</p>'}
        </section>
        ${f.client ? '' : '<p class="hint" style="margin:0 4px">Dica: selecione um cliente no filtro para ver o resumo completo dele, com status e técnicos que atenderam.</p>'}
      </div>`;
  },
  mount() {
    const f = REP_STATE;
    $$('[data-period]').forEach((b) => (b.onclick = () => { f.period = b.dataset.period; router(); }));
    $('#repApply').onclick = () => {
      Object.assign(f, { client: $('#repCli').value, tech: $('#repTech').value, status: $('#repSt').value, urg: $('#repUrg').value });
      if (f.period === 'custom') Object.assign(f, { from: $('#repFrom').value, to: $('#repTo').value });
      router();
    };
    $('#repClear').onclick = () => { Object.assign(f, REP_DEFAULT()); router(); };
    $('#repPdf').onclick = () => {
      const pa = $('#printArea');
      pa.hidden = false;
      pa.innerHTML = `<div class="print-report"><h2 style="margin:0 0 4px">Sumos · Relatório de atendimentos</h2>${$('#repArea').innerHTML}</div>`;
      window.print();
      setTimeout(() => (pa.hidden = true), 500);
    };
    $('#repCsv').onclick = () => exportCsv(repData(f).list);
  },
};
