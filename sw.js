// sw.js — Service Worker для офлайн-доступа
const CACHE_NAME = 'scooter-tracker-v25';
const BASE = '/ScooterTracker/';

const URLS_TO_CACHE = [
    BASE,
    BASE + 'index.html',
    BASE + 'manifest.json',
    BASE + 'sw.js'
];

// Установка
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Кеш открыт');
                return cache.addAll(URLS_TO_CACHE);
            })
            .then(() => {
                console.log('Кеширование завершено');
                self.skipWaiting();
            })
            .catch(err => {
                console.error('Ошибка кеширования:', err);
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
                    return response;
                }
                return fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200) {
                            const clone = networkResponse.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, clone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        console.warn('Нет доступа к ресурсу:', event.request.url);
                        return new Response('Офлайн-режим: ресурс недоступен', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});