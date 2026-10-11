const translations = {
    pt: {
        stat_apis: "APIs encontradas",
        stat_categories: "categorias",
        stat_noauth: "sem autenticação",
        stat_favorites: "favoritas",
        search_placeholder: "Buscar APIs...",
        sort_category: "Ordenar: Categoria",
        sort_name_asc: "Ordenar: Nome A-Z",
        sort_name_desc: "Ordenar: Nome Z-A",
        sort_favorites: "Favoritos primeiro",
        loading: "Carregando APIs...",
        updating: "Atualizando...",
        translating: "Traduzindo descrições...",
        translation_done: "Tradução concluída!",
        no_results: "Nenhuma API encontrada com esses filtros.",
        error_load: "Falha ao carregar dados das APIs.",
        error_try_reload: "Tente recarregar a página.",
        toast_favorite_add: "Adicionado aos favoritos!",
        toast_favorite_remove: "Removido dos favoritos!",
        toast_export: "Exportando dados...",
        toast_cache_loaded: "Dados carregados do cache",
        auth_no: "Sem Auth",
        auth_yes: "Auth",
        cors_yes: "CORS ✅",
        cors_no: "Sem CORS ❌",
        cors_unknown: "CORS ❓",
        https: "HTTPS 🔒",
        http: "HTTP ⚠️"
    },
    en: {
        stat_apis: "APIs found",
        stat_categories: "categories",
        stat_noauth: "no authentication",
        stat_favorites: "favorites",
        search_placeholder: "Search APIs...",
        sort_category: "Sort: Category",
        sort_name_asc: "Sort: Name A-Z",
        sort_name_desc: "Sort: Name Z-A",
        sort_favorites: "Favorites first",
        loading: "Loading APIs...",
        updating: "Updating...",
        translating: "Translating descriptions...",
        translation_done: "Translation complete!",
        no_results: "No APIs found with these filters.",
        error_load: "Failed to load API data.",
        error_try_reload: "Please try reloading the page.",
        toast_favorite_add: "Added to favorites!",
        toast_favorite_remove: "Removed from favorites!",
        toast_export: "Exporting data...",
        toast_cache_loaded: "Data loaded from cache",
        auth_no: "No Auth",
        auth_yes: "Auth",
        cors_yes: "CORS ✅",
        cors_no: "No CORS ❌",
        cors_unknown: "CORS ❓",
        https: "HTTPS 🔒",
        http: "HTTP ⚠️"
    }
};

let currentLang = 'pt';
let apiData = [];
let activeCategory = 'all';
let favorites = new Set();
let currentPage = 1;
let itemsPerPage = 24;

// ========== DETECÇÃO DE IDIOMA DO NAVEGADOR ==========
function detectBrowserLanguage() {
    const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
    return browserLang === 'pt' ? 'pt' : 'en';
}

// ========== TRADUÇÃO COM GOOGLE TRANSLATE (endpoint gratuito, sem chave) ==========
// Usa translate.googleapis.com (mesmo endpoint das extensões de navegador).
// Muito mais tolerante a rate limit que o MyMemory — traduz 1500+ descrições sem 429.
async function translateText(text, targetLang) {
    if (!text || targetLang === 'en' || text.length < 5) return text;
    
    const cacheKey = `trans_${btoa(encodeURIComponent(text)).slice(0, 50)}_${targetLang}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
    
    try {
        const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang === 'pt' ? 'pt' : 'en'}&dt=t&q=${encodeURIComponent(text)}`
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        // data[0] é um array de segmentos; concatena o texto traduzido
        let translated = Array.isArray(data[0]) ? data[0].map(seg => seg[0]).join('') : '';
        
        if (translated && translated !== text) {
            localStorage.setItem(cacheKey, translated);
            return translated;
        }
        return text;
    } catch (e) {
        console.warn('Translation failed:', e);
        return text;
    }
}

async function translateAPIs(apis, targetLang, onProgress) {
    const batchSize = 10;
    const results = new Array(apis.length);
    const concurrency = 4; // Google Translate aguenta bem mais paralelismo que o MyMemory
    let done = 0;

    // Processa lotes com concorrência limitada
    for (let i = 0; i < apis.length; i += batchSize * concurrency) {
        const slice = apis.slice(i, i + batchSize * concurrency);
        const batches = [];
        for (let j = 0; j < slice.length; j += batchSize) {
            batches.push(slice.slice(j, j + batchSize));
        }
        await Promise.all(batches.map(async (batch, bi) => {
            const translatedBatch = await Promise.all(
                batch.map(api => translateText(api.Description, targetLang))
            );
            translatedBatch.forEach((desc, index) => {
                const globalIdx = i + bi * batchSize + index;
                results[globalIdx] = { ...batch[index], Description: desc };
            });
            done += batch.length;
            if (onProgress) onProgress(done, apis.length);
        }));
    }

    return results;
}

function loadFavorites() {
    try {
        const saved = localStorage.getItem('api_favorites');
        if (saved) favorites = new Set(JSON.parse(saved));
    } catch (e) { console.warn('Could not load favorites:', e); }
}

function saveFavorites() {
    try {
        localStorage.setItem('api_favorites', JSON.stringify([...favorites]));
        updateFavoritesCount();
    } catch (e) { console.warn('Could not save favorites:', e); }
}

function toggleFavorite(apiName) {
    if (favorites.has(apiName)) {
        favorites.delete(apiName);
        showToast(translations[currentLang].toast_favorite_remove);
    } else {
        favorites.add(apiName);
        showToast(translations[currentLang].toast_favorite_add);
    }
    saveFavorites();
    updateFavoritesCount();
}

function updateFavoritesCount() {
    document.getElementById('favorites-count').textContent = favorites.size;
}

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-star"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function updateLanguage() {
    const t = translations[currentLang];
    document.getElementById('search').placeholder = t.search_placeholder;
    document.getElementById('stat-apis').textContent = t.stat_apis;
    document.getElementById('stat-categories').textContent = t.stat_categories;
    document.getElementById('stat-noauth').textContent = t.stat_noauth;
    document.getElementById('stat-favorites').textContent = t.stat_favorites;
    
    const sortSelect = document.getElementById('sort-select');
    sortSelect.options[0].innerHTML = `<i class="fas fa-folder"></i> ${t.sort_category}`;
    sortSelect.options[1].innerHTML = `<i class="fas fa-sort-alpha-down"></i> ${t.sort_name_asc}`;
    sortSelect.options[2].innerHTML = `<i class="fas fa-sort-alpha-up"></i> ${t.sort_name_desc}`;
    sortSelect.options[3].innerHTML = `<i class="fas fa-star"></i> ${t.sort_favorites}`;
    
    renderCategories();
    renderGrid();
}

function parseMarkdownAPITable(markdown) {
    const apis = [];
    const lines = markdown.split('\n');
    let currentCategory = 'Other';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('### ')) {
            currentCategory = line.slice(4).trim();
            continue;
        }
        if (line.trim().startsWith('|') && !/^\s*\|[\s:|-]+\|\s*$/.test(line) && !line.includes('API|Description')) {
            const cells = line.split('|').slice(1, -1).map(c => c.trim());
            if (cells.length >= 5 && cells[0] && !cells[0].includes('API')) {
                const apiMatch = cells[0].match(/\[([^\]]+)\]\(([^)]+)\)/);
                apis.push({
                    API: apiMatch ? apiMatch[1] : cells[0],
                    Link: apiMatch ? apiMatch[2] : '',
                    Description: cells[1] || '',
                    Auth: cells[2] || 'No',
                    HTTPS: cells[3]?.toLowerCase() === 'yes',
                    CORS: cells[4] || 'unknown',
                    Category: currentCategory
                });
            }
        }
    }
    return apis;
}

// ========== FETCH COM TRADUÇÃO EM BACKGROUND (degradação progressiva) ==========
// Renderiza os dados em inglês IMEDIATAMENTE, depois traduz em background
// e atualiza os cards conforme traduz. O usuário pode navegar enquanto traduz.
async function fetchAPIs() {
    const btn = document.getElementById('refresh-btn');
    
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-sync-alt fa-spin"></i> ${currentLang === 'pt' ? 'Atualizando...' : 'Updating...'}`;

    try {
        const response = await fetch('https://api.publicapis.org/entries', { signal: AbortSignal.timeout(10000) });
        const data = await response.json();
        const rawData = data.entries || [];
        await processAPIs(rawData);
    } catch (e) {
        console.log('API failed, trying markdown:', e);
        await fetchFromMarkdown();
    }

    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-sync-alt"></i> ${currentLang === 'pt' ? 'Atualizar' : 'Refresh'}`;
}

async function fetchFromMarkdown() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/public-apis/public-apis/master/README.md', { signal: AbortSignal.timeout(15000) });
        const md = await response.text();
        const rawData = parseMarkdownAPITable(md);
        await processAPIs(rawData);
    } catch (e) {
        console.error('Failed to fetch markdown:', e);
        if (!loadCache()) {
            document.getElementById('api-grid').innerHTML = `<div class="error-msg">
                <i class="fas fa-exclamation-triangle"></i> ${translations[currentLang].error_load}
                <p style="font-size:0.8rem;margin-top:0.5rem">${e.message}</p>
                <p style="font-size:0.8rem;margin-top:1rem">${translations[currentLang].error_try_reload}</p>
            </div>`;
        }
    }
}

// Processa os dados: renderiza em inglês na hora, traduz em background
async function processAPIs(rawData) {
    // 1. Renderiza IMEDIATAMENTE em inglês (sem esperar tradução)
    apiData = rawData;
    renderAll();
    saveCache();
    showToast(currentLang === 'pt' ? 'Dados carregados!' : 'Data loaded!');

    // 2. Traduz em background se for pt, atualizando conforme avança
    if (currentLang === 'pt') {
        const grid = document.getElementById('api-grid');
        // Barra de progresso de tradução
        const progressBar = document.createElement('div');
        progressBar.className = 'translate-progress';
        progressBar.innerHTML = `<div class="translate-progress-inner"><i class="fas fa-language"></i> <span class="translate-progress-text">${translations[currentLang].translating} 0%</span></div>`;
        grid.prepend(progressBar);

        const translated = await translateAPIs(rawData, 'pt', (done, total) => {
            const pct = Math.round((done / total) * 100);
            const text = progressBar.querySelector('.translate-progress-text');
            if (text) text.textContent = `${translations[currentLang].translating} ${pct}%`;
        });

        // 3. Atualiza os dados traduzidos e re-renderiza
        apiData = translated;
        saveCache();
        progressBar.remove();
        renderAll();
        showToast(translations[currentLang].translation_done);
    }
}

function renderAll() {
    renderStats();
    renderCategories();
    renderGrid();
    updateTimestamp();
    updateFavoritesCount();
}

function renderStats() {
    document.getElementById('total-apis').textContent = apiData.length;
    const categories = [...new Set(apiData.map(a => a.Category))];
    document.getElementById('total-categories').textContent = categories.length;
    const noAuth = apiData.filter(a => !a.Auth || a.Auth === 'No' || a.Auth === 'null' || a.Auth === '').length;
    document.getElementById('no-auth-count').textContent = noAuth;
}

function renderCategories() {
    const bar = document.getElementById('categories-bar');
    const counts = {};
    apiData.forEach(a => {
        const cat = a.Category || 'Other';
        counts[cat] = (counts[cat] || 0) + 1;
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    let html = `<div class="cat-chip ${activeCategory === 'all' ? 'active' : ''}" data-category="all">
        <i class="fas fa-layer-group"></i> ${currentLang === 'pt' ? 'Todas' : 'All'}<span class="cat-count">(${apiData.length})</span>
    </div>`;
    
    sorted.forEach(([cat, count]) => {
        html += `<div class="cat-chip ${activeCategory === cat ? 'active' : ''}" data-category="${cat.replace(/"/g, '&quot;')}">
            <i class="fas fa-folder"></i> ${cat}<span class="cat-count">(${count})</span>
        </div>`;
    });
    
    bar.innerHTML = html;
    bar.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            activeCategory = chip.dataset.category;
            currentPage = 1;
            renderCategories();
            renderGrid();
            setTimeout(updateScrollButtons, 50);
        });
    });
}

function getFilteredSorted() {
    const query = document.getElementById('search').value.toLowerCase().trim();
    const sortBy = document.getElementById('sort-select').value;
    
    let filtered = activeCategory === 'all' ? [...apiData] : apiData.filter(a => (a.Category || 'Other') === activeCategory);
    
    if (query) {
        filtered = filtered.filter(a => (a.API || '').toLowerCase().includes(query) || (a.Description || '').toLowerCase().includes(query) || (a.Category || '').toLowerCase().includes(query));
    }
    
    switch (sortBy) {
        case 'name': filtered.sort((a, b) => (a.API || '').localeCompare(b.API || '')); break;
        case 'name-desc': filtered.sort((a, b) => (b.API || '').localeCompare(a.API || '')); break;
        case 'favorites': filtered.sort((a, b) => (favorites.has(b.API) ? 1 : 0) - (favorites.has(a.API) ? 1 : 0) || (a.API || '').localeCompare(b.API || '')); break;
        default: filtered.sort((a, b) => (a.Category || '').localeCompare(b.Category || '') || (a.API || '').localeCompare(b.API || ''));
    }
    
    return filtered;
}

function renderGrid() {
    const grid = document.getElementById('api-grid');
    const filtered = getFilteredSorted();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="no-results"><i class="fas fa-search"></i> ${translations[currentLang].no_results}</div>`;
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    let html = '';
    paginated.forEach((api, idx) => {
        const globalIdx = start + idx + 1;
        const isFavorite = favorites.has(api.API);
        const t = translations[currentLang];
        
        let authLabel, authClass, authIcon;
        if (!api.Auth || api.Auth === 'No' || api.Auth === 'null' || api.Auth === '') {
            authLabel = t.auth_no;
            authClass = 'tag-auth-false';
            authIcon = '<i class="fas fa-lock-open"></i>';
        } else {
            authLabel = api.Auth.length > 15 ? api.Auth.slice(0, 12) + '...' : api.Auth;
            authClass = 'tag-auth-true';
            authIcon = '<i class="fas fa-lock"></i>';
        }
        
        const httpsLabel = api.HTTPS === true || api.HTTPS === 'Yes' ? t.https : t.http;
        const httpsClass = api.HTTPS === true || api.HTTPS === 'Yes' ? 'tag-https' : 'tag-http';
        const httpsIcon = api.HTTPS === true || api.HTTPS === 'Yes' ? '<i class="fas fa-shield-alt"></i>' : '<i class="fas fa-exclamation-triangle"></i>';
        
        let corsLabel, corsClass, corsIcon;
        const corsVal = (api.CORS || '').toLowerCase();
        if (corsVal === 'yes') { corsLabel = t.cors_yes; corsClass = 'tag-cors-yes'; corsIcon = '<i class="fas fa-check-circle"></i>'; }
        else if (corsVal === 'no') { corsLabel = t.cors_no; corsClass = 'tag-cors-no'; corsIcon = '<i class="fas fa-times-circle"></i>'; }
        else { corsLabel = t.cors_unknown; corsClass = 'tag-cors-unknown'; corsIcon = '<i class="fas fa-question-circle"></i>'; }
        
        html += `<div class="api-card">
            <div class="card-header">
                <h3>${api.Link ? `<a href="${api.Link}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> ${escapeHtml(api.API)}</a>` : escapeHtml(api.API)}</h3>
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-api="${api.API.replace(/"/g, '&quot;')}"><i class="fas ${isFavorite ? 'fa-star' : 'fa-star-o'}"></i></button>                <span class="rank-badge"><i class="fas fa-hashtag"></i>${globalIdx}</span>
            </div>
            <p class="card-desc">${escapeHtml(api.Description || '')}</p>
            <div class="card-tags">
                <span class="tag tag-category" title="Category"><i class="fas fa-folder"></i> ${escapeHtml(api.Category || 'Other')}</span>
                <span class="tag ${authClass}" title="Authentication">${authIcon} ${authLabel}</span>
                <span class="tag ${httpsClass}" title="HTTPS">${httpsIcon} ${httpsLabel}</span>
                <span class="tag ${corsClass}" title="CORS">${corsIcon} ${corsLabel}</span>
            </div>
        </div>`;
    });
    
    grid.innerHTML = html;
    
    renderPagination(totalPages);
}

//==========BOTAO========
const categoriesContainer =
    document.getElementById('categories-bar');

const scrollLeftBtn =
    document.getElementById('scroll-left');

const scrollRightBtn =
    document.getElementById('scroll-right');

const scrollAmount = 250;

scrollLeftBtn.addEventListener('click', () => {
    categoriesContainer.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
    });
});

scrollRightBtn.addEventListener('click', () => {
    categoriesContainer.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
    });
});

function updateScrollButtons() {

    const maxScroll =
        categoriesContainer.scrollWidth -
        categoriesContainer.clientWidth;

    scrollLeftBtn.classList.toggle(
        'hidden',
        categoriesContainer.scrollLeft <= 0
    );

    scrollRightBtn.classList.toggle(
        'hidden',
        categoriesContainer.scrollLeft >= maxScroll - 1
    );
}

categoriesContainer.addEventListener(
    'scroll',
    updateScrollButtons
);

window.addEventListener(
    'resize',
    updateScrollButtons
);

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `<button class="page-btn" id="prev-page" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i> ${currentLang === 'pt' ? 'Anterior' : 'Prev'}</button>`;
    
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    
    if (startPage > 1) html += `<button class="page-btn" data-page="1">1</button>${startPage > 2 ? '<span class="page-dots">...</span>' : ''}`;
    for (let i = startPage; i <= endPage; i++) html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    if (endPage < totalPages) html += `${endPage < totalPages - 1 ? '<span class="page-dots">...</span>' : ''}<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    
    html += `<button class="page-btn" id="next-page" ${currentPage === totalPages ? 'disabled' : ''}>${currentLang === 'pt' ? 'Próxima' : 'Next'} <i class="fas fa-chevron-right"></i></button>`;
    html += `<select class="items-per-page" id="items-per-page">
        <option value="12" ${itemsPerPage === 12 ? 'selected' : ''}>12 ${currentLang === 'pt' ? 'por página' : 'per page'}</option>
        <option value="24" ${itemsPerPage === 24 ? 'selected' : ''}>24 ${currentLang === 'pt' ? 'por página' : 'per page'}</option>
        <option value="48" ${itemsPerPage === 48 ? 'selected' : ''}>48 ${currentLang === 'pt' ? 'por página' : 'per page'}</option>
        <option value="96" ${itemsPerPage === 96 ? 'selected' : ''}>96 ${currentLang === 'pt' ? 'por página' : 'per page'}</option>
    </select>`;
    
    container.innerHTML = html;
    
    document.getElementById('prev-page')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderGrid(); } });
    document.getElementById('next-page')?.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderGrid(); } });
    document.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => { currentPage = parseInt(btn.dataset.page); renderGrid(); });
    });
    document.getElementById('items-per-page')?.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderGrid();
    });
}

function exportToCSV() {
    const filtered = getFilteredSorted();
    showToast(translations[currentLang].toast_export);
    
    const headers = ['API', 'Description', 'Category', 'Auth', 'HTTPS', 'CORS', 'Link'];
    const csvRows = [headers.join(',')];
    
    filtered.forEach(api => {
        const row = headers.map(header => {
            let value = api[header] || '';
            if (header === 'HTTPS') value = api.HTTPS === true || api.HTTPS === 'Yes' ? 'Yes' : 'No';
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) value = `"${value.replace(/"/g, '""')}"`;
            return value;
        });
        csvRows.push(row.join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api_directory_${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function updateTimestamp() {
    const now = new Date();
    document.getElementById('last-fetch').innerHTML = `<i class="far fa-calendar-alt"></i> ${currentLang === 'pt' ? 'Última atualização' : 'Last updated'}: ${now.toLocaleString(currentLang === 'pt' ? 'pt-BR' : 'en-US')}`;
    localStorage.setItem('api_directory_last_update', now.toISOString());
}

function saveCache() {
    try {
        localStorage.setItem('api_directory_data', JSON.stringify(apiData));
        localStorage.setItem('api_directory_timestamp', new Date().toISOString());
    } catch (e) { console.warn('Could not save cache:', e); }
}

function loadCache() {
    try {
        const cached = localStorage.getItem('api_directory_data');
        if (cached) {
            apiData = JSON.parse(cached);
            console.log(`Loaded ${apiData.length} APIs from cache`);
            return true;
        }
    } catch (e) { console.warn('Could not load cache:', e); }
    return false;
}

// ========== INICIALIZAÇÃO COM DETECÇÃO DE IDIOMA ==========
async function init() {
    loadFavorites();
    
    // 🔥 DETECTA IDIOMA DO NAVEGADOR
    const detectedLang = detectBrowserLanguage();
    currentLang = detectedLang;
    
    // Atualiza botão ativo
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === detectedLang) btn.classList.add('active');
    });
    
    updateLanguage();
    
    if (!loadCache()) {
        // Sem cache: mostra skeleton cards (feedback real de loading)
        showSkeleton();
        await fetchAPIs();
    } else {
        renderAll();
        fetchAPIs(); // Busca dados novos em background
    }
}

// Skeleton cards enquanto carrega (feedback visual real)
function showSkeleton() {
    const grid = document.getElementById('api-grid');
    let html = '<div class="skeleton-grid">';
    for (let i = 0; i < 8; i++) {
        html += `<div class="skeleton-card">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line long"></div>
        </div>`;
    }
    html += '</div>';
    grid.innerHTML = html;
}

// Event listeners
document.getElementById('search').addEventListener('input', () => { currentPage = 1; renderGrid(); });
document.getElementById('sort-select').addEventListener('change', () => { currentPage = 1; renderGrid(); });
document.getElementById('refresh-btn').addEventListener('click', fetchAPIs);
document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLang = btn.dataset.lang;
        updateLanguage();
        renderGrid();
    });
});

// Listener delegado único para botões de favorito (evita acúmulo a cada render)
document.getElementById('api-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.favorite-btn');
    if (btn) {
        toggleFavorite(btn.dataset.api);
    }
});

// Auto-atualização em background a cada 5 minutos (timer único)
setInterval(() => { if (!document.hidden) fetchAPIs(); }, 5 * 60 * 1000);

init();