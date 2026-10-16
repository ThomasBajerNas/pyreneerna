/* Service worker för Reseguide Pyrenéerna (pyreneestrip.com)
   – Sidan: nätet först, sparad kopia när det saknas täckning.
   – Guidens egna filer (språk, bilder, villkor): sparad kopia direkt, uppdateras i bakgrunden.
   – Leaflet och typsnitt: sparad kopia.
   – Karttiles från OpenStreetMap-baserade kartor: de rutor man har tittat på sparas (max TILE_MAX st), så att kartan
     fungerar i bergen utan täckning. Google- och Esri-kartor sparas inte (deras villkor tillåter det inte).
   – Betalning (/api), Stripe, BRouter, sökning och partnerlänkar går alltid direkt mot nätet.
   Höj VERSION när cachestrategin ändras – gamla cacher rensas då. */
const VERSION = "v1";
const PAGE = "pyr-page-" + VERSION, STATIC = "pyr-static-" + VERSION, TILES = "pyr-tiles-" + VERSION;
const TILE_MAX = 3000;
const TILE_HOSTS = /(^|\.)(tile\.openstreetmap\.org|tile-cyclosm\.openstreetmap\.fr|tile\.opentopomap\.org|tile\.waymarkedtrails\.org|tiles\.opensnowmap\.org)$/;
const CDN_HOSTS = /^(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(PAGE).then(c => fetch("/", { cache: "reload" }).then(r => r.ok && c.put("/", r))).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("pyr-") && ![PAGE, STATIC, TILES].includes(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function networkFirst(req) {
  const cache = await caches.open(PAGE), key = new URL(req.url).pathname;   // en kopia per sida, oavsett ?lang= eller ?kop=
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(key, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(key)) || (await cache.match("/")) || Response.error();
  }
}

async function staleWhileRevalidate(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  const net = fetch(req).then(res => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || Response.error();
}

let tilePuts = 0;
async function tile(req) {
  const cache = await caches.open(TILES), key = req.url;
  const hit = await cache.match(key);
  if (hit) return hit;
  try {
    // Hämtas med CORS så att svaret går att spara utan "opaque"-utfyllnad (som annars äter webbläsarens lagringsutrymme).
    const res = await fetch(key, { mode: "cors", credentials: "omit" });
    if (res.ok) { await cache.put(key, res.clone()); if (++tilePuts % 100 === 0) trimTiles(cache); }
    return res;
  } catch (err) {
    try { return await fetch(req); } catch (e) { return Response.error(); }   // servern saknar CORS: visa utan att spara
  }
}
async function trimTiles(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - TILE_MAX; i++) await cache.delete(keys[i]);   // äldst först
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/api/")) return;                         // betalning: alltid nätet
    if (req.mode === "navigate") { e.respondWith(networkFirst(req)); return; }
    if (url.pathname === "/sw.js") return;
    e.respondWith(staleWhileRevalidate(req, STATIC)); return;
  }
  if (TILE_HOSTS.test(url.hostname)) { e.respondWith(tile(req)); return; }
  if (CDN_HOSTS.test(url.hostname)) { e.respondWith(staleWhileRevalidate(req, STATIC)); return; }
  // allt annat (Stripe, BRouter, Nominatim, Google, partnerlänkar, Wikipedia …) går direkt
});
