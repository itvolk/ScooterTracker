// sw.js — Service Worker для офлайн-доступа
// Версия: v5 — с абсолютными путями относительно корня сайта

const CACHE_NAME = 'scooter-tracker-v5';
const BASE_PATH = '/ScooterTracker/'; // <- ваш репозиторий

// Все файлы, которые должны быть доступны офлайн
const URLS_TO_CACHE = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'sw.js'
];

// Установка
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Кеш открыт, кешируем:', URLS_TO_CACHE);
                return cache.addAll(URLS_TO_CACHE);
            })
            .then(() => {
                console.log('Кеширование завершено');
                self.skipWaiting(); // сразу активируем
            })
            .catch(err => {
                console.error('Ошибка кеширования:', err);
                // Если один файл не закешировался, пробуем остальные
                // но лучше исправить пути
            })
    );
});

// Активация
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
        .then(() => {
            console.log('Service Worker активирован');
            self.clients.claim();
        })
    );
});

// Обработка запросов
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    // Если есть в кеше — возвращаем
                    return response;
                }
                // Иначе идём в сеть
                return fetch(event.request)
                    .then(networkResponse => {
                        // Кешируем успешные ответы
                        if (networkResponse && networkResponse.status === 200) {
                            const clone = networkResponse.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, clone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Если сеть недоступна и нет кеша — показываем ошибку
                        console.warn('Нет доступа к ресурсу:', event.request.url);
                        return new Response('Офлайн-режим: ресурс недоступен', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});