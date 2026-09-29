const CACHE='aegispay-shell-v4';
const ASSETS=['./','./index.html','./master-admin.html','./styles.css','./supabase-client.js','./supabase-service.js','./client-auth.js','./admin-auth.js','./aegispay-logo.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 const path=url.pathname;
 const allowed=ASSETS.some(asset=>new URL(asset,self.location.href).pathname===path);
 if(!allowed)return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
  return response;
 }).catch(()=>caches.match('./index.html'))));
});

