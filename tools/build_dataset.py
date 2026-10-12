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
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from html import unescape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from translate_policy import needs_translation  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
README_URL = "https://raw.githubusercontent.com/public-apis/public-apis/master/README.md"
OUT_PATH = os.path.join(ROOT, "data", "apis.json")
CACHE_PATH = os.path.join(ROOT, "data", "translations.json")
UA = "api-directory-build/1.0 (+https://github.com/nz12two/api-directory)"

# 8 nao e arbitrario: acima disso o gtx responde 429 e metade do dataset fica
# em ingles, que e exatamente o defeito que a gente quer evitar.
WORKERS = 8

# Teto de tempo na traducao. Os dois motores sao servicos publicos gratuitos que
# estrangulam: medido, o gtx ficou 3+ min devolvendo HTML de bloqueio e o
# MyMemory libera ~7 requisicoes a cada 3,5 min. Com o teto, uma execucao longa
# nao fica batendo em porta fechada — ela traduz o que couber, grava, e a
# proxima execucao do CI continua de onde parou pelo cache.
BUDGET_S = int(os.environ.get("TRANSLATE_BUDGET_S", "420"))

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


def _fetch(url: str, timeout: int = 20) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


class QuotaExhausted(Exception):
    """O servico respondeu, mas disse que a cota acabou."""


class Engine:
    """Um tradutor e o estado de bloqueio dele.

    Medido nesta maquina: o gtx responde HTTP 200 com HTML de bloqueio
    ("Sorry, now you see Google") por 3+ minutos seguidos, e o MyMemory libera
    ~7 requisicoes a cada 3,5 min. Os dois sao servicos publicos gratuitos e os
    dois estrangulam. Sem este objeto, cada traducao que falha vira 3 retries
    com sleep (~10 s) e o build passa a hora inteira batendo em porta fechada.
    """

    def __init__(self, name: str, cool: float):
        self.name = name
        self.cool = cool          # quanto tempo fica fechado apos esgotar
        self.blocked_until = 0.0
        self.ok = 0
        self.fail = 0
        # Trava: com 8 workers, todas passam por available() antes de qualquer
        # uma marcar o bloqueio — medido, 8 requisicoas vazaram por janela.
        # O token garante que so uma worker chega na rede por vez.
        self._lock = threading.Lock()

    def available(self) -> bool:
        return time.time() >= self.blocked_until

    def throttle(self) -> None:
        left = self.cool
        self.blocked_until = time.time() + left
        print(f"  [throttle] {self.name} fechado por {left:.0f}s "
              f"({self.ok} ok / {self.fail} falhas ate aqui)", flush=True)

    def call(self, url: str, parse) -> str:
        """Executa e classifica. Devolve "" quando indisponivel agora."""
        with self._lock:
            if not self.available():
                return ""
            try:
                body = _fetch(url)
            except Exception:  # noqa: BLE001
                self.fail += 1
                self.throttle()
                return ""
            # Bloqueio vem como HTML, com HTTP 200. Nao ha JSON dentro: parsear o
            # HTML e o que ja produziu o catalogo com metade em ingles sem aviso.
            if body.lstrip().startswith("<"):
                self.fail += 1
                self.throttle()
                return ""
            try:
                out = parse(body)
            except QuotaExhausted:
                self.fail += 1
                self.throttle()
                return ""
            except Exception:  # noqa: BLE001
                self.fail += 1
                return ""
            self.ok += 1
            return out

    def stats(self) -> str:
        return f"{self.name}: {self.ok} ok / {self.fail} falhas"


def _gtx_parse(body: str) -> str:
    data = json.loads(body)
    out = "".join(seg[0] for seg in data[0] if seg and seg[0])
    if not out:
        raise ValueError("vazio")
    return out


def _mymemory_parse(body: str) -> str:
    data = json.loads(body)
    if data.get("responseStatus") != 200:
        raise QuotaExhausted(str(data.get("responseDetails") or "cota"))
    out = (data.get("responseData") or {}).get("translatedText") or ""
    if not out or "MYMEMORY WARNING" in out.upper() or out.upper() == "INVALID":
        raise QuotaExhausted("resposta vazia")
    return out


# gtx: sem cota nominal, mas o bloqueio por IP durou 3+ min medidos.
GTX = Engine("gtx", cool=180)
# MyMemory: janela medida de ~3,5 min para ~7 requisicoes.
MYMEMORY = Engine("mymemory", cool=210)


def translate_pt(text: str) -> str:
    """Traduz en->pt na cadeia gtx -> MyMemory.

    Devolve o original, nunca string vazia: descricao em ingles e melhor do que
    card sem descricao.
    """
    if not text or len(text) < 5:
        return text

    q = urllib.parse.urlencode({"client": "gtx", "sl": "en", "tl": "pt", "dt": "t", "q": text})
    out = GTX.call("https://translate.googleapis.com/translate_a/single?" + q, _gtx_parse)
    if out and out != text:
        return out

    q = urllib.parse.urlencode({"q": text, "langpair": "en|pt"})
    out = MYMEMORY.call("https://api.mymemory.translated.net/get?" + q, _mymemory_parse)
    if out and out != text:
        return out

    return text


def load_cache() -> dict:
    """Traducoes ja feitas. Sem isso, cada build refaz 2.000 requisicoes para
    descobrir que quase nada mudou no README."""
    try:
        with open(CACHE_PATH, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def prune_cache(cache: dict, apis: list) -> int:
    """Joga fora as entradas que o tradutor devolveu iguais ao original.

    Medido: o bloqueio por rate-limit salvou 921 entradas com valor == chave.
    Sem isso, a proxima execucao cache-as e nunca mais tenta traduzir de
    verdade — o defeito fica permanente mesmo depois que o endpoint volta.
    """
    valid = {a["description"] for a in apis}
    dropped = 0
    for k in list(cache):
        if k not in valid or cache[k] == k or not cache[k]:
            del cache[k]
            dropped += 1
    return dropped


def translate_all(apis: list, cache: dict) -> int:
    """Traduz o que falta, em paralelo.

    Sequencial deu 1.6 traducoes/s (medido: 600 em 377 s) porque cada chamada
    espera a latencia da rede. Com 8 workers a latencia se esconde atras de
    outras 7. Acima de ~12 o proprio gtx comeca a devolver 429 e o resultado
    fica metade em ingles — que e o defeito que o cache evita.
    """
    pending = []
    kept_en = 0
    for api in apis:
        text = api["description"]
        if text in cache:
            continue
        # Nome próprio e código ficam em inglês de propósito: traduzir "Cat
        # Facts" estraga o card. Só o que a política aprova vai ao tradutor,
        # o que corta as 2.000+ chamadas pela metade.
        if not needs_translation(text):
            kept_en += 1
            continue
        pending.append(text)
    uniq = list(dict.fromkeys(pending))
    if kept_en:
        print(f"  {kept_en} mantidas em ingles (nome proprio ou codigo)")
    if not uniq:
        print("traducao: tudo em cache")
        return 0

    print(f"traduzindo {len(uniq)} descricoes unicas, {WORKERS} workers, ate {BUDGET_S}s por execucao")
    started = time.perf_counter()
    done = 0
    ok = 0

    def one(text: str) -> str:
        """Traduz uma descricao, esperando a janela quando ambos estao fechados.

        Sem essa espera, os motores fechados devolviam "" imediato e as 669
        descricoes restantes eram "tentadas" em 1,2 s — o build gastava a janela
        inteira sem traduzir nada. Aqui o worker dorme ate o primeiro motor
        reabrir, desde que ainda sobre orcamento.
        """
        while True:
            out = translate_pt(text)
            if out != text:
                return out
            if not (GTX.available() or MYMEMORY.available()):
                if time.perf_counter() - started > BUDGET_S:
                    return out          # sem orcamento: devolve e segue
                # Dorme ate o motor mais proximo de reabrir, mais 1 s de folga.
                wait = min(GTX.blocked_until, MYMEMORY.blocked_until) - time.time() + 1
                print(f"  [espera] ambos fechados; retomando em {wait:.0f}s "
                      f"(orcamento {BUDGET_S - int(time.perf_counter() - started)}s restantes)",
                      flush=True)
                time.sleep(max(wait, 1))
            else:
                # Ha motor aberto mas falhou com este texto: pode ser termino
                # proprio. Nao insista — devolve o original.
                return out

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        for text, out in zip(uniq, pool.map(one, uniq)):
            # Só entra no cache a tradução que de fato mudou o texto. Guardar o
            # original quando o tradutor falhou foi o que fez 921 descrições
            # ficarem em inglês para sempre.
            if out != text:
                cache[text] = out
                ok += 1
            done += 1
            if done % 25 == 0:
                rate = done / max(time.perf_counter() - started, 0.001)
                print(f"  {done}/{len(uniq)} ({rate:.1f}/s, {ok} traduzidas) | "
                      f"{GTX.stats()} | {MYMEMORY.stats()}", flush=True)

    print(f"  {ok} traduzidas nesta execucao ({done} tentadas, "
          f"{int(time.perf_counter() - started)}s)")
    print(f"  motores: {GTX.stats()} | {MYMEMORY.stats()}")
    remaining = len(uniq) - ok
    if remaining > 0:
        print(f"  restam {remaining} para a proxima execucao — o cache garante que "
              f"cada build so avanca, nunca regride")
    return ok


def main() -> int:
    md = http_get(README_URL).decode("utf-8", "replace")
    apis = parse_markdown(md)
    if len(apis) < 100:
        print(f"ABORT: so {len(apis)} entradas - parser quebrou, nao publicar", file=sys.stderr)
        return 1
    cats = len({a["category"] for a in apis})
    print(f"parse: {len(apis)} APIs em {cats} categorias")

    cache = load_cache()
    skip = os.environ.get("SKIP_TRANSLATE") == "1"
    if skip:
        translated = 0
    else:
        dropped = prune_cache(cache, apis)
        if dropped:
            print(f"cache: {dropped} entradas invalidas descartadas (rate-limit ou igual ao original)")
        translated = translate_all(apis, cache)

    for api in apis:
        api["description_pt"] = api["description"] if skip else cache.get(api["description"], api["description"])

    # So grava o cache quando a traducao rodou: com SKIP_TRANSLATE as entradas
    # seriam o proprio ingles, envenenando o cache para sempre.
    if not skip and translated:
        os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
        with open(CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, separators=(",", ":"))

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
    print(f"    {size:,} bytes | traduzidas: {pt_ok}/{len(apis)} | novas: {translated} | em {payload['generated_at']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())