"use strict"

const cacheName = `321zeno-v1-${process.env.SW_VERSION}`
const cacheFiles = ["/index.html", "/css/main.css"]

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll(cacheFiles)
        })
    )
})

self.addEventListener("fetch", e => {
    if (e.request.method !== "GET") {
        return
    }
    e.respondWith(
        caches.match(e.request).then(r => {
            return (
                r ||
                fetch(e.request).then(response => {
                    return caches.open(cacheName).then(cache => {
                        cache.put(e.request, response.clone())
                        return response
                    })
                })
            )
        })
    )
})

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (cacheName.indexOf(key) === -1) {
                        return caches.delete(key)
                    }
                })
            )
        })
    )
})
