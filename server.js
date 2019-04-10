const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()
const Stream = require('./lib/ffmpeg_stream')
const Chat = require('./lib/ws_chat')
const config = require('./lib/config.js')

fs.mkdirSync(path.join(__dirname, 'data/stream'), { recursive: true })
fs.mkdirSync(path.join(__dirname, 'data/vods'), { recursive: true })

app.get('/', (req, res) => {
  fs.readFile('public/index.html', (err, index) => res.end(index.toString()))
})

app.get('/vods/', (req, res) => {
  fs.readFile('public/vods.html', (err, index) => res.end(index.toString()))
})

app.use('/stream/', express.static('data/stream'))
app.use('/vods/', express.static('data/vods'))
app.use('/', express.static('public'))

app.listen(config.port)

let stream = new Stream(config)
let chat = new Chat(config)

stream.on('changed', playing => chat.signal_stream_change(playing))
