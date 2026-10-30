# OpenGate — Landing page de integradores

Reconstrução de https://integradores-opengate.framer.website/ em HTML, CSS e JS puros, sem dependências,
com uma calculadora de ganho anual adicionada logo após a seção "Como funciona a parceria".

## Rodar

```bash
npm start        # http://localhost:4173
npm run check    # referências, links, sintaxe do JS/CSS e cenários da calculadora
```

## Estrutura

```
index.html                 conteúdo e marcação (seções comentadas na ordem da página)
css/tokens.css             cores, sombras, fontes e medidas
css/base.css               reset, container, badge, cabeçalho de seção, botões
css/sections.css           header, hero, como funciona, perfil, diferenciais, contato, footer
css/calculator.css         calculadora de ganho anual
css/form.css               formulário de parceiros (portado do componente Framer original)
js/main.js                 ponto de entrada (módulo): inicia calculadora e formulário
js/calculator-config.js    valores comerciais e premissas da calculadora
js/calculator.js           cálculo puro (sem DOM) e formatação em reais
js/calculator-ui.js        liga sliders e resultados ao cálculo
assets/                    imagens originais e favicon
scripts/                   servidor local e verificação
```

Layout mobile first; o layout desktop entra a partir de 1100px.

## Calculadora de ganho anual (`#calculadora`)

Projeta 12 meses a partir de quatro controles: novas instalações por mês (v), ganho por instalação (I),
ganho por implantação/integração (P) e recorrência mensal por aparelho ativo (c).

- Instalações: `v × I × 12`
- Implantação/integração: `v × 12 × implantações por instalação × P`
- Recorrência acumulada: soma, mês a mês, dos aparelhos ativos × c. Com 1 aparelho por instalação,
  ativação no próprio mês e sem cancelamentos, equivale a `c × v × 12 × 13 / 2`.
- Recorrência mensal no fim do período: aparelhos ativos no 12º mês × c (não é o acumulado do ano).

Os valores iniciais (1 instalação/mês, R$ 600, R$ 380, R$ 30/mês) e as premissas (implantações e aparelhos
por instalação, mês de início da recorrência, cancelamento mensal) ficam em `js/calculator-config.js` e são
**ilustrativos, pendentes de confirmação comercial**.

## Links e formulário

- CTAs de conversão (`data-cta="header"`, `"hero"`, `"calculator"`) levam a `#seja-parceiro`, com rolagem suave.
- A logo do cabeçalho leva a https://opengatebr.com.
- Âncoras das seções: `#inicio`, `#como-funciona`, `#calculadora`, `#perfil`, `#diferenciais`, `#seja-parceiro`.
- Envio do formulário: por e-mail para `marcio@msserver.com.br`, via [Web3Forms](https://web3forms.com).
  O destino é o e-mail cadastrado no Web3Forms junto com a chave, que fica no campo oculto `access_key`
  do formulário em `index.html` (a chave é pública por design). Para trocar o destino, gere uma chave
  nova em web3forms.com com o novo e-mail e atualize também `PARTNER_FORM_EMAIL` em `js/main.js`.
- Contingência: se o envio falhar, a página oferece "Enviar por e-mail", que abre o app de e-mail do
  visitante com uma mensagem para `PARTNER_FORM_EMAIL` já preenchida.
- Campos: `nome`, `empresa`, `receita_recorrente`, `seguranca_eletronica`, `carteira_clientes`
  (mais `botcheck`, armadilha anti-spam). `npm run check` falha se a `access_key` estiver vazia.
