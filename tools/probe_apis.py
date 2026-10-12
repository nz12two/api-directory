#!/usr/bin/env python3
"""Sonda as APIs do dataset e grava data/health.json.

Onde roda: GitHub Actions, uma vez por dia, em paralelo. Nao roda no navegador.

Por que no CI e nao no navegador: o teste do navegador so mede CORS — a resposta
so chega se o servidor mandar Access-Control-Allow-Origin, e a maioria das APIs
publicas nao manda. Quando CORS barra, o browser ve "failed" e nao sabe se o
servidor esta no ar. A sondagem de fora mede o que a pessoa quer saber: a API
responde? com que latencia? Em um datacenter, sem CORS no meio.

Metodo, e o porque de cada escolha:
  - HEAD primeiro: e o metodo mais barato. Se o host responde 405/403 a HEAD, ele
    esta vivo; o status sozinho ja responde a pergunta.
  - GET so quando o HEAD nao diz nada (timeout, 5xx, rede morta): assim so
    gastamos banda com host que deu trabalho.
  - Sem seguir redirect cegamente: a coluna Link do catalogo e a pagina de
    documentacao, nao o endpoint. Tratar isso como API mediria a coisa errada.
  - Concorrencia 16: dispara 2085 requisicoes de uma vez e o proprio runnable
    vira o gargalo; com 1, uma noite. 16 da tempos de minutos.

Rodar:  python tools/probe_apis.py [limite]
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "apis.json")
OUT = os.path.join(ROOT, "data", "health.json")
UA = "api-directory-probe/1.0 (+https://github.com/nz12two/api-directory)"

HEAD_TIMEOUT = 6
GET_TIMEOUT = 9
WORKERS = 16

# Status que provam que o host esta no ar. 401 e 403 saohosts de pe com chave
# exigida: o servidor respondeu, so negou. Isso e util, nao e falha.
ALIVE = {200, 201, 202, 204, 206, 301, 302, 303, 307, 308, 401, 403, 405, 406, 410, 418, 429}


def classify(status: int, err: str = "") -> str:
    if status in ALIVE:
        return "up"
    if status == 0:
        return "down"
    if 500 <= status < 600:
        return "error"
    return "redirect_dead" if 400 <= status < 500 and status not in ALIVE else "down"


def one(url: str) -> dict:
    """HEAD e, se nao responder, GET. Devolve o veredito e o tempo.

    HEAD e o metodo mais barato: um 405/403 nele ja prova que o host esta de
    pe. So gastamos banda com GET quando o host deu timeout ou erro de rede.
    """
    last_err = "unknown"
    for method, timeout in (("HEAD", HEAD_TIMEOUT), ("GET", GET_TIMEOUT)):
        started = time.perf_counter()
        req = urllib.request.Request(url, method=method, headers={"User-Agent": UA, "Accept": "*/*"})
        try:
            opener = urllib.request.build_opener(NoRedirect)
            with opener.open(req, timeout=timeout) as r:
                return {"status": r.status, "ms": round((time.perf_counter() - started) * 1000), "via": method}
        except urllib.error.HTTPError as e:
            return {"status": e.code, "ms": round((time.perf_counter() - started) * 1000), "via": method}
        except Exception as exc:  # noqa: BLE001 - rede falha de todo jeito
            last_err = type(exc).__name__
    return {"status": 0, "ms": None, "via": None, "error": last_err}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    """A coluna Link aponta para a documentacao. Seguir o redirect mediria o
    site de doc, nao a API — entao registramos o 3xx como esta e guardamos a
    Location para o card."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise urllib.error.HTTPError(req.full_url, code, "redirect", headers, fp)


def main() -> int:
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    with open(DATA, encoding="utf-8") as f:
        apis = json.load(f)["apis"]
    if limit:
        apis = apis[:limit]

    # Prioriza o que a pessoa mais usa: sem auth e com CORS abrem no navegador.
    apis.sort(key=lambda a: (a["auth"] == "yes", a["cors"] != "yes", a["name"]))
    print(f"sondando {len(apis)} APIs com {WORKERS} workers")

    health = {}
    started = time.perf_counter()
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futs = {pool.submit(one, a["url"]): a for a in apis if a["url"]}
        done = 0
        for fut in as_completed(futs):
            api = futs[fut]
            try:
                r = fut.result()
            except Exception as exc:  # noqa: BLE001
                r = {"status": 0, "ms": None, "via": None, "error": type(exc).__name__}
            health[api["url"]] = {
                "status": r["status"],
                "ms": r["ms"],
                "state": classify(r["status"], r.get("error", "")),
                "via": r.get("via"),
                "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            done += 1
            if done % 200 == 0:
                print(f"  {done}/{len(futs)}", flush=True)

    up = sum(1 for v in health.values() if v["state"] == "up")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({
            "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "count": len(health),
            "up": up,
            "results": health,
        }, f, ensure_ascii=False, separators=(",", ":"))

    lat = [v["ms"] for v in health.values() if v["ms"]]
    lat.sort()
    print(f"OK  {OUT}")
    print(f"    {len(health)} sondadas | {up} no ar ({100 * up // max(1, len(health))}%)")
    if lat:
        print(f"    latencia p50={lat[len(lat) // 2]} ms  p90={lat[int(len(lat) * 0.9)]} ms")
    print(f"    {round(time.perf_counter() - started)} s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())