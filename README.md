# API Directory

Diretório de APIs públicas gratuitas que **diz se elas respondem**. Um índice
mostra o que existe; este mostra o que está no ar, com a latência medida.

**No ar:** https://nz12two.github.io/api-directory/

## O que ele faz além de listar

Um diretório comum tem nome, descrição e link. Isso aqui tem:

- **Latência real por API** — quantos ms o host levou, medido de fora
- **Status de vida** — no ar, fora, ou erro de servidor
- **Ordenar por velocidade** — as mais rápidas primeiro
- **Teste no navegador** — clique no ▶ e veja se a API abre de frente ou se o
  CORS barra
- **Snippet pronto** — cURL, JavaScript ou Python, com o endpoint preenchido
- **Filtro "sem auth"** — o que dá para usar sem cadastro
- **CSV** do que está filtrado, com a latência junto

## Por que a latência não é medida no navegador

Porque o navegador mentiria. Um `fetch` só entrega a resposta se o servidor
mandar `Access-Control-Allow-Origin`; sem isso, o browser bloqueia o corpo e
reporta "failed" — sem distinguir *servidor fora do ar* de *CORS bloqueando*.

São duas perguntas diferentes, e o site responde as duas separadamente:

| Onde mede | Pergunta que responde | Limitação |
|---|---|---|
| `tools/probe_apis.py` (CI) | O host responde? Em quantos ms? | Mede o host, não o endpoint |
| Botão ▶ (navegador) | Dá para consumir no front? | Diz nada sobre o host |

Quando o ▶ falha mas a sondagem diz HTTP 200, as duas informações aparecem lado
a lado — e as duas estão certas.

## Arquitetura

```
tools/build_dataset.py   → data/apis.json    (catálogo + tradução PT, 1x/dia no CI)
tools/probe_apis.py      → data/health.json  (sonda real, 16 workers, ~3 min)
index.html / style.css / script.js           (vanilla, sem build step)
```

O site carrega **JSON estático**. Antes ele parseava 300 KB de markdown e
traduzia 2.000+ descrições contra o endpoint do Google Translate **dentro do
navegador de cada visitante** — 2.000 requisições a cada visita. Agora isso
roda uma vez por dia num runner, e a página abre com um `fetch`.

## Rodar local

Precisa de HTTP, não `file://` — o `fetch` de um arquivo local é bloqueado.

```bash
python -m http.server 8912
# http://127.0.0.1:8912
```

## Atualizar os dados

```bash
python tools/build_dataset.py    # catálogo + tradução (SKIP_TRANSLATE=1 pula a tradução)
python tools/probe_apis.py       # sonda tudo (ou `probe_apis.py 100` para uma amostra)
```

## Como a sondagem decide que um host está vivo

`HEAD` primeiro, porque é o método mais barato. Se o host responde 405 ou 403
nele, ele está de pé — o servidor respondeu, só negou. `GET` só quando o
`HEAD` deu timeout ou erro de rede, para não gastar banda à toa.

São considerados vivos: 2xx, 3xx, 401, 403, 405, 406, 410, 418, 429. Um 401 é
um host de pé exigindo chave, e isso é informação útil.

## Fonte dos dados

[`public-apis/public-apis`](https://github.com/public-apis/public-apis), o
catálogo comunitário mantido no GitHub. A API dele (`api.publicapis.org`) está
fora do ar — por isso o build lê o README.

## Licença

MIT.