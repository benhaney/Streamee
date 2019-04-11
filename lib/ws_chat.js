const crypto = require('crypto')
const WebSocket = require('ws')
const EventEmitter = require('events')

class WsChat extends EventEmitter {
  constructor(opts) {
    super()
    this.message_buffer = []
    this.init_ws(opts)
  }

  broadcast(payload) {
    this.message_buffer.push(payload)
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(payload));
      }
    })
  }

  get present() {
    return [...this.wss.clients].filter(c => c.readyState == WebSocket.OPEN && c.chat_id).map(c => ({id: c.chat_id, name: c.chat_name}))
  }

  init_ws(opts) {
    this.wss = new WebSocket.Server({port: opts["chat-port"]})

    this.wss.on('connection', ws => {
      this.message_buffer.forEach(mes => ws.send(JSON.stringify(mes)))

      ws.on('close', () => {
        if (!ws.chat_id) return
        this.broadcast({
          from: ws.chat_id,
          type: 'leave',
          present: this.present
        })
      })

      ws.on('message', mes => {
        try {
          mes = JSON.parse(mes)
        } catch (e) { return }

        if (mes.type == 'init') {
          ws.chat_id = +(parseInt('0x'+crypto.createHash('sha1').update(mes.id).digest('hex'))+'').slice(2,-4)
          this.broadcast({
            from: ws.chat_id,
            type: 'join',
            present: this.present
          })
        }

        if (mes.type == 'name_change') {
          if (mes.name == ws.chat_name) return
          if ([...this.wss.clients].some(c => c.readyState == WebSocket.OPEN && c.chat_name == mes.name)) {
            return ws.send(JSON.stringify({type: "error", message: "Name already in use"}))
          }
          if (!mes.name || mes.name.length > 8) {
            return ws.send(JSON.stringify({type: "error", message: "Invalid name"}))
          }
          ws.chat_name = mes.name
          this.broadcast({
            from: ws.chat_id,
            type: 'name_change',
            name: mes.name,
            present: this.present
          })
        }

        if (mes.type == 'chat') {
          if (!ws.chat_name) {
            return ws.send(JSON.stringify({type: "error", message: "Set a name first"}))
          }
          this.broadcast({
            from: ws.chat_id,
            name: ws.chat_name,
            type: 'chat',
            message: mes.message
          })
        }

        if (this.message_buffer.length > 120) {
          this.message_buffer = this.message_buffer.slice(-100)
        }
      })
    })
  }

  signal_stream_change(playing) {
    this.broadcast({ type: 'stream_change', playing })
  }
}

module.exports = WsChat
