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
