const fs = require('fs')
const webpush = require('web-push')

class Push {
  constructor(app, route, opts) {
    this.opts = opts
    this.persist = {}
    try {
      this.persist = JSON.parse(fs.readFileSync(opts["push-storage"]))
    } catch (err) {
      console.log('Could not read push subscriptions file. An empty one will be generated')
      Object.assign(this.persist, webpush.generateVAPIDKeys())
      this.persist.subs = {}
      this.write()
    }

    webpush.setVapidDetails(
        `mailto:${opts.email}`,
        this.persist.publicKey,
        this.persist.privateKey
    )

    app.get(route + 'pubkey', (req, res) => {
      res.send(JSON.stringify([...Buffer.from(this.persist.publicKey, 'base64')]))
    })

    app.post(route + 'register', (req, res) => {
      this.persist.subs[req.body.subscription.endpoint] = req.body.subscription
      res.sendStatus(201)
      this.write()
    })

    app.post(route + 'unregister', (req, res) => {
      delete this.persist.subs[req.body.subscription.endpoint]
      res.sendStatus(201)
      this.write()
    })
  }

  push(payload) {
    console.log(`Pushing payload "${payload}"`)
    for (let subscription of Object.values(this.persist.subs)) {
      webpush.sendNotification(subscription, JSON.stringify(payload), {TTL: 3600*1000}).catch(console.error)
    }
  }

  write(cb) {
    fs.writeFile(this.opts['push-storage'], JSON.stringify(this.persist), cb||(()=>null))
  }
}

module.exports = Push
