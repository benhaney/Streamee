const WebSocket = require('ws')
const EventEmitter = require('events')

class WsChat extends EventEmitter {
  constructor(opts) {
    super()
    this.init_ws(opts)
  }

  init_ws(opts) {
    this.wss = new WebSocket.Server({port: opts.chat_port})

    let message_buffer = []

    this.wss.on('connection', ws => {
      ws.chat_id = +(Math.random() + '').slice(2)

      message_buffer.forEach(mes => ws.send(JSON.stringify(mes)))

      ws.on('message', mes => {
        try {
          mes = JSON.parse(mes)
        } catch (e) { return }

        if (mes.type == 'name_change') {
          if (mes.name == ws.chat_name) return
          if ([...this.wss.clients].some(c => c.readyState == WebSocket.OPEN && c.chat_name == mes.name)) {
            return ws.send(JSON.stringify({type: "error", message: "Name already in use"}))
          }
          if (!mes.name || mes.name.length > 8) {
            return ws.send(JSON.stringify({type: "error", message: "Invalid name"}))
          }
          ws.chat_name = mes.name
          let payload = {
            from: ws.chat_id,
            type: 'name_change',
            name: mes.name
          }
          message_buffer.push(payload)
          this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(payload));
            }
          })
        }

        if (mes.type == 'chat') {
          if (!ws.chat_name) {
            return ws.send(JSON.stringify({type: "error", message: "Set a name first"}))
          }
          let payload = {
            from: ws.chat_id,
            name: ws.chat_name,
            type: 'chat',
            message: mes.message
          }
          message_buffer.push(payload)
          this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(payload))
            }
          })
        }

        if (message_buffer.length > 120) message_buffer = message_buffer.slice(-100)
      })
    })
  }

  signal_start_stream() {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'stream_start' }))
      }
    })
  }
}

module.exports = WsChat
