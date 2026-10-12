#!/usr/bin/env python3
"""Gera data/apis.json a partir do README do public-apis/public-apis.

Por que este script existe: a API publica (api.publicapis.org) esta fora do ar,
e o site antes parseava o README de 300 KB dentro do navegador de cada visitante,
traduzindo 1400+ descricoes contra o endpoint do Google Translate a cada visita.
Aqui o trabalho pesado acontece uma vez por dia, num runner, e o site serve
um JSON estatico.

Rodar:  python tools/build_dataset.py
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html import unescape

README_URL = "https://raw.githubusercontent.com/public-apis/public-apis/master/README.md"
OUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "apis.json")
UA = "api-directory-build/1.0 (+https://github.com/nz12two/api-directory)"

# Linha separadora da tabela markdown (|:---|:---|).
SEP = re.compile(r"^\|[\s:|-]+\|$")
LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")


def http_get(url: str, timeout: int = 30, retries: int = 3) -> bytes:
    """GET com retry e backoff. O runner pode ser flaky; uma falha aqui nao
    deve publicar um dataset vazio e derrubar o site."""
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as exc:  # noqa: BLE001 - qualquer falha de rede vale retry
            last = exc
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"GET {url} falhou: {last}")


def clean(cell: str) -> str:
    """README usa &#39; eFriends; a barra invertida escapa pipe dentro de celula."""
    return unescape(cell.replace("\\|", "|").replace("\\\\", "\\").strip())


def parse_markdown(md: str) -> list:
    """Extrai as tabelas do README. Mesma logica do fallback que roda no
    navegador, so que aqui roda uma vez e vira JSON estatico."""
    apis = []
    category = "Other"

    for raw in md.splitlines():
        heading = raw.strip()
        if heading.startswith("### "):
            category = heading[4:].strip()
            continue
        line = raw.strip()
        if not line.startswith("|") or not line.endswith("|"):
            continue
        if SEP.match(line):
            continue

        cells = [clean(c) for c in line[1:-1].split("|")]
        if len(cells) < 5 or not cells[0]:
            continue
        # Cabecalho repetido dentro da tabela do README.
        if cells[0].strip() == "API":
            continue

        name, description, auth, https, cors = cells[0], cells[1], cells[2], cells[3], cells[4]
        match = LINK.match(name)
        url = match.group(2) if match else ""
        if match:
            name = match.group(1)
        # Linha de separador ou cabecalho remanescente dentro da tabela.
        if not name or name in ("API", "---") or description.lower().startswith("description"):
            continue

        apis.append({
            "name": name,
            "url": url,
            "description": description,
            "auth": "no" if auth.lower() in ("no", "none", "") else "yes",
            "https": https.lower().startswith("y"),
            "cors": cors.lower() if cors.lower() in ("yes", "no") else "unknown",
            "category": category,
        })
    return apis


def translate_pt(text: str) -> str:
    """Traduz via o endpoint publico do gtx. Devolve o original em qualquer
    falha - descricao em ingles e melhor do que descricao faltando."""
    if not text or len(text) < 5:
        return text
    q = urllib.parse.urlencode({"client": "gtx", "sl": "en", "tl": "pt", "dt": "t", "q": text})
    try:
        req = urllib.request.Request(
            "https://translate.googleapis.com/translate_a/single?" + q,
            headers={"User-Agent": UA},
        )
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.loads(r.read().decode("utf-8"))
        out = "".join(seg[0] for seg in data[0] if seg and seg[0])
        return out or text
    except Exception:  # noqa: BLE001
        return text


def main() -> int:
    md = http_get(README_URL).decode("utf-8", "replace")
    apis = parse_markdown(md)
    if len(apis) < 100:
        print(f"ABORT: so {len(apis)} entradas - parser quebrou, nao publicar", file=sys.stderr)
        return 1
    print(f"parse: {len(apis)} APIs em {len({a['category'] for a in apis})} categorias")

    # Traduz em PT com janelas deslizantes e uma pausa: 1400 requisicoes seguidas
    # derrubam o endpoint e produzem um dataset com metade em ingles.
    skip = os.environ.get("SKIP_TRANSLATE") == "1"
    done = 0
    for api in apis:
        api["description_pt"] = api["description"] if skip else translate_pt(api["description"])
        done += 1
        if done % 100 == 0:
            print(f"  traduzido {done}/{len(apis)}", flush=True)
        if not skip and done % 60 == 0:
            time.sleep(1.5)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    payload = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": "public-apis/public-apis",
        "source_url": README_URL,
        "count": len(apis),
        "translated": not skip,
        "apis": apis,
    }
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    pt_ok = sum(1 for a in apis if a["description_pt"] != a["description"])
    size = os.path.getsize(OUT_PATH)
    print(f"OK  {OUT_PATH}")
    print(f"    {size:,} bytes | traduzidas: {pt_ok}/{len(apis)} | em {payload['generated_at']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())