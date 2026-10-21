/* =========================================================
   Produtos e Serviços + Estoque
   Como no sistema antigo: um catálogo só. O Estoque é a visão de saldo,
   localização (mapa A1–E5) e movimentações; serviços não controlam estoque.
   Materiais usados numa OS dão baixa automática no saldo.
   ========================================================= */
const CAT = () => D().catalogo;
const catById = (id) => CAT().find((p) => p.id === +id);
const catByName = (name) => CAT().find((p) => p.name.toLowerCase() === String(name).trim().toLowerCase());
const isProduct = (p) => p.type === 'Produto';
// Tamanho do mapa e limites de alerta vêm de Configurações › Empresa
const slotCols = () => { const last = (company().stockGridMaxColumn || 'E').charCodeAt(0); return Array.from({ length: Math.max(1, last - 64) }, (_, i) => String.fromCharCode(65 + i)); };
const slotRows = () => Array.from({ length: Math.max(1, +company().stockGridMaxRow || 5) }, (_, i) => i + 1);
const lowLimit = () => +company().stockLowThreshold || 0;
const critLimit = () => +company().stockCriticalThreshold || 0;

// Situação do saldo (mesma legenda do sistema real: OK, Até 2, Crítico até 1)
function stockState(p) {
  if (!isProduct(p)) return { key: 'servico', label: 'Serviço', color: '#AAAAAA' };
  if (p.stock <= critLimit()) return { key: 'critico', label: 'Crítico', color: '#FF3B30' };
  if (p.stock <= lowLimit()) return { key: 'ate2', label: 'Até ' + lowLimit(), color: '#FF9500' };
  if (p.stock <= (p.min || 0)) return { key: 'baixo', label: 'Baixo', color: '#FF9500' };
  return { key: 'ok', label: 'OK', color: '#34C759' };
}
const isLow = (p) => isProduct(p) && p.stock <= Math.max(p.min || 0, lowLimit());
const pendingPurchase = (p) => (D().compras || []).find((c) => c.item.toLowerCase() === p.name.toLowerCase() && ['pendente', 'aprovada', 'comprada'].includes(c.status));
const stockPill = (p) => `<span class="pill-solid" style="--c:${stockState(p).color}">${stockState(p).label}</span>`;

// Movimenta o saldo e registra no histórico do item
function stockMove(p, delta, type, origin) {
  if (!p || !isProduct(p)) return;
  p.stock = Math.max(0, (p.stock || 0) + delta);
  (p.moves ||= []).push({ at: new Date().toISOString(), type, qty: delta, balance: p.stock, origin });
}

/* ---------------- Produtos e Serviços ---------------- */
const PROD_STATE = { q: '', dir: 1 };
PAGES.produtos = {
  render() {
    const n = CAT().length;
    return `
      <div class="page-head">
        <div><h1>Produtos e Serviços</h1><p>Catálogo de produtos e serviços usados no atendimento · ${n} itens</p></div>
        <div class="actions">
          <label class="btn btn-ghost" style="cursor:pointer">${icon('file')}Importar NFe (XML)<input type="file" id="nfeIn" accept=".xml,text/xml" hidden></label>
          <label class="btn btn-ghost" style="cursor:pointer">${icon('download')}Importar CSV<input type="file" id="csvIn" accept=".csv,text/csv" hidden></label>
          <button class="btn btn-primary" onclick="openItem()"><span data-icon="plus"></span>Novo item</button>
        </div>
      </div>
      <div class="card glass">
        <div class="toolbar">
          <div class="input-wrap" style="max-width:none">${icon('search')}<input class="input" id="prodSearch" placeholder="Buscar por nome, descrição, categoria ou localização..." value="${esc(PROD_STATE.q)}"></div>
          <a href="#" id="csvModel" class="hint">Baixar modelo de CSV</a>
        </div>
        <div id="prodBody"></div>
      </div>`;
  },
  mount() {
    $('#prodSearch').oninput = (e) => { PROD_STATE.q = e.target.value; this.body(); };
    $('#nfeIn').onchange = (e) => e.target.files[0] && importNfe(e.target.files[0]);
    $('#csvIn').onchange = (e) => e.target.files[0] && importCsv(e.target.files[0]);
    $('#csvModel').onclick = (e) => { e.preventDefault(); downloadCsvModel(); };
    this.body();
  },
  body() {
    const q = PROD_STATE.q.trim().toLowerCase();
    const list = CAT().filter((p) => [p.name, p.desc, p.category, p.location].join(' ').toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name) * PROD_STATE.dir);
    $('#prodBody').innerHTML = list.length ? `<div class="table-wrap"><table class="t">
      <thead><tr><th class="nosort"></th><th data-sort class="sorted">Nome<span class="arr">${PROD_STATE.dir === 1 ? '▲' : '▼'}</span></th><th class="nosort">Categoria</th><th class="nosort">Tipo</th><th class="nosort">Estoque</th><th class="nosort">Localização</th><th class="nosort">Preço</th><th class="nosort">Descrição</th><th class="nosort">Ações</th></tr></thead>
      <tbody>${list.map((p) => `<tr data-id="${p.id}">
        <td><span class="letter">${p.image ? `<img src="${esc(p.image)}" alt="">` : esc(p.name[0].toUpperCase())}</span></td>
        <td><b>${esc(p.name)}</b></td>
        <td><span class="muted">${esc(p.category || '—')}</span></td>
        <td><span class="badge ${isProduct(p) ? 'b-accent' : 'b-brand'}">${p.type}</span></td>
        <td>${isProduct(p) ? `<b class="${isLow(p) ? 'stock-low' : ''}">${p.stock}</b>` : '<span class="muted">—</span>'}</td>
        <td>${p.location ? `<span class="slot-tag">${esc(p.location)}</span>` : '<span class="muted">-</span>'}</td>
        <td>${money(p.price)}</td>
        <td><span class="muted">${esc(p.desc || '-')}</span></td>
        <td><span class="inline-actions">
          <button class="more" data-act="edit" data-id="${p.id}" title="Editar">${icon('edit')}</button>
          ${isProduct(p) ? `<button class="more" data-act="stock" data-id="${p.id}" title="Estoque">${icon('box')}</button>` : ''}
          <button class="more" data-act="del" data-id="${p.id}" title="Excluir">${icon('trash')}</button>
        </span></td>
      </tr>`).join('')}</tbody></table></div>` : `<div class="empty-state">${icon('box')}<div>Nenhum item encontrado.</div></div>`;
    const th = $('#prodBody [data-sort]');
    if (th) th.onclick = () => { PROD_STATE.dir *= -1; this.body(); };
    $$('#prodBody tbody tr').forEach((tr) => (tr.onclick = (e) => { if (!e.target.closest('button')) openItem(+tr.dataset.id); }));
    $$('#prodBody [data-act]').forEach((b) => (b.onclick = () => {
      const p = catById(b.dataset.id);
      if (b.dataset.act === 'edit') openItem(p.id);
      if (b.dataset.act === 'stock') location.hash = '#/estoque/' + p.id;
      if (b.dataset.act === 'del' && confirm(`Excluir “${p.name}” do catálogo?`)) {
        D().catalogo = CAT().filter((x) => x !== p);
        refresh(); toast('Item excluído', 'trash');
      }
    }));
  },
};

// Novo / editar item (mesmos campos do sistema real)
function openItem(id) {
  const p = id ? catById(id) : null;
  const v = p || { type: 'Produto', factor: 1, min: 2, stock: 0 };
  const slots = slotCols().flatMap((c) => slotRows().map((r) => c + r));
  openDrawer(`
    ${drawerHead(p ? 'Editar item' : 'Novo produto/serviço', p ? esc(p.name) : 'Dados do item')}
    <form class="drawer-body" id="itemForm">
      <div class="form-grid">
        <div class="field full"><label for="pName">Nome</label><input class="input" id="pName" value="${esc(v.name || '')}" placeholder="Ex.: Formatação, Cabo USB..." required></div>
        <div class="field full"><label for="pImg">URL da imagem</label><input class="input" id="pImg" type="url" value="${esc(v.image || '')}" placeholder="https://..."></div>
        <div class="field"><label for="pCat">Categoria</label><input class="input" id="pCat" list="pCats" value="${esc(v.category || '')}" placeholder="Ex.: Hardware, Software..."><datalist id="pCats">${[...new Set(CAT().map((x) => x.category).filter(Boolean))].map((c) => `<option>${esc(c)}</option>`).join('')}</datalist></div>
        <div class="field"><label for="pType">Tipo</label><select class="input" id="pType">${['Produto', 'Serviço'].map((t) => `<option ${v.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="field"><label for="pPrice">Preço (R$)</label><input class="input" id="pPrice" type="number" min="0" step="0.01" value="${v.price ?? ''}"></div>
        <div class="field stock-only"><label for="pStock">Estoque</label><input class="input" id="pStock" type="number" min="0" value="${v.stock ?? 0}" ${p ? 'disabled title="Use “Ajustar estoque” na página do item"' : ''}></div>
        <div class="field stock-only"><label for="pFactor">Fator de conversão</label><input class="input" id="pFactor" type="number" min="1" value="${v.factor ?? 1}" title="Quantas unidades de uso vêm em cada unidade comprada"></div>
        <div class="field stock-only"><label for="pMin">Estoque mínimo</label><input class="input" id="pMin" type="number" min="0" value="${v.min ?? 0}"></div>
        <div class="field stock-only"><label for="pLoc">Localização</label><select class="input" id="pLoc"><option value="">Sem local</option>${slots.map((s) => `<option ${v.location === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
        <div class="field full"><label for="pDesc">Descrição</label><textarea class="input" id="pDesc" rows="3">${esc(v.desc || '')}</textarea></div>
      </div>
    </form>
    <div class="drawer-foot">${p && isProduct(p) ? `<a class="btn btn-ghost btn-sm" href="#/estoque/${p.id}" style="margin-right:auto">${icon('box')}Ver estoque</a>` : ''}<button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit" form="itemForm">${icon('check')}Salvar</button></div>`, { focus: !p });
  const syncType = () => $$('#itemForm .stock-only').forEach((f) => (f.hidden = $('#pType').value !== 'Produto'));
  $('#pType').onchange = syncType; syncType();
  $('#itemForm').onsubmit = (e) => {
    e.preventDefault();
    const data = { name: $('#pName').value.trim(), image: $('#pImg').value.trim(), category: $('#pCat').value.trim(), type: $('#pType').value, price: +$('#pPrice').value || 0, factor: +$('#pFactor').value || 1, min: +$('#pMin').value || 0, location: $('#pLoc').value, desc: $('#pDesc').value.trim() };
    if (!data.name) return;
    if (p) Object.assign(p, data);
    else {
      const n = { id: D().nextId.catalogo++, ...data, stock: 0, nfe: '', moves: [] };
      CAT().push(n);
      const q = +$('#pStock').value || 0;
      if (q && isProduct(n)) stockMove(n, q, 'entrada', 'Cadastro inicial');
    }
    closeDrawer(); refresh(); toast(p ? 'Item atualizado' : 'Item cadastrado', 'box');
  };
}

/* ---------------- Importação: NFe (XML) e CSV ---------------- */
function readText(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); }); }

async function importNfe(file) {
  let xml;
  try { xml = new DOMParser().parseFromString(await readText(file), 'text/xml'); } catch { return toast('Não consegui ler o arquivo XML', 'alert'); }
  const get = (el, tag) => el.getElementsByTagNameNS('*', tag)[0]?.textContent?.trim() || el.getElementsByTagName(tag)[0]?.textContent?.trim() || '';
  const dets = [...xml.getElementsByTagNameNS('*', 'det'), ...(xml.getElementsByTagNameNS('*', 'det').length ? [] : xml.getElementsByTagName('det'))];
  const nNF = get(xml, 'nNF');
  const margin = Math.min(95, Math.max(0, +company().profitMargin || 0));
  const rows = dets.map((det) => { const cost = +get(det, 'vUnCom') || 0; return { code: get(det, 'cProd'), name: get(det, 'xProd'), qty: Math.round(+get(det, 'qCom') || 0), cost, price: +(cost / (1 - margin / 100)).toFixed(2) }; }).filter((r) => r.name);
  if (!rows.length) return toast('Nenhum produto encontrado nesse XML de NFe', 'alert');
  previewImport(`NFe ${nNF || ''}`.trim(), rows.map((r) => ({ ...r, category: 'Importado NFe', type: 'Produto', desc: 'Código NFe: ' + r.code, nfe: r.code })));
}

async function importCsv(file) {
  const txt = (await readText(file)).replace(/^﻿/, '');
  const lines = txt.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return toast('CSV vazio', 'alert');
  const sep = lines[0].includes(';') ? ';' : ',';
  const split = (l) => l.split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
  const head = split(lines[0]).map((h) => h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
  const idx = (k) => head.findIndex((h) => h.startsWith(k));
  const col = { name: idx('nome'), category: idx('categ'), type: idx('tipo'), price: idx('preco'), qty: idx('estoque'), min: idx('min'), location: idx('local'), desc: idx('descr') };
  if (col.name < 0) return toast('O CSV precisa ter a coluna “nome”', 'alert');
  const num = (v) => +String(v || '').replace(/\./g, '').replace(',', '.') || 0;
  const rows = lines.slice(1).map(split).map((c) => ({
    name: c[col.name], category: c[col.category] || '', type: /serv/i.test(c[col.type] || '') ? 'Serviço' : 'Produto',
    price: num(c[col.price]), qty: Math.round(num(c[col.qty])), min: Math.round(num(c[col.min])), location: (c[col.location] || '').toUpperCase(), desc: c[col.desc] || '',
  })).filter((r) => r.name);
  previewImport('CSV ' + file.name, rows);
}

function downloadCsvModel() {
  const csv = '﻿nome;categoria;tipo;preco;estoque;minimo;localizacao;descricao\nCabo HDMI 2m;Cabos;Produto;35,00;10;3;B5;\nConfiguração de roteador;Serviços;Serviço;150,00;;;;Remoto ou presencial\n';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'modelo-produtos.csv';
  a.click();
}

// Mostra o que vai entrar antes de gravar
function previewImport(source, rows) {
  const plan = rows.map((r) => {
    const ex = (r.nfe && CAT().find((p) => p.nfe === r.nfe)) || catByName(r.name);
    return { ...r, ex };
  });
  const newN = plan.filter((r) => !r.ex).length, upd = plan.length - newN;
  openDrawer(`
    ${drawerHead('Importar ' + esc(source), `${plan.length} itens · ${newN} novos · ${upd} já cadastrados (entrada de estoque)`)}
    <div class="drawer-body">
      <div class="items">${plan.map((r) => `<div class="item-row"><div><b>${esc(r.name)}</b><small>${esc(r.category || '')}${r.ex ? ' · já existe' : ' · novo'}</small></div><span class="muted">${r.type === 'Produto' ? `+${r.qty || 0} un.` : 'serviço'}</span><b title="${r.cost ? 'Custo ' + money(r.cost) + ' + margem ' + company().profitMargin + '%' : ''}">${money(r.price)}</b><span class="badge ${r.ex ? 'b-muted' : 'b-ok'}">${r.ex ? 'Entrada' : 'Novo'}</span></div>`).join('')}</div>
    </div>
    <div class="drawer-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="impGo">${icon('check')}Importar ${plan.length} itens</button></div>`);
  $('#impGo').onclick = () => {
    plan.forEach((r) => {
      let p = r.ex;
      if (!p) {
        p = { id: D().nextId.catalogo++, name: r.name, image: '', category: r.category, type: r.type, price: r.price, stock: 0, factor: 1, min: r.min || 0, location: r.location || '', desc: r.desc || '', nfe: r.nfe || '', moves: [] };
        CAT().push(p);
      } else if (r.price) p.price = r.price;
      if (r.qty && isProduct(p)) stockMove(p, r.qty, 'entrada', 'Importação ' + source);
    });
    closeDrawer(); refresh(); toast(`${plan.length} itens importados de ${source}`, 'box');
  };
}

/* ---------------- Estoque ---------------- */
const STK_STATE = { q: '', type: 'todos', sit: 'todos', slot: '' };
function lastMove(p) { return (p.moves || []).at(-1); }
const MOVE_LABEL = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste' };

PAGES.estoque = {
  render(id) {
    if (id) return stockItemPage(id);
    const prods = CAT().filter(isProduct);
    const withStock = prods.filter((p) => p.stock > 0);
    const slotsUsed = new Set(withStock.map((p) => p.location).filter(Boolean));
    const low = prods.filter(isLow), zero = prods.filter((p) => p.stock === 0), crit = prods.filter((p) => p.stock <= critLimit());
    const pend = prods.filter(pendingPurchase), risk = low.filter((p) => !pendingPurchase(p));
    const tile = (k, cls, label, val, sub) => `<button class="op-kpi ${cls} ${k && STK_STATE.sit === k ? 'sel' : ''}" ${k ? `data-sit="${k}"` : 'style="cursor:default"'}><div class="op-kpi-top"><span>${label}</span></div><b>${val}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;
    // mapa: pior situação de cada slot
    const slotInfo = (s) => {
      const items = prods.filter((p) => p.location === s);
      if (!items.length) return { cls: 'empty', items, units: 0 };
      const units = items.reduce((a, p) => a + p.stock, 0);
      const worst = items.some((p) => p.stock <= critLimit()) ? 'crit' : items.some((p) => p.stock <= lowLimit()) ? 'warn' : 'ok';
      return { cls: worst, items, units };
    };
    return `
      <div class="page-head">
        <div><h1>Estoque</h1><p>Controle de saldo, localização e saídas por OS. Serviços aparecem como itens sem controle de estoque.</p></div>
        <div class="actions"><button class="btn btn-ghost" onclick="location.hash='#/produtos'">${icon('list')}Produtos</button><button class="btn btn-primary" onclick="openItem()"><span data-icon="plus"></span>Novo item</button></div>
      </div>
      <div class="grid g-3 stock-kpis">
        ${tile(null, 'k-neutral', 'Itens com estoque', withStock.length)}
        ${tile(null, 'k-neutral', 'Unidades em saldo', prods.reduce((a, p) => a + p.stock, 0))}
        ${tile(null, 'k-neutral', 'Localizações ocupadas', slotsUsed.size, `de ${slotCols().length * slotRows().length} posições`)}
        ${tile('baixos', 'k-warn', 'Estoque baixo', low.length, 'no mínimo ou abaixo')}
        ${tile('criticos', 'k-danger', 'Zerados', zero.length, `${crit.length} crítico(s)`)}
        ${tile('pendentes', 'k-brand', 'Solicitação pendente', pend.length, `${risk.length} risco de ruptura`)}
      </div>
      <div class="grid g-main">
        <div class="card glass">
          <div class="toolbar">
            <div class="input-wrap">${icon('search')}<input class="input" id="stkSearch" placeholder="Buscar item, categoria ou local" value="${esc(STK_STATE.q)}"></div>
            <select class="input" id="stkType" style="width:auto;height:38px">${[['todos', 'Todos os tipos'], ['produtos', 'Somente produtos'], ['servicos', 'Somente serviços']].map(([k, l]) => `<option value="${k}" ${STK_STATE.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <select class="input" id="stkSit" style="width:auto;height:38px">${[['todos', 'Todos'], ['baixos', 'Somente baixos'], ['criticos', 'Somente críticos'], ['pendentes', 'Somente pendentes']].map(([k, l]) => `<option value="${k}" ${STK_STATE.sit === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
            ${STK_STATE.slot ? `<button class="chip on" id="slotClear">${icon('pin')}${STK_STATE.slot} ✕</button>` : ''}
          </div>
          <div id="stkBody"></div>
        </div>
        <div class="card glass" style="align-self:start">
          <div class="card-head"><div><h3>Mapa do estoque</h3><p>Grade por localização. Clique para ver os itens do slot.</p></div></div>
          <div class="slot-grid" style="grid-template-columns:20px repeat(${slotCols().length}, minmax(0, 1fr))">
            <span></span>${slotCols().map((c) => `<span class="slot-h">${c}</span>`).join('')}
            ${slotRows().map((r) => `<span class="slot-h">${r}</span>${slotCols().map((c) => { const s = c + r, i = slotInfo(s); return `<button class="slot-cell ${i.cls} ${STK_STATE.slot === s ? 'sel' : ''}" data-slot="${s}" title="${s}: ${i.items.length ? i.items.map((p) => p.name + ' (' + p.stock + ')').join(', ') : 'vazio'}"><b>${s}</b><small>${i.items.length ? i.units + ' un.' : 'Vazio'}</small></button>`; }).join('')}`).join('')}
          </div>
          <div class="legend" style="margin-top:12px"><span><i style="background:var(--surface-2);border:1px solid var(--border-strong)"></i>Vazio</span><span><i style="background:#34C759"></i>OK</span><span><i style="background:#FF9500"></i>Até ${lowLimit()}</span><span><i style="background:#FF3B30"></i>Crítico até ${critLimit()}</span></div>
        </div>
      </div>`;
  },
  mount(id) {
    if (id) return stockItemMount(id);
    $('#stkSearch').oninput = (e) => { STK_STATE.q = e.target.value; this.body(); };
    $('#stkType').onchange = (e) => { STK_STATE.type = e.target.value; this.body(); };
    $('#stkSit').onchange = (e) => { STK_STATE.sit = e.target.value; router(); };
    $$('[data-sit]').forEach((b) => (b.onclick = () => { STK_STATE.sit = b.dataset.sit; router(); }));
    $$('[data-slot]').forEach((b) => (b.onclick = () => { STK_STATE.slot = STK_STATE.slot === b.dataset.slot ? '' : b.dataset.slot; router(); }));
    const sc = $('#slotClear');
    if (sc) sc.onclick = () => { STK_STATE.slot = ''; router(); };
    this.body();
  },
  body() {
    const q = STK_STATE.q.trim().toLowerCase();
    const sit = { todos: () => true, baixos: isLow, criticos: (p) => isProduct(p) && p.stock <= critLimit(), pendentes: (p) => !!pendingPurchase(p) }[STK_STATE.sit];
    const list = CAT().filter((p) =>
      (STK_STATE.type === 'todos' || (STK_STATE.type === 'produtos') === isProduct(p)) && sit(p) &&
      (!STK_STATE.slot || p.location === STK_STATE.slot) &&
      [p.name, p.category, p.location, p.desc].join(' ').toLowerCase().includes(q))
      .sort((a, b) => (isProduct(b) ? 1 : 0) - (isProduct(a) ? 1 : 0) || a.name.localeCompare(b.name));
    $('#stkBody').innerHTML = list.length ? `<div class="table-wrap"><table class="t">
      <thead><tr><th class="nosort">Item</th><th class="nosort">Tipo</th><th class="nosort">Localização</th><th class="nosort">Saldo</th><th class="nosort">Última movimentação</th><th class="nosort">Ações</th></tr></thead>
      <tbody>${list.map((p) => { const m = lastMove(p), pp = pendingPurchase(p); return `<tr data-id="${p.id}">
        <td><b>${esc(p.name)}</b><small>${esc(p.desc || p.category || '')}</small></td>
        <td><span class="badge ${isProduct(p) ? 'b-accent' : 'b-brand'}">${p.type}</span></td>
        <td>${p.location ? `<span class="slot-tag">${esc(p.location)}</span>` : '<span class="muted">Sem local</span>'}</td>
        <td>${isProduct(p) ? `<div style="display:flex;gap:8px;align-items:center"><b style="min-width:24px">${p.stock}</b>${stockPill(p)}${pp ? `<span class="badge b-brand" title="Solicitação de compra ${COMP_ST[pp.status][0].toLowerCase()}">compra</span>` : ''}</div>` : '<span class="muted">Sem controle</span>'}</td>
        <td>${m ? `${fmtDate(m.at)}<small>${MOVE_LABEL[m.type]} ${m.qty > 0 ? '+' : ''}${m.qty} · ${esc(m.origin)}</small>` : '<span class="muted">Sem histórico</span>'}</td>
        <td><span class="inline-actions">${isProduct(p) ? `<a class="btn btn-ghost btn-sm" href="#/estoque/${p.id}">Movimentos</a>` : ''}<button class="btn btn-ghost btn-sm" data-edit="${p.id}">Editar</button></span></td>
      </tr>`; }).join('')}</tbody></table></div>` : `<div class="empty-state">${icon('box')}<div>Nenhum item com esses filtros.</div></div>`;
    $$('#stkBody [data-edit]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); openItem(+b.dataset.edit); }));
    $$('#stkBody tbody tr').forEach((tr) => (tr.onclick = (e) => { if (e.target.closest('a,button')) return; const p = catById(tr.dataset.id); isProduct(p) ? (location.hash = '#/estoque/' + p.id) : openItem(p.id); }));
  },
};

// Página do item: histórico de entradas, saídas e uso nas OS
function stockItemPage(id) {
  const p = catById(id);
  if (!p) return `<div class="empty-state">${icon('box')}<div>Item não encontrado.</div><p><a href="#/estoque">Voltar ao estoque</a></p></div>`;
  const moves = [...(p.moves || [])].reverse();
  const osOut = (p.moves || []).filter((m) => m.type === 'saida' && /^OS /.test(m.origin));
  const used = -osOut.reduce((a, m) => a + m.qty, 0);
  return `
    <a href="#/estoque" class="back-link">${icon('chevL')}Estoque</a>
    <div class="page-head">
      <div><h1>Estoque · ${esc(p.name)}</h1><p>Histórico de entradas, saídas e uso do item nas ordens de serviço.</p></div>
      <div class="actions"><button class="btn btn-ghost" id="itEdit">${icon('edit')}Editar item</button><button class="btn btn-primary" id="itAdjust">${icon('repeat')}Ajustar estoque</button></div>
    </div>
    <div class="grid g-4">
      <div class="op-kpi k-neutral"><div class="op-kpi-top"><span>Tipo</span></div><b style="font-size:22px">${esc(p.category || p.type)}</b></div>
      <div class="op-kpi ${isLow(p) ? 'k-danger' : 'k-ok'}"><div class="op-kpi-top"><span>Saldo atual</span></div><b>${p.stock}</b><small>${stockState(p).label} · mínimo ${p.min || 0}</small></div>
      <div class="op-kpi k-neutral"><div class="op-kpi-top"><span>Localização</span></div><b style="font-size:22px">${esc(p.location || 'Sem local')}</b></div>
      <div class="op-kpi k-brand"><div class="op-kpi-top"><span>Saídas em OS</span></div><b>${osOut.length}</b><small>${used} unidade(s) consumidas</small></div>
    </div>
    <div class="grid g-main">
      <section class="card glass">
        <div class="card-head"><h3>Todas as movimentações</h3><span class="badge b-muted">${moves.length}</span></div>
        ${moves.length ? `<div class="table-wrap"><table class="t" style="min-width:560px"><thead><tr><th class="nosort">Movimento</th><th class="nosort">Qtd.</th><th class="nosort">Saldo</th><th class="nosort">Origem</th><th class="nosort">Data</th></tr></thead><tbody>
          ${moves.map((m) => `<tr style="cursor:default"><td><span class="badge ${m.type === 'entrada' ? 'b-ok' : m.type === 'saida' ? 'b-danger' : 'b-muted'}">${MOVE_LABEL[m.type]}</span></td><td><b>${m.qty > 0 ? '+' : ''}${m.qty}</b></td><td>${m.balance}</td><td>${m.osId ? `<a href="#/os/${m.osId}">${esc(m.origin)}</a>` : esc(m.origin)}</td><td class="muted">${fmtDT(m.at)}</td></tr>`).join('')}
        </tbody></table></div>` : `<div class="empty-state">${icon('repeat')}<div>Nenhuma movimentação registrada.</div></div>`}
      </section>
      <div class="grid" style="align-content:start">
        <section class="card glass">
          <div class="card-head"><h3>Resumo do item</h3></div>
          <dl class="kv">
            <dt>Categoria</dt><dd>${esc(p.category || '-')}</dd>
            <dt>Preço</dt><dd>${money(p.price)}</dd>
            <dt>Fator de conversão</dt><dd>${p.factor || 1}</dd>
            <dt>Descrição</dt><dd>${esc(p.desc || '-')}</dd>
          </dl>
        </section>
        <section class="card glass">
          <div class="card-head"><h3>Saídas em OS</h3></div>
          ${osOut.length ? `<div class="list">${osOut.slice().reverse().map((m) => `<a class="list-item" href="${m.osId ? '#/os/' + m.osId : '#/ordens'}" style="text-decoration:none;color:inherit"><div class="meta"><strong>${esc(m.origin)}</strong><small>${fmtDT(m.at)}</small></div><div class="end">${m.qty}</div></a>`).join('')}</div>` : '<p class="muted" style="margin:0">Ainda não houve baixa automática deste item em ordens de serviço.</p>'}
        </section>
      </div>
    </div>`;
}
function stockItemMount(id) {
  const p = catById(id);
  if (!p) return;
  $('#itEdit').onclick = () => openItem(p.id);
  $('#itAdjust').onclick = () => {
    openDrawer(`
      ${drawerHead('Ajustar estoque', `${esc(p.name)} · saldo atual ${p.stock}`)}
      <form class="drawer-body" id="adjForm">
        <div class="seg" style="margin:0" id="adjType"><button type="button" data-t="entrada" class="on">Entrada</button><button type="button" data-t="saida">Saída</button><button type="button" data-t="ajuste">Ajuste (saldo exato)</button></div>
        <div class="form-grid">
          <div class="field"><label for="adjQty" id="adjLbl">Quantidade</label><input class="input" id="adjQty" type="number" min="0" value="1" required></div>
          <div class="field"><label for="adjOrigin">Motivo / origem</label><input class="input" id="adjOrigin" placeholder="Ex.: Compra, inventário, perda"></div>
        </div>
        <p class="hint" id="adjPrev"></p>
      </form>
      <div class="drawer-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit" form="adjForm">${icon('check')}Registrar</button></div>`, { focus: true });
    let t = 'entrada';
    const prev = () => {
      const q = +$('#adjQty').value || 0;
      const after = t === 'entrada' ? p.stock + q : t === 'saida' ? Math.max(0, p.stock - q) : q;
      $('#adjLbl').textContent = t === 'ajuste' ? 'Novo saldo' : 'Quantidade';
      $('#adjPrev').textContent = `Saldo: ${p.stock} → ${after}`;
    };
    $$('#adjType button').forEach((b) => (b.onclick = () => { t = b.dataset.t; $$('#adjType button').forEach((x) => x.classList.toggle('on', x === b)); prev(); }));
    $('#adjQty').oninput = prev; prev();
    $('#adjForm').onsubmit = (e) => {
      e.preventDefault();
      const q = +$('#adjQty').value || 0;
      const delta = t === 'entrada' ? q : t === 'saida' ? -q : q - p.stock;
      if (!delta) return closeDrawer();
      stockMove(p, delta, t, $('#adjOrigin').value.trim() || (t === 'ajuste' ? 'Ajuste manual' : t === 'entrada' ? 'Entrada manual' : 'Saída manual'));
      closeDrawer(); refresh(); toast('Estoque atualizado', 'box');
    };
  };
}
