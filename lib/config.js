const fs = require('fs')
const path = require('path')

// defaults of required configs
let required = {
  "name": undefined,
  "email": undefined,
  "push-storage": 'push-storage.json',
  "port": 9030,
  "chat-port": 9031
}

// defaults of optional configs
let optional = {
  key: undefined
}

// merge defaults into one object
let conf = Object.assign({...required}, optional)

// load config file into config object
try {
  Object.assign(conf, JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8')))
} catch (e) {
  console.error(e)
  process.exit(1)
}

// listen, environment variables are hard to deal with
let type_conv = (val, match) => {
  if (match === undefined || val === undefined) return val
  if (typeof match == 'boolean') return !(val == 'false')
  if (typeof match == 'number') return +val
  return val
}

// look for environment variables associated with config entries and load them
for (let key of Object.keys(conf)) {
  let env_val = process.env[`STREAMEE_${key.toUpperCase()}`]
  if (env_val) conf[key] = type_conv(env_val, conf[key])
}

// cry about any "required" settings that still aren't set
for (let key of Object.keys(required)) {
  if (conf[key] === undefined) {
    console.error(`Warning: Setting "${key}" not defined!`)
  }
}

module.exports = conf
