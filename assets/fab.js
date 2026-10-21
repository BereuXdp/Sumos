/* =========================================================
   Botão flutuante “+” (igual ao sistema antigo): menu “Novo cadastro”
   com atalhos para os cadastros, em ordem alfabética.
   ========================================================= */
const FAB_ITEMS = [
  { label: 'Cliente', icon: 'users', run: () => openNewClient() },
  { label: 'Contato', icon: 'user', run: () => openContact() },
  { label: 'Pendência', icon: 'alert', run: () => openRecord(MODULES.pendencias) },
  { label: 'RMA', icon: 'tool', run: () => openRma() },
].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

document.addEventListener('DOMContentLoaded', () => {
  const wrap = document.createElement('div');
  wrap.className = 'fab-wrap';
  wrap.innerHTML = `
    <div class="fab-menu" id="fabMenu" role="menu" aria-label="Novo cadastro">
      <div class="fab-head">Novo cadastro</div>
      ${FAB_ITEMS.map((it, i) => `<button role="menuitem" data-fab="${i}">${icon(it.icon)}${it.label}</button>`).join('')}
    </div>
    <button class="fab" id="fabBtn" aria-label="Novo cadastro" aria-haspopup="true" aria-expanded="false" title="Novo cadastro">${icon('plus')}</button>`;
  document.body.append(wrap);
  const btn = $('#fabBtn');
  const setOpen = (open) => { wrap.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); if (open) $('#fabMenu [data-fab]').focus(); };
  btn.onclick = (e) => { e.stopPropagation(); setOpen(!wrap.classList.contains('open')); };
  $$('[data-fab]', wrap).forEach((b) => (b.onclick = () => { setOpen(false); FAB_ITEMS[+b.dataset.fab].run(); }));
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && wrap.classList.contains('open')) { setOpen(false); btn.focus(); }
    if (!wrap.classList.contains('open') || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const items = $$('[data-fab]', wrap), i = items.indexOf(document.activeElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
  });
});
