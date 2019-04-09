let video = document.getElementById('video')
if (Hls.isSupported()) {
  let hls = new Hls({
    liveSyncDurationCount: 2,
    liveMaxLatencyDurationCount: 7
  })
  hls.loadSource('stream/stream.m3u8')
  hls.attachMedia(video)
  hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(console.error))
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
  video.src = 'stream/stream.m3u8'
  video.addEventListener('loadedmetadata', () => video.play().catch(console.error))
}

let class_swap = (el, c1, c2) => {
  let cs = [...el.classList]
  if (cs.includes(c1)) el.classList = cs.map(c => c == c1 ? c2 : c)
  else if (cs.includes(c2)) el.classList = cs.map(c => c == c2 ? c1 : c)
  else el.classList = cs.concat(c1)
}

let collapser = document.getElementById('collapse-button')
collapser.onclick = ev => {
  class_swap(document.body, 'right-uncollapsed', 'right-collapsed')
  cookie.collapsed = [...document.body.classList].filter(x => /right-(un)?collapsed/.test(x))[0] == 'right-collapsed'
  write_cookie(cookie)
}

document.body.className = cookie.collapsed == "true" ? 'right-collapsed' : 'right-uncollapsed'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
