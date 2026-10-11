# API Directory

Um diretório de APIs públicas gratuitas que se atualiza sozinho. Busca dados de [`public-apis/public-apis`](https://github.com/public-apis/public-apis) (mantido pela comunidade) e exibe em uma interface limpa com busca, filtros e favoritos.

## ✨ Features

- 🔄 **Auto-atualização** — busca dados novos a cada 5 minutos
- 🌐 **Bilíngue** — detecta o idioma do navegador (PT/EN) e traduz descrições
- 🔍 **Busca em tempo real** — filtra por nome, descrição ou categoria
- 🗂️ **Filtro por categoria** — barra de categorias com contagem
- ⭐ **Favoritos** — salva no `localStorage` do navegador
- 📊 **Estatísticas** — total de APIs, categorias, sem autenticação
- 📥 **Exportar CSV** — baixa a lista filtrada
- 📄 **Fallback** — se a API falhar, busca direto do README do GitHub
- 💾 **Cache local** — carregamento instantâneo em visitas seguintes

## 🚀 Deploy no GitHub Pages

1. Crie um repositório no GitHub
2. Faça push dos arquivos deste diretório
3. Vá em **Settings > Pages**
4. Selecione a branch `main` e salve
5. O site estará disponível em `https://seu-usuario.github.io/nome-do-repo/`

## 🛠️ Como funciona

- Busca dados de [`public-apis/public-apis`](https://github.com/public-apis/public-apis) (mantido pela comunidade)
- Atualiza automaticamente a cada 5 minutos
- Cache local para carregamento instantâneo
- Filtros por categoria, busca por texto e ordenação

## 📁 Estrutura

```
api-directory/
├── index.html   # Estrutura da página
├── style.css    # Estilos (tema escuro)
├── script.js    # Lógica (fetch, busca, filtros, favoritos)
└── README.md    # Este arquivo
```

## 📄 Licença

Feito para fins educacionais. Os dados das APIs pertencem aos seus respectivos criadores.
