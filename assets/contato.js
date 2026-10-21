/* =========================================================
   Novo contato — igual ao sistema antigo: Nome, E-mail, WhatsApp e
   Clientes (seleção múltipla com busca). Ao marcar um cliente, as
   filiais dele entram automaticamente (dá para desmarcar alguma).
   Cargo, tipo e observações ficam em “Mais informações”.
   Vínculo salvo em contato.clients = [{ clientId, branches: [nomes] }]
   ========================================================= */
const contactClients = (x) => x.clients || [];
const contactLinksClient = (x, c) => contactClients(x).some((l) => l.clientId === c.id);
const contactBranchesFor = (x, c) => (contactClients(x).find((l) => l.clientId === c.id) || {}).branches || [];

// Uma vez: contatos antigos (empresa/filial em texto) passam para o vínculo novo
(function migrateContacts() {
  const d = DB.data;
  if (!Array.isArray(d.contatos)) return;
  let changed = false;
  d.contatos.forEach((x) => {
    if (x.clients) return;
    const c = d.clients.find((k) => k.name.toLowerCase() === (x.company || '').trim().toLowerCase());
    x.clients = c ? [{ clientId: c.id, branches: x.branch ? [x.branch] : (c.filiais || []).map((b) => b.name) }] : [];
    changed = true;
  });
  if (changed) DB.save();
})();

// Texto curto dos clientes de um contato (lista e tabela)
function contactClientsLabel(x) {
  const links = contactClients(x);
  if (!links.length) return esc(x.company || '—');
  return links.map((l) => {
    const c = client(l.clientId), all = (c.filiais || []).length;
    const b = l.branches || [];
    return `${esc(c.name)}${all ? `<span class="muted"> · ${b.length === all ? 'todas as filiais' : b.length ? b.map(esc).join(', ') : 'só matriz'}</span>` : ''}`;
  }).join('<br>');
}

const WA_MASK = (v) => {
  v = v.replace(/\D/g, '').slice(0, 11);
  if (v.length > 6) return v.replace(/(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 2) return v.replace(/(\d{2})(\d+)/, '($1) $2');
  return v;
};

function openContact(rec, preset = {}) {
  const isNew = !rec;
  const v = rec || { type: 'Cliente', ...preset };
  // seleção: clientId -> Set(filiais)
  const sel = new Map(contactClients(v).map((l) => [l.clientId, new Set(l.branches || [])]));
  if (isNew && preset.clientId) { const c = client(preset.clientId); sel.set(c.id, new Set((c.filiais || []).map((b) => b.name))); }

  openDrawer(`
    ${drawerHead(isNew ? 'Novo contato' : esc(v.name), isNew ? '' : 'Contato')}
    <form class="drawer-body" id="ctForm">
      <div class="field"><label for="ctName">Nome</label><input class="input" id="ctName" value="${esc(v.name || '')}" required></div>
      <div class="field"><label for="ctEmail">E-mail</label><input class="input" id="ctEmail" type="email" value="${esc(v.email || '')}"></div>
      <div class="field"><label for="ctPhone">WhatsApp</label><input class="input" id="ctPhone" value="${esc(v.phone || '')}" placeholder="(85) 90000-0000" inputmode="tel"></div>
      <div class="field">
        <label for="msBtn">Clientes</label>
        <div class="ms" id="ms">
          <button type="button" class="input ms-trigger" id="msBtn" aria-haspopup="listbox" aria-expanded="false"><span id="msText">Selecione os clientes</span>${icon('chevD')}</button>
          <div class="ms-pop" id="msPop" hidden>
            <div class="input-wrap">${icon('search')}<input class="input" id="msSearch" placeholder="Buscar cliente..." autocomplete="off"></div>
            <div class="ms-list" id="msList" role="listbox" aria-multiselectable="true"></div>
          </div>
        </div>
        <div class="ms-chips" id="msChips"></div>
        <small class="hint">Ao marcar um cliente, as filiais dele entram automaticamente.</small>
      </div>
      <details class="ct-more" ${v.role || v.notes || (v.type && v.type !== 'Cliente') ? 'open' : ''}>
        <summary>Mais informações</summary>
        <div class="form-grid" style="margin-top:12px">
          <div class="field"><label for="ctRole">Cargo / função</label><input class="input" id="ctRole" value="${esc(v.role || '')}"></div>
          <div class="field"><label for="ctType">Tipo</label><select class="input" id="ctType">${['Cliente', 'Fornecedor', 'Parceiro', 'Técnico', 'Outro'].map((t) => `<option ${v.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
          <div class="field full"><label for="ctCompany">Empresa (se não for cliente)</label><input class="input" id="ctCompany" list="ctSup" value="${esc(contactClients(v).length ? '' : v.company || '')}" placeholder="Ex.: fornecedor ou parceiro"><datalist id="ctSup">${(D().fornecedores || []).map((f) => `<option value="${esc(f.name)}">`).join('')}</datalist></div>
          <div class="field full"><label for="ctNotes">Observações</label><textarea class="input" id="ctNotes" rows="3">${esc(v.notes || '')}</textarea></div>
        </div>
      </details>
    </form>
    <div class="drawer-foot">
      ${isNew ? '' : `<button class="btn btn-ghost btn-sm" id="ctDel" style="margin-right:auto;color:var(--danger)">${icon('trash')}Excluir</button>`}
      <button class="btn btn-ghost" data-close>Cancelar</button>
      <button class="btn btn-primary" type="submit" form="ctForm">${icon('check')}Salvar</button>
    </div>`, { focus: isNew });

  $('#ctPhone').oninput = (e) => (e.target.value = WA_MASK(e.target.value));

  const pop = $('#msPop'), btn = $('#msBtn');
  const setOpen = (o) => { pop.hidden = !o; btn.setAttribute('aria-expanded', o); $('#ms').classList.toggle('open', o); if (o) { $('#msSearch').focus(); requestAnimationFrame(() => pop.scrollIntoView({ block: 'nearest', behavior: 'smooth' })); } };
  const paint = () => {
    const q = $('#msSearch').value.trim().toLowerCase();
    const clients = D().clients.slice().sort((a, b) => a.name.localeCompare(b.name));
    const rows = clients.filter((c) => !q || c.name.toLowerCase().includes(q) || (c.filiais || []).some((b) => b.name.toLowerCase().includes(q))).map((c) => {
      const on = sel.has(c.id), fil = c.filiais || [];
      return `<div class="ms-opt ${on ? 'on' : ''}">
        <label><input type="checkbox" data-cli="${c.id}" ${on ? 'checked' : ''}><span>${esc(c.name)}</span>${fil.length ? `<small>${fil.length} ${fil.length === 1 ? 'filial' : 'filiais'}</small>` : ''}</label>
        ${on && fil.length ? `<div class="ms-sub">${fil.map((b) => `<label><input type="checkbox" data-br="${c.id}" value="${esc(b.name)}" ${sel.get(c.id).has(b.name) ? 'checked' : ''}><span>${esc(b.name)}</span></label>`).join('')}</div>` : ''}
      </div>`;
    }).join('');
    $('#msList').innerHTML = rows || '<div class="muted" style="padding:10px">Nenhum cliente encontrado.</div>';
    $$('#msList [data-cli]').forEach((cb) => (cb.onchange = () => {
      const c = client(+cb.dataset.cli);
      if (cb.checked) sel.set(c.id, new Set((c.filiais || []).map((b) => b.name))); // filiais entram automaticamente
      else sel.delete(c.id);
      if (cb.checked && $('#ctType').value !== 'Cliente') $('#ctType').value = 'Cliente';
      paint(); chips();
    }));
    $$('#msList [data-br]').forEach((cb) => (cb.onchange = () => {
      const set = sel.get(+cb.dataset.br);
      cb.checked ? set.add(cb.value) : set.delete(cb.value);
      chips();
    }));
  };
  const chips = () => {
    const n = sel.size;
    $('#msText').textContent = n ? `${n} cliente${n > 1 ? 's' : ''} selecionado${n > 1 ? 's' : ''}` : 'Selecione os clientes';
    $('#msChips').innerHTML = [...sel.entries()].map(([id, set]) => {
      const c = client(id), all = (c.filiais || []).length;
      const sub = all ? (set.size === all ? 'todas as filiais' : set.size ? [...set].join(', ') : 'só matriz') : '';
      return `<span class="ms-chip">${esc(c.name)}${sub ? `<small>${esc(sub)}</small>` : ''}<button type="button" data-rm="${id}" aria-label="Remover ${esc(c.name)}">${icon('x')}</button></span>`;
    }).join('');
    $$('#msChips [data-rm]').forEach((b) => (b.onclick = () => { sel.delete(+b.dataset.rm); chips(); if (!pop.hidden) paint(); }));
  };
  btn.onclick = () => { setOpen(pop.hidden); if (!pop.hidden) paint(); };
  $('#msSearch').oninput = paint;
  $('#ms').addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { e.stopPropagation(); setOpen(false); btn.focus(); } });
  $('#drawer').addEventListener('click', (e) => { if (!pop.hidden && !$('#ms').contains(e.target)) setOpen(false); });
  chips();

  $('#ctForm').onsubmit = (e) => {
    e.preventDefault();
    const name = $('#ctName').value.trim();
    if (!name) { $('#ctName').classList.add('invalid'); $('#ctName').focus(); return; }
    const clients = [...sel.entries()].map(([clientId, set]) => ({ clientId, branches: [...set] }));
    const data = {
      name, email: $('#ctEmail').value.trim(), phone: $('#ctPhone').value.trim(),
      role: $('#ctRole').value.trim(), type: $('#ctType').value, notes: $('#ctNotes').value.trim(),
      clients, company: clients.length ? client(clients[0].clientId).name : $('#ctCompany').value.trim(), branch: '',
    };
    data._clientsText = clients.map((l) => client(l.clientId).name + ' ' + l.branches.join(' ')).join(' ');
    if (rec) Object.assign(rec, data);
    else D().contatos.push({ id: D().nextId.contatos++, ...data });
    closeDrawer(); refresh(); toast(rec ? 'Contato atualizado' : 'Contato salvo', 'contact');
  };
  const del = $('#ctDel');
  if (del) del.onclick = () => { if (confirm(`Excluir o contato “${v.name}”?`)) { D().contatos = D().contatos.filter((x) => x !== rec); closeDrawer(); refresh(); toast('Contato excluído', 'trash'); } };
}

// A página de Contatos usa este formulário e mostra os clientes vinculados
(function wireContactsPage() {
  const cfg = MODULES.contatos;
  cfg.open = (_cfg, r) => openContact(r);
  cfg.fields = cfg.fields.filter((f) => !['branch'].includes(f.k));
  cfg.columns = [
    { label: 'Nome', html: (c) => `<div class="who">${avatar(c.name)}<div><b>${esc(c.name)}</b><small>${esc(c.role || c.type || '')}</small></div></div>` },
    { label: 'E-mail', html: (c) => (c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '—') },
    { label: 'WhatsApp', html: (c) => (c.phone ? `<a href="${waLink(c.phone, 'Olá!')}" target="_blank" rel="noopener">${esc(c.phone)}</a>` : '—') },
    { label: 'Cliente', html: (c) => `<span class="ct-clients">${contactClientsLabel(c)}</span>` },
    { label: '', html: (c) => `<button class="more" data-act="copy" data-id="${c.id}" title="Copiar telefone">${icon('copy')}</button>` },
  ];
  // busca também pelos nomes dos clientes e filiais vinculados
  cfg.fields = [...cfg.fields, { k: '_clientsText', label: '', hidden: true }];
  const refreshText = () => (D().contatos || []).forEach((x) => (x._clientsText = contactClients(x).map((l) => client(l.clientId).name + ' ' + (l.branches || []).join(' ')).join(' ')));
  refreshText();
  window.addEventListener('hashchange', refreshText);
})();
