const CACHE_NAME = 'matematica-divertida-cache-v1'; // Mude a versão (v2, v3...) se atualizar os arquivos
const ASSETS_TO_CACHE = [
    '/', // Cacheia a raiz (importante)
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    // Ícones (ajuste o caminho se necessário)
    'images/icon-192x192.png',
    'images/icon-512x512.png',
    // Sons (adicione TODOS os seus arquivos de som)
    'sounds/correct.wav',
    'sounds/incorrect.wav',
    'sounds/click.wav',
    'sounds/win.wav',
    'sounds/lose.wav',
    'sounds/background_music.mp3',
    // Font Awesome (opcional, mas melhora offline se o CDN falhar)
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css', // Cachear CDNs pode ser complexo/instável
    // Canvas Confetti (opcional)
    'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js'
];

// Evento de Instalação: Baixa e armazena os assets em cache
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Cache aberto, adicionando assets essenciais');
                // Adiciona arquivos essenciais primeiro. Se falhar, a instalação falha.
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[Service Worker] Assets essenciais cacheados com sucesso!');
                // Força o SW a se tornar ativo imediatamente após a instalação (útil para dev)
                return self.skipWaiting();
            })
            .catch(error => {
                 console.error('[Service Worker] Falha ao cachear assets durante a instalação:', error);
            })
    );
});

// Evento de Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Ativando...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deletando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Cache atualizado, ativado e pronto para controlar clientes!');
            // Controla clientes (abas abertas) não controlados imediatamente
            return self.clients.claim();
        })
    );
});

// Evento Fetch: Intercepta requisições e serve do cache se possível
self.addEventListener('fetch', (event) => {
    // Ignora requisições que não são GET (ex: POST)
    if (event.request.method !== 'GET') {
        return;
    }

    // Estratégia: Cache first, falling back to network
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Retorna do cache se encontrado
                if (cachedResponse) {
                    // console.log('[Service Worker] Servindo do cache:', event.request.url);
                    return cachedResponse;
                }

                // Não está no cache, busca na rede
                // console.log('[Service Worker] Buscando na rede:', event.request.url);
                return fetch(event.request).then((networkResponse) => {
                    // Opcional: Cacheia a resposta da rede para uso futuro
                    // É importante clonar a resposta, pois ela só pode ser consumida uma vez
                     if (networkResponse && networkResponse.status === 200) {
                         let responseToCache = networkResponse.clone();
                         caches.open(CACHE_NAME)
                             .then((cache) => {
                                 // console.log('[Service Worker] Cacheando novo recurso:', event.request.url);
                                 cache.put(event.request, responseToCache);
                             });
                     }
                    return networkResponse;
                }).catch(error => {
                    console.error('[Service Worker] Erro ao buscar na rede:', error);
                    // Opcional: Retornar uma página offline padrão aqui se necessário
                    // return caches.match('/offline.html');
                });
            })
    );
});