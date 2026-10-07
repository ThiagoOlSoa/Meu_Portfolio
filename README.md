# Meu Portfólio

Portfólio de Thiago Soares em React + Vite, publicado no GitHub Pages:
https://thiagoolsoa.github.io/Meu_Portfolio/

## Rodar localmente

```bash
npm install
npm run dev
```

## Onde editar

- `src/content.js`: todo o texto do site (projetos, tecnologias, contato). Nada de dados reais de clientes, candidatos ou da empresa.
- `src/index.css`: tokens de cor, tipografia e layout.
- `docs/design-rules.md`: o que NÃO ter no visual (evita aparência genérica).

## Adicionar capturas de tela de um projeto

1. Coloque as imagens (só com dados fictícios) em `public/capturas/`.
2. Em `src/content.js`, no projeto, preencha `capturas`:

```js
capturas: [
  { arquivo: 'grm-solicitacoes.png', legenda: 'Lista de solicitações.', alt: 'Descrição da imagem para leitores de tela' },
]
```

A seção "Capturas" só aparece na página do projeto quando houver imagens.

## Deploy

Automático a cada push na `main`, via GitHub Actions. Em Settings, Pages, Source, escolha **GitHub Actions**.

As rotas usam hash (`#/projeto/grm`) porque o GitHub Pages não faz fallback de rotas. Os exercícios antigos em HTML/CSS ficam em `public/` e são servidos como estão.
