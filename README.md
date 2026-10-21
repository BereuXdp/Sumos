# Sumos.app — interface (protótipo)

Nova interface do painel Sumos (login e painel interno): ordens de serviço, agenda, dashboard, clientes e contatos, produtos, estoque, RMA, relatórios e configurações.

É um protótipo estático (HTML, CSS e JavaScript puros, sem build). Os dados são fictícios e ficam salvos no `localStorage` do navegador. O login aceita qualquer e-mail válido e qualquer senha.

## Rodar localmente

```bash
npx --yes http-server@14.1.1 . -p 5173 -c-1
```

Abra http://localhost:5173 no navegador.

## Estrutura

- `index.html` — tela de login
- `app.html` — painel (rotas por `#/rota`)
- `assets/` — estilos (`styles.css`, `os.css`, `mobile.css`) e módulos JS por área (`os.js`, `agenda.js`, `catalogo.js`, `rma.js`, `relatorios.js`, `configuracoes.js`, …)
- Animações com [Motion](https://github.com/motiondivision/motion) em `assets/motion-ui.js`
