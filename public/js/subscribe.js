let sub_buttons = [...document.getElementsByClassName('subscribe')]

let subscribe = () => {
  navigator.serviceWorker.ready.then(registration => {
    return registration.pushManager.getSubscription().then(async subscription => {
      if (subscription) return subscription
      let pubkey = new Uint8Array(JSON.parse(await (await fetch('/push/pubkey')).text()))
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: pubkey
      })
    })
  }).then(subscription => {
    sub_buttons.forEach(el => { el.innerHTML = 'Unsubscribe' })
    fetch('/push/register', {
      method: 'post',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ subscription })
    })
  })
}

let unsubscribe = () => {
  navigator.serviceWorker.ready.then(registration =>
    registration.pushManager.getSubscription()
  ).then(subscription => {
    console.log(subscription)
    subscription.unsubscribe().then(() => {
      sub_buttons.forEach(el => { el.innerHTML = 'Subscribe' })
      fetch('/push/unregister', {
        method: 'post',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ subscription })
      })
    })
  })
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    registration.pushManager.getSubscription().then(subscription => {
      sub_buttons.forEach(el => {
        el.innerHTML = subscription ? 'Unsubscribe' : 'Subscribe'
      })
    })
  })

  sub_buttons.forEach(el => {
    el.addEventListener('click', event => {
      event.preventDefault()
      navigator.serviceWorker.ready.then(registration =>
        registration.pushManager.getSubscription()
      ).then(subscription => {
        if (subscription) { unsubscribe() } else { subscribe() }
      })
    })
  })
} else {
  sub_buttons.forEach(el => el.parentElement.remove())
}
