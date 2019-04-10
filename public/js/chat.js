let ws

let chats = document.getElementById('chats')

let create_chat_line = (id, name, mes) => {
  let chat = document.createElement('div')
  chat.className = `chat-line id_${id}`
  let name_el = document.createElement('a')
  name_el.className = 'name'
  name_el.append(document.createTextNode(name))
  name_el.style.color = `hsl(${id%360},${((id/1000)%50)+50}%,50%)`
  chat.append(name_el)
  chat.append(document.createTextNode(`: ${mes}`))
  return chat
}

let create_error_line = (mes) => {
  let chat = document.createElement('div')
  chat.className = `chat-line chat-error`
  chat.append(document.createTextNode(mes))
  return chat
}

let ws_connect = () => {
  ws = new WebSocket(`wss://${location.host}/chat-socket/`)

  let pinger = window.setInterval(() => {
    ws.send(JSON.stringify({type: 'ping'}))
  }, 10000)

  ws.addEventListener('open', ev => {
    if (cookie.name) {
      name_input.value = cookie.name
      name_input.dispatchEvent(new Event('change'))
    }
  })

  ws.addEventListener('message', ev => {
    let m = {}
    try {
      m = JSON.parse(ev.data)
    } catch (err) { return }

    if (m.type == 'chat') {
      chats.prepend(create_chat_line(m.from, m.name, m.message))
    }

    if (m.type == 'name_change') {
      [...document.querySelectorAll(`#chats .id_${m.from} .name`)].forEach(n => {
        n.innerText = m.name
      })
    }

    if (m.type == 'stream_change') {
      console.log(m.playing)
      if (m.playing) init_video()
      if (!m.playing) {
        if (video.paused) {
          init_video()
        } else {
          video.addEventListener('pause', init_video, {once: true})
        }
      }
    }

    if (m.type == 'error') {
      chats.prepend(create_error_line(m.message))
    }
  })

  ws.addEventListener('close', ev => {
    window.clearInterval(pinger)
    ws_connect()
  })
}

let name_input = document.getElementById('name-input')
name_input.onchange = ev => {
  if (name_input.value) {
    cookie.name = name_input.value
    write_cookie(cookie)
    ws.send(JSON.stringify({type: 'name_change', name: name_input.value}))
  } else {
    name_input.value = cookie.name || ''
  }
}

let chat_input = document.getElementById('chat-input')
chat_input.onkeypress = ev => {
  if (ev.keyCode === 13 && chat_input.value) {
    ws.send(JSON.stringify({type: 'chat', message: chat_input.value}))
    chat_input.value = ''
  }
}

ws_connect()
