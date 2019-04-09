let time_between = (t1, t2) => {
  let times = {
    year:   60 * 60 * 24 * 365,
    month:  60 * 60 * 24 * 30,
    week:   60 * 60 * 24 * 7,
    day:    60 * 60 * 24,
    hour:   60 * 60,
    minute: 60,
    second: 1
  }
  let finish = (num, unit) => `${~~num} ${unit}${~~num>1?'s':''} ago`
  let t = (t2 - t1) / 1000
  for (let [unit, time] of Object.entries(times)) {
    if (t > time) return finish(t / time, unit)
  }
}

let vods_container = document.getElementById('vods-container')

fetch('/vods/vods.json').then(res => res.json()).then(vods => {
  for (let [filename, meta] of Object.entries(vods).reverse()) {
    let vod = document.createElement('div')
    vod.className = 'vod'
    let date_el = document.createElement('span')
    date_el.className = "vod-line"
    date_el.append(document.createTextNode(time_between(meta.time, Date.now())))
    vod.append(date_el)
    let thumb_a = document.createElement('a')
    thumb_a.href = `/vods/${filename}`
    let thumb = document.createElement('img')
    thumb.src = `/vods/${meta.thumb}`
    thumb.alt = meta.title || 'Unnamed stream'
    thumb_a.append(thumb)
    vod.append(thumb_a)
    if (meta.title) {
      let title_el = document.createElement('span')
      title_el.className = "vod-line vod-title"
      title_el.append(document.createTextNode(meta.title))
      vod.append(title_el)
    }
    for (let subject of (meta.subjects || [])) {
      let sub_el = document.createElement('span')
      sub_el.className = "vod-line vod-subject"
      sub_el.append(document.createTextNode(subject))
      vod.append(sub_el)
    }
    vods_container.append(vod)
  }
})
