const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const { promisify } = require('util')

fs.p_readFile = promisify(fs.readFile)
fs.p_readdir = promisify(fs.readdir)

let update_vods = async (opts) => {
  let vods_path = path.join(__dirname, '../data/vods')
  let vods = {}, files = []
  try {
    vods = JSON.parse(await fs.p_readFile(`${vods_path}/vods.json`, 'utf8'))
  } catch (err) {}
  try {
    files = await fs.p_readdir(vods_path)
  } catch (err) {}
  let file_set = new Set(files)
  for (let filename of files) {
    if (filename.endsWith('.mp4')) {
      vods[filename] = vods[filename] || {}
      if (!file_set.has(filename.replace(/mp4$/, 'jpg'))) {
        spawn('ffmpeg', [
          '-ss', `$(echo $(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 ${vods_path}/${filename}) | awk '{print int($0/2)}')`,
          '-i', `${vods_path}/${filename}`,
          '-vf', 'scale=320:-1',
          '-q:v', '2',
          '-vframes', '1',
          `${vods_path}/${filename.replace(/mp4$/, 'jpg')}`
        ], {shell: '/bin/bash'})
        vods[filename].thumb = `${filename.replace(/mp4$/, 'jpg')}`
      }
      vods[filename].time = Date.parse([filename.replace(/_vod.mp4$/,'').split('_')].map(x => [x[0],x[1].replace(/-/g,':')])[0].join('T'))
    }
  }
  fs.writeFile(`${vods_path}/vods.json`, Buffer.from(JSON.stringify(vods,null,2)), ()=>false)
}

module.exports = update_vods
