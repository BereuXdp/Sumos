/* =========================================================
   Gestão de RMA — controle de entrada e saída de equipamentos
   Mesmo modelo do sistema antigo: equipamento do cliente, status,
   acompanhamento da manutenção (fornecedora/local), orçamento,
   decisão do cliente e resolução/devolução.
   ========================================================= */
const RMA_STATUS = {
  recebido: { label: 'Recebido', color: '#007AFF' },
  analise: { label: 'Em análise', color: '#0ea5e9' },
  pecas: { label: 'Aguardando peças', color: '#FF9500' },
  reparado: { label: 'Reparado', color: '#34C759' },
  entregue: { label: 'Entregue', color: '#6E6E73' },
  descartado: { label: 'Descartado', color: '#AAAAAA' },
};
const RMA_MAINT = {
  aguardando_envio: 'Aguardando envio',
  enviado: 'Enviado para manutenção',
  aguardando_retorno: 'Aguardando retorno',
  orcamento: 'Orçamento recebido',
  aguardando_cliente: 'Aguardando cliente',
  aprovado: 'Aprovado',
  em_reparo: 'Em reparo',
  sem_reparo: 'Sem reparo',
  pronto: 'Pronto para devolver',
  devolvido: 'Devolvido',
};
const MAINT_FLOW = ['aguardando_envio', 'enviado', 'aguardando_retorno', 'orcamento', 'aguardando_cliente', 'aprovado', 'em_reparo', 'pronto', 'devolvido'];
const RMA_DECISION = { '': 'Ainda não informado', aprovado: 'Aprovado', nao_autorizado: 'Não autorizado' };
const OUTSIDE = ['enviado', 'aguardando_retorno', 'orcamento', 'aguardando_cliente', 'aprovado', 'em_reparo'];

const rmaOpen = (r) => !['entregue', 'descartado'].includes(r.status);
const rmaSupplier = (r) => r.supplier || r.supplierManual || '';
const rmaWhere = (r) => (OUTSIDE.includes(r.maint) ? rmaSupplier(r) || r.place || 'Fornecedora não informada' : r.place || 'Na empresa');
const rmaCode = (r) => '#' + ((r.id * 2246822519) >>> 0).toString(16).slice(0, 6);
const RMA_TILES = {
  aberto: { label: 'Em aberto', icon: 'box', fn: rmaOpen },
  fornecedora: { label: 'Com fornecedora', icon: 'building', fn: (r) => rmaOpen(r) && !!rmaSupplier(r) && OUTSIDE.includes(r.maint) },
  cliente: { label: 'Aguardando cliente', icon: 'alert', fn: (r) => rmaOpen(r) && ['orcamento', 'aguardando_cliente'].includes(r.maint) && !r.decision },
  devolver: { label: 'Prontos para devolver', icon: 'check', fn: (r) => rmaOpen(r) && (r.maint === 'pronto' || r.status === 'reparado') },
  semforn: { label: 'Sem fornecedora', icon: 'wrench', fn: (r) => rmaOpen(r) && !rmaSupplier(r) },
};
// Usados no Dashboard e em Fornecedores
const rmaStuck = () => D().rma.filter((r) => rmaOpen(r) && ['enviado', 'aguardando_retorno'].includes(r.maint) && r.maintEntryAt && Date.now() - new Date(r.maintEntryAt) > 7 * 864e5);
const rmaOutside = () => D().rma.filter((r) => rmaOpen(r) && OUTSIDE.includes(r.maint));

(function ensureRma() {
  const d = DB.data;
  if (Array.isArray(d.rma) && (!d.rma.length || 'equipment' in d.rma[0])) return;
  const day = (n, h = 10) => { const x = new Date(Date.now() + n * 864e5); x.setHours(h, 0, 0, 0); return x.toISOString(); };
  const base = { serial: '', notes: '', supplier: '', supplierManual: '', place: '', osPickup: '', osCompany: '', maintEntryAt: '', feedbackAt: '', estimate: 0, decision: '', decisionAt: '', exitAt: '', resolvedAt: '', osResolution: '', diagnosis: '', resolutionNote: '' };
  d.rma = [
    { ...base, clientId: 5, status: 'analise', equipment: 'DVR 16 canais Intelbras', serial: 'DVR16-88213', defect: 'Não grava e reinicia sozinho', entryAt: day(-12), maint: 'aguardando_retorno', supplier: 'B7 Soluções', maintEntryAt: day(-10), osPickup: 'OS #a1b2' },
    { ...base, clientId: 4, status: 'pecas', equipment: 'Impressora térmica de cozinha', serial: 'TM-T20X-5512', defect: 'LED de erro aceso, não imprime comanda', entryAt: day(-6), maint: 'orcamento', supplier: 'B7 Soluções', maintEntryAt: day(-5), feedbackAt: day(-1), estimate: 380 },
    { ...base, clientId: 6, status: 'recebido', equipment: 'Switch 24 portas', serial: 'SW24-00921', defect: 'Portas 1 a 8 sem link', entryAt: day(-2), maint: 'aguardando_envio' },
    { ...base, clientId: 3, status: 'reparado', equipment: 'Notebook Dell Latitude', serial: 'DL5420-7HX', defect: 'Tela piscando', entryAt: day(-15), maint: 'pronto', supplierManual: 'Assistência Dell autorizada', maintEntryAt: day(-13), feedbackAt: day(-9), estimate: 650, decision: 'aprovado', decisionAt: day(-8), diagnosis: 'Flat da tela substituído' },
    { ...base, clientId: 9, status: 'analise', equipment: 'Nobreak 1500VA', serial: 'NB15-3301', defect: 'Bateria não segura carga', entryAt: day(-4), maint: 'em_reparo', place: 'Bancada interna', maintEntryAt: day(-3) },
    { ...base, clientId: 1, status: 'entregue', equipment: 'Roteador', serial: 'RT-77810', defect: 'Não liga', entryAt: day(-30), maint: 'devolvido', supplier: 'B7 Soluções', maintEntryAt: day(-28), feedbackAt: day(-24), decision: 'aprovado', decisionAt: day(-23), resolvedAt: day(-18), exitAt: day(-18), diagnosis: 'Fonte trocada em garantia' },
  ].map((r, i) => ({ id: i + 1, history: [{ at: r.entryAt, text: 'Equipamento recebido' }], ...r }));
  d.nextId.rma = d.rma.length + 1;
  DB.save();
})();

const RMA_STATE = { q: '', tile: 'aberto', resolved: false };
PAGES.rma = {
  render() {
    const all = D().rma;
    const base = all.filter((r) => RMA_STATE.resolved || rmaOpen(r));
    const groups = {};
    base.filter(rmaOpen).forEach((r) => (groups[rmaWhere(r)] = (groups[rmaWhere(r)] || 0) + 1));
    const max = Math.max(1, ...Object.values(groups));
    return `
      <div class="page-head">
        <div><h1>Gestão de RMA <span class="badge b-muted" style="vertical-align:6px">${all.filter(rmaOpen).length} em aberto</span></h1><p>Controle de entrada e saída de equipamentos.</p></div>
        <div class="actions">
          <label class="check"><span class="switch"><input type="checkbox" id="rmaResolved" ${RMA_STATE.resolved ? 'checked' : ''}><span></span></span>Mostrar resolvidas</label>
          <button class="btn btn-primary" onclick="openRma()"><span data-icon="plus"></span>Novo RMA</button>
        </div>
      </div>
      <div class="rma-tiles">${Object.entries(RMA_TILES).map(([k, t]) => `<button class="os-kpi glass ${RMA_STATE.tile === k ? 'on' : ''}" data-tile="${k}"><small>${icon(t.icon)} ${t.label}</small><b>${all.filter(t.fn).length}</b><span class="hint">Clique para filtrar</span></button>`).join('')}</div>
      <div class="grid g-main">
        <div class="card glass">
          <div class="toolbar"><div class="input-wrap" style="max-width:none">${icon('search')}<input class="input" id="rmaSearch" placeholder="Buscar cliente, equipamento, série, fornecedora, OS ou defeito..." value="${esc(RMA_STATE.q)}"></div></div>
          <div id="rmaBody"></div>
        </div>
        <div class="grid" style="align-content:start">
          <div class="card glass">
            <div class="card-head"><div><h3>Onde estão os equipamentos?</h3><p>Equipamentos em aberto por fornecedora ou local</p></div></div>
            ${Object.keys(groups).length ? `<div class="hbars">${Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="hbar"><span>${esc(k)}</span><div><i style="width:${(n / max) * 100}%"></i></div><b>${n}</b></div>`).join('')}</div>` : '<p class="muted" style="margin:0">Nenhum registro para exibir.</p>'}
          </div>
          <div class="card glass">
            <div class="card-head"><h3>Legenda rápida</h3></div>
            <div class="list" style="font-size:13px">
              <div class="list-item">${icon('building')}<div class="meta">Fornecedora = equipamento fora da empresa</div></div>
              <div class="list-item">${icon('pin')}<div class="meta">Local = unidade da manutenção</div></div>
              <div class="list-item">${icon('clock')}<div class="meta">Aguardando cliente ou retorno da fornecedora</div></div>
            </div>
          </div>
        </div>
      </div>`;
  },
  mount() {
    $('#rmaSearch').oninput = (e) => { RMA_STATE.q = e.target.value; this.body(); };
    $('#rmaResolved').onchange = (e) => { RMA_STATE.resolved = e.target.checked; router(); };
    $$('[data-tile]').forEach((b) => (b.onclick = () => { RMA_STATE.tile = RMA_STATE.tile === b.dataset.tile ? 'aberto' : b.dataset.tile; router(); }));
    this.body();
  },
  body() {
    const q = RMA_STATE.q.trim().toLowerCase();
    const tileFn = RMA_STATE.resolved && RMA_STATE.tile === 'aberto' ? () => true : RMA_TILES[RMA_STATE.tile].fn;
    const list = D().rma.filter((r) => tileFn(r) && (RMA_STATE.resolved || rmaOpen(r)) &&
      [rmaCode(r), client(r.clientId).name, r.equipment, r.serial, rmaSupplier(r), r.place, r.osPickup, r.osCompany, r.osResolution, r.defect].join(' ').toLowerCase().includes(q))
      .sort((a, b) => (rmaOpen(a) ? 0 : 1) - (rmaOpen(b) ? 0 : 1) || new Date(a.entryAt) - new Date(b.entryAt));
    $('#rmaBody').innerHTML = list.length ? `<div class="table-wrap"><table class="t">
      <thead><tr><th class="nosort">ID</th><th class="nosort">Status / manutenção</th><th class="nosort">Cliente</th><th class="nosort">Equipamento</th><th class="nosort">Defeito / onde está</th><th class="nosort">Datas</th><th class="nosort">Ações</th></tr></thead>
      <tbody>${list.map((r) => {
        const days = Math.floor((Date.now() - new Date(r.entryAt)) / 864e5);
        const nextIdx = MAINT_FLOW.indexOf(r.maint) + 1;
        return `<tr data-id="${r.id}">
          <td><b class="mono">${rmaCode(r)}</b></td>
          <td><span class="pill-solid" style="--c:${RMA_STATUS[r.status].color}">${RMA_STATUS[r.status].label}</span><small>${RMA_MAINT[r.maint]}</small></td>
          <td>${esc(client(r.clientId).name)}</td>
          <td><b>${esc(r.equipment)}</b><small>${r.serial ? 'Série ' + esc(r.serial) : ''}</small></td>
          <td><span class="clip">${esc(r.defect)}</span><small>${icon(OUTSIDE.includes(r.maint) ? 'building' : 'pin')} ${esc(rmaWhere(r))}</small></td>
          <td>Entrada ${fmtDate(r.entryAt)}<small>${r.exitAt ? 'Saída ' + fmtDate(r.exitAt) : `${days} dia${days === 1 ? '' : 's'} com a gente`}${r.feedbackAt ? ' · orçamento ' + fmtDate(r.feedbackAt) : ''}</small></td>
          <td><span class="inline-actions"><button class="more" data-edit="${r.id}" title="Editar">${icon('edit')}</button>${rmaOpen(r) && nextIdx > 0 && nextIdx < MAINT_FLOW.length ? `<button class="more" data-next="${r.id}" title="Avançar para: ${RMA_MAINT[MAINT_FLOW[nextIdx]]}">${icon('chevR')}</button>` : ''}</span></td>
        </tr>`;
      }).join('')}</tbody></table></div>` : `<div class="empty-state">${icon('repeat')}<div>Nenhum registro encontrado.</div></div>`;
    $$('#rmaBody tbody tr').forEach((tr) => (tr.onclick = (e) => { if (!e.target.closest('button')) openRma(+tr.dataset.id); }));
    $$('#rmaBody [data-edit]').forEach((b) => (b.onclick = () => openRma(+b.dataset.edit)));
    $$('#rmaBody [data-next]').forEach((b) => (b.onclick = () => {
      const r = D().rma.find((x) => x.id === +b.dataset.next);
      r.maint = MAINT_FLOW[MAINT_FLOW.indexOf(r.maint) + 1];
      const now = new Date().toISOString();
      if (r.maint === 'enviado' && !r.maintEntryAt) r.maintEntryAt = now;
      if (r.maint === 'orcamento' && !r.feedbackAt) r.feedbackAt = now;
      if (r.maint === 'pronto' && !['entregue', 'descartado'].includes(r.status)) r.status = 'reparado';
      if (r.maint === 'devolvido') { r.status = 'entregue'; r.exitAt = r.exitAt || now; r.resolvedAt = r.resolvedAt || now; }
      r.history.push({ at: now, text: 'Manutenção: ' + RMA_MAINT[r.maint] });
      DB.save(); router(); toast(`${rmaCode(r)} → ${RMA_MAINT[r.maint]}`, 'repeat');
    }));
  },
};

// Novo RMA / editar (campos do formulário do sistema real)
function openRma(id) {
  const r = id ? D().rma.find((x) => x.id === id) : null;
  const v = r || { status: 'recebido', maint: 'aguardando_envio', decision: '', entryAt: new Date().toISOString() };
  const dt = (k) => (v[k] ? v[k].slice(0, 10) : '');
  const sel = (id2, map, cur) => `<select class="input" id="${id2}">${Object.entries(map).map(([k, l]) => `<option value="${k}" ${String(cur ?? '') === k ? 'selected' : ''}>${typeof l === 'string' ? l : l.label}</option>`).join('')}</select>`;
  const f = (k, label, html, full) => `<div class="field ${full ? 'full' : ''}"><label for="r_${k}">${label}</label>${html}</div>`;
  const inp = (k, type = 'text', ph = '') => `<input class="input" id="r_${k}" type="${type}" value="${type === 'date' ? dt(k) : esc(v[k] ?? '')}" placeholder="${ph}">`;
  openDrawer(`
    ${drawerHead(r ? 'RMA ' + rmaCode(r) : 'Novo RMA', r ? esc(client(r.clientId).name) + ' · ' + esc(r.equipment) : '')}
    <form class="drawer-body" id="rmaForm">
      <div class="form-grid">
        ${f('clientId', 'Cliente', `<select class="input" id="r_clientId" required><option value="">Selecione o cliente</option>${D().clients.map((c) => `<option value="${c.id}" ${+v.clientId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`, true)}
        ${f('status', 'Status', sel('r_status', RMA_STATUS, v.status))}
        ${f('serial', 'Número de série', inp('serial'))}
        ${f('equipment', 'Equipamento', inp('equipment', 'text', 'Ex.: Impressora térmica, switch, DVR'), true)}
        ${f('defect', 'Defeito relatado', `<textarea class="input" id="r_defect" rows="3">${esc(v.defect || '')}</textarea>`, true)}
      </div>
      <p class="section-title">Datas e prazos</p>
      <div class="form-grid">
        ${f('entryAt', 'Data de entrada', inp('entryAt', 'date'))}
        ${f('exitAt', 'Data de saída', inp('exitAt', 'date'))}
        ${f('notes', 'Observações', `<textarea class="input" id="r_notes" rows="2">${esc(v.notes || '')}</textarea>`, true)}
      </div>
      <p class="section-title">Acompanhamento da manutenção</p>
      <div class="form-grid">
        ${f('maint', 'Situação da manutenção', sel('r_maint', RMA_MAINT, v.maint), true)}
        ${f('supplier', 'Fornecedor cadastrado', `<select class="input" id="r_supplier"><option value="">Nenhum fornecedor</option>${(D().fornecedores || []).map((s) => `<option ${v.supplier === s.name ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>`)}
        ${f('supplierManual', 'Nome da empresa (manual)', inp('supplierManual'))}
        ${f('place', 'Local da manutenção', inp('place', 'text', 'Ex.: Bancada interna'))}
        ${f('osPickup', 'OS interna de retirada', inp('osPickup', 'text', 'Ex.: OS #a1b2'))}
        ${f('osCompany', 'OS da empresa responsável', inp('osCompany'))}
        ${f('maintEntryAt', 'Entrada na manutenção', inp('maintEntryAt', 'date'))}
        ${f('feedbackAt', 'Data do feedback / orçamento', inp('feedbackAt', 'date'))}
        ${f('estimate', 'Valor estimado (R$)', inp('estimate', 'number'))}
        ${f('decision', 'Decisão do cliente', sel('r_decision', RMA_DECISION, v.decision))}
        ${f('decisionAt', 'Data da decisão', inp('decisionAt', 'date'))}
        ${f('resolvedAt', 'Data da resolução / devolução', inp('resolvedAt', 'date'))}
        ${f('osResolution', 'OS de resolução / devolução', inp('osResolution'))}
        ${f('diagnosis', 'Diagnóstico / solução', `<textarea class="input" id="r_diagnosis" rows="2">${esc(v.diagnosis || '')}</textarea>`, true)}
        ${f('resolutionNote', 'Observação da resolução', `<textarea class="input" id="r_resolutionNote" rows="2">${esc(v.resolutionNote || '')}</textarea>`, true)}
      </div>
      ${r ? `<div><p class="section-title">Histórico</p><div class="history">${[...r.history].reverse().map((h) => `<div>${esc(h.text)}<small>${fmtDT(h.at)}</small></div>`).join('')}</div></div>` : ''}
    </form>
    <div class="drawer-foot">${r ? `<button class="btn btn-ghost btn-sm" id="rmaLabel">${icon('printer')}Imprimir etiqueta</button>` : ''}${r ? `<button class="btn btn-ghost btn-sm" id="rmaDel" style="margin-right:auto;color:var(--danger)">${icon('trash')}Excluir</button>` : ''}<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit" form="rmaForm">${icon('check')}Salvar</button></div>`, { focus: !r });
  $('#rmaForm').onsubmit = (e) => {
    e.preventDefault();
    const keys = ['status', 'serial', 'equipment', 'defect', 'notes', 'maint', 'supplier', 'supplierManual', 'place', 'osPickup', 'osCompany', 'estimate', 'decision', 'osResolution', 'diagnosis', 'resolutionNote'];
    const dates = ['entryAt', 'exitAt', 'maintEntryAt', 'feedbackAt', 'decisionAt', 'resolvedAt'];
    const data = { clientId: +$('#r_clientId').value };
    keys.forEach((k) => (data[k] = $('#r_' + k).value.trim()));
    data.estimate = +data.estimate || 0;
    dates.forEach((k) => (data[k] = $('#r_' + k).value ? new Date($('#r_' + k).value + 'T12:00').toISOString() : ''));
    if (!data.clientId || !data.equipment) { (!data.clientId ? $('#r_clientId') : $('#r_equipment')).classList.add('invalid'); return; }
    if (r) {
      if (r.maint !== data.maint) r.history.push({ at: new Date().toISOString(), text: 'Manutenção: ' + RMA_MAINT[data.maint] });
      if (r.status !== data.status) r.history.push({ at: new Date().toISOString(), text: 'Status: ' + RMA_STATUS[data.status].label });
      Object.assign(r, data);
    } else {
      D().rma.push({ id: D().nextId.rma++, ...data, entryAt: data.entryAt || new Date().toISOString(), history: [{ at: new Date().toISOString(), text: 'Equipamento recebido' }] });
    }
    closeDrawer(); refresh(); toast(r ? 'RMA atualizado' : 'RMA registrado', 'repeat');
  };
  const lb = $('#rmaLabel');
  if (lb) lb.onclick = () => printRmaLabel(r);
  const del = $('#rmaDel');
  if (del) del.onclick = () => { if (confirm('Excluir este RMA?')) { D().rma = D().rma.filter((x) => x !== r); closeDrawer(); refresh(); toast('RMA excluído', 'trash'); } };
}
