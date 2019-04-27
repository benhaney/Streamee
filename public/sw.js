let cache_list = new Set([
  '/',
  '/vods',
  '/vods/vods.json',
  '/css/style.css',
  '/js/hls.js',
  '/js/cookie.js',
  '/js/index.js',
  '/js/chat.js',
  '/js/vods.js',
  '/stream/stream.m3u8',
  '/stream/done.ts',
  '/manifest.webmanifest'
])

let cache_exts = new Set(['js', 'css', 'json', 'jpg', 'png', 'html'])

self.addEventListener('install', event => {
  event.waitUntil(async () => {
    let cache = await caches.open('static')
    cache.addAll([...cache_list])
  })
})

self.addEventListener('fetch', event => {
  let path = `/${event.request.url.split('/').slice(3).join('/')}`
  let ext = (path.match(/\.(.+)$/)||[])[1]
  if (!cache_list.has(path) && !cache_exts.has(ext)) return
  event.respondWith(
    fetch(event.request).then(res => {
      let res_cache = res.clone()
      caches.open('static').then(cache => cache.put(event.request, res_cache))
      return res
    }).catch(() => {
      return caches.open('static')
        .then(cache => cache.match(event.request))
        .then(res => res || Promise.reject('no-match'))
    })
  )
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
