const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const update_vods = require('./vod_updater')

let spawn_ffmpeg = (opts) => {
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
  //ffmpeg.stderr.on('data', data => console.error(data.toString()))
  //ffmpeg.stdout.on('data', data => console.log(data.toString()))
  let exited = false
  let exit_handler = code => {
    if (exited) return
    exited = true
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
    fs.copyFile(`${data_path}/stream/done.m3u8`, `${data_path}/stream/stream.m3u8`, err => false)
    update_vods({})
    spawn_ffmpeg(opts)
  }
  ffmpeg.on('close', exit_handler)
  ffmpeg.on('error', exit_handler)
  ffmpeg.on('exit', exit_handler)
}

module.exports = spawn_ffmpeg
