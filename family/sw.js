/* FamilyManager – service worker (19/11/2026): l'app si apre dalla copia salvata sul telefono, subito,
   e intanto si scarica in sottofondo la versione nuova per la prossima apertura.
   Quando c'è una versione nuova, la pagina la mette nella copia e si ricarica da sola (vedi versione.txt). */
const CACHE = "fm-v3";
const BASE = new URL("./", self.registration.scope).pathname;
const PAGINA = new URL("./index.html", self.registration.scope).href;
const SHELL = ["./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
const FISSI = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];   // indirizzi con versione: non cambiano
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("fm-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
async function rete(req, chiave) {
  const r = await fetch(req, { cache: "no-cache" });
  if (r.ok) { const c = await caches.open(CACHE); await c.put(chiave || req, r.clone()); }
  return r;
}
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const u = new URL(req.url);
  const mio = u.origin === location.origin && u.pathname.startsWith(BASE);
  if (mio) {
    const nome = u.pathname.slice(BASE.length);
    if (nome === "versione.txt" || nome === "importa.bin" || u.searchParams.has("fresco")) return;   // sempre dalla rete
    if (req.mode === "navigate" || nome === "" || nome === "index.html") {
      // la pagina: subito dalla copia, e in sottofondo si prende quella nuova
      const nuova = rete(new Request(PAGINA), PAGINA).catch(() => null);
      e.waitUntil(nuova);
      e.respondWith(caches.match(PAGINA).then(c => c || nuova.then(r => r || Response.error())));
      return;
    }
    e.respondWith(caches.match(req).then(c => { const n = rete(req).catch(() => null); if (c) { e.waitUntil(n); return c; } return n.then(r => r || Response.error()); }));
    return;
  }
  if (FISSI.includes(u.host)) {
    e.respondWith(caches.match(req).then(c => c || fetch(req).then(r => { if (r.ok || r.type === "opaque") { const x = r.clone(); caches.open(CACHE).then(k => k.put(req, x)); } return r; })));
  }
});
