/* =========================================================
   Celular: as tabelas viram cartões. Cada célula recebe o nome da
   sua coluna (data-label), que o mobile.css mostra ao lado do valor.
   Funciona para qualquer tabela .t, inclusive as que aparecem depois
   (filtros, gavetas, buscas).
   ========================================================= */
(function () {
  function labelTables(root) {
    root.querySelectorAll('table.t').forEach((t) => {
      const heads = [...t.querySelectorAll('thead th')].map((th) => th.textContent.replace(/[▲▼]/g, '').trim());
      t.querySelectorAll('tbody tr').forEach((tr) => {
        [...tr.children].forEach((td, i) => {
          if (td.dataset.label === undefined) td.dataset.label = heads[i] || '';
        });
      });
    });
  }
  function watch(el) {
    if (!el) return;
    labelTables(el);
    new MutationObserver(() => labelTables(el)).observe(el, { childList: true, subtree: true });
  }
  document.addEventListener('DOMContentLoaded', () => {
    watch(document.getElementById('view'));
    watch(document.getElementById('drawer'));
  });
})();
