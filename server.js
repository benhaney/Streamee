const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()
const streamer = require('./lib/ffmpeg_stream')
const chat = require('./lib/ws_chat')
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

streamer(config)
chat(config)
