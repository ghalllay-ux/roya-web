const APP_CACHE='werd-v3';
const RUNTIME_CACHE='werd-runtime-v3';
const APP_SHELL=['./','./index.html','./app.css','./app.js','./notifications.js','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',event=>{event.waitUntil(caches.open(APP_CACHE).then(cache=>cache.addAll(APP_SHELL)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>![APP_CACHE,RUNTIME_CACHE].includes(k)).map(k=>caches.delete(k)))));self.clients.claim();});

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(APP_CACHE).then(c=>c.put('./index.html',copy));return res;}).catch(()=>caches.match('./index.html')));return;
  }
  if(url.hostname.includes('alquran.cloud')||url.hostname.includes('raw.githubusercontent.com')||url.hostname.includes('cdn.jsdelivr.net')){
    event.respondWith(caches.open(RUNTIME_CACHE).then(async cache=>{const cached=await cache.match(req);const network=fetch(req).then(res=>{if(res&&(res.status===200||res.type==='opaque'))cache.put(req,res.clone());return res;}).catch(()=>cached);return cached||network;}));return;
  }
  if(url.origin===self.location.origin){event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{const copy=res.clone();caches.open(APP_CACHE).then(c=>c.put(req,copy));return res;})));}
});

self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch(e){data={body:event.data?.text()||'لديك تذكير جديد من ورد'}}
  const title=data.title||'ورد 🌿';
  const options={
    body:data.body||'حان وقت وردك اليومي.',
    icon:'./icon.svg',
    badge:'./icon.svg',
    dir:'rtl',
    lang:'ar',
    tag:data.tag||'werd-reminder',
    renotify:true,
    data:{url:data.url||'./'}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification.data?.url||'./';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const client of list){if('focus' in client){client.navigate(target).catch(()=>{});return client.focus();}}
    return clients.openWindow?clients.openWindow(target):undefined;
  }));
});