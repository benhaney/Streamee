const fs = require('fs')
const path = require('path')
const EventEmitter = require('events')
const { spawn } = require('child_process')
const update_vods = require('./vod_updater')

class FfmpegStream extends EventEmitter {
  constructor(opts) {
    super()
    this.buffer = []
    this.latest = 0
    this.streaming = false
    this.init_ffmpeg(opts)
    setInterval(() => {
      this.buffer = this.buffer.concat(this.latest).slice(-3)
      if (this.buffer.length < 3) return
      let streaming_t = (this.streaming
        ? Date.now() - this.buffer[2] < 1500 || Date.now() - this.buffer[0] < 3500
        : Date.now() - this.buffer[2] < 1500 && Date.now() - this.buffer[0] < 3500)
      if (this.streaming != streaming_t) {
        this.streaming = streaming_t
        this.emit('changed', this.streaming)
      }
    }, 1000)
  }

  init_ffmpeg(opts) {
    let data_path = path.join(__dirname, '../data')
    let ffmpeg = spawn('ffmpeg', [
      '-listen', '1',
      '-i', `rtmp://0.0.0.0/stream${opts.name?`/${opts.name}`:''}${opts.key?`/${opts.key}`:''}`,
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-flags', '+cgop',
      '-g', '30',
      '-hls_time', '1',
      '-hls_list_size', '20',
      '-hls_allow_cache', '1',
      '-hls_flags', 'delete_segments',
      `${data_path}/stream/stream.m3u8`,
      '-f', 'segment',
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-strftime', '1',
      '-segment_time', '1000000000',
      '-segment_format', 'mp4',
      `${data_path}/vods/%Y-%m-%d_%H-%M-%S_vod.mp4`
    ])
    ffmpeg.stderr.on('data', data => { this.latest = Date.now() })
    ffmpeg.stdout.on('data', data => { this.latest = Date.now() })
    let exited = false
    let exit_handler = code => {
      if (exited) return
      exited = true
      if (code) console.error(`ffmpeg exited with code ${code}`)

      // For future fresh loads, only give them the "stream over" segment
      setTimeout(() => {
        fs.copyFile(`${data_path}/stream/done.m3u8`, `${data_path}/stream/stream.m3u8`, err => false)
      }, 2*1000)

      // Clean up old HLS chunks because ffmpeg can't
      // But leave them there for a bit in case someone is still watching
      setTimeout(() => {
        fs.readdir(`${data_path}/stream/`, (err, files) => {
          files.filter(x => x.startsWith('stream') && x.endsWith('.ts')).forEach(x => {
            fs.stat(`${data_path}/stream/${x}`, (err, stats) => {
              if (Date.now() - stats.mtime.getTime() > 20000) {
                fs.unlink(`${data_path}/stream/${x}`, err => false)
              }
            })
          })
        })
      }, 20*1000)

      update_vods(opts)
      this.init_ffmpeg(opts)
    }
    ffmpeg.on('close', exit_handler)
    ffmpeg.on('error', exit_handler)
    ffmpeg.on('exit', exit_handler)
  }
}

module.exports = FfmpegStream
