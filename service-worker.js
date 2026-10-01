const CACHE='aegispay-shell-v8-app-reset';
const ASSETS=['./','./index.html','./app/','./app/index.html','./master-admin.html','./styles.css','./supabase-client.js','./supabase-service.js','./aegis-auth-redirect.js','./app-update.js','./client-auth.js','./admin-auth.js','./aegispay-logo.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS).catch(()=>{})));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 const networkFirst=url.pathname.endsWith('.js')||url.pathname.endsWith('.html')||url.pathname.endsWith('/app-version.json');
 if(networkFirst){
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match(url.pathname.startsWith('/app/')?'./app/index.html':'./index.html'))));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
  const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;
 }).catch(()=>caches.match('./index.html'))));
});