/* =========================================================
   Módulos de cadastro: Projetos, Pendências, Melhorias, RMA,
   Contatos, Fornecedores, Produtos, Solicitações de compra,
   Acessos e Conhecimento.
   Cada página é descrita por uma config e montada por
   collectionPage() — lista/cartões, busca, abas e ficha.
   ========================================================= */

/* ---------- Dados de exemplo (criados só se ainda não existirem) ---------- */
function daysFromNow(n, h = 12) {
  const x = new Date(Date.now() + n * 864e5);
  x.setHours(h, 0, 0, 0);
  return x.toISOString();
}
const MODULE_SEEDS = {
  projetos: () => [
    { name: 'Rede da Clínica Vida', client: 'Clínica Vida', resp: 'Rafael', status: 'andamento', progress: 65, start: daysFromNow(-20), due: daysFromNow(8), desc: 'Cabeamento estruturado, 2 access points e firewall.' },
    { name: 'Upgrade dos PCs do escritório', client: 'Contábil Souza', resp: 'Diego', status: 'andamento', progress: 40, start: daysFromNow(-10), due: daysFromNow(12), desc: 'Troca de 8 HDs por SSD e formatação.' },
    { name: 'Câmeras da loja centro', client: 'Mercado Bom Preço', resp: 'Juliana', status: 'planejamento', progress: 10, start: daysFromNow(3), due: daysFromNow(25), desc: 'Instalação de 6 câmeras IP e DVR.' },
    { name: 'Contrato de manutenção mensal', client: 'Escola Aprender', resp: 'Marina', status: 'pausado', progress: 30, start: daysFromNow(-45), due: daysFromNow(15), desc: 'Visitas quinzenais nos laboratórios.' },
    { name: 'Migração de servidor', client: 'Advocacia Lima', resp: 'Rafael', status: 'concluido', progress: 100, start: daysFromNow(-60), due: daysFromNow(-5), desc: 'Servidor local para nuvem com backup.' },
  ],
  pendencias: () => [
    { title: 'Ligar para fornecedor sobre tela do S22', desc: 'Peça chegou com pixel morto', prio: 'alta', status: 'aberta', due: daysFromNow(0), ref: 'OS #2634', resp: 'Rafael' },
    { title: 'Conferir garantia do MacBook Air', desc: 'Ver se ainda está na garantia Apple', prio: 'media', status: 'aberta', due: daysFromNow(1), ref: 'OS #2633', resp: 'Juliana' },
    { title: 'Renovar certificado digital', desc: '', prio: 'alta', status: 'aberta', due: daysFromNow(-1), ref: '', resp: 'Marina' },
    { title: 'Organizar bancada 2', desc: 'Separar sucata para descarte', prio: 'baixa', status: 'resolvida', due: daysFromNow(-3), ref: '', resp: 'Diego' },
  ],
  melhorias: () => [
    { title: 'Etiqueta com QR Code em cada aparelho', desc: 'Facilita achar a OS na prateleira só apontando o celular.', area: 'Oficina', impact: 'alto', status: 'planejada', votes: 7 },
    { title: 'Checklist com fotos na entrada', desc: 'Tirar fotos do aparelho ao receber para evitar discussão sobre riscos.', area: 'Atendimento', impact: 'alto', status: 'andamento', votes: 5 },
    { title: 'Kit de ferramentas por bancada', desc: 'Cada técnico com seu kit para não perder tempo procurando.', area: 'Oficina', impact: 'medio', status: 'feita', votes: 4 },
    { title: 'Relatório semanal automático', desc: 'Resumo de OS, faturamento e atrasos toda segunda.', area: 'Sistema', impact: 'medio', status: 'ideia', votes: 3 },
    { title: 'Aceitar Pix por QR na entrega', desc: '', area: 'Financeiro', impact: 'baixo', status: 'ideia', votes: 2 },
  ],
  contatos: () => [
    { name: 'Carlos Mendes', company: 'B7 Soluções', role: 'Vendedor', phone: '(85) 98888-1111', email: 'carlos@b7exemplo.com.br', type: 'Fornecedor', notes: 'Atende até 18h, frete grátis acima de R$ 500.' },
    { name: 'Fernanda Rocha', company: 'DTS Segurança Eletrônica', role: 'Pós-venda', phone: '(85) 97777-2222', email: 'fernanda@dtsexemplo.com.br', type: 'Fornecedor', notes: 'Responsável pelos RMA.' },
    { name: 'Lucas Prado', company: 'Autônomo', role: 'Técnico em microsoldagem', phone: '(85) 96666-3333', email: 'lucas.prado@email.com', type: 'Parceiro', notes: 'Terceirizamos reparos de placa.' },
    { name: 'Beatriz Alves', company: 'Contábil Souza', role: 'Contadora', phone: '(85) 95555-4444', email: 'beatriz@contabilsouza.com.br', type: 'Outro', notes: '' },
  ],
  fornecedores: () => [
    { name: 'B7 Soluções', cnpj: '12.345.678/0001-90', category: 'Manutenção e assistência técnica', contact: 'Carlos Mendes', phone: '(85) 98888-1111', email: 'contato@b7exemplo.com.br', site: '', lead: 5, rating: 5, notes: 'Recebe a maior parte dos RMA.' },
    { name: 'DTS Segurança Eletrônica', cnpj: '23.456.789/0001-01', category: 'CFTV e segurança', contact: 'Fernanda Rocha', phone: '(85) 97777-2222', email: 'vendas@dtsexemplo.com.br', site: '', lead: 3, rating: 4, notes: '' },
    { name: 'Horus Distribuidora', cnpj: '34.567.890/0001-12', category: 'Informática e redes', contact: 'Paulo', phone: '(85) 3333-4444', email: 'atacado@horusexemplo.com.br', site: '', lead: 2, rating: 4, notes: '' },
    { name: 'Supri Nordeste', cnpj: '45.678.901/0001-23', category: 'Equipamentos de informática', contact: 'Rita', phone: '(85) 3222-1100', email: 'rita@supriexemplo.com.br', site: '', lead: 4, rating: 3, notes: '' },
  ],
  compras: () => [
    { item: 'Memória DDR4 16GB', qty: 4, supplier: 'Horus Distribuidora', reason: 'Estoque zerado', prio: 'alta', status: 'pendente', value: 760, requester: 'Diego', date: daysFromNow(0) },
    { item: 'Pasta térmica Arctic MX-4', qty: 6, supplier: 'Horus Distribuidora', reason: 'Abaixo do mínimo', prio: 'media', status: 'pendente', value: 210, requester: 'Marina', date: daysFromNow(-1) },
    { item: 'Switch 24 portas gigabit', qty: 1, supplier: 'B7 Soluções', reason: 'Reposição', prio: 'alta', status: 'aprovada', value: 1020, requester: 'Rafael', date: daysFromNow(-2) },
    { item: 'Ferro de solda Hikari', qty: 1, supplier: '', reason: 'Bancada 3 sem ferro', prio: 'baixa', status: 'comprada', value: 320, requester: 'Juliana', date: daysFromNow(-5) },
    { item: 'Álcool isopropílico 1L', qty: 3, supplier: 'Horus Distribuidora', reason: '', prio: 'baixa', status: 'recebida', value: 105, requester: 'Diego', date: daysFromNow(-9) },
    { item: 'Balun par (CFTV)', qty: 10, supplier: 'Supri Nordeste', reason: 'Zerado no estoque', prio: 'media', status: 'pendente', value: 180, requester: 'Rafael', date: daysFromNow(-1) },
  ],
  acessos: () => [
    { name: 'Portal TecParts', url: 'https://tecparts.com.br/login', user: 'loja@exemplo.com', password: 'Exemplo#2026', category: 'Fornecedor', notes: 'Pedidos e boletos.' },
    { name: 'Wi-Fi da loja', url: '', user: 'SUMOS_LOJA', password: 'wifi-exemplo-123', category: 'Rede', notes: 'Rede de clientes: SUMOS_VISITANTE' },
    { name: 'Roteador (admin)', url: 'http://192.168.0.1', user: 'admin', password: 'troque-esta-senha', category: 'Rede', notes: '' },
    { name: 'E-mail da loja', url: 'https://mail.exemplo.com', user: 'contato@exemplo.com', password: 'Senha-de-exemplo', category: 'E-mail', notes: '' },
  ],
  conhecimento: () => [
    { title: 'Como trocar tela de iPhone sem perder o True Tone', category: 'Tutorial', tags: 'iphone, tela', updatedAt: daysFromNow(-3),
      body: '1. Antes de desmontar, leia o número de série da tela original com o programador.\n2. Faça a troca normalmente, com cuidado com o flex do Face ID.\n3. Com a tela nova instalada, transfira os dados com o programador.\n4. Teste o True Tone em Ajustes > Tela e Brilho.\n\nDica: sem o programador, o True Tone some e o cliente costuma reclamar.' },
    { title: 'Procedimento de entrada de aparelho', category: 'Procedimento', tags: 'balcão, checklist', updatedAt: daysFromNow(-10),
      body: '• Ligar o aparelho na frente do cliente\n• Preencher o checklist (tela, carcaça, botões, câmera)\n• Pedir a senha ou o padrão de desbloqueio\n• Anotar acessórios deixados\n• Imprimir o comprovante e pedir assinatura' },
    { title: 'Notebook liga mas não dá vídeo', category: 'Diagnóstico', tags: 'notebook, placa', updatedAt: daysFromNow(-6),
      body: 'Ordem de testes:\n1. Testar com monitor externo (HDMI)\n2. Trocar ou reencaixar a memória RAM\n3. Fazer reset da BIOS (tirar a bateria CMOS)\n4. Verificar o flat da tela\n5. Se nada resolver: suspeita de chip de vídeo, orçar reparo de placa.' },
    { title: 'Política de garantia', category: 'Política', tags: 'garantia, atendimento', updatedAt: daysFromNow(-30),
      body: 'Serviços: 90 dias.\nPeças novas: 90 dias, exceto mau uso, queda ou contato com líquido.\nAparelhos com lacre rompido por terceiros perdem a garantia.' },
  ],
};
(function ensureModuleData() {
  const d = DB.data;
  let changed = false;
  Object.entries(MODULE_SEEDS).forEach(([k, seed]) => {
    if (!Array.isArray(d[k])) {
      // Responsáveis dos exemplos passam a ser técnicos da equipe real
      d[k] = seed().map((r, i) => {
        ['resp', 'requester'].forEach((f) => { if (r[f] && !d.techs.includes(r[f])) r[f] = d.techs[i % d.techs.length]; });
        return { id: i + 1, ...r };
      });
      d.nextId[k] = d[k].length + 1;
      changed = true;
    }
  });
  if (changed) DB.save();
})();

/* ---------- Helpers ---------- */
const MOD_STATE = {};
const opt = (map) => Object.entries(map).map(([value, [label]]) => ({ value, label }));
const pill = (map, v) => (map[v] ? `<span class="badge ${map[v][1]}">${map[v][0]}</span>` : '');
const lateDate = (iso, done) => iso && !done && new Date(iso) < new Date(new Date().toDateString());
const stars = (n) => `<span class="stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span>`;
function copyText(text, label = 'Copiado') {
  if (!navigator.clipboard) return toast('Não foi possível copiar', 'alert');
  navigator.clipboard.writeText(text).then(() => toast(label, 'copy'), () => toast('Não foi possível copiar', 'alert'));
}
const PRIO = { baixa: ['Baixa', 'b-muted'], media: ['Média', 'b-warn'], alta: ['Alta', 'b-danger'] };
const supplierNames = () => D().fornecedores.map((f) => f.name);

/* ---------- Página genérica de cadastro ---------- */
function collectionPage(cfg) {
  const st = (MOD_STATE[cfg.key] ||= { q: '', tab: cfg.tabs?.default || 'todas' });
  return {
    // embedded = mostrada dentro de outra página (ex.: aba Contatos em Clientes), sem o próprio cabeçalho
    render(p, s, embedded) {
      const all = D()[cfg.key];
      const tabs = cfg.tabs
        ? `<div class="status-tabs">${[['todas', 'Todas'], ...opt(cfg.tabs.map).map((o) => [o.value, o.label])].map(([k, l]) =>
            `<button data-tab="${k}" class="${st.tab === k ? 'on' : ''}">${l}<span>${k === 'todas' ? all.length : all.filter((r) => r[cfg.tabs.field] === k).length}</span></button>`).join('')}</div>`
        : '';
      return `
        ${embedded ? '' : `<div class="page-head">
          <div><h1>${cfg.title}</h1><p>${cfg.sub(all)}</p></div>
          <div class="actions">${cfg.extraActions || ''}<button class="btn btn-primary" data-new><span data-icon="plus"></span>${cfg.newLabel}</button></div>
        </div>`}
        ${cfg.kpis ? `<div class="grid g-3">${cfg.kpis(all)}</div>` : ''}
        <div class="card glass">
          ${cfg.notice ? `<div class="notice">${icon('alert')}${cfg.notice}</div>` : ''}
          ${tabs}
          <div class="toolbar"><div class="input-wrap">${icon('search')}<input class="input" data-q placeholder="${cfg.searchPh || 'Buscar...'}" value="${esc(st.q)}"></div></div>
          <div data-body></div>
        </div>`;
    },
    mount() {
      const nb = $('[data-new]');
      if (nb) nb.onclick = () => openRecord(cfg);
      $('[data-q]').oninput = (e) => { st.q = e.target.value; this.body(); };
      $$('.status-tabs button').forEach((b) => (b.onclick = () => {
        st.tab = b.dataset.tab;
        $$('.status-tabs button').forEach((x) => x.classList.toggle('on', x === b));
        this.body();
      }));
      cfg.mount && cfg.mount();
      this.body();
    },
    body() {
      const q = st.q.trim().toLowerCase();
      const searchable = cfg.fields.filter((f) => f.type !== 'secret').map((f) => f.k);
      let list = D()[cfg.key].filter((r) =>
        (st.tab === 'todas' || !cfg.tabs || r[cfg.tabs.field] === st.tab) &&
        searchable.map((k) => r[k]).join(' ').toLowerCase().includes(q));
      if (cfg.sort) list = [...list].sort(cfg.sort);
      const el = $('[data-body]');
      if (!list.length) {
        el.innerHTML = `<div class="empty-state">${icon(cfg.icon)}<div>${q || st.tab !== 'todas' ? 'Nada encontrado com esses filtros.' : 'Nenhum registro ainda.'}</div></div>`;
        return;
      }
      el.innerHTML = cfg.card
        ? `<div class="cards-grid">${list.map((r) => `<div class="rcard" data-id="${r.id}">${cfg.card(r)}</div>`).join('')}</div>`
        : `<div class="table-wrap"><table class="t">
            <thead><tr>${cfg.columns.map((c) => `<th class="nosort" ${c.right ? 'style="text-align:right"' : ''}>${c.label}</th>`).join('')}</tr></thead>
            <tbody>${list.map((r) => `<tr data-id="${r.id}">${cfg.columns.map((c) => `<td ${c.right ? 'style="text-align:right"' : ''}>${c.html(r)}</td>`).join('')}</tr>`).join('')}</tbody>
          </table></div>`;
      $$('[data-id]', el).forEach((row) => (row.onclick = (e) => {
        if (e.target.closest('[data-act], a')) return;
        const r = D()[cfg.key].find((x) => x.id === +row.dataset.id);
        (cfg.open || openRecord)(cfg, r);
      }));
      $$('[data-act]', el).forEach((b) => (b.onclick = (e) => {
        e.stopPropagation();
        const r = D()[cfg.key].find((x) => x.id === +b.dataset.id);
        cfg.actions[b.dataset.act](r, b);
      }));
    },
  };
}

// Empresas e filiais para o formulário de contato
const clientByName = (name) => D().clients.find((c) => c.name === name);
function companyOptions(cur) {
  const clients = D().clients.map((c) => c.name).sort((a, b) => a.localeCompare(b));
  const sups = (D().fornecedores || []).map((f) => f.name).sort((a, b) => a.localeCompare(b));
  const known = [...clients, ...sups];
  return [
    { value: '', label: 'Sem empresa' },
    ...clients.map((n) => ({ value: n, label: n, group: 'Clientes' })),
    ...sups.map((n) => ({ value: n, label: n, group: 'Fornecedores' })),
    ...(cur && !known.includes(cur) && cur !== '__outra' ? [{ value: cur, label: cur, group: 'Outras' }] : []),
    { value: '__outra', label: 'Outra (digitar)…', group: 'Outras' },
  ];
}
function branchOptions(company) {
  const cli = clientByName(company);
  const list = (cli && cli.filiais) || [];
  if (!cli) return [{ value: '', label: 'Só para clientes' }];
  return [{ value: '', label: list.length ? 'Todas / matriz' : 'Sem filiais (use o +)' }, ...list.map((b) => ({ value: b.name, label: b.name + (b.address ? ' · ' + b.address : '') }))];
}

// <option>s de um select; opções com `group` consecutivo viram <optgroup>
function selectOptions(options, v) {
  let html = '', group = null;
  options.forEach((o) => {
    const val = typeof o === 'string' ? o : o.value, lab = typeof o === 'string' ? o : o.label, g = typeof o === 'string' ? null : o.group || null;
    if (g !== group) { if (group) html += '</optgroup>'; if (g) html += `<optgroup label="${esc(g)}">`; group = g; }
    html += `<option value="${esc(val)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(lab)}</option>`;
  });
  return html + (group ? '</optgroup>' : '');
}

// Ficha de criação/edição gerada a partir de cfg.fields
function openRecord(cfg, rec) {
  const isNew = !rec;
  const r = rec || { ...(cfg.defaults ? cfg.defaults() : {}) };
  const input = (f) => {
    const v = r[f.k] ?? '';
    const id = 'f_' + f.k;
    if (f.type === 'select') {
      // options pode depender do registro aberto e trazer `group` (vira <optgroup>)
      const options = typeof f.options === 'function' ? f.options(r) : f.options;
      return `<select class="input" id="${id}">${f.allowEmpty ? '<option value="">—</option>' : ''}${selectOptions(options, v)}</select>`;
    }
    if (f.type === 'textarea') return `<textarea class="input" id="${id}" rows="${f.rows || 4}">${esc(v)}</textarea>`;
    if (f.type === 'date') return `<input class="input" type="date" id="${id}" value="${v ? v.slice(0, 10) : ''}">`;
    if (f.type === 'secret') return `<div class="input-wrap"><span data-icon="lock"></span><input class="input" type="password" id="${id}" value="${esc(v)}" autocomplete="new-password" style="padding-right:76px">
      <span class="suffix inline-actions"><button type="button" class="btn btn-icon btn-sm" data-reveal="${id}" style="background:transparent" aria-label="Mostrar">${icon('eye')}</button><button type="button" class="btn btn-icon btn-sm" data-copy="${id}" style="background:transparent" aria-label="Copiar">${icon('copy')}</button></span></div>`;
    return `<input class="input" type="${f.type || 'text'}" id="${id}" value="${esc(v)}" ${f.type === 'number' ? `min="${f.min ?? 0}" ${f.max != null ? `max="${f.max}"` : ''} step="${f.step || 1}"` : ''} ${f.required ? 'required' : ''} placeholder="${esc(f.ph || '')}">`;
  };
  openDrawer(`
    ${drawerHead(isNew ? cfg.newLabel : esc(r[cfg.titleField]), isNew ? '' : cfg.singular)}
    <form class="drawer-body" id="recForm">
      ${cfg.intro && !isNew ? cfg.intro(r) : ''}
      <div class="form-grid">${cfg.fields.map((f) => `<div class="field ${f.full ? 'full' : ''}"><label for="f_${f.k}">${f.label}</label>${input(f)}</div>`).join('')}</div>
    </form>
    <div class="drawer-foot">
      ${isNew ? '' : `<button class="btn btn-ghost btn-sm" id="recDel" style="margin-right:auto;color:var(--danger)">${icon('trash')}Excluir</button>`}
      <button class="btn btn-ghost" data-close>Cancelar</button>
      <button class="btn btn-primary" type="submit" form="recForm">${icon('check')}Salvar</button>
    </div>`, { focus: isNew });

  if (cfg.onOpen) cfg.onOpen(r, isNew);
  $$('[data-reveal]').forEach((b) => (b.onclick = () => { const i = $('#' + b.dataset.reveal); i.type = i.type === 'password' ? 'text' : 'password'; b.innerHTML = icon(i.type === 'password' ? 'eye' : 'eyeOff'); }));
  $$('[data-copy]').forEach((b) => (b.onclick = () => copyText($('#' + b.dataset.copy).value, 'Senha copiada')));
  $('#recForm').onsubmit = (e) => {
    e.preventDefault();
    const data = {};
    cfg.fields.forEach((f) => {
      let v = $('#f_' + f.k).value;
      if (f.type === 'number') v = v === '' ? 0 : +v;
      if (f.type === 'date') v = v ? new Date(v + 'T12:00').toISOString() : '';
      if (typeof v === 'string') v = v.trim();
      data[f.k] = v;
    });
    if (!data[cfg.titleField]) { $('#f_' + cfg.titleField).classList.add('invalid'); $('#f_' + cfg.titleField).focus(); return; }
    if (cfg.beforeSave) cfg.beforeSave(data, r);
    if (isNew) D()[cfg.key].push({ id: D().nextId[cfg.key]++, ...data });
    else Object.assign(rec, data);
    closeDrawer(); refresh();
    toast(isNew ? `Salvo em ${cfg.title}` : "Alterações salvas");
  };
  const del = $('#recDel');
  if (del) del.onclick = () => {
    if (!confirm(`Excluir “${r[cfg.titleField]}”? Isso não pode ser desfeito.`)) return;
    D()[cfg.key] = D()[cfg.key].filter((x) => x.id !== rec.id);
    closeDrawer(); refresh(); toast('Registro excluído', 'trash');
  };
}

/* =========================================================
   Configurações de cada página
   ========================================================= */
const PROJ_ST = { planejamento: ['Planejamento', 'b-muted'], andamento: ['Em andamento', 'b-brand'], pausado: ['Pausado', 'b-warn'], concluido: ['Concluído', 'b-ok'] };
const MELH_ST = { ideia: ['Ideia', 'b-muted'], planejada: ['Planejada', 'b-brand'], andamento: ['Em andamento', 'b-accent'], feita: ['Feita', 'b-ok'] };
const IMPACT = { baixo: ['Impacto baixo', 'b-muted'], medio: ['Impacto médio', 'b-warn'], alto: ['Impacto alto', 'b-danger'] };
const RMA_ST = { aberto: ['Aberto', 'b-muted'], enviado: ['Enviado', 'b-brand'], aprovado: ['Aprovado', 'b-accent'], creditado: ['Creditado', 'b-ok'], recusado: ['Recusado', 'b-danger'] };
const COMP_ST = { pendente: ['Pendente', 'b-warn'], aprovada: ['Aprovada', 'b-brand'], comprada: ['Comprada', 'b-accent'], recebida: ['Recebida', 'b-ok'], cancelada: ['Cancelada', 'b-muted'] };
const COMP_FLOW = ['pendente', 'aprovada', 'comprada', 'recebida'];

const MODULES = {
  projetos: {
    title: 'Projetos', singular: 'Projeto', newLabel: 'Novo projeto', icon: 'layout', titleField: 'name',
    sub: (l) => `${l.filter((p) => p.status === 'andamento').length} em andamento · ${l.length} no total`,
    searchPh: 'Buscar projeto ou cliente',
    tabs: { field: 'status', map: PROJ_ST },
    defaults: () => ({ status: 'planejamento', progress: 0, resp: D().techs[0], start: new Date().toISOString() }),
    sort: (a, b) => (a.due || '').localeCompare(b.due || ''),
    fields: [
      { k: 'name', label: 'Nome do projeto', full: true, required: true },
      { k: 'client', label: 'Cliente / empresa' },
      { k: 'resp', label: 'Responsável', type: 'select', options: () => D().techs },
      { k: 'status', label: 'Status', type: 'select', options: opt(PROJ_ST) },
      { k: 'progress', label: 'Progresso (%)', type: 'number', max: 100, step: 5 },
      { k: 'start', label: 'Início', type: 'date' },
      { k: 'due', label: 'Entrega', type: 'date' },
      { k: 'desc', label: 'Descrição / escopo', type: 'textarea', full: true },
    ],
    card: (p) => `
      <div class="row-between">${pill(PROJ_ST, p.status)}<small class="${lateDate(p.due, p.status === 'concluido') ? 'stock-low' : 'muted'}">${p.due ? icon('clock') + ' ' + fmtDate(p.due) : ''}</small></div>
      <h4>${esc(p.name)}</h4>
      <p>${esc(p.desc || p.client || '')}</p>
      <div><div class="row-between" style="font-size:12px;margin-bottom:6px"><span class="muted">Progresso</span><b>${p.progress}%</b></div><div class="progress"><i style="width:${p.progress}%"></i></div></div>
      <div class="r-foot"><span style="display:flex;gap:8px;align-items:center">${avatar(p.resp || '?')}${esc(p.resp || '')}</span><span>${esc(p.client || '')}</span></div>`,
  },

  pendencias: {
    title: 'Pendências', singular: 'Pendência', newLabel: 'Nova pendência', icon: 'alert', titleField: 'title',
    sub: (l) => { const o = l.filter((p) => p.status !== 'resolvida'); return `${o.length} em aberto · ${o.filter((p) => lateDate(p.due)).length} atrasadas`; },
    searchPh: 'Buscar pendência',
    tabs: { field: 'status', map: { aberta: ['Abertas'], resolvida: ['Resolvidas'] }, default: 'aberta' },
    defaults: () => ({ prio: 'media', status: 'aberta', resp: D().techs[0], due: new Date().toISOString() }),
    sort: (a, b) => (a.status === b.status ? ['alta', 'media', 'baixa'].indexOf(a.prio) - ['alta', 'media', 'baixa'].indexOf(b.prio) || (a.due || '').localeCompare(b.due || '') : a.status === 'aberta' ? -1 : 1),
    fields: [
      { k: 'title', label: 'O que precisa ser feito', full: true, required: true },
      { k: 'desc', label: 'Detalhes', type: 'textarea', full: true, rows: 3 },
      { k: 'prio', label: 'Prioridade', type: 'select', options: opt(PRIO) },
      { k: 'due', label: 'Prazo', type: 'date' },
      { k: 'resp', label: 'Responsável', type: 'select', options: () => D().techs },
      { k: 'ref', label: 'Referência (ex.: OS #2634)' },
      { k: 'status', label: 'Status', type: 'select', options: [{ value: 'aberta', label: 'Aberta' }, { value: 'resolvida', label: 'Resolvida' }] },
    ],
    columns: [
      { label: '', html: (p) => `<button class="more" data-act="toggle" data-id="${p.id}" title="${p.status === 'resolvida' ? 'Reabrir' : 'Marcar como resolvida'}" style="${p.status === 'resolvida' ? 'background:var(--ok);color:#fff;border-color:transparent' : ''}">${icon('check')}</button>` },
      { label: 'Pendência', html: (p) => `<b style="${p.status === 'resolvida' ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(p.title)}</b><small>${esc(p.desc || '')}</small>` },
      { label: 'Prioridade', html: (p) => pill(PRIO, p.prio) },
      { label: 'Prazo', html: (p) => (p.due ? `<span class="${lateDate(p.due, p.status === 'resolvida') ? 'stock-low' : ''}">${fmtDate(p.due)}${lateDate(p.due, p.status === 'resolvida') ? ' · atrasada' : ''}</span>` : '—') },
      { label: 'Referência', html: (p) => `<span class="muted">${esc(p.ref || '—')}</span>` },
      { label: 'Responsável', html: (p) => `<div class="who">${avatar(p.resp || '?')}${esc(p.resp || '')}</div>` },
    ],
    actions: {
      toggle: (p) => { p.status = p.status === 'resolvida' ? 'aberta' : 'resolvida'; DB.save(); router(); toast(p.status === 'resolvida' ? 'Pendência resolvida 🎉' : 'Pendência reaberta'); },
    },
  },

  melhorias: {
    title: 'Melhorias', singular: 'Melhoria', newLabel: 'Nova ideia', icon: 'trendUp', titleField: 'title',
    sub: (l) => `${l.length} ideias · ${l.filter((m) => m.status === 'feita').length} já implementadas`,
    searchPh: 'Buscar ideia',
    tabs: { field: 'status', map: MELH_ST },
    defaults: () => ({ status: 'ideia', impact: 'medio', area: 'Oficina', votes: 0 }),
    sort: (a, b) => b.votes - a.votes,
    fields: [
      { k: 'title', label: 'Ideia', full: true, required: true },
      { k: 'desc', label: 'Por que vale a pena?', type: 'textarea', full: true },
      { k: 'area', label: 'Área', type: 'select', options: ['Atendimento', 'Oficina', 'Sistema', 'Financeiro', 'Estoque'] },
      { k: 'impact', label: 'Impacto', type: 'select', options: opt(IMPACT) },
      { k: 'status', label: 'Status', type: 'select', options: opt(MELH_ST) },
      { k: 'votes', label: 'Votos', type: 'number' },
    ],
    card: (m) => `
      <div class="row-between">${pill(MELH_ST, m.status)}<span class="tag" style="margin:0">${esc(m.area)}</span></div>
      <h4>${esc(m.title)}</h4>
      <p>${esc(m.desc || '')}</p>
      <div class="r-foot">${pill(IMPACT, m.impact)}<button class="btn btn-soft btn-sm" data-act="vote" data-id="${m.id}">${icon('thumbUp')} ${m.votes}</button></div>`,
    actions: { vote: (m) => { m.votes++; DB.save(); router(); } },
  },

  contatos: {
    title: 'Contatos', singular: 'Contato', newLabel: 'Novo contato', icon: 'contact', titleField: 'name',
    sub: (l) => `${l.length} contatos de fornecedores, parceiros e outros`,
    searchPh: 'Buscar nome, empresa ou telefone',
    tabs: { field: 'type', map: { Cliente: ['Clientes'], Fornecedor: ['Fornecedores'], Parceiro: ['Parceiros'], 'Técnico': ['Técnicos'], Outro: ['Outros'] } },
    defaults: () => ({ type: 'Fornecedor' }),
    sort: (a, b) => a.name.localeCompare(b.name),
    fields: [
      { k: 'name', label: 'Nome', full: true, required: true },
      { k: 'company', label: 'Empresa', type: 'select', options: (r) => companyOptions(r.company) },
      { k: 'branch', label: 'Filial', type: 'select', options: (r) => branchOptions(r.company) },
      { k: 'role', label: 'Cargo / função' },
      { k: 'phone', label: 'Telefone', ph: '(85) 90000-0000' },
      { k: 'email', label: 'E-mail', type: 'email' },
      { k: 'type', label: 'Tipo', type: 'select', options: ['Cliente', 'Fornecedor', 'Parceiro', 'Técnico', 'Outro'] },
      { k: 'notes', label: 'Observações', type: 'textarea', full: true, rows: 3 },
    ],
    // Empresa escolhida → recarrega as filiais; “Outra” mostra campo de texto; “+” cadastra filial no cliente
    onOpen(r) {
      const comp = $('#f_company'), br = $('#f_branch');
      comp.insertAdjacentHTML('afterend', `<input class="input" id="f_company_custom" placeholder="Nome da empresa" style="margin-top:8px" hidden>`);
      br.outerHTML = `<div class="branch-row">${br.outerHTML}<button type="button" class="btn btn-ghost btn-icon" id="addBranch" title="Cadastrar filial neste cliente" aria-label="Cadastrar filial">${icon('plus')}</button></div>`;
      const sync = (keepBranch) => {
        const name = $('#f_company').value, cli = clientByName(name), cur = keepBranch ? $('#f_branch').value : '';
        $('#f_company_custom').hidden = name !== '__outra';
        $('#f_branch').innerHTML = selectOptions(branchOptions(name), cur);
        $('#f_branch').disabled = !cli;
        $('#addBranch').disabled = !cli;
        if (!keepBranch) {
          if (cli) $('#f_type').value = 'Cliente';
          else if ((D().fornecedores || []).some((f) => f.name === name)) $('#f_type').value = 'Fornecedor';
        }
      };
      $('#f_company').onchange = () => { sync(false); if ($('#f_company').value === '__outra') $('#f_company_custom').focus(); };
      $('#addBranch').onclick = () => {
        const cli = clientByName($('#f_company').value);
        if (!cli) return;
        const n = (prompt(`Nome da nova filial de ${cli.name}:`) || '').trim();
        if (!n) return;
        (cli.filiais ||= []).push({ name: n, address: '' });
        DB.save();
        $('#f_branch').innerHTML = selectOptions(branchOptions(cli.name), n);
        toast(`Filial “${n}” cadastrada em ${cli.name}`);
      };
      sync(true);
    },
    beforeSave(data) {
      if (data.company === '__outra') data.company = ($('#f_company_custom').value || '').trim();
      if (!clientByName(data.company)) data.branch = '';
    },
    columns: [
      { label: 'Nome', html: (c) => `<div class="who">${avatar(c.name)}<div><b>${esc(c.name)}</b><small>${esc(c.role || '')}</small></div></div>` },
      { label: 'Empresa', html: (c) => `${esc(c.company || '—')}${c.branch ? `<small>${esc(c.branch)}</small>` : ''}` },
      { label: 'Telefone', html: (c) => (c.phone ? `<a href="tel:${c.phone.replace(/\D/g, '')}">${esc(c.phone)}</a>` : '—') },
      { label: 'E-mail', html: (c) => (c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '—') },
      { label: 'Tipo', html: (c) => `<span class="badge b-muted">${esc(c.type)}</span>` },
      { label: '', html: (c) => `<button class="more" data-act="copy" data-id="${c.id}" title="Copiar telefone">${icon('copy')}</button>` },
    ],
    actions: { copy: (c) => copyText(c.phone, 'Telefone copiado') },
  },

  fornecedores: {
    title: 'Fornecedores', singular: 'Fornecedor', newLabel: 'Novo fornecedor', icon: 'building', titleField: 'name',
    sub: (l) => `${l.length} fornecedores cadastrados`,
    searchPh: 'Buscar fornecedor, categoria ou CNPJ',
    defaults: () => ({ rating: 4, lead: 3 }),
    sort: (a, b) => b.rating - a.rating || a.name.localeCompare(b.name),
    fields: [
      { k: 'name', label: 'Razão social / nome', full: true, required: true },
      { k: 'cnpj', label: 'CNPJ', ph: '00.000.000/0000-00' },
      { k: 'category', label: 'O que fornece' },
      { k: 'contact', label: 'Contato' },
      { k: 'phone', label: 'Telefone' },
      { k: 'email', label: 'E-mail', type: 'email' },
      { k: 'site', label: 'Site', type: 'url' },
      { k: 'lead', label: 'Prazo de entrega (dias)', type: 'number' },
      { k: 'rating', label: 'Avaliação (1 a 5)', type: 'number', min: 1, max: 5 },
      { k: 'notes', label: 'Observações', type: 'textarea', full: true, rows: 3 },
    ],
    columns: [
      { label: 'Fornecedor', html: (f) => `<div class="who">${avatar(f.name)}<div><b>${esc(f.name)}</b><small>${esc(f.cnpj || '')}</small></div></div>` },
      { label: 'Fornece', html: (f) => `<span class="badge b-muted">${esc(f.category || '—')}</span>` },
      { label: 'Contato', html: (f) => `${esc(f.contact || '—')}<small>${esc(f.phone || '')}</small>` },
      { label: 'Entrega', html: (f) => `${f.lead} dia${f.lead === 1 ? '' : 's'}` },
      { label: 'Avaliação', html: (f) => stars(Math.max(0, Math.min(5, f.rating))) },
      { label: 'RMA abertos', html: (f) => { const n = D().rma.filter((r) => rmaOpen(r) && r.supplier === f.name).length; return n ? `<span class="badge b-warn">${n}</span>` : '<span class="muted">0</span>'; } },
      { label: '', html: (f) => (f.site ? `<a class="more" href="${esc(f.site)}" target="_blank" rel="noopener" title="Abrir site">${icon('external')}</a>` : '') },
    ],
  },

  compras: {
    title: 'Solicitações de compra', singular: 'Solicitação', newLabel: 'Nova solicitação', icon: 'cart', titleField: 'item',
    sub: (l) => `${l.filter((c) => c.status === 'pendente').length} aguardando aprovação · ${money(l.filter((c) => ['pendente', 'aprovada'].includes(c.status)).reduce((a, c) => a + c.value, 0))} previstos`,
    searchPh: 'Buscar item, fornecedor ou solicitante',
    tabs: { field: 'status', map: COMP_ST },
    extraActions: `<button class="btn btn-ghost" id="fromStock"><span data-icon="box"></span>Gerar do estoque baixo</button>`,
    defaults: () => ({ status: 'pendente', prio: 'media', qty: 1, requester: D().techs[0], date: new Date().toISOString() }),
    sort: (a, b) => COMP_FLOW.indexOf(a.status) - COMP_FLOW.indexOf(b.status) || (b.date || '').localeCompare(a.date || ''),
    fields: [
      { k: 'item', label: 'Item', full: true, required: true },
      { k: 'qty', label: 'Quantidade', type: 'number', min: 1 },
      { k: 'value', label: 'Valor estimado (R$)', type: 'number', step: 0.01 },
      { k: 'supplier', label: 'Fornecedor', type: 'select', options: supplierNames, allowEmpty: true },
      { k: 'prio', label: 'Prioridade', type: 'select', options: opt(PRIO) },
      { k: 'requester', label: 'Solicitante', type: 'select', options: () => D().techs },
      { k: 'status', label: 'Status', type: 'select', options: opt(COMP_ST) },
      { k: 'reason', label: 'Motivo', type: 'textarea', full: true, rows: 2 },
    ],
    columns: [
      { label: 'Item', html: (c) => `<b>${esc(c.item)}</b><small>${esc(c.reason || '')}</small>` },
      { label: 'Qtd.', html: (c) => c.qty },
      { label: 'Fornecedor', html: (c) => esc(c.supplier || '—') },
      { label: 'Prioridade', html: (c) => pill(PRIO, c.prio) },
      { label: 'Solicitante', html: (c) => `${esc(c.requester || '')}<small>${c.date ? fmtDate(c.date) : ''}</small>` },
      { label: 'Status', html: (c) => pill(COMP_ST, c.status) },
      { label: 'Valor', right: true, html: (c) => `<b>${money(c.value)}</b>` },
      { label: '', html: (c) => (COMP_FLOW.indexOf(c.status) > -1 && c.status !== 'recebida' ? `<button class="more" data-act="next" data-id="${c.id}" title="Avançar para ${COMP_ST[COMP_FLOW[COMP_FLOW.indexOf(c.status) + 1]][0]}">${icon('chevR')}</button>` : '') },
    ],
    actions: {
      next: (c) => {
        c.status = COMP_FLOW[COMP_FLOW.indexOf(c.status) + 1];
        // Ao receber, soma no estoque se a peça existir lá
        if (c.status === 'recebida') {
          const p = catByName(c.item);
          if (p && isProduct(p)) { stockMove(p, c.qty, 'entrada', 'Solicitação de compra recebida'); toast(`${c.qty} un. somadas ao estoque de ${p.name}`, 'box'); }
        }
        DB.save(); router();
        toast(`Solicitação → ${COMP_ST[c.status][0]}`);
      },
    },
    mount() {
      $('#fromStock').onclick = () => {
        const pending = D().compras.filter((c) => ['pendente', 'aprovada', 'comprada'].includes(c.status)).map((c) => c.item.toLowerCase());
        const low = D().catalogo.filter((p) => isLow(p) && !pending.includes(p.name.toLowerCase()));
        if (!low.length) return toast('Nenhuma peça baixa sem solicitação aberta', 'check');
        low.forEach((s) => {
          const qty = Math.max(1, Math.max(s.min || 0, 2) * 2 - s.stock);
          D().compras.push({ id: D().nextId.compras++, item: s.name, qty, value: qty * s.price, supplier: '', prio: s.stock === 0 ? 'alta' : 'media', status: 'pendente', requester: D().techs[0], reason: `Estoque: ${s.stock} de mínimo ${s.min || 0}`, date: new Date().toISOString() });
        });
        DB.save(); router();
        toast(`${low.length} solicitações criadas a partir do estoque`, 'cart');
      };
    },
  },

  acessos: {
    title: 'Acessos', singular: 'Acesso', newLabel: 'Novo acesso', icon: 'key', titleField: 'name',
    sub: (l) => `${l.length} logins e senhas guardados`,
    searchPh: 'Buscar serviço, usuário ou categoria',
    notice: 'Protótipo: as senhas ficam salvas só neste navegador, sem criptografia. Na versão final elas devem ser guardadas criptografadas no servidor.',
    tabs: { field: 'category', map: { Fornecedor: ['Fornecedores'], Sistema: ['Sistemas'], Rede: ['Rede'], 'E-mail': ['E-mail'] } },
    defaults: () => ({ category: 'Sistema' }),
    sort: (a, b) => a.name.localeCompare(b.name),
    fields: [
      { k: 'name', label: 'Serviço', full: true, required: true },
      { k: 'url', label: 'Endereço (URL)', full: true, type: 'url', ph: 'https://' },
      { k: 'user', label: 'Usuário' },
      { k: 'password', label: 'Senha', type: 'secret' },
      { k: 'category', label: 'Categoria', type: 'select', options: ['Fornecedor', 'Sistema', 'Rede', 'E-mail'] },
      { k: 'notes', label: 'Observações', type: 'textarea', full: true, rows: 3 },
    ],
    columns: [
      { label: 'Serviço', html: (a) => `<div class="who"><span class="kpi-ico" style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--brand-soft);color:var(--brand)">${icon('key')}</span><div><b>${esc(a.name)}</b><small>${esc(a.url || '')}</small></div></div>` },
      { label: 'Usuário', html: (a) => `${esc(a.user || '—')} ${a.user ? `<button class="more inline-actions" data-act="user" data-id="${a.id}" title="Copiar usuário" style="width:26px;height:26px">${icon('copy')}</button>` : ''}` },
      { label: 'Senha', html: (a) => `<span class="secret" data-pw="${a.id}">••••••••</span> <span class="inline-actions"><button class="more" data-act="show" data-id="${a.id}" title="Mostrar" style="width:26px;height:26px">${icon('eye')}</button><button class="more" data-act="pass" data-id="${a.id}" title="Copiar senha" style="width:26px;height:26px">${icon('copy')}</button></span>` },
      { label: 'Categoria', html: (a) => `<span class="badge b-muted">${esc(a.category)}</span>` },
      { label: '', html: (a) => (a.url ? `<a class="more" href="${esc(a.url)}" target="_blank" rel="noopener" title="Abrir">${icon('external')}</a>` : '') },
    ],
    actions: {
      user: (a) => copyText(a.user, 'Usuário copiado'),
      pass: (a) => copyText(a.password, 'Senha copiada'),
      show: (a, btn) => {
        const el = $(`[data-pw="${a.id}"]`);
        const hidden = el.textContent.startsWith('•');
        el.textContent = hidden ? a.password : '••••••••';
        btn.innerHTML = icon(hidden ? 'eyeOff' : 'eye');
        if (hidden) setTimeout(() => { if (el.isConnected) { el.textContent = '••••••••'; btn.innerHTML = icon('eye'); } }, 10000);
      },
    },
  },

  conhecimento: {
    title: 'Conhecimento', singular: 'Artigo', newLabel: 'Novo artigo', icon: 'book', titleField: 'title',
    sub: (l) => `${l.length} artigos: tutoriais, procedimentos e diagnósticos`,
    searchPh: 'Buscar no conteúdo dos artigos',
    tabs: { field: 'category', map: { Tutorial: ['Tutoriais'], Procedimento: ['Procedimentos'], 'Diagnóstico': ['Diagnósticos'], 'Política': ['Políticas'] } },
    defaults: () => ({ category: 'Tutorial' }),
    sort: (a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''),
    beforeSave: (data) => { data.updatedAt = new Date().toISOString(); },
    fields: [
      { k: 'title', label: 'Título', full: true, required: true },
      { k: 'category', label: 'Categoria', type: 'select', options: ['Tutorial', 'Procedimento', 'Diagnóstico', 'Política'] },
      { k: 'tags', label: 'Tags (separadas por vírgula)' },
      { k: 'body', label: 'Conteúdo', type: 'textarea', full: true, rows: 14 },
    ],
    card: (a) => `
      <div class="row-between"><span class="badge b-brand">${esc(a.category)}</span><small class="muted">${a.updatedAt ? relTime(a.updatedAt) : ''}</small></div>
      <h4>${esc(a.title)}</h4>
      <p>${esc(a.body || '')}</p>
      <div>${(a.tags || '').split(',').map((t) => t.trim()).filter(Boolean).map((t) => `<span class="tag">#${esc(t)}</span>`).join('')}</div>`,
    // Abre em modo leitura; o botão Editar leva para a ficha
    open: (cfg, a) => {
      openDrawer(`
        ${drawerHead(esc(a.title), `${esc(a.category)} · atualizado ${a.updatedAt ? relTime(a.updatedAt) : ''}`)}
        <div class="drawer-body">
          <div>${(a.tags || '').split(',').map((t) => t.trim()).filter(Boolean).map((t) => `<span class="tag">#${esc(t)}</span>`).join('')}</div>
          <div class="article">${esc(a.body || '')}</div>
        </div>
        <div class="drawer-foot">
          <button class="btn btn-ghost btn-sm" id="artCopy">${icon('copy')}Copiar texto</button>
          <button class="btn btn-primary btn-sm" id="artEdit">${icon('edit')}Editar</button>
        </div>`);
      $('#artCopy').onclick = () => copyText(`${a.title}\n\n${a.body}`, 'Artigo copiado');
      $('#artEdit').onclick = () => openRecord(cfg, a);
    },
  },
};

Object.entries(MODULES).forEach(([key, cfg]) => {
  cfg.key = key;
  PAGES[key] = collectionPage(cfg);
});
