let cache_list_stale = new Set([
  '/',
  '/vods',
  '/css/style.css',
  '/js/hls.js',
  '/js/cookie.js',
  '/js/index.js',
  '/js/chat.js',
  '/js/vods.js'
])

let cache_list_fresh = new Set([
  '/stream/stream.m3u8',
  '/stream/done.ts'
])

let cache_list = new Set([...cache_list_stale, ...cache_list_fresh])

self.addEventListener('install', event => {
  event.waitUntil(async () => {
    let cache = await caches.open('static')
    cache.addAll([...cache_list])
  })
})

self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    let path = `/${event.request.url.split('/').slice(3).join('/')}`
    let cache = await caches.open('static')
    let cached = await cache.match(event.request)
    let network_req = fetch(event.request)

    // Don't ever cache this
    if (!cache_list.has(path)) return network_req

    // Cache this
    event.waitUntil((async () => {
      try {
        let network_res = await network_req
        await cache.put(event.request, network_res.clone())
      } catch (e) {}
    })())

    if (cache_list_stale.has(path)) {
      // Stale allowed - return cached resource while updating if we have it
      return cached || network_req
    } else if (cache_list_fresh.has(path)) {
      // Fresh required - wait for update to finish and only serve stale if failed
      try { return await network_req } catch (e) { return cached }
    }
  })())
})

self.addEventListener('push', event => {
  let data = event.data ? event.data.json() : {}
  let title = data.title || 'Stream update'
  event.waitUntil(self.registration.showNotification(title, {
    body: data.message ? data.message.replace(/[0-9]{13}/g, n => new Date(+n).toLocaleTimeString('en-US').replace(/:[0-9]{2} /,' ')) : undefined,
    tag: data.tag || 'stream-notify',
    vibrate: [400, 100, 200, 100, 200]
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.matchAll({type: "window"}).then(clientList => {
    for (let client of clientList) {
      if (client.url.split('/').slice(3).join('/').replace(/#.*$/,'') == '' && 'focus' in client) return client.focus()
    }
    return clients.openWindow('/')
  }))
})
