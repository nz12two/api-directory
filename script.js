/* API Directory — front-end.
 *
 * Mudança central: o site carrega data/apis.json (build por tools/build_dataset.py,
 * translations inclusas) em vez de parsear 300 KB de markdown e traduzir 2000+
 * descrições dentro do navegador de cada visitante. O dataset no navegador é a
 * única fonte; o fetch do GitHub virou o botão "Atualizar".
 */

const DATASET_URL = 'data/apis.json';
const HEALTH_URL = 'data/health.json';

const i18n = {
    pt: {
        tagline: 'APIs públicas testadas ao vivo',
        search: 'Buscar APIs...',
        sort_category: 'Ordenar: Categoria', sort_name: 'Ordenar: Nome A-Z',
        sort_name_desc: 'Ordenar: Nome Z-A', sort_favorites: 'Favoritos primeiro',
        sort_latency: 'Ordenar: Mais rápida', sort_health: 'Ordenar: Respondendo',
        noauth: 'Sem auth', refresh: 'Atualizar', csv: 'CSV',
        apis: 'APIs', categories: 'categorias', no_auth: 'sem auth',
        favorites: 'favoritas', tested: 'testadas', last_update: 'Última atualização',
        all: 'Todas', loading: 'Carregando APIs...', error_load: 'Falha ao carregar os dados.',
        error_hint: 'O arquivo data/apis.json não está acessível. Rode o build ou abra via servidor (não file://).',
        no_results: 'Nenhuma API encontrada com esses filtros.',
        toast_fav_add: 'Adicionado aos favoritos!', toast_fav_remove: 'Remido dos favoritos!',
        toast_export: 'Exportando dados...', toast_updated: 'Lista atualizada!',
        auth_no: 'Sem Auth', auth_yes: 'Auth', cors_yes: 'CORS ✅',
        cors_no: 'Sem CORS ❌', cors_unknown: 'CORS ❓', https: 'HTTPS 🔒', http: 'HTTP ⚠️',
        per_page: 'por página', prev: 'Anterior', next: 'Próxima',
        endpoint: 'Endpoint', run: 'Testar agora', open_docs: 'Abrir docs',
        status: 'Status', latency: 'Latência', size: 'Tamanho', cors: 'CORS',
        copy_response: 'Copiar resposta', copy_snippet: 'Copiar snippet',
        copied: 'Copiado!', take_ready: 'Leve pronto',
        probe_run: 'Testar as APIs desta página', probe_working: 'Testando',
        probe_cancel: 'Parar', probe_done: 'testadas', probe_none: 'sem resposta',
        docs_note: 'O teste mede se o host responde e se o navegador consegue ler a resposta. Endpoint de verdade está na documentação.',
        copy_fail: 'Não foi possível ler a resposta deste host (CORS). Abrir em nova aba?',
        open_tab: 'Abrir em nova aba', dataset_age: 'Dataset de',
        pick: 'Marcar para comparar',
        pick_max: 'Máximo de 3 para comparar',
        tray: 'Comparar',
        tray_clear: 'Limpar',
        compare: 'Comparar',
        cmp_desc: 'Descrição',
        cmp_status: 'Sondagem',
        cmp_latency: 'Latência',
        cmp_auth: 'Auth',
        cmp_cors: 'CORS',
        cmp_https: 'HTTPS',
        cmp_cat: 'Categoria',
        cmp_snippet: 'Usar',
        open_snippet: 'Abrir playground',
        quickbar: 'Atalhos',
        clear: 'Limpar',
        qc_usable: 'Usável no front', qc_noauth: 'Sem auth', qc_cors: 'Com CORS',
        qc_fast: 'Sub-500ms', qc_up: 'No ar', qc_dead: 'Fora do ar',
        health_title: 'Sondagem de fora, sem CORS no meio',
        external_probe: 'Sondagem externa', in: 'em',
        not_readable: 'não lido', cors_allowed: 'liberado', cors_blocked: 'bloqueado',
        host_answers: 'o host responde', host_silent: 'o host não respondeu',
        no_response: 'sem resposta',
        browser_ok: 'Abre direto no navegador',
        browser_no: 'CORS bloqueia a leitura pelo navegador',
        test_browser: 'Testar se abre no navegador',
        checked_at: 'Sondado em',
    },
    en: {
        tagline: 'Live-tested public APIs',
        search: 'Search APIs...',
        sort_category: 'Sort: Category', sort_name: 'Sort: Name A-Z',
        sort_name_desc: 'Sort: Name Z-A', sort_favorites: 'Favorites first',
        sort_latency: 'Sort: Fastest', sort_health: 'Sort: Responding',
        noauth: 'No auth', refresh: 'Refresh', csv: 'CSV',
        apis: 'APIs', categories: 'categories', no_auth: 'no auth',
        favorites: 'favorites', tested: 'tested', last_update: 'Last updated',
        all: 'All', loading: 'Loading APIs...', error_load: 'Failed to load the dataset.',
        error_hint: 'data/apis.json is not reachable. Run the build, or serve over http (not file://).',
        no_results: 'No APIs match these filters.',
        toast_fav_add: 'Added to favorites!', toast_fav_remove: 'Removed from favorites!',
        toast_export: 'Exporting data...', toast_updated: 'List updated!',
        auth_no: 'No Auth', auth_yes: 'Auth', cors_yes: 'CORS ✅',
        cors_no: 'No CORS ❌', cors_unknown: 'CORS ❓', https: 'HTTPS 🔒', http: 'HTTP ⚠️',
        per_page: 'per page', prev: 'Prev', next: 'Next',
        endpoint: 'Endpoint', run: 'Test now', open_docs: 'Open docs',
        status: 'Status', latency: 'Latency', size: 'Size', cors: 'CORS',
        copy_response: 'Copy response', copy_snippet: 'Copy snippet',
        copied: 'Copied!', take_ready: 'Take it ready',
        probe_run: 'Test this page’s APIs', probe_working: 'Testing',
        probe_cancel: 'Stop', probe_done: 'answered', probe_none: 'no answer',
        docs_note: 'The test measures whether the host answers and whether the browser can read it. The real endpoint is in the docs.',
        copy_fail: "Could not read this host's response (CORS). Open in a new tab?",
        open_tab: 'Open in new tab', dataset_age: 'Dataset from',
        pick: 'Mark to compare',
        pick_max: 'At most 3 to compare',
        tray: 'Compare',
        tray_clear: 'Clear',
        compare: 'Compare',
        cmp_desc: 'Description',
        cmp_status: 'Probe',
        cmp_latency: 'Latency',
        cmp_auth: 'Auth',
        cmp_cors: 'CORS',
        cmp_https: 'HTTPS',
        cmp_cat: 'Category',
        cmp_snippet: 'Use',
        open_snippet: 'Open playground',
        quickbar: 'Shortcuts',
        clear: 'Clear',
        qc_usable: 'Usable in front', qc_noauth: 'No auth', qc_cors: 'With CORS',
        qc_fast: 'Under 500ms', qc_up: 'Up', qc_dead: 'Down',
        health_title: 'Probed from outside, no CORS in the way',
        external_probe: 'External probe', in: 'in',
        not_readable: 'not readable', cors_allowed: 'allowed', cors_blocked: 'blocked',
        host_answers: 'the host answers', host_silent: 'the host did not answer',
        no_response: 'no response',
        browser_ok: 'Opens directly in the browser',
        browser_no: 'CORS blocks the browser from reading it',
        test_browser: 'Test if it opens in the browser',
        checked_at: 'Probed on',
    },
};

let lang = 'pt';
let apis = [];
let health = new Map();       // url -> {status, ms, state, via, checked_at} do CI
let probeResults = new Map(); // url -> resultado do teste no navegador
let healthAt = '';            // quando o CI rodou a sondagem
let probing = new Map();      // url -> AbortController, do teste ao vivo no browser
let category = 'all';
let favorites = new Set();
let page = 1;
let perPage = 24;
let filters = new Set();       // atalhos ligados: usable|noauth|cors|fast|up|dead
let picked = new Set();        // APIs marcadas para comparar
let searchTimer = null;
let currentApi = null;
let lastProbe = null;         // ultimo resultado do playground, para re-render
let snippetLang = 'curl';

/* Cada atalho responde uma pergunta diferente, e é por isso que não são só
 * etiquetas: "sem auth" é o que não pede cadastro; "com CORS" é o que o
 * navegador consegue ler; "usável no front" é a interseção dos dois, que é
 * o subconjunto que dá para integrar hoje sem proxy. */
function matchFilter(api, f) {
    const h = health.get(api.url);
    switch (f) {
        case 'usable': return api.auth === 'no' && api.cors === 'yes';
        case 'noauth': return api.auth === 'no';
        case 'cors': return api.cors === 'yes';
        case 'fast': return h?.state === 'up' && h.ms < 500;
        case 'up': return h?.state === 'up';
        case 'dead': return !!h && h.state !== 'up';
        default: return true;
    }
}

function countFilter(f) {
    let n = 0;
    for (const a of apis) if (matchFilter(a, f)) n++;
    return n;
}

// Escala a barra pela ordem de grandeza, não pelo pior caso: entre 40 ms e
// 3.000 ms a escala linear deixa quase tudo colado no zero.
function latencyBar(ms) {
    const pct = Math.max(4, Math.min(100, 100 - (Math.log(Math.max(ms, 1)) - Math.log(40)) / (Math.log(3000) - Math.log(40)) * 100));
    const tone = ms < 300 ? 'fast' : ms < 900 ? 'mid' : 'slow';
    return `<div class="lat-bar" title="${ms} ms">
        <div class="lat-fill ${tone}" style="width:${pct.toFixed(1)}%"></div>
    </div>`;
}

const $ = (id) => document.getElementById(id);
const t = () => i18n[lang];

/* ============================ dados ============================ */

async function loadDataset() {
    let payload;
    try {
        const res = await fetch(DATASET_URL, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        payload = await res.json();
    } catch (e) {
        return fail(`<div class="no-results"><i class="fas fa-triangle-exclamation"></i> ${t().error_load}<br><small>${e.message}</small><br><small>${t().error_hint}</small></div>`);
    }

    apis = Array.isArray(payload) ? payload : (payload.apis || []);
    if (!apis.length) return fail(`<div class="no-results">${t().error_load}</div>`);

    loadFavorites();
    render();
    // Link profundo (?cat=Weather) precisa trazer a tab para a vista: com 52
    // categorias, "Weather" fica a x=2259 e o visitante veria a lista filtrada
    // sem nenhuma pista de onde ela veio.
    revealActiveTab();
    $('data-age').textContent = t().dataset_age + ' ' + (payload.generated_at || '').slice(0, 10);

    // O health vem separado e é opcional: sem ele o site ainda lista, só perde
    // a coluna de status. Um 404 aqui não pode derrubar o catálogo inteiro.
    try {
        const hres = await fetch(HEALTH_URL, { cache: 'no-cache' });
        if (hres.ok) {
            const h = await hres.json();
            health = new Map(Object.entries(h.results || {}));
            healthAt = h.checked_at || '';
            render();
            $('health-stat').hidden = false;
            $('health-checked-at').textContent = t().checked_at + ' ' + healthAt.slice(0, 10);
        }
    } catch (_) { /* health é bônus, não requisito */ }
}

function fail(html) {
    $('api-grid').innerHTML = html;
}

async function refreshFromGitHub() {
    const btn = $('refresh-btn');
    btn.disabled = true;
    btn.querySelector('i').classList.add('fa-spin');
    try {
        const res = await fetch('https://raw.githubusercontent.com/public-apis/public-apis/master/README.md', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const md = await res.text();
        const parsed = parseMarkdown(md);
        if (parsed.length < 100) throw new Error('só ' + parsed.length + ' entradas no README');
        apis = parsed;
        render();
        toast(t().toast_updated);
    } catch (e) {
        toast('⚠️ ' + e.message);
    } finally {
        btn.disabled = false;
        btn.querySelector('i').classList.remove('fa-spin');
    }
}

function parseMarkdown(md) {
    const out = [];
    let cat = 'Other';
    const SEP = /^\|[\s:|-]+\|$/;
    const LINK = /\[([^\]]+)\]\(([^)\s]+)/;
    const dec = (s) => { const d = document.createElement('div'); d.innerHTML = s; return d.textContent.trim(); };

    for (const raw of md.split('\n')) {
        const h = raw.trim();
        if (h.startsWith('### ')) { cat = h.slice(4).trim(); continue; }
        if (!h.startsWith('|') || !h.endsWith('|')) continue;
        if (SEP.test(h)) continue;
        const cells = h.slice(1, -1).split('|').map(dec);
        if (cells.length < 5 || !cells[0] || cells[0] === 'API') continue;
        const m = LINK.exec(cells[0]);
        out.push({
            name: m ? m[1] : cells[0],
            url: m ? m[2] : '',
            description: cells[1] || '',
            description_pt: null,          // recem-baixado: sem tradução pronta
            auth: /^(no|none)?$/i.test(cells[2]) ? 'no' : 'yes',
            https: /^y/i.test(cells[3]),
            cors: /^(yes|no)$/i.test(cells[4]) ? cells[4].toLowerCase() : 'unknown',
            category: cat,
        });
    }
    return out;
}

/* ============================ busca / filtros ============================ */

function visible() {
    const q = $('search').value.toLowerCase().trim();
    let list = category === 'all' ? apis.slice() : apis.filter(a => (a.category || 'Other') === category);
    if (q) list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.description_pt || '').toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q));
    for (const f of filters) list = list.filter(a => matchFilter(a, f));

    const sort = $('sort-select').value;
    const byName = (x, y) => x.name.localeCompare(y.name);
    // Estado sem latência vai para o fim: Infinity primeiro daria a APIs mortas
    // o topo da lista de "mais rápida".
    const lat = (a) => (health.get(a.url)?.state === 'up' ? health.get(a.url).ms ?? Infinity : Infinity);
    switch (sort) {
        case 'name': list.sort(byName); break;
        case 'name-desc': list.sort((x, y) => byName(y, x)); break;
        case 'favorites': list.sort((x, y) => (favorites.has(y.url) ? 1 : 0) - (favorites.has(x.url) ? 1 : 0) || byName(x, y)); break;
        case 'latency': list.sort((x, y) => lat(x) - lat(y) || byName(x, y)); break;
        case 'health': list.sort((x, y) => (health.get(y.url)?.state === 'up' ? 1 : 0) - (health.get(x.url)?.state === 'up' ? 1 : 0) || byName(x, y)); break;
        default: list.sort((x, y) => x.category.localeCompare(y.category) || byName(x, y));
    }
    return list;
}

function render() {
    renderStats();
    renderCategories();
    renderGrid();
}

/* ============ estado na URL: o botao voltar precisa funcionar ============ */
// Antes o historico do navegador era inerte nesta pagina: filtrar, buscar e
// escolher categoria nao deixavam rastro, e nao havia como compartilhar um
// recorte ("clima + CORS + sub-500ms") sem colar o filtro no texto.
const URL_PER_PAGE = [12, 24, 48];

function readUrl() {
    const p = new URLSearchParams(location.search);
    $('search').value = p.get('q') || '';
    $('search-clear').hidden = !$('search').value;
    category = p.get('cat') || 'all';
    // filter(Boolean) antes do segundo filtro: sem ele, "f" ausente vira '' e
    // ''.split(',') = [''] — o Set ficava com um filtro vazio que nao casava
    // com nenhuma API, mas contava como 1 filtro ligado (botao "Limpar" aparecia
    // sem nada filtrado) e voltava na URL como "f=".
    filters = new Set((p.get('f') || '').split(',').filter(k => k && k !== 'category'));
    const s = p.get('sort');
    if (s) $('sort-select').value = s;
    const n = +p.get('n');
    if (URL_PER_PAGE.includes(n)) perPage = n;
    page = 1;
}

// 'push' para acao discreta (nova entrada no historico), 'replace' para o que
// muda a cada tecla — 20 entradas de historico para uma frase so e o botao
// voltar deixa de servir para sair da busca.
function syncUrl(mode = 'replace') {
    const p = new URLSearchParams();
    const q = $('search').value.trim();
    if (q) p.set('q', q);
    if (category !== 'all') p.set('cat', category);
    const s = $('sort-select').value;
    if (s && s !== 'category') p.set('sort', s);
    if (perPage !== 24) p.set('n', perPage);
    if (filters.size) p.set('f', [...filters].join(','));
    history[mode + 'State'](null, '', p.toString() ? '?' + p : location.pathname);
}

window.addEventListener('popstate', () => {
    readUrl();
    $('items-per-page') && ($('items-per-page').value = perPage);
    render();
    revealActiveTab();
});

function renderStats() {
    $('total-apis').textContent = apis.length;
    $('total-categories').textContent = new Set(apis.map(a => a.category)).size;
    $('no-auth-count').textContent = apis.filter(a => a.auth === 'no').length;

    if (health.size) {
        const up = [...health.values()].filter(h => h.state === 'up').length;
        $('health-stat').hidden = false;
        $('health-count').textContent = `${up}/${health.size}`;
        $('health-stat').title = t().health_title;
    }

    // Contagem dos atalhos: mostra o tamanho do subconjunto antes de clicar,
    // que é a informação que decide se o atalho vale o clique.
    document.querySelectorAll('.quick-chip').forEach(chip => {
        const em = chip.querySelector('em');
        if (em) em.textContent = countFilter(chip.dataset.quick);
        chip.classList.toggle('active', filters.has(chip.dataset.quick));
        chip.classList.toggle('empty', em && em.textContent === '0');
    });
    $('clear-filters-btn').hidden = filters.size === 0 && !$('search').value;
}

function renderCategories() {
    const counts = new Map();
    apis.forEach(a => counts.set(a.category || 'Other', (counts.get(a.category || 'Other') || 0) + 1));
    const sorted = [...counts].sort((a, b) => b[1] - a[1]);
    const total = apis.length;
    const html = [`<button class="cat-tab ${category === 'all' ? 'active' : ''}" data-category="all" role="tab" aria-selected="${category === 'all'}">${t().all}<span class="cat-count">${total}</span></button>`]
        .concat(sorted.map(([c, n]) =>
            `<button class="cat-tab ${category === c ? 'active' : ''}" data-category="${esc(c)}" role="tab" aria-selected="${category === c}">${esc(c)}<span class="cat-count">${n}</span></button>`))
        .join('');
    $('categories-bar').innerHTML = html;
    $('categories-bar').querySelectorAll('.cat-tab').forEach(tab =>
        tab.addEventListener('click', () => {
            category = tab.dataset.category;
            page = 1;
            renderCategories();
            renderGrid();
            syncUrl('push');
            // revealActiveTab, e nao tab.scrollIntoView: renderCategories() acima
            // reconstruiu o innerHTML do rail e `tab` saiu do documento — rolar
            // um elemento desanexado nao move nada. Medido: tinta em x=6062 com
            // o rail ainda em 1582, ou seja, a categoria clicada ficava invisivel.
            revealActiveTab('center');
        }));
    moveInk();
}

// A "tinta" da tab segue a selecionada. Sem ela o usuario so descobre onde esta
// pela posicao num scroll horizontal, que e a unica pista ruim de navegacao.
function moveInk() {
    const ink = $('cat-ink');
    const rail = $('categories-bar');
    const active = rail.querySelector('.cat-tab.active');
    if (!ink || !rail || !active) return;
    ink.style.width = active.offsetWidth + 'px';
    ink.style.transform = `translateX(${active.offsetLeft}px)`;
    ink.style.opacity = '1';
}

// 'nearest' rola so se a tab ja estiver fora da vista. Se rolamos a cada
// render, um simples resize ou troca de filtro puxaria o rail de volta e
// brigaria com quem scrolleou com o mouse.
function revealActiveTab(align = 'nearest') {
    const rail = $('categories-bar');
    const active = rail?.querySelector('.cat-tab.active');
    if (!active) return;
    const visible = active.offsetLeft >= rail.scrollLeft
        && active.offsetLeft + active.offsetWidth <= rail.scrollLeft + rail.clientWidth;
    if (!visible) active.scrollIntoView({ behavior: 'smooth', inline: align, block: 'nearest' });
    moveInk();
}

function renderGrid() {
    const list = visible();
    const pages = Math.ceil(list.length / perPage) || 1;
    page = Math.min(page, pages);
    const slice = list.slice((page - 1) * perPage, page * perPage);

    if (!list.length) {
        $('api-grid').innerHTML = `<div class="no-results"><i class="fas fa-search"></i> ${t().no_results}</div>`;
        $('pagination').innerHTML = '';
        return;
    }

    $('api-grid').innerHTML = slice.map((a, i) => {
        const h = health.get(a.url);
        const p = probeResults.get(a.url);

        // Status vem do CI (sonda de verdade, sem CORS no meio). O teste do
        // navegador, quando existe, vira um segundo selo: "abre no browser".
        let badge = '';
        if (p) {
            badge += p.readable
                ? `<span class="health-badge ok" title="${t().browser_ok} · ${p.ms} ms"><i class="fas fa-window-maximize"></i> ${p.ms} ms</span>`
                : `<span class="health-badge cors" title="${t().browser_no}"><i class="fas fa-ban"></i> CORS</span>`;
        } else if (h) {
            badge += h.state === 'up'
                ? `<span class="health-badge ok" title="${t().health_title} HTTP ${h.status} · ${h.ms} ms"><i class="fas fa-heart-pulse"></i> ${h.ms} ms</span>`
                : `<span class="health-badge dead" title="${t().health_title} HTTP ${h.status}">${h.status ? 'HTTP ' + h.status : '<i class="fas fa-plug-circle-xmark"></i>'}</span>`;
        }

        const noDataPt = a.description_pt === null;   // recém baixado do README

        return `<article class="api-card">
            <div class="card-header">
                <h3><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.name)} <i class="fas fa-external-link-alt fa-xs"></i></a></h3>
                <div class="card-actions">
                    ${badge}
                    <button class="pick-btn ${picked.has(a.url) ? 'active' : ''}" data-url="${esc(a.url)}" title="${t().pick}" aria-label="${t().pick}"><i class="fas fa-scale-balanced"></i></button>
                    <button class="test-btn" data-url="${esc(a.url)}" title="${t().test_browser}"><i class="fas fa-play"></i></button>
                    <button class="favorite-btn ${favorites.has(a.url) ? 'active' : ''}" data-url="${esc(a.url)}" aria-label="Favoritar"><i class="fas ${favorites.has(a.url) ? 'fa-star' : 'fa-star-o'}"></i></button>
                </div>
            </div>
            <p class="card-desc">${esc((!noDataPt && lang === 'pt') ? a.description_pt : a.description)}</p>
            ${h && h.state === 'up' ? latencyBar(h.ms) : ''}
            <div class="card-tags">
                <span class="tag tag-category"><i class="fas fa-folder"></i> ${esc(a.category || 'Other')}</span>
                <span class="tag ${a.auth === 'no' ? 'tag-auth-false' : 'tag-auth-true'}"><i class="fas ${a.auth === 'no' ? 'fa-lock-open' : 'fa-lock'}"></i> ${a.auth === 'no' ? t().auth_no : t().auth_yes}</span>
                <span class="tag ${a.https ? 'tag-https' : 'tag-http'}"><i class="fas ${a.https ? 'fa-shield-alt' : 'fa-triangle-exclamation'}"></i> ${a.https ? t().https : t().http}</span>
                <span class="tag ${a.cors === 'yes' ? 'tag-cors-yes' : a.cors === 'no' ? 'tag-cors-no' : 'tag-cors-unknown'}"><i class="fas ${a.cors === 'yes' ? 'fa-circle-check' : a.cors === 'no' ? 'fa-circle-xmark' : 'fa-circle-question'}"></i> ${a.cors === 'yes' ? t().cors_yes : a.cors === 'no' ? t().cors_no : t().cors_unknown}</span>
            </div>
        </article>`;
    }).join('');

    // Entrada escalonada: 24 cards aparecendo juntos e sem hierarquia visual
    // nao ajuda a enxergar o primeiro. O atraso cresce até 240 ms e para.
    [...$('api-grid').children].forEach((el, i) => {
        el.style.animationDelay = Math.min(i * 10, 240) + 'ms';
    });

    renderPagination(pages);
}

function renderPagination(pages) {
    const el = $('pagination');
    if (pages <= 1 && apis.length <= 24) { el.innerHTML = ''; return; }
    let html = `<button class="page-btn" ${page === 1 ? 'disabled' : ''} data-nav="prev"><i class="fas fa-chevron-left"></i> ${t().prev}</button>`;
    const win = 5;
    let from = Math.max(1, page - Math.floor(win / 2));
    const to = Math.min(pages, from + win - 1);
    if (from > 1) html += `<button class="page-btn" data-page="1">1</button>${from > 2 ? '<span class="page-dots">…</span>' : ''}`;
    for (let i = from; i <= to; i++) html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    if (to < pages) html += `${to < pages - 1 ? '<span class="page-dots">…</span>' : ''}<button class="page-btn" data-page="${pages}">${pages}</button>`;
    html += `<button class="page-btn" ${page === pages ? 'disabled' : ''} data-nav="next">${t().next} <i class="fas fa-chevron-right"></i></button>`;
    html += `<select class="items-per-page" id="items-per-page" aria-label="APIs por página">${[12, 24, 48, 96].map(n => `<option value="${n}" ${perPage === n ? 'selected' : ''}>${n} ${t().per_page}</option>`).join('')}</select>`;
    el.innerHTML = html;

    el.querySelectorAll('.page-btn[data-page]').forEach(b => b.addEventListener('click', () => { page = +b.dataset.page; renderGrid(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
    el.querySelector('[data-nav="prev"]')?.addEventListener('click', () => { if (page > 1) { page--; renderGrid(); } });
    el.querySelector('[data-nav="next"]')?.addEventListener('click', () => { if (page < pages) { page++; renderGrid(); } });
    $('items-per-page')?.addEventListener('change', e => { perPage = +e.target.value; page = 1; renderGrid(); });
}

/* ============================ teste no navegador ============================ */

/* IMPORTANTE: isto mede CORS, nao "a API esta no ar".
 *
 * O fetch do navegador so entrega a resposta se o servidor mandar
 * Access-Control-Allow-Origin. A maioria das APIs publicas nao manda, e o
 * browser reporta "failed" — que nao diz nada sobre o servidor estar vivo.
 * Por isso o status real vem do data/health.json, sondado no CI sem CORS no
 * meio. Aqui o teste vale pelo que o navegador consegue fazer: abrir a API
 * direto do front, ou nao. E a resposta que muda decisao de quem vai
 * integrar. */
async function probe(url, { timeout = 9000 } = {}) {
    const started = performance.now();
    const ctrl = new AbortController();
    probing.set(url, ctrl);
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
        const res = await fetch(url, { mode: 'cors', redirect: 'follow', signal: ctrl.signal, cache: 'no-store' });
        const ms = Math.round(performance.now() - started);
        const buf = await res.clone().arrayBuffer();
        const text = new TextDecoder().decode(buf.slice(0, 4000));
        let preview;
        try { preview = JSON.stringify(JSON.parse(text), null, 2); }
        catch (_) { preview = text.slice(0, 4000); }
        return { readable: true, status: res.status, ms, bytes: buf.byteLength, preview };
    } catch (e) {
        // TypeError aqui = CORS ou rede. O health do CI separa os dois casos.
        return {
            readable: false, status: 0, ms: Math.round(performance.now() - started), bytes: 0, preview: '',
            error: e.name === 'AbortError' ? 'timeout' : 'cors_or_network',
        };
    } finally {
        clearTimeout(timer);
        probing.delete(url);
    }
}

async function probePage() {
    const list = visible().slice(0, 24).filter(a => a.url);
    if (!list.length) return;
    $('probe-bar').hidden = false;
    let done = 0;
    const bump = () => {
        done++;
        $('probe-progress-inner').style.width = `${Math.round((done / list.length) * 100)}%`;
        $('probe-label').textContent = `${t().probe_working} ${done}/${list.length}…`;
    };

    const queue = list.slice();
    const worker = async () => {
        while (queue.length) {
            const item = queue.shift();
            await probe(item.url);
            bump();
            renderGrid();
        }
    };
    // 4 em paralelo: testa sem transformar o site do visitante em varredor.
    await Promise.all([worker(), worker(), worker(), worker()]);

    const ok = list.filter(a => probeResults.get(a.url)?.readable).length;
    $('probe-label').textContent = `${ok}/${list.length} ${lang === 'pt' ? 'abrem no navegador' : 'open in browser'}`;
    $('probe-progress-inner').style.width = '100%';
}

function cancelProbe() {
    probing.forEach(c => c.abort());
    probing.clear();
    $('probe-bar').hidden = true;
}

/* ============================ playground ============================ */

function openPlayground(api) {
    currentApi = api;
    $('pg-name').textContent = api.name;
    $('pg-desc').textContent = api.description_pt || api.description;
    $('pg-endpoint').value = api.url;
    $('pg-result').hidden = true;
    $('pg-open-btn').href = api.url;
    renderSnippet();
    $('playground-overlay').hidden = false;
    document.body.classList.add('modal-open');
}

function closePlayground() {
    $('playground-overlay').hidden = true;
    document.body.classList.remove('modal-open');
    currentApi = null;
}

function snippet() {
    const url = $('pg-endpoint').value.trim() || (currentApi?.url || '');
    if (snippetLang === 'curl') return `curl -s "${url}"`;
    if (snippetLang === 'javascript') return `const res = await fetch("${url}");\nif (!res.ok) throw new Error(res.status);\nconst data = await res.json();\nconsole.log(data);`;
    return `import requests\n\nresp = requests.get("${url}", timeout=10)\nresp.raise_for_status()\ndata = resp.json()`;
}

function renderSnippet() {
    $('snippet-body').textContent = snippet();
    document.querySelectorAll('.snippet-tab').forEach(b => b.classList.toggle('active', b.dataset.langTab === snippetLang));
}

async function runPlayground() {
    const url = $('pg-endpoint').value.trim();
    if (!url) return;
    const btn = $('pg-run-btn');
    btn.disabled = true;
    btn.querySelector('i').className = 'fas fa-spinner fa-spin';

    const r = await probe(url, { timeout: 12000 });
    const ci = health.get(url);
    probeResults.set(url, r);

    $('pg-result').hidden = false;
    lastProbe = r;
    renderPlaygroundResult();

    btn.disabled = false;
    btn.querySelector('i').className = 'fas fa-play';
    renderStats();
    renderGrid();
}

// Resultado da última execução do playground. Fica em função porque applyLang
// precisa redesenhá-lo: as métricas eram escritas em PT e continuavam em PT
// mesmo com a página inteira em inglês, até o visitante rodar a sondagem de novo.
function renderPlaygroundResult() {
    const r = lastProbe;
    if (!r) return;
    // Duas medidas de coisas diferentes, mostradas juntas. Quando o browser
    // diz "não leu" e o CI diz 200, nenhuma das duas está errada: o browser
    // mede CORS, o CI mede o host. Mostrar só uma delas mente sobre a outra.
    $('pg-status').textContent = r.readable ? (r.status || '200') : t().not_readable;
    $('pg-status').className = r.readable ? 'good' : 'bad';
    $('pg-time').textContent = r.readable ? r.ms + ' ms' : '—';
    $('pg-size').textContent = r.bytes ? formatBytes(r.bytes) : '—';
    $('pg-cors').textContent = r.readable ? t().cors_allowed : t().cors_blocked;
    $('pg-body').textContent = r.readable
        ? r.preview
        : (lang === 'pt'
            ? `O navegador não conseguiu ler esta resposta.\n\n`
            + `Isso NÃO significa que a API está fora do ar.\n`
            + `Um fetch no browser só recebe a resposta se o servidor mandar\n`
            + `Access-Control-Allow-Origin. Sem esse cabeçalho o browser bloqueia\n`
            + `antes de entregar o corpo — e ele não diz se o servidor respondeu.`
            : `The browser could not read this response.\n\n`
            + `That does NOT mean the API is down.\n`
            + `A browser fetch only receives the response if the server sends\n`
            + `Access-Control-Allow-Origin. Without it the browser blocks the body\n`
            + `and never tells you whether the server answered.`);
    $('pg-body').className = 'pg-body' + (r.readable ? '' : ' error');
    renderCiLine();
}

// A verdade sobre o host, que o browser não consegue ver. Fica em função
// própria porque trocar de idioma precisa redesenhá-la — senão o card fica com
// metade em português e metade em inglês até a próxima sondagem.
function renderCiLine() {
    const ciLine = $('pg-ci-line');
    const ci = currentApi ? health.get(currentApi.url) : null;
    if (ci) {
        ciLine.hidden = false;
        const head = `<i class="fas ${ci.state === 'up' ? 'fa-heart-pulse' : 'fa-plug-circle-xmark'}"></i> ${t().external_probe}: `;
        ciLine.innerHTML = ci.state === 'up'
            ? `${head}<strong>HTTP ${ci.status}</strong> ${t().in} <strong>${ci.ms} ms</strong> — ${t().host_answers}`
            : `${head}<strong>${ci.status ? 'HTTP ' + ci.status : t().no_response}</strong> — ${t().host_silent}`;
    } else {
        ciLine.hidden = true;
    }
}

function formatBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
}

/* ============================ comparar ============================ */

const MAX_PICK = 3;   // três já é a largura de uma tabela legível

function togglePick(url) {
    const on = picked.has(url);
    if (on) picked.delete(url);
    else {
        if (picked.size >= MAX_PICK) { toast(`⚠️ ${t().pick_max}`); return; }
        picked.add(url);
    }
    renderTray();
    // Só o botão muda de estado. redesenhar o grid inteiro aqui destruía os
    // nós vizinhos no meio da sequência de cliques: marcar 3 APIs clicando
    // uma atrás da outra só registrava a primeira.
    document.querySelectorAll(`.pick-btn[data-url="${CSS.escape(url)}"]`).forEach(b => {
        b.classList.toggle('active', !on);
    });
}

function renderTray() {
    const tray = $('tray');
    tray.hidden = picked.size === 0;
    if (!picked.size) return;
    $('tray-items').innerHTML = [...picked].map(url => {
        const a = apis.find(x => x.url === url);
        if (!a) return '';
        return `<span class="tray-chip"><i class="fas fa-circle" style="font-size:.4rem;color:var(--accent)"></i> ${esc(a.name)}<button data-unpick="${esc(url)}" aria-label="Remover"><i class="fas fa-xmark"></i></button></span>`;
    }).join('');
    $('tray-compare-btn').disabled = picked.size < 2;
}

function openCompare() {
    const items = [...picked].map(url => apis.find(x => x.url === url)).filter(Boolean);
    if (items.length < 2) return;
    const rows = [
        { label: t().cmp_desc, get: a => esc((a.description_pt && a.description_pt !== a.description && lang === 'pt') ? a.description_pt : a.description) },
        { label: t().cmp_status, get: a => { const h = health.get(a.url); return h ? (h.state === 'up' ? `<span class="cmp-good">HTTP ${h.status}</span>` : `<span class="cmp-bad">${h.status ? 'HTTP ' + h.status : 'sem resposta'}</span>`) : '—'; }, wide: true },
        { label: t().cmp_latency, get: a => { const h = health.get(a.url); return h?.state === 'up' ? `${h.ms} ms` : '—'; }, best: a => { const h = health.get(a.url); return h?.state === 'up' ? h.ms : Infinity; } },
        { label: t().cmp_auth, get: a => a.auth === 'no' ? `<span class="cmp-good">${t().auth_no}</span>` : `<span class="cmp-bad">${t().auth_yes}</span>` },
        { label: t().cmp_cors, get: a => a.cors === 'yes' ? `<span class="cmp-good">${t().cors_yes}</span>` : a.cors === 'no' ? `<span class="cmp-bad">${t().cors_no}</span>` : t().cors_unknown },
        { label: t().cmp_https, get: a => a.https ? `<span class="cmp-good">${t().https}</span>` : `<span class="cmp-warn">${t().http}</span>` },
        { label: t().cmp_cat, get: a => esc(a.category) },
        { label: t().cmp_snippet, get: a => `<button class="ghost-btn small" data-cmp-open="${esc(a.url)}"><i class="fas fa-terminal"></i> ${t().open_snippet}</button>`, wide: true },
    ];

    // Marca o melhor por latência: é o dado que a comparação existe para decidir.
    const bestLat = Math.min(...items.map(a => { const h = health.get(a.url); return h?.state === 'up' ? h.ms : Infinity; }));

    $('compare-body').innerHTML =
        `<table class="cmp-table"><thead><tr><th></th>${items.map(a => `<th><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.name)} <i class="fas fa-external-link-alt fa-xs"></i></a></th>`).join('')}</tr></thead><tbody>` +
        rows.map(r => `<tr><th>${r.label}</th>${items.map(a => {
            const isBest = r.best && r.best(a) === bestLat && r.best(a) !== Infinity;
            return `<td class="${r.wide ? 'wide' : ''}${isBest ? ' best' : ''}">${r.get(a)}</td>`;
        }).join('')}</tr>`).join('') +
        `</tbody></table>`;

    $('compare-body').querySelectorAll('[data-cmp-open]').forEach(b => b.addEventListener('click', () => {
        const api = apis.find(x => x.url === b.dataset.cmpOpen);
        closeCompare();
        if (api) openPlayground(api);
    }));

    $('compare-overlay').hidden = false;
    document.body.classList.add('modal-open');
}

function closeCompare() {
    $('compare-overlay').hidden = true;
    document.body.classList.remove('modal-open');
}

/* ============================ favoritos / CSV ============================ */

function loadFavorites() {
    try { favorites = new Set(JSON.parse(localStorage.getItem('api_directory_favs') || '[]')); }
    catch (_) { favorites = new Set(); }
    $('favorites-count').textContent = favorites.size;
}

function toggleFavorite(url) {
    favorites.has(url) ? favorites.delete(url) : favorites.add(url);
    localStorage.setItem('api_directory_favs', JSON.stringify([...favorites]));
    $('favorites-count').textContent = favorites.size;
    renderGrid();
    toast(favorites.has(url) ? t().toast_fav_add : t().toast_fav_remove);
}

function exportCsv() {
    const head = ['name', 'url', 'description', 'category', 'auth', 'https', 'cors', 'latencia_ms', 'status'];
    const rows = [head.join(',')];
    for (const a of visible()) {
        const h = health.get(a.url);
        rows.push([a.name, a.url, a.description, a.category, a.auth, a.https, a.cors, h?.ms ?? '', h?.status ?? '']
            .map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    }
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `api_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/* ============================ i18n da UI ============================ */

function applyLang() {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    $('search').placeholder = t().search;
    $('tagline').textContent = t().tagline;
    // Por value, não por índice: a ordem das <option> já mudou uma vez e o
    // índice calado continuaria escrevendo o rótulo no campo errado.
    const set = (val, txt) => { const o = $('sort-select').querySelector(`option[value="${val}"]`); if (o) o.textContent = txt; };
    set('category', t().sort_category); set('name', t().sort_name);
    set('name-desc', t().sort_name_desc); set('latency', t().sort_latency);
    set('health', t().sort_health); set('favorites', t().sort_favorites);

    $('qc-usable').textContent = t().qc_usable; $('qc-noauth').textContent = t().qc_noauth;
    $('qc-cors').textContent = t().qc_cors; $('qc-fast').textContent = t().qc_fast;
    $('qc-up').textContent = t().qc_up; $('qc-dead').textContent = t().qc_dead;
    $('clear-label').textContent = t().clear;
    $('tray-label').textContent = t().tray; $('tray-clear-label').textContent = t().tray_clear;
    $('tray-compare-label').textContent = t().compare; $('compare-title').textContent = t().compare;
    $('stat-apis').textContent = t().apis; $('stat-categories').textContent = t().categories;
    $('stat-noauth').textContent = t().no_auth; $('stat-favorites').textContent = t().favorites;
    $('stat-health').textContent = t().tested;
    $('pg-label-endpoint').textContent = t().endpoint; $('pg-run-label').textContent = t().run;
    $('pg-open-label').textContent = t().open_docs; $('pg-copy-label').textContent = t().copy_response;
    $('snippet-copy-label').textContent = t().copy_snippet; $('pg-snippet-label').textContent = t().take_ready;
    $('pg-metric-status-label').textContent = t().status; $('pg-metric-time-label').textContent = t().latency;
    $('pg-metric-size-label').textContent = t().size; $('pg-metric-cors-label').textContent = t().cors;
    $('probe-cancel-label').textContent = t().probe_cancel;
    document.title = lang === 'pt' ? 'API Directory — APIs públicas testadas ao vivo' : 'API Directory — live-tested public APIs';
    // Grid e painel precisam ser redesenhados: card, chip e playground carregam
    // texto no idioma em que estavam abertos, e applyLang só trocava os rótulos
    // estáticos — o resto ficava na língua anterior até um clique recarregasse.
    renderStats();
    renderGrid();
    renderCiLine();
    renderPlaygroundResult();
}

/* ============================ infra ============================ */

let toastTimer;
function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ============ scroll: header encolhe, topo aparece, tinta acompanha ========= */

// O header inteiro gruda. Antes header e quickbar eram dois sticky top:0, que
// no scroll se sobrepunham. Agora e um bloco so.
function onScroll() {
    const y = window.scrollY;
    $('topbar')?.classList.toggle('condensed', y > 40);
    const toTop = $('to-top');
    if (toTop) toTop.hidden = y < 500;
}
window.addEventListener('scroll', onScroll, { passive: true });

$('to-top')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('search').focus({ preventScroll: true });
});

// Limpar busca: um "x" e mais discoverable do que selecionar tudo e apagar,
// e some sozinho quando o campo esta vazio.
$('search-clear')?.addEventListener('click', () => {
    $('search').value = '';
    $('search-clear').hidden = true;
    page = 1;
    render();
    syncUrl('push');
    $('search').focus();
});

// Setas do teclado movem o cursor da tab ativa — navegacao por teclado sem
// depender de mouse num rail horizontal de 52 itens.
$('categories-bar').addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = [...$('categories-bar').querySelectorAll('.cat-tab')];
    const i = tabs.findIndex(t => t.classList.contains('active'));
    if (i < 0) return;
    const next = tabs[i + (e.key === 'ArrowRight' ? 1 : -1)];
    if (!next) return;
    e.preventDefault();
    next.click();
    next.focus();
});

// Scroll do mouse vira scroll horizontal: sem isso o rail de 52 categorias so
// anda com barra de rolagem embaixo, que ninguém acha.
$('categories-bar').addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const bar = $('categories-bar');
    bar.scrollLeft += e.deltaY;
    e.preventDefault();
}, { passive: false });

function copy(text, label) {
    navigator.clipboard?.writeText(text).then(() => toast(t().copied + (label ? ' — ' + label : '')))
        .catch(() => toast('⚠️ clipboard'));
}

/* ============================ boot ============================ */

$('search').addEventListener('input', () => {
    $('search-clear').hidden = !$('search').value;
    clearTimeout(searchTimer);
    // 'replace', nao 'push': digitar 6 letras e uma unica volta do historico.
    searchTimer = setTimeout(() => { page = 1; renderGrid(); syncUrl('replace'); }, 140);
});
$('sort-select').addEventListener('change', () => { page = 1; renderGrid(); syncUrl('push'); });
$('refresh-btn').addEventListener('click', refreshFromGitHub);
$('export-csv-btn').addEventListener('click', exportCsv);
$('quick-chips').addEventListener('click', e => {
    const chip = e.target.closest('.quick-chip');
    if (!chip) return;
    const f = chip.dataset.quick;
    filters.has(f) ? filters.delete(f) : filters.add(f);
    page = 1;
    render();
    syncUrl('push');
});
$('clear-filters-btn').addEventListener('click', () => {
    filters.clear();
    $('search').value = '';
    $('search-clear').hidden = true;
    category = 'all';
    page = 1;
    render();
    syncUrl('push');
});

// A "tinta" precisa ser reposicionada quando a janela muda ou quando o rail
// some da vista; sem isso ela fica parada no lugar antigo.
window.addEventListener('resize', () => { moveInk(); renderStats(); });

// Delegação única: os cards são reescritos a cada render.
$('api-grid').addEventListener('click', e => {
    const fav = e.target.closest('.favorite-btn');
    if (fav) return toggleFavorite(fav.dataset.url);
    const pick = e.target.closest('.pick-btn');
    if (pick) return togglePick(pick.dataset.url);
    const test = e.target.closest('.test-btn');
    if (test) {
        const api = apis.find(a => a.url === test.dataset.url);
        if (api) openPlayground(api);
    }
});

$('tray-items').addEventListener('click', e => {
    const b = e.target.closest('[data-unpick]');
    if (b) togglePick(b.dataset.unpick);
});
$('tray-compare-btn').addEventListener('click', openCompare);
$('tray-clear-btn').addEventListener('click', () => { picked.clear(); renderTray(); renderGrid(); });
$('compare-close').addEventListener('click', closeCompare);
$('compare-overlay').addEventListener('click', e => { if (e.target.id === 'compare-overlay') closeCompare(); });

const probeInfo = $('probe-bar').querySelector('.probe-info');
probeInfo.insertAdjacentHTML('beforeend',
    `<button class="ghost-btn small" id="probe-run-btn"><i class="fas fa-satellite-dish"></i> <span id="probe-run-label">${t().probe_run}</span></button>
     <small class="probe-hint">${t().docs_note}</small>`);
$('probe-run-btn').addEventListener('click', probePage);
$('probe-cancel-btn').addEventListener('click', cancelProbe);

$('pg-close').addEventListener('click', closePlayground);
$('playground-overlay').addEventListener('click', e => { if (e.target.id === 'playground-overlay') closePlayground(); });
$('pg-run-btn').addEventListener('click', runPlayground);
$('pg-endpoint').addEventListener('input', renderSnippet);
$('pg-endpoint').addEventListener('keydown', e => { if (e.key === 'Enter') runPlayground(); });
$('pg-copy-btn').addEventListener('click', () => copy($('pg-body').textContent));
$('snippet-copy-btn').addEventListener('click', () => copy(snippet()));
document.querySelectorAll('.snippet-tab').forEach(b => b.addEventListener('click', () => { snippetLang = b.dataset.langTab; renderSnippet(); }));

document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    lang = btn.dataset.lang;
    localStorage.setItem('api_directory_lang', lang);
    applyLang();
    renderGrid();
}));

document.addEventListener('keydown', e => {
    // O modal mais alto vence o Esc: fechar o playground deixando a comparação
    // aberta por baixo seria sair do foco do teclado.
    if (e.key === 'Escape') {
        if (!$('playground-overlay').hidden) return closePlayground();
        if (!$('compare-overlay').hidden) return closeCompare();
        return;
    }
    if (e.key === '/' && document.activeElement !== $('search') && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault(); $('search').focus();
    }
});

const savedLang = localStorage.getItem('api_directory_lang');
if (savedLang && i18n[savedLang]) {
    lang = savedLang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
}
applyLang();
readUrl();
$('last-fetch-value').textContent = new Date().toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US');
loadDataset();