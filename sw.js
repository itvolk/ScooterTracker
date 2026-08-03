// sw.js — Service Worker для офлайн-доступа

const CACHE_NAME = 'scooter-tracker-v1'; // Увеличивайте версию при обновлении
const URLS_TO_CACHE = [
    '/',                          // корень (обычно index.html)
    '/index.html',
    '/manifest.json',
    // Если у вас есть другие статические ресурсы (стили, скрипты), добавьте их сюда
    // Например: '/style.css', '/app.js'
];

// Установка — кешируем основные файлы
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Кеш открыт');
                return cache.addAll(URLS_TO_CACHE);
            })
            .catch(err => console.error('Ошибка кеширования:', err))
    );
    // Принудительно активируем новый SW сразу
    self.skipWaiting();
});

// Активация — удаляем старые кеши
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        console.log('Удаляем старый кеш:', name);
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    // Захватываем управление сразу
    self.clients.claim();
});

// Обработка запросов — стратегия: сначала кеш, затем сеть
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Если есть в кеше — возвращаем
                if (response) {
                    return response;
                }
                // Иначе идём в сеть, кешируем и возвращаем
                return fetch(event.request).then(
                    networkResponse => {
                        // Кешируем только успешные ответы
                        if (networkResponse && networkResponse.status === 200) {
                            const clone = networkResponse.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, clone);
                            });
                        }
                        return networkResponse;
                    }
                ).catch(() => {
                    // Если сеть недоступна и нет кеша — показываем страницу офлайн (опционально)
                    // Можно вернуть заглушку, но лучше просто ошибку
                    console.warn('Нет доступа к ресурсу:', event.request.url);
                });
            })
    );
});

