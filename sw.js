/* HealthFit – service worker: rete prima, cache come riserva */
const CACHE="hf-v205";
const EXCACHE="hf-ex1";   // foto degli esercizi: non cambiano, restano tra una versione e l'altra
const SHELL=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==EXCACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method==="GET"&&((u.origin===location.origin&&/\/ex\/[^/]+\.webp$/.test(u.pathname))||(u.host==="raw.githubusercontent.com"&&u.pathname.startsWith("/yuhonas/free-exercise-db/")))){
    // prima la cache: la foto si apre all'istante dalla seconda volta in poi
    e.respondWith(caches.open(EXCACHE).then(c=>c.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{ if(r.ok||r.type==="opaque") c.put(e.request,r.clone()); return r; }))));
    return;
  }
  if(e.request.method!=="GET"||(u.origin!==location.origin&&u.host!=="cdn.jsdelivr.net")) return;
  let req=e.request;   // controlla sempre se c'è una versione nuova
  if(u.origin===location.origin){ try{ req= e.request.mode==="navigate"? new Request(e.request.url,{cache:"no-cache",credentials:"same-origin"}) : new Request(e.request,{cache:"no-cache"}); }catch{ req=e.request; } }
  e.respondWith(fetch(req).then(r=>{ const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r; }).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==="navigate"? caches.match("./index.html") : Response.error()))));
});
