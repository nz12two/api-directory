# Decide o que merece tradução e o que deve ficar em inglês.
#
# Medido no catálogo real: 921 das 2.085 descrições não foram traduzidas pelo
# gtx. Duas causas distintas, e elas pedem decisões opostas:
#
#   1. Descrição que é nome próprio — "Cat Facts", "QR Code Generator",
#      "NASA". Traduzir estraga: vira "Gerador de Código QR" ou "Gatos Fatos".
#   2. Descrição que o gtx recusou por rate-limit. Essa deve ser traduzida,
#      e o build tenta de novo.
#
# Separar os dois por presença de palavra-chave não funciona: descrição real
# do catálogo é nominal ("Decentralized cryptocurrency exchange"), sem artigo
# nem verbo, e não casa com lista de stopwords. O que separa é o formato:
# nome próprio tem poucas palavras e Title Case; descrição tem uma clause.
#
# Regra: 1-2 palavras = nome próprio (fica em inglês). 3+ = descrição (traduz).
# Com código, URL ou símbolo no meio, nunca traduz.

import re
import sys

# Descrição com uma clause: tem conectivo ou verbo em qualquer forma.
DESCRIPTIONY = re.compile(r"\b(of|for|with|and|or|from|to|in|on|by|that|which|is|are|be|get|fetch|list|search|returns?|provides?|allows?|enables?|converts?|generates?|tracks?|manages?|gives?|shows?|find|create|update|delete|add|remove|every|any)\b", re.I)

# Caractere que denuncia código/config/URL — nunca traduzir.
CODEY = re.compile(r"[{}<>|=+*]|\$\(|https?://|::|\b\w+_\w+\b|\b\d+\.\d+\b")


def needs_translation(text: str) -> bool:
    """True quando vale a pena traduzir."""
    if not text:
        return False
    text = text.strip()
    if len(text) < 8:
        return False
    if CODEY.search(text):
        return False

    words = text.split()

    # Nome próprio: uma ou duas palavras. "Cat Facts", "NASA", "Weather API"
    # (três palavras mas sem clause — cai no caso seguinte).
    if len(words) <= 2:
        return False

    # Três palavras sem nenhum conectivo nem verbo: quase sempre nome de
    # produto — "QR Code Generator", "Random Dog Facts".
    if len(words) == 3 and not DESCRIPTIONY.search(text):
        return False

    return True


if __name__ == "__main__":
    samples = [
        # (texto, precisa traduzir)
        # 3 palavras sem conectivo: nome de produto, não descrição.
        ("Decentralized cryptocurrency exchange", False),
        ("Ethereum tokens, balances, addresses, history of transactions", True),
        ("API provides spot, margin and futures trading operations", True),
        ("Get all the tags", True),
        ("Free public API for currency exchange", True),
        ("Dog breed health scores, median lifespans and conditions", True),
        ("Collection of axolotl pictures and facts", True),
        ("On-chain top-10 holder concentration for crypto tokens", True),
        # nome próprio: NÃO traduzir
        ("Cat Facts", False),
        ("Dog Facts", False),
        ("NASA", False),
        ("REST", False),
        ("JSONPlaceholder", False),
        ("QR Code Generator", False),
        ("Random Dog Facts", False),
        # código: nunca
        ("Get repos from api.github.com/users/{username}", False),
    ]
    bad = 0
    for text, expected in samples:
        got = needs_translation(text)
        if got != expected:
            bad += 1
            print(f"FALHA  {text!r}\n       esperado {expected}, veio {got}")
    print(f"\n{len(samples) - bad}/{len(samples)} ok")
    sys.exit(1 if bad else 0)