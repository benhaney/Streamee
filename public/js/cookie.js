let write_cookie = obj => {
  let ex = new Date(Date.now() + 1000*60*60*24*365).toUTCString()
  Object.entries(obj).map(a => a.join('=')).forEach(x => document.cookie = `${x}; expires=${ex}`)
}

let read_cookie = () => document.cookie ? document.cookie.split(/; ?/g).map(x => x.split('=')).reduce((a,b)=>Object.assign(a,{[b[0]]:b[1]}), {}) : ({})

let cookie = read_cookie()
