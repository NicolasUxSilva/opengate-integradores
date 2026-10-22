# OpenGate — Landing page de integradores

Reconstrução de https://integradores-opengate.framer.website/ em HTML, CSS e JS puros, sem dependências.

## Rodar

```bash
npm start        # http://localhost:4173
npm run check    # referências, âncoras, sintaxe do JS e CSS
```

## Estrutura

```
index.html          conteúdo e marcação (seções comentadas na ordem da página)
css/tokens.css      cores, sombras, fontes e medidas
css/base.css        reset, container, badge, cabeçalho de seção, botões
css/sections.css    header, hero, como funciona, perfil, diferenciais, contato, footer
css/form.css        formulário de parceiros (portado do componente Framer original)
js/main.js          comportamento do formulário
assets/             imagens originais e favicon
scripts/            servidor local e verificação
```

Layout mobile first; o layout desktop entra a partir de 1100px.

## Pontos prontos para novas interações

- **CTAs** (`data-cta="header"` e `data-cta="hero"` em `index.html`): no original não têm destino. Basta adicionar `href` (ex.: `#seja-parceiro`).
- **Âncoras das seções**: `#inicio`, `#como-funciona`, `#perfil`, `#diferenciais`, `#seja-parceiro`.
- **Envio do formulário**: `PARTNER_FORM_ACTION` em `js/main.js` (vazio = envio bloqueado, como no original). Campos: `nome`, `empresa`, `receita_recorrente`, `seguranca_eletronica`, `carteira_clientes`.
