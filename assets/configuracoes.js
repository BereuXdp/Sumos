/* =========================================================
   Configurações — mesmo grupo do sistema antigo:
   Usuários, Empresa, API, MCP, SMTP, Notificações e Modelos de Doc.
   (as preferências do protótipo continuam em #/configuracoes)
   ========================================================= */
const CFG_DEFAULT_COMPANY = { name: 'Suporte Mais', tradeName: 'suporte+', document: '00.000.000/0001-00', profitMargin: 45, rmaLabelWidth: 75, rmaLabelHeight: 35, stockGridMaxColumn: 'E', stockGridMaxRow: 5, stockLowThreshold: 2, stockCriticalThreshold: 1 };
const company = () => D().settings.company;
const randKey = (n = 32) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 56]).join('');

(function ensureSettings() {
  const d = DB.data;
  let changed = false;
  const day = (n, h = 10, m = 0) => { const x = new Date(Date.now() + n * 864e5); x.setHours(h, m, 0, 0); return x.toISOString(); };
  if (!d.settings) { d.settings = { company: { ...CFG_DEFAULT_COMPANY }, smtp: { host: 'smtp.gmail.com', port: 587, user: '', fromName: 'Suporte Mais', fromEmail: '', secure: false } }; changed = true; }
  if (!d.users) {
    d.users = REAL_TECHS.map((name, i) => ({ id: i + 1, name, email: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '.') + '@exemplo.com', role: 'Técnico', phone: '', active: true, lastLogin: day(-(i % 4), 8 + i) }));
    d.users.push({ id: d.users.length + 1, name: 'Atendimento', email: 'atendimento@exemplo.com', role: 'Atendente', phone: '', active: true, lastLogin: day(0, 8) });
    d.nextId.users = d.users.length + 1; changed = true;
  }
  if (!d.apiKeys) {
    d.apiKeys = [
      { id: 1, name: 'Bot do WhatsApp', key: 'sk_demo_' + randKey(24), active: true, createdAt: day(-90), lastUse: day(0, 9, 12), ip: '177.10.0.21' },
      { id: 2, name: 'Portal do cliente', key: 'sk_demo_' + randKey(24), active: true, createdAt: day(-60), lastUse: day(-1, 17, 40), ip: '177.10.0.35' },
      { id: 3, name: 'Planilha antiga', key: 'sk_demo_' + randKey(24), active: false, createdAt: day(-200), lastUse: day(-120), ip: '' },
    ];
    d.nextId.apiKeys = 4; changed = true;
  }
  if (!d.mcpCreds) {
    d.mcpCreds = [
      { id: 1, name: 'Agente de triagem', prefix: 'mcp_' + randKey(6), scopes: ['clients.read', 'tickets.read', 'knowledge.read'], limit: 60, active: true, lastUse: day(0, 8, 30) },
      { id: 2, name: 'Agente de relatórios', prefix: 'mcp_' + randKey(6), scopes: ['tickets.read', 'reports.read', 'technicians.read'], limit: 30, active: true, lastUse: day(-2, 18) },
      { id: 3, name: 'Teste antigo', prefix: 'mcp_' + randKey(6), scopes: ['tickets.read'], limit: 10, active: false, lastUse: '' },
    ];
    d.nextId.mcpCreds = 4; changed = true;
  }
  if (!d.notifLog) {
    const comps = ['PAD-SRV-01', 'CLI-REC-02', 'LIMA-SRV01', 'HOT-NOC-01', 'MER-CX-03'];
    d.notifLog = Array.from({ length: 24 }, (_, i) => ({ id: i + 1, at: day(-Math.floor(i / 4), 18 - (i % 4) * 2, (i * 17) % 60), computer: comps[i % comps.length], user: REAL_TECHS[i % 3], provider: i % 7 === 3 ? 'email' : 'whatsapp', status: i % 9 === 4 ? 'error' : 'sent' }));
    changed = true;
  }
  if (!d.docTemplates) {
    d.docTemplates = [
      { id: 1, name: 'Declaração de armazenamento', category: 'Segurança', desc: '', body: '<h2>Declaração de armazenamento</h2><p>Eu, {{responsavel_cliente}}, representante de <b>{{nome_cliente}}</b> (CNPJ {{cnpj_cliente}}), declaro que o equipamento referente à OS {{numero_os}} ficará armazenado nas dependências de {{nome_empresa_prestadora}} (CNPJ {{cnpj_prestadora}}).</p><p>Fortaleza, {{data_atual}}.</p><p><br>______________________________<br>{{responsavel_cliente}}</p>' },
      { id: 2, name: 'Declaração de armazenamento de imagens', category: 'Segurança', desc: 'Termo de responsabilidade sobre imagens de CFTV', body: '<h2>Termo de responsabilidade sobre imagens de CFTV</h2><p>{{nome_cliente}}, localizado em {{endereco_cliente}}, é o único responsável pelo uso e guarda das imagens gravadas pelo sistema de CFTV instalado por {{nome_empresa_prestadora}}.</p><p>Técnico responsável: {{nome_responsavel_tecnico}} ({{cargo_responsavel}}).</p><p>{{data_atual}}</p>' },
      { id: 3, name: 'Descarte seguro', category: 'Infraestrutura', desc: 'Declaração de descarte seguro de equipamentos', body: '<h2>Declaração de descarte seguro</h2><p>Declaramos que os equipamentos recolhidos de {{nome_cliente}} na OS {{numero_os}} foram descartados de forma segura, com destruição dos dados armazenados, em {{data_atual}}.</p><p>{{nome_empresa_prestadora}} · {{nome_responsavel_tecnico}}</p>' },
      { id: 4, name: 'Relatório de diagnóstico técnico e recomendação de substituição', category: 'Geral', desc: 'Modelo profissional para recomendar troca de equipamento', body: '<h2>Relatório de diagnóstico técnico</h2><p><b>Cliente:</b> {{nome_cliente}}<br><b>OS:</b> {{numero_os}}<br><b>Data:</b> {{data_atual}}</p><h3>Diagnóstico</h3><p>Descreva aqui o que foi encontrado.</p><h3>Recomendação</h3><p>Recomendamos a substituição do equipamento pelos motivos acima.</p><p>{{nome_responsavel_tecnico}} — {{cargo_responsavel}}</p>' },
    ];
    d.nextId.docTemplates = 5; changed = true;
  }
  // Técnicos da OS/agenda = usuários ativos com função Técnico
  const techs = d.users.filter((u) => u.active && u.role === 'Técnico').map((u) => u.name);
  if (techs.length && techs.join('|') !== d.techs.join('|')) { d.techs = techs; changed = true; }
  if (changed) DB.save();
})();
function syncTechs() { D().techs = D().users.filter((u) => u.active && u.role === 'Técnico').map((u) => u.name); }

const cfgHead = (title, sub, actions = '') => `<div class="page-head"><div><small class="eyebrow">Configurações</small><h1>${title}</h1><p>${sub}</p></div><div class="actions">${actions}</div></div>`;
const copyBtn = (text, label) => `<button class="more" data-copytext="${esc(text)}" data-copylabel="${esc(label)}" title="Copiar">${icon('copy')}</button>`;
function bindCopy() { $$('[data-copytext]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); navigator.clipboard?.writeText(b.dataset.copytext).then(() => toast(b.dataset.copylabel || 'Copiado', 'copy'), () => toast('Não foi possível copiar', 'alert')); })); }

/* ---------------- Usuários ---------------- */
const ROLES = { Administrador: 'Acesso total, inclusive Configurações', Técnico: 'Recebe OS, aparece na agenda e nos relatórios', Atendente: 'Abre e acompanha OS, sem Configurações' };
PAGES.usuarios = {
  render() {
    const u = D().users;
    return `${cfgHead('Usuários', `${u.filter((x) => x.active).length} ativos · ${u.filter((x) => x.role === 'Técnico' && x.active).length} técnicos`, '<button class="btn btn-primary" onclick="openUser()"><span data-icon="plus"></span>Novo usuário</button>')}
      <div class="notice">${icon('alert')}Não consegui abrir esta página no sistema antigo (o seu usuário foi redirecionado). Ela foi montada a partir do que o resto do sistema usa: técnicos com função e status.</div>
      <div class="card glass"><div class="table-wrap"><table class="t">
        <thead><tr><th class="nosort">Usuário</th><th class="nosort">E-mail</th><th class="nosort">Função</th><th class="nosort">Status</th><th class="nosort">Último acesso</th><th class="nosort">OS abertas</th><th class="nosort"></th></tr></thead>
        <tbody>${u.map((x) => `<tr data-id="${x.id}">
          <td><div class="who">${avatar(x.name)}<b>${esc(x.name)}</b></div></td>
          <td class="muted">${esc(x.email)}</td>
          <td><span class="badge ${x.role === 'Administrador' ? 'b-brand' : x.role === 'Técnico' ? 'b-accent' : 'b-muted'}">${x.role}</span></td>
          <td>${x.active ? '<span class="badge b-ok">Ativo</span>' : '<span class="badge b-muted">Inativo</span>'}</td>
          <td class="muted">${x.lastLogin ? relTime(x.lastLogin) : 'Nunca'}</td>
          <td>${D().orders.filter((o) => o.tech === x.name && !osClosed(o)).length}</td>
          <td><button class="btn btn-ghost btn-sm" data-toggle="${x.id}">${x.active ? 'Desativar' : 'Reativar'}</button></td>
        </tr>`).join('')}</tbody></table></div></div>`;
  },
  mount() {
    $$('#view tbody tr').forEach((tr) => (tr.onclick = (e) => { if (!e.target.closest('button')) openUser(+tr.dataset.id); }));
    $$('[data-toggle]').forEach((b) => (b.onclick = () => {
      const x = D().users.find((y) => y.id === +b.dataset.toggle);
      const open = D().orders.filter((o) => o.tech === x.name && !osClosed(o)).length;
      if (x.active && open && !confirm(`${x.name} tem ${open} OS abertas. Desativar mesmo assim? As OS continuam com o nome dele até você reatribuir.`)) return;
      x.active = !x.active; syncTechs(); refresh();
      toast(x.active ? 'Usuário reativado' : 'Usuário desativado');
    }));
  },
};
function openUser(id) {
  const x = id ? D().users.find((u) => u.id === id) : null;
  const v = x || { role: 'Técnico', active: true };
  openDrawer(`
    ${drawerHead(x ? esc(x.name) : 'Novo usuário', x ? esc(x.email) : '')}
    <form class="drawer-body" id="userForm">
      <div class="photo-field">
        <span id="uPhotoPrev">${v.photo ? `<img class="avatar avatar-img big" src="${v.photo}" alt="">` : `<span class="avatar big">${esc(initials(v.name || '?'))}</span>`}</span>
        <div>
          <b>Foto do usuário</b>
          <small class="hint">Aparece na Agenda, nas OS e nos relatórios. JPG ou PNG; é recortada em quadrado automaticamente.</small>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
            <label class="btn btn-ghost btn-sm" style="cursor:pointer">${icon('plus')}${v.photo ? 'Trocar foto' : 'Enviar foto'}<input type="file" id="uPhoto" accept="image/*" hidden></label>
            <button type="button" class="btn btn-ghost btn-sm" id="uPhotoDel" ${v.photo ? '' : 'hidden'}>${icon('trash')}Remover</button>
          </div>
        </div>
      </div>
      <div class="form-grid">
        <div class="field full"><label for="uName">Nome</label><input class="input" id="uName" value="${esc(v.name || '')}" required></div>
        <div class="field full"><label for="uEmail">E-mail de acesso</label><input class="input" id="uEmail" type="email" value="${esc(v.email || '')}" required></div>
        <div class="field"><label for="uPhone">WhatsApp</label><input class="input" id="uPhone" value="${esc(v.phone || '')}" placeholder="(85) 90000-0000"></div>
        <div class="field"><label for="uRole">Função</label><select class="input" id="uRole">${Object.keys(ROLES).map((r) => `<option ${v.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
      </div>
      <p class="hint" id="uRoleHint">${ROLES[v.role]}</p>
      ${x ? '' : '<p class="hint">No sistema final o usuário recebe um e-mail para criar a própria senha. Aqui no protótipo nenhuma senha é cadastrada.</p>'}
    </form>
    <div class="drawer-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit" form="userForm">${icon('check')}Salvar</button></div>`, { focus: !x });
  $('#uRole').onchange = (e) => ($('#uRoleHint').textContent = ROLES[e.target.value]);
  // Foto: recorta no centro e reduz para 160×160 (cabe no armazenamento do navegador)
  let photo = v.photo || '';
  const paintPhoto = () => {
    $('#uPhotoPrev').innerHTML = photo ? `<img class="avatar avatar-img big" src="${photo}" alt="">` : `<span class="avatar big">${esc(initials($('#uName').value || '?'))}</span>`;
    $('#uPhotoDel').hidden = !photo;
  };
  $('#uPhoto').onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(img.width, img.height), cv = document.createElement('canvas');
        cv.width = cv.height = 160;
        cv.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 160, 160);
        photo = cv.toDataURL('image/jpeg', 0.82);
        paintPhoto();
      };
      img.onerror = () => toast('Não consegui abrir essa imagem', 'alert');
      img.src = r.result;
    };
    r.readAsDataURL(f);
  };
  $('#uPhotoDel').onclick = () => { photo = ''; paintPhoto(); };
  $('#uName').addEventListener('input', () => { if (!photo) paintPhoto(); });
  $('#userForm').onsubmit = (e) => {
    e.preventDefault();
    const data = { name: $('#uName').value.trim(), email: $('#uEmail').value.trim(), phone: $('#uPhone').value.trim(), role: $('#uRole').value, photo };
    if (x) {
      if (x.name !== data.name) D().orders.forEach((o) => { if (o.tech === x.name) o.tech = data.name; });
      Object.assign(x, data);
    } else D().users.push({ id: D().nextId.users++, ...data, active: true, lastLogin: '' });
    syncTechs(); closeDrawer(); refresh(); toast(x ? 'Usuário atualizado' : 'Usuário criado');
  };
}

/* ---------------- Páginas dentro de #/configuracoes/... ---------------- */
const CFG = {};

CFG.empresa = {
  render() {
    const c = company();
    const f = (k, label, type = 'text', hint = '', extra = '') => `<div class="field"><label for="c_${k}">${label}</label><input class="input" id="c_${k}" type="${type}" value="${esc(c[k] ?? '')}" ${extra}>${hint ? `<small class="hint">${hint}</small>` : ''}</div>`;
    return `${cfgHead('Configurações da Empresa', 'Informações principais da sua empresa e regras do negócio.')}
      <form class="card glass" id="cfgCompany">
        <div class="card-head"><h3>Dados da empresa</h3></div>
        <div class="form-grid">
          ${f('name', 'Razão social')}${f('tradeName', 'Nome fantasia')}
          ${f('document', 'CNPJ')}
          ${f('profitMargin', 'Margem de lucro padrão (%)', 'number', 'Usada para calcular o preço de venda na importação de NFe. Preço = custo / (1 − margem/100).', 'min="0" max="95"')}
        </div>
        <div class="card-head" style="margin-top:18px"><h3>Etiqueta de RMA</h3></div>
        <div class="form-grid">${f('rmaLabelWidth', 'Largura da etiqueta (mm)', 'number', '', 'min="20"')}${f('rmaLabelHeight', 'Altura da etiqueta (mm)', 'number', '', 'min="15"')}</div>
        <div class="card-head" style="margin-top:18px"><h3>Estoque</h3></div>
        <div class="form-grid">
          ${f('stockGridMaxColumn', 'Mapa: última coluna (A–Z)', 'text', 'Define a largura do mapa do estoque.', 'maxlength="1" style="text-transform:uppercase"')}
          ${f('stockGridMaxRow', 'Mapa: última linha', 'number', '', 'min="1" max="30"')}
          ${f('stockLowThreshold', 'Limite para alerta baixo', 'number', 'Saldo menor ou igual a esse valor fica marcado como estoque baixo.', 'min="0"')}
          ${f('stockCriticalThreshold', 'Limite para alerta crítico', 'number', 'Saldo menor ou igual a esse valor fica marcado como crítico.', 'min="0"')}
        </div>
        <div class="row-between" style="justify-content:flex-end;margin-top:16px"><button class="btn btn-primary" type="submit">${icon('check')}Salvar alterações</button></div>
      </form>`;
  },
  mount() {
    $('#cfgCompany').onsubmit = (e) => {
      e.preventDefault();
      const c = company();
      ['name', 'tradeName', 'document'].forEach((k) => (c[k] = $('#c_' + k).value.trim()));
      ['profitMargin', 'rmaLabelWidth', 'rmaLabelHeight', 'stockGridMaxRow', 'stockLowThreshold', 'stockCriticalThreshold'].forEach((k) => (c[k] = +$('#c_' + k).value || 0));
      c.stockGridMaxColumn = (($('#c_stockGridMaxColumn').value || 'E').toUpperCase().match(/[A-Z]/) || ['E'])[0];
      c.stockGridMaxRow = Math.max(1, Math.min(30, c.stockGridMaxRow || 5));
      if (c.stockCriticalThreshold > c.stockLowThreshold) c.stockLowThreshold = c.stockCriticalThreshold;
      refresh(); toast('Configurações da empresa salvas');
    };
  },
};

CFG.api = {
  render() {
    const k = D().apiKeys;
    const host = 'https://sumos.devmais.com';
    return `${cfgHead('Configurações · API', 'Gerencie as chaves usadas por apps externos para consultar, criar e atualizar Ordens de Serviço.')}
      <div class="notice">${icon('alert')}Protótipo: as chaves geradas aqui são de demonstração e não funcionam no sistema real.</div>
      <div class="card glass">
        <form class="toolbar" id="apiNew" style="margin-bottom:6px"><div class="field" style="flex:1;min-width:220px"><label for="apiName">Nome da integração</label><input class="input" id="apiName" placeholder="Ex.: Bot do WhatsApp" required></div><button class="btn btn-primary" type="submit" style="align-self:flex-end">${icon('plus')}Criar chave</button></form>
        <div id="apiShow"></div>
        <div class="table-wrap"><table class="t">
          <thead><tr><th class="nosort">Integração</th><th class="nosort">Chave</th><th class="nosort">Status</th><th class="nosort">Criada em</th><th class="nosort">Último uso</th><th class="nosort">IP</th><th class="nosort">Ações</th></tr></thead>
          <tbody>${k.map((x) => `<tr style="cursor:default"><td><b>${esc(x.name)}</b></td><td><span class="secret">${esc(x.key.slice(0, 11))}••••${esc(x.key.slice(-4))}</span></td><td>${x.active ? '<span class="badge b-ok">Ativa</span>' : '<span class="badge b-muted">Desativada</span>'}</td><td class="muted">${fmtDate(x.createdAt)}</td><td class="muted">${x.lastUse ? relTime(x.lastUse) : 'Nunca'}</td><td class="muted mono">${esc(x.ip || '-')}</td><td><button class="btn btn-ghost btn-sm" data-apitoggle="${x.id}">${x.active ? 'Desativar' : 'Reativar'}</button></td></tr>`).join('')}</tbody>
        </table></div>
      </div>
      <div class="card glass">
        <div class="card-head"><div><h3>Como usar</h3><p>Envie a chave no cabeçalho <span class="mono">x-api-key</span>.</p></div></div>
        <div class="api-endpoints"><span class="badge b-ok">POST</span><span class="mono">/api/os</span><span class="muted">Abrir OS (pelo CNPJ do cliente)</span>
          <span class="badge b-warn">PATCH</span><span class="mono">/api/os/:id</span><span class="muted">Atualizar status, notas, solução, técnico e agendamento</span>
          <span class="badge b-brand">GET</span><span class="mono">/api/users?role=TECHNICIAN</span><span class="muted">Listar técnicos</span></div>
        <pre class="code">curl -X POST "${host}/api/os" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: SUA_CHAVE" \\
  -d '{ "document": "00.000.000/0001-00", "description": "Computador não liga", "sourceType": "MEU_APP", "sourceId": "ticket-123" }'

curl -X PATCH "${host}/api/os/UUID_DA_OS" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: SUA_CHAVE" \\
  -d '{ "status": "IN_PROGRESS", "notes": "Cliente avisado.", "technicianId": "UUID_DO_TECNICO", "scheduledAt": "2026-06-16T11:00:00.000Z" }'</pre>
      </div>`;
  },
  mount() {
    $('#apiNew').onsubmit = (e) => {
      e.preventDefault();
      const key = 'sk_demo_' + randKey(32);
      D().apiKeys.unshift({ id: D().nextId.apiKeys++, name: $('#apiName').value.trim(), key, active: true, createdAt: new Date().toISOString(), lastUse: '', ip: '' });
      refresh();
      $('#apiShow').innerHTML = `<div class="key-once"><div><b>Copie a chave agora.</b> Por segurança, ela não é mostrada de novo.</div><span class="secret">${esc(key)}</span>${copyBtn(key, 'Chave copiada')}</div>`;
      bindCopy();
    };
    $$('[data-apitoggle]').forEach((b) => (b.onclick = () => { const x = D().apiKeys.find((y) => y.id === +b.dataset.apitoggle); x.active = !x.active; refresh(); toast(x.active ? 'Chave reativada' : 'Chave desativada', 'key'); }));
  },
};

const MCP_READ = ['clients.read', 'technicians.read', 'tickets.read', 'knowledge.read', 'assets.read', 'reports.read'];
const MCP_WRITE = ['tickets.create', 'tickets.update', 'tickets.notes.write', 'tickets.assign', 'tickets.status.write', 'tickets.finish'];
CFG.mcp = {
  render() {
    const c = D().mcpCreds;
    const box = (s, checked) => `<label class="dd-check-row"><input type="checkbox" value="${s}" ${checked ? 'checked' : ''}><span class="mono">${s}</span></label>`;
    return `${cfgHead('Configurações · MCP', 'Credenciais de leitura para agentes. O tenant sai da credencial. A escrita de OS permanece desligada.')}
      <div class="grid g-main">
        <div class="card glass">
          <div class="card-head"><h3>Credenciais</h3><span class="badge b-muted">${c.filter((x) => x.active).length} ativas</span></div>
          <div id="mcpShow"></div>
          <div class="table-wrap"><table class="t">
            <thead><tr><th class="nosort">Nome</th><th class="nosort">Prefixo</th><th class="nosort">Escopos</th><th class="nosort">Limite</th><th class="nosort">Status</th><th class="nosort">Último uso</th><th class="nosort">Ações</th></tr></thead>
            <tbody>${c.map((x) => `<tr style="cursor:default"><td><b>${esc(x.name)}</b></td><td class="mono">${esc(x.prefix)}…</td><td>${x.scopes.map((s) => `<span class="tag ${MCP_WRITE.includes(s) ? 'tag-warn' : ''}">${s}</span>`).join('')}</td><td>${x.limit}/min</td><td>${x.active ? '<span class="badge b-ok">Ativa</span>' : '<span class="badge b-muted">Desativada</span>'}</td><td class="muted">${x.lastUse ? relTime(x.lastUse) : 'Nunca'}</td><td><button class="btn btn-ghost btn-sm" data-mcptoggle="${x.id}">${x.active ? 'Desativar' : 'Reativar'}</button></td></tr>`).join('')}</tbody>
          </table></div>
          <p class="section-title" style="margin-top:14px">Conexão</p>
          <pre class="code">POST https://sumos.devmais.com/api/mcp
Authorization: Bearer SUA_CREDENCIAL
Content-Type: application/json
Accept: application/json, text/event-stream</pre>
        </div>
        <form class="card glass" id="mcpNew" style="align-self:start">
          <div class="card-head"><h3>Criar credencial</h3></div>
          <div class="field"><label for="mcpName">Nome</label><input class="input" id="mcpName" placeholder="Ex.: Agente de triagem" required></div>
          <div class="field" style="margin-top:10px"><label for="mcpLimit">Limite por minuto</label><input class="input" id="mcpLimit" type="number" min="1" value="60"></div>
          <p class="section-title" style="margin-top:14px">Escopos de leitura</p>
          <div id="mcpRead">${MCP_READ.map((s) => box(s, s === 'tickets.read' || s === 'clients.read')).join('')}</div>
          <p class="section-title" style="margin-top:14px">Escopos de escrita</p>
          <p class="hint" style="margin:0 0 6px">Marque só o que o agente operacional precisa. <span class="mono">tickets.finish</span> fecha a OS de forma definitiva.</p>
          <div id="mcpWrite">${MCP_WRITE.map((s) => box(s, false)).join('')}</div>
          <button class="btn btn-primary" type="submit" style="margin-top:14px;width:100%">${icon('plus')}Criar credencial</button>
        </form>
      </div>`;
  },
  mount() {
    $('#mcpNew').onsubmit = (e) => {
      e.preventDefault();
      const scopes = $$('#mcpRead input:checked, #mcpWrite input:checked').map((i) => i.value);
      if (!scopes.length) return toast('Marque pelo menos um escopo', 'alert');
      if (scopes.includes('tickets.finish') && !confirm('O escopo tickets.finish permite fechar OS de forma definitiva. Continuar?')) return;
      const secret = 'mcp_' + randKey(40);
      D().mcpCreds.unshift({ id: D().nextId.mcpCreds++, name: $('#mcpName').value.trim(), prefix: secret.slice(0, 10), scopes, limit: +$('#mcpLimit').value || 60, active: true, lastUse: '' });
      refresh();
      $('#mcpShow').innerHTML = `<div class="key-once"><div><b>Credencial criada.</b> Copie agora; ela não é mostrada de novo (demonstração, não funciona no sistema real).</div><span class="secret">${esc(secret)}</span>${copyBtn(secret, 'Credencial copiada')}</div>`;
      bindCopy();
    };
    $$('[data-mcptoggle]').forEach((b) => (b.onclick = () => { const x = D().mcpCreds.find((y) => y.id === +b.dataset.mcptoggle); x.active = !x.active; refresh(); toast(x.active ? 'Credencial reativada' : 'Credencial desativada', 'key'); }));
  },
};

// A senha do SMTP não é salva no protótipo (fica só enquanto a página está aberta)
let smtpPassword = '';
CFG.smtp = {
  render() {
    const s = D().settings.smtp;
    return `${cfgHead('Configuração SMTP', 'Configure o servidor de e-mail para envio de notificações.')}
      <div class="grid g-main">
        <form class="card glass" id="smtpForm">
          <div class="form-grid">
            <div class="field"><label for="sHost">Host SMTP</label><input class="input" id="sHost" value="${esc(s.host)}" placeholder="smtp.gmail.com"></div>
            <div class="field"><label for="sPort">Porta</label><input class="input" id="sPort" type="number" value="${s.port}"></div>
            <div class="field"><label for="sUser">Usuário</label><input class="input" id="sUser" value="${esc(s.user)}" autocomplete="off"></div>
            <div class="field"><label for="sPass">Senha</label><input class="input" id="sPass" type="password" value="${esc(smtpPassword)}" autocomplete="new-password"><small class="hint">Gmail? Use uma Senha de App (16 caracteres) em vez da sua senha normal.</small></div>
            <div class="field"><label for="sFromName">Nome do remetente</label><input class="input" id="sFromName" value="${esc(s.fromName)}"></div>
            <div class="field"><label for="sFromEmail">E-mail do remetente</label><input class="input" id="sFromEmail" type="email" value="${esc(s.fromEmail)}"></div>
          </div>
          <div class="set-row"><div><b>Usar SSL/TLS (Secure)</b><small>Geralmente ativo para porta 465 e inativo para porta 587.</small></div><label class="switch"><input type="checkbox" id="sSecure" ${s.secure ? 'checked' : ''}><span></span></label></div>
          <p class="hint">Protótipo: a senha não é salva no navegador. Na versão final ela deve ficar criptografada no servidor.</p>
          <div class="row-between" style="justify-content:flex-end"><button class="btn btn-primary" type="submit">${icon('check')}Salvar configurações</button></div>
        </form>
        <div class="card glass" style="align-self:start">
          <div class="card-head"><h3>Testar conexão</h3></div>
          <div class="field"><label for="sTo">Enviar e-mail de teste para</label><input class="input" id="sTo" type="email" placeholder="voce@empresa.com"></div>
          <button class="btn btn-ghost" id="sTest" style="margin-top:10px;width:100%">${icon('mail')}Enviar teste</button>
          <div id="sTestOut" style="margin-top:10px"></div>
        </div>
      </div>`;
  },
  mount() {
    $('#sPort').oninput = (e) => { if (+e.target.value === 465) $('#sSecure').checked = true; if (+e.target.value === 587) $('#sSecure').checked = false; };
    $('#sPass').oninput = (e) => (smtpPassword = e.target.value);
    $('#smtpForm').onsubmit = (e) => {
      e.preventDefault();
      Object.assign(D().settings.smtp, { host: $('#sHost').value.trim(), port: +$('#sPort').value || 587, user: $('#sUser').value.trim(), fromName: $('#sFromName').value.trim(), fromEmail: $('#sFromEmail').value.trim(), secure: $('#sSecure').checked });
      DB.save(); toast('Configurações SMTP salvas (sem a senha)', 'mail');
    };
    $('#sTest').onclick = () => {
      const s = { host: $('#sHost').value.trim(), user: $('#sUser').value.trim(), to: $('#sTo').value.trim() };
      const miss = [!s.host && 'host', !s.user && 'usuário', !smtpPassword && 'senha', !/^\S+@\S+\.\S+$/.test(s.to) && 'destinatário'].filter(Boolean);
      $('#sTestOut').innerHTML = miss.length
        ? `<div class="notice" style="margin:0">${icon('alert')}Falta preencher: ${miss.join(', ')}.</div>`
        : `<div class="notice ok" style="margin:0">${icon('check')}Campos válidos. No protótipo o e-mail não é enviado de verdade; no sistema final este botão testa a conexão com ${esc(s.host)}.</div>`;
    };
  },
};

const NOTIF_STATE = { status: '', provider: '' };
CFG.notificacoes = {
  render() {
    const all = D().notifLog;
    const sent = all.filter((n) => n.status === 'sent').length, err = all.filter((n) => n.status === 'error').length;
    const list = all.filter((n) => (!NOTIF_STATE.status || n.status === NOTIF_STATE.status) && (!NOTIF_STATE.provider || n.provider === NOTIF_STATE.provider)).sort((a, b) => new Date(b.at) - new Date(a.at));
    return `${cfgHead('Configurações · Notificações', 'Envios automáticos de avisos para a equipe e os clientes.')}
      <div class="grid g-3">
        <button class="op-kpi k-ok ${NOTIF_STATE.status === 'sent' ? 'sel' : ''}" data-nst="sent"><div class="op-kpi-top"><span>Notificações enviadas</span></div><b>${sent}</b></button>
        <button class="op-kpi k-danger ${NOTIF_STATE.status === 'error' ? 'sel' : ''}" data-nst="error"><div class="op-kpi-top"><span>Erros de envio</span></div><b>${err}</b></button>
        <button class="op-kpi k-neutral" data-nst=""><div class="op-kpi-top"><span>Total processado</span></div><b>${all.length}</b></button>
      </div>
      <div class="card glass">
        <div class="card-head"><h3>Últimas notificações</h3>
          <select class="input" id="nProv" style="width:auto;height:36px"><option value="">Todos os provedores</option>${['whatsapp', 'email'].map((p) => `<option ${NOTIF_STATE.provider === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
        <div class="table-wrap"><table class="t">
          <thead><tr><th class="nosort">Data</th><th class="nosort">Computador</th><th class="nosort">Usuário</th><th class="nosort">Provedor</th><th class="nosort">Status</th><th class="nosort"></th></tr></thead>
          <tbody>${list.map((n) => `<tr style="cursor:default"><td>${fmtDT(n.at)}</td><td class="mono">${esc(n.computer)}</td><td>${esc(n.user)}</td><td><span class="badge ${n.provider === 'whatsapp' ? 'b-ok' : 'b-brand'}">${n.provider}</span></td><td>${n.status === 'sent' ? '<span class="badge b-ok">sent</span>' : '<span class="badge b-danger">error</span>'}</td><td>${n.status === 'error' ? `<button class="btn btn-ghost btn-sm" data-resend="${n.id}">Reenviar</button>` : ''}</td></tr>`).join('')}</tbody>
        </table></div>
      </div>`;
  },
  mount() {
    $$('[data-nst]').forEach((b) => (b.onclick = () => { NOTIF_STATE.status = NOTIF_STATE.status === b.dataset.nst ? '' : b.dataset.nst; router(); }));
    $('#nProv').onchange = (e) => { NOTIF_STATE.provider = e.target.value; router(); };
    $$('[data-resend]').forEach((b) => (b.onclick = () => { const n = D().notifLog.find((x) => x.id === +b.dataset.resend); n.status = 'sent'; n.at = new Date().toISOString(); refresh(); toast('Notificação reenviada (simulado)', 'bell'); }));
  },
};

/* ---------------- Modelos de Documentos ---------------- */
const DOC_CATS = ['Geral', 'Segurança', 'Redes', 'LGPD', 'Infraestrutura'];
const DOC_VARS = [
  ['nome_cliente', 'Nome do cliente'], ['cnpj_cliente', 'CPF/CNPJ do cliente'], ['endereco_cliente', 'Endereço completo'], ['responsavel_cliente', 'Contato responsável'],
  ['nome_empresa_prestadora', 'Sua empresa'], ['cnpj_prestadora', 'Seu CNPJ'], ['nome_responsavel_tecnico', 'Técnico logado'], ['cargo_responsavel', 'Cargo do técnico'],
  ['numero_os', 'Número da OS (se houver)'], ['data_atual', 'Data de hoje (dd/MM/aaaa)'],
];
const sanitizeDoc = (html) => html.replace(/<(script|style|iframe|object)[\s\S]*?<\/\1>/gi, '').replace(/\son\w+="[^"]*"/gi, '').replace(/javascript:/gi, '');
function fillDoc(body, ctx) {
  const c = ctx.clientId ? client(ctx.clientId) : {}, o = ctx.osId ? orderById(ctx.osId) : null;
  const me = (sessionStorage.getItem('sumos-user') || '').split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase());
  const tech = o?.tech || me || D().techs[0];
  const vals = {
    nome_cliente: c.name, cnpj_cliente: c.doc, endereco_cliente: c.address, responsavel_cliente: o?.requester || c.contact,
    nome_empresa_prestadora: company().name, cnpj_prestadora: company().document, nome_responsavel_tecnico: tech,
    cargo_responsavel: (D().users.find((u) => u.name === tech) || {}).role || 'Técnico', numero_os: o ? osCode(o, true) : '', data_atual: new Date().toLocaleDateString('pt-BR'),
  };
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (k in vals ? esc(vals[k] || '') : m));
}
// Emitir documento a partir de um modelo (usado também na ficha da OS)
function openGenerateDoc(ctx = {}) {
  const t = D().docTemplates;
  if (!t.length) return toast('Cadastre um modelo em Configurações › Modelos de Doc.', 'alert');
  const osOpts = D().orders.slice().sort((a, b) => b.id - a.id);
  openDrawer(`
    ${drawerHead('Emitir documento', 'Preenche as variáveis com os dados do cliente e da OS')}
    <form class="drawer-body" id="genForm">
      <div class="field"><label for="gTpl">Modelo</label><select class="input" id="gTpl">${t.map((x) => `<option value="${x.id}" ${ctx.tplId === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
      <div class="field"><label for="gOs">OS (opcional)</label><select class="input" id="gOs"><option value="">Sem OS</option>${osOpts.map((o) => `<option value="${o.id}" ${+ctx.osId === o.id ? 'selected' : ''}>${osCode(o, true)} · ${esc(client(o.clientId).name)}</option>`).join('')}</select></div>
      <div class="field"><label for="gCli">Cliente</label><select class="input" id="gCli">${D().clients.map((c) => `<option value="${c.id}" ${+ctx.clientId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
      <p class="section-title">Prévia</p>
      <div class="doc-preview" id="gPrev"></div>
    </form>
    <div class="drawer-foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit" form="genForm">${icon('printer')}Imprimir / salvar PDF</button></div>`);
  const prev = () => {
    const tpl = t.find((x) => x.id === +$('#gTpl').value);
    $('#gPrev').innerHTML = sanitizeDoc(fillDoc(tpl.body, { clientId: +$('#gCli').value, osId: +$('#gOs').value || null }));
  };
  $('#gOs').onchange = () => { const o = orderById($('#gOs').value); if (o) $('#gCli').value = o.clientId; prev(); };
  $('#gTpl').onchange = prev; $('#gCli').onchange = prev; prev();
  $('#genForm').onsubmit = (e) => {
    e.preventDefault();
    const o = orderById($('#gOs').value);
    if (o) { addHistory(o, 'Documento emitido: ' + t.find((x) => x.id === +$('#gTpl').value).name); DB.save(); }
    const pa = $('#printArea');
    pa.hidden = false;
    pa.innerHTML = `<div class="print-doc">${$('#gPrev').innerHTML}</div>`;
    window.print();
    setTimeout(() => (pa.hidden = true), 500);
  };
}

CFG.documentos = {
  render(sub) {
    if (sub) return this.editor(sub);
    const t = D().docTemplates;
    return `${cfgHead('Modelos de Documentos', 'Gerencie os modelos para geração automática de documentos.', `<button class="btn btn-ghost" onclick="openGenerateDoc()">${icon('printer')}Emitir documento</button><a class="btn btn-primary" href="#/configuracoes/documentos/novo"><span data-icon="plus"></span>Novo modelo</a>`)}
      <div class="card glass"><div class="table-wrap"><table class="t">
        <thead><tr><th class="nosort">Nome</th><th class="nosort">Categoria</th><th class="nosort">Descrição</th><th class="nosort">Ações</th></tr></thead>
        <tbody>${t.length ? t.map((x) => `<tr data-doc="${x.id}"><td><div class="who">${icon('file')}<b>${esc(x.name)}</b></div></td><td><span class="badge b-muted">${esc(x.category)}</span></td><td class="muted">${esc(x.desc || '-')}</td>
          <td><span class="inline-actions"><button class="more" data-gen="${x.id}" title="Emitir">${icon('printer')}</button><a class="more" href="#/configuracoes/documentos/${x.id}" title="Editar">${icon('edit')}</a><button class="more" data-deldoc="${x.id}" title="Excluir">${icon('trash')}</button></span></td></tr>`).join('') : `<tr><td colspan="4"><div class="empty-state">Nenhum modelo ainda.</div></td></tr>`}</tbody>
      </table></div></div>`;
  },
  editor(sub) {
    const x = sub === 'novo' ? null : D().docTemplates.find((d) => d.id === +sub);
    if (sub !== 'novo' && !x) return `<div class="empty-state">Modelo não encontrado. <a href="#/configuracoes/documentos">Voltar</a></div>`;
    const v = x || { name: '', category: '', desc: '', body: '' };
    return `<a href="#/configuracoes/documentos" class="back-link">${icon('chevL')}Modelos de Documentos</a>
      ${cfgHead(x ? 'Editar modelo' : 'Novo modelo de documento', 'O texto pode usar as variáveis da direita; elas são preenchidas ao emitir.')}
      <div class="grid g-main">
        <div class="grid">
          <div class="card glass">
            <div class="card-head"><h3>Informações do modelo</h3></div>
            <div class="form-grid">
              <div class="field"><label for="dName">Nome do documento</label><input class="input" id="dName" value="${esc(v.name)}" placeholder="Ex.: Termo de entrega"></div>
              <div class="field"><label for="dCat">Categoria</label><select class="input" id="dCat"><option value="">Selecione...</option>${DOC_CATS.map((c) => `<option ${v.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
              <div class="field full"><label for="dDesc">Descrição interna (opcional)</label><input class="input" id="dDesc" value="${esc(v.desc)}" placeholder="Ex.: Usado para entrega de equipamentos de CFTV"></div>
            </div>
          </div>
          <div class="card glass">
            <div class="card-head"><h3>Editor de conteúdo</h3>
              <div class="tabs-inline doc-tools">
                <button type="button" data-cmd="bold" title="Negrito"><b>B</b></button><button type="button" data-cmd="italic" title="Itálico"><i>I</i></button><button type="button" data-cmd="underline" title="Sublinhado"><u>S</u></button>
                <button type="button" data-cmd="formatBlock" data-arg="H2" title="Título">T</button><button type="button" data-cmd="insertUnorderedList" title="Lista">•</button><button type="button" data-cmd="justifyCenter" title="Centralizar">≡</button>
              </div></div>
            <div class="doc-editor" id="dBody" contenteditable="true" data-ph="Comece a escrever seu modelo aqui...">${sanitizeDoc(v.body)}</div>
          </div>
          <div class="row-between" style="justify-content:flex-end;gap:8px">
            <a class="btn btn-ghost" href="#/configuracoes/documentos">Cancelar</a>
            ${x ? `<button class="btn btn-ghost" id="dPreview">${icon('eye')}Pré-visualizar</button>` : ''}
            <button class="btn btn-primary" id="dSave">${icon('check')}Salvar modelo</button>
          </div>
        </div>
        <div class="card glass" style="align-self:start">
          <div class="card-head"><div><h3>Variáveis dinâmicas</h3><p>Clique para inserir no texto</p></div></div>
          <div class="doc-vars">${DOC_VARS.map(([k, l]) => `<button type="button" data-var="${k}"><span class="mono">{{${k}}}</span><small>${l}</small></button>`).join('')}</div>
        </div>
      </div>`;
  },
  mount(sub) {
    if (!sub) {
      $$('[data-doc]').forEach((tr) => (tr.onclick = (e) => { if (!e.target.closest('button,a')) location.hash = '#/configuracoes/documentos/' + tr.dataset.doc; }));
      $$('[data-gen]').forEach((b) => (b.onclick = () => openGenerateDoc({ tplId: +b.dataset.gen })));
      $$('[data-deldoc]').forEach((b) => (b.onclick = () => { const x = D().docTemplates.find((d) => d.id === +b.dataset.deldoc); if (confirm(`Excluir o modelo “${x.name}”?`)) { D().docTemplates = D().docTemplates.filter((d) => d !== x); refresh(); toast('Modelo excluído', 'trash'); } }));
      return;
    }
    const ed = $('#dBody');
    if (!ed) return;
    let range = null;
    const keep = () => { const s = getSelection(); if (s.rangeCount && ed.contains(s.anchorNode)) range = s.getRangeAt(0); };
    ed.onkeyup = keep; ed.onmouseup = keep; ed.onblur = keep;
    $$('[data-cmd]').forEach((b) => (b.onmousedown = (e) => { e.preventDefault(); ed.focus(); document.execCommand(b.dataset.cmd, false, b.dataset.arg || null); }));
    $$('[data-var]').forEach((b) => (b.onclick = () => {
      ed.focus();
      const s = getSelection();
      if (range) { s.removeAllRanges(); s.addRange(range); }
      document.execCommand('insertText', false, `{{${b.dataset.var}}}`);
      keep();
    }));
    const save = () => {
      const data = { name: $('#dName').value.trim(), category: $('#dCat').value || 'Geral', desc: $('#dDesc').value.trim(), body: sanitizeDoc(ed.innerHTML) };
      if (!data.name) { $('#dName').classList.add('invalid'); $('#dName').focus(); return null; }
      let x = sub === 'novo' ? null : D().docTemplates.find((d) => d.id === +sub);
      if (x) Object.assign(x, data); else { x = { id: D().nextId.docTemplates++, ...data }; D().docTemplates.push(x); }
      DB.save();
      return x;
    };
    $('#dSave').onclick = () => { if (save()) { location.hash = '#/configuracoes/documentos'; toast('Modelo salvo', 'file'); } };
    const pv = $('#dPreview');
    if (pv) pv.onclick = () => { const x = save(); if (x) openGenerateDoc({ tplId: x.id }); };
  },
};

// #/configuracoes → Preferências do protótipo; #/configuracoes/<página> → páginas acima
const PREFS_PAGE = PAGES.configuracoes;
PAGES.configuracoes = {
  render(p, sub) { return CFG[p] ? CFG[p].render(sub) : PREFS_PAGE.render(); },
  mount(p, sub) { if (CFG[p]) { CFG[p].mount && CFG[p].mount(sub); bindCopy(); } else PREFS_PAGE.mount(); },
};

/* ---------------- Integrações com outras telas ---------------- */
// Etiqueta de RMA no tamanho definido em Empresa
function printRmaLabel(r) {
  const c = company();
  const pa = $('#printArea');
  pa.hidden = false;
  pa.innerHTML = `<div class="rma-label" style="width:${c.rmaLabelWidth}mm;height:${c.rmaLabelHeight}mm">
    <b>${esc(c.tradeName || c.name)} · RMA ${rmaCode(r)}</b>
    <span>${esc(client(r.clientId).name)}</span>
    <span>${esc(r.equipment)}${r.serial ? ' · S/N ' + esc(r.serial) : ''}</span>
    <small>Entrada ${new Date(r.entryAt).toLocaleDateString('pt-BR')}</small>
  </div>`;
  window.print();
  setTimeout(() => (pa.hidden = true), 500);
}
