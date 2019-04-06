let video = document.getElementById('video')
if (Hls.isSupported()) {
  let hls = new Hls({
    liveSyncDurationCount: 2,
    liveMaxLatencyDurationCount: 7
  })
  hls.loadSource('stream/stream.m3u8')
  hls.attachMedia(video)
  hls.on(Hls.Events.MANIFEST_PARSED, video.play)
} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
  video.src = 'stream/stream.m3u8'
  video.addEventListener('loadedmetadata', video.play)
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

let write_cookie = obj => {
  let ex = new Date(Date.now() + 1000*60*60*24*365).toUTCString()
  Object.entries(obj).map(a => a.join('=')).forEach(x => document.cookie = `${x}; expires=${ex}`)
}

let read_cookie = () => document.cookie ? document.cookie.split(/; ?/g).map(x => x.split('=')).reduce((a,b)=>Object.assign(a,{[b[0]]:b[1]}), {}) : ({})

let cookie = read_cookie()

document.body.className = cookie.collapsed == "true" ? 'right-collapsed' : 'right-uncollapsed'
