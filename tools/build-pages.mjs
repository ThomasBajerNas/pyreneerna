/* Bygger statiska sidor för sökmotorer av guidens data i index.html och språkfilerna i i18n/.
   En sida per resmål, vandringsled, cykelrunda, bilrutt och mountainbikeområde, på alla nio språk,
   plus en översiktssida per språk (/sv/, /en/ …) och en ny sitemap.xml.
   Kör efter ändringar i guidens innehåll:  node tools/build-pages.mjs
   Sidorna hamnar i /<språk>/… och ska checkas in tillsammans med index.html. */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://pyreneestrip.com";
const LANGS = ["sv", "no", "da", "en", "de", "fr", "es", "it", "pt"];
const HL = { sv: "sv", no: "nb", da: "da", en: "en", de: "de", fr: "fr", es: "es", it: "it", pt: "pt" };
const LOCALE = { sv: "sv-SE", no: "nb-NO", da: "da-DK", en: "en-GB", de: "de-DE", fr: "fr-FR", es: "es-ES", it: "it-IT", pt: "pt-PT" };
const OGL = { sv: "sv_SE", no: "nb_NO", da: "da_DK", en: "en_GB", de: "de_DE", fr: "fr_FR", es: "es_ES", it: "it_IT", pt: "pt_PT" };
const LNAME = { sv: "Svenska", no: "Norsk", da: "Dansk", en: "English", de: "Deutsch", fr: "Français", es: "Español", it: "Italiano", pt: "Português" };
const KINDS = ["place", "trail", "ride", "route", "mtb"];

/* ---------- läs guidens data ---------- */
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const block = (start) => { const i = html.indexOf(start); if (i < 0) throw new Error("Hittar inte " + start); const a = html.indexOf(">", i) + 1; return html.slice(a, html.indexOf("</script>", a)); };
const DATA_JS = block("<script>/* Reseguide Pyreneerna – data");
const TR_JS = block("<script>/* Översätter guidens innehåll");

function loadData(lang) {
  const ctx = { console, window: {} };
  vm.createContext(ctx);
  vm.runInContext(DATA_JS, ctx);
  if (lang !== "sv") {
    vm.runInContext(fs.readFileSync(path.join(ROOT, "i18n", lang + ".js"), "utf8"), ctx);
    ctx.window.LANG = lang;
    vm.runInContext(TR_JS, ctx);
  }
  return vm.runInContext("({ CATS, PLACES, WHS, TRAILS, TRAIL_GROUPS, HIKE_AT, PEAKS, SKI, MTB, ROUTES, RUNDOR, ROUTED, TRAIL_LINES })", ctx);
}
const I18N = { sv: {} };
for (const l of LANGS) if (l !== "sv") { const c = { window: {} }; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(ROOT, "i18n", l + ".js"), "utf8"), c); I18N[l] = c.window.I18N; }

/* ---------- texter som bara finns på de här sidorna ---------- */
const MY = {
  site: { sv: "Reseguide Pyrenéerna", no: "Reiseguide Pyreneene", da: "Rejseguide Pyrenæerne", en: "Pyrenees Travel Guide", de: "Reiseführer Pyrenäen", fr: "Guide de voyage des Pyrénées", es: "Guía de viaje de los Pirineos", it: "Guida di viaggio dei Pirenei", pt: "Guia de viagem dos Pirenéus" },
  hubTitle: { sv: "Alla resmål, leder och rundor", no: "Alle reisemål, stier og turer", da: "Alle rejsemål, ruter og ture", en: "All places, trails and rides", de: "Alle Reiseziele, Wege und Touren", fr: "Toutes les destinations, sentiers et circuits", es: "Todos los destinos, senderos y rutas", it: "Tutte le mete, i sentieri e i percorsi", pt: "Todos os destinos, trilhos e percursos" },
  hubIntro: {
    sv: "Allt innehåll i reseguiden på en sida: städer och byar, Tour de France-pass, bergstoppar, skidorter, varma källor, världsarv, vandringsleder, cykelrundor och mountainbike i Pyrenéerna och södra Frankrike.",
    no: "Alt innholdet i reiseguiden på én side: byer og landsbyer, Tour de France-pass, fjelltopper, skisteder, varme kilder, verdensarv, turstier, sykkelturer og terrengsykling i Pyreneene og Sør-Frankrike.",
    da: "Alt indholdet i rejseguiden på én side: byer og landsbyer, Tour de France-pas, bjergtoppe, skisportssteder, varme kilder, verdensarv, vandreruter, cykelture og mountainbike i Pyrenæerne og Sydfrankrig.",
    en: "Everything in the travel guide on one page: towns and villages, Tour de France climbs, peaks, ski resorts, hot springs, World Heritage sites, long-distance trails, cycling rides and mountain biking in the Pyrenees and southern France.",
    de: "Alle Inhalte des Reiseführers auf einer Seite: Städte und Dörfer, Tour-de-France-Pässe, Gipfel, Skigebiete, heiße Quellen, Welterbestätten, Fernwanderwege, Radtouren und Mountainbiken in den Pyrenäen und Südfrankreich.",
    fr: "Tout le contenu du guide sur une seule page : villes et villages, cols du Tour de France, sommets, stations de ski, sources chaudes, sites du patrimoine mondial, sentiers de grande randonnée, circuits à vélo et VTT dans les Pyrénées et le sud de la France.",
    es: "Todo el contenido de la guía en una página: ciudades y pueblos, puertos del Tour de Francia, cumbres, estaciones de esquí, aguas termales, Patrimonio Mundial, senderos de gran recorrido, rutas en bici y BTT en los Pirineos y el sur de Francia.",
    it: "Tutti i contenuti della guida in una pagina: città e villaggi, salite del Tour de France, vette, stazioni sciistiche, sorgenti termali, siti Patrimonio dell'Umanità, sentieri a lunga percorrenza, giri in bici e mountain bike nei Pirenei e nel sud della Francia.",
    pt: "Todo o conteúdo do guia numa página: cidades e aldeias, subidas do Tour de France, cumes, estâncias de esqui, termas, Património Mundial, trilhos de grande rota, percursos de bicicleta e BTT nos Pirenéus e no sul de França." },
  openMap: { sv: "Öppna i den interaktiva kartan", no: "Åpne i det interaktive kartet", da: "Åbn i det interaktive kort", en: "Open in the interactive map", de: "In der interaktiven Karte öffnen", fr: "Ouvrir dans la carte interactive", es: "Abrir en el mapa interactivo", it: "Apri nella mappa interattiva", pt: "Abrir no mapa interativo" },
  openGuide: { sv: "Öppna guiden", no: "Åpne guiden", da: "Åbn guiden", en: "Open the guide", de: "Reiseführer öffnen", fr: "Ouvrir le guide", es: "Abrir la guía", it: "Apri la guida", pt: "Abrir o guia" },
  trails: { sv: "Vandringsleder", no: "Turstier", da: "Vandreruter", en: "Long-distance trails", de: "Fernwanderwege", fr: "Sentiers de grande randonnée", es: "Senderos de gran recorrido", it: "Sentieri a lunga percorrenza", pt: "Trilhos de grande rota" },
  trail: { sv: "Vandringsled", no: "Tursti", da: "Vandrerute", en: "Long-distance trail", de: "Fernwanderweg", fr: "Sentier de grande randonnée", es: "Sendero de gran recorrido", it: "Sentiero a lunga percorrenza", pt: "Trilho de grande rota" },
  rides: { sv: "Cykelrundor", no: "Sykkelturer", da: "Cykelture", en: "Cycling rides", de: "Radtouren", fr: "Circuits à vélo", es: "Rutas en bici", it: "Giri in bici", pt: "Percursos de bicicleta" },
  ride: { sv: "Cykelrunda", no: "Sykkeltur", da: "Cykeltur", en: "Cycling ride", de: "Radtour", fr: "Circuit à vélo", es: "Ruta en bici", it: "Giro in bici", pt: "Percurso de bicicleta" },
  roadtrips: { sv: "Bilrutter", no: "Bilruter", da: "Bilruter", en: "Road trips", de: "Autorouten", fr: "Itinéraires en voiture", es: "Rutas en coche", it: "Itinerari in auto", pt: "Roteiros de carro" },
  roadtrip: { sv: "Bilrutt", no: "Bilrute", da: "Bilrute", en: "Road trip", de: "Autoroute", fr: "Itinéraire en voiture", es: "Ruta en coche", it: "Itinerario in auto", pt: "Roteiro de carro" },
  mtbRoutes: { sv: "Långa mountainbikerutter", no: "Lange terrengsykkelruter", da: "Lange mountainbikeruter", en: "Long mountain bike routes", de: "Lange Mountainbike-Routen", fr: "Grands itinéraires VTT", es: "Grandes rutas de BTT", it: "Grandi percorsi in mountain bike", pt: "Grandes percursos de BTT" },
  massif: { sv: "Massiv", no: "Massiv", da: "Massiv", en: "Massif", de: "Massiv", fr: "Massif", es: "Macizo", it: "Massiccio", pt: "Maciço" },
  first: { sv: "Första bestigning", no: "Første bestigning", da: "Første bestigning", en: "First ascent", de: "Erstbesteigung", fr: "Première ascension", es: "Primera ascensión", it: "Prima salita", pt: "Primeira ascensão" },
  start: { sv: "Startpunkt", no: "Startpunkt", da: "Startsted", en: "Starting point", de: "Ausgangspunkt", fr: "Point de départ", es: "Punto de partida", it: "Punto di partenza", pt: "Ponto de partida" },
  hut: { sv: "Bergsstuga", no: "Fjellhytte", da: "Bjerghytte", en: "Mountain hut", de: "Berghütte", fr: "Refuge", es: "Refugio", it: "Rifugio", pt: "Refúgio" },
  safety: { sv: "Säkerhet", no: "Sikkerhet", da: "Sikkerhed", en: "Safety", de: "Sicherheit", fr: "Sécurité", es: "Seguridad", it: "Sicurezza", pt: "Segurança" },
  alt2: { sv: "Andra vägar upp", no: "Andre ruter opp", da: "Andre ruter op", en: "Other routes up", de: "Andere Aufstiege", fr: "Autres itinéraires", es: "Otras rutas de subida", it: "Altre vie di salita", pt: "Outras vias de subida" },
  highlights: { sv: "Höjdpunkter", no: "Høydepunkter", da: "Højdepunkter", en: "Highlights", de: "Höhepunkte", fr: "Points forts", es: "Lo más destacado", it: "Punti salienti", pt: "Destaques" },
  snow: { sv: "Snötillverkning", no: "Snøproduksjon", da: "Kunstsne", en: "Snowmaking", de: "Beschneiung", fr: "Neige de culture", es: "Innivación", it: "Innevamento", pt: "Neve artificial" },
  park: { sv: "Snowpark", no: "Snowpark", da: "Snowpark", en: "Snow park", de: "Snowpark", fr: "Snowpark", es: "Snowpark", it: "Snowpark", pt: "Snowpark" },
  runs: { sv: "Backar", no: "Nedfarter", da: "Pister", en: "Runs", de: "Pisten", fr: "Pistes", es: "Pistas", it: "Piste", pt: "Pistas" },
  classic: { sv: "Klassisk stil", no: "Klassisk", da: "Klassisk", en: "Classic", de: "Klassisch", fr: "Classique", es: "Clásico", it: "Classico", pt: "Clássico" },
  loops: { sv: "Slingor", no: "Løyper", da: "Løjper", en: "Loops", de: "Runden", fr: "Boucles", es: "Circuitos", it: "Anelli", pt: "Circuitos" },
  other: { sv: "Övrigt", no: "Annet", da: "Andet", en: "Other", de: "Sonstiges", fr: "Autres", es: "Otros", it: "Altro", pt: "Outros" },
  stayNear: { sv: "Boende i närheten", no: "Overnatting i nærheten", da: "Overnatning i nærheden", en: "Places to stay nearby", de: "Unterkünfte in der Nähe", fr: "Hébergement à proximité", es: "Alojamiento cerca", it: "Alloggi nei dintorni", pt: "Alojamento perto" },
  route: { sv: "Sträckning", no: "Strekning", da: "Strækning", en: "Route", de: "Verlauf", fr: "Itinéraire", es: "Recorrido", it: "Percorso", pt: "Percurso" },
  base: { sv: "Utgångsort", no: "Utgangspunkt", da: "Udgangspunkt", en: "Base", de: "Ausgangsort", fr: "Départ", es: "Salida", it: "Partenza", pt: "Partida" },
  stops: { sv: "Stopp längs vägen", no: "Stopp underveis", da: "Stop undervejs", en: "Stops along the way", de: "Stopps unterwegs", fr: "Étapes en chemin", es: "Paradas en el camino", it: "Tappe lungo la strada", pt: "Paragens pelo caminho" },
  more: { sv: "Mer information", no: "Mer informasjon", da: "Mere information", en: "More information", de: "Weitere Informationen", fr: "Plus d'informations", es: "Más información", it: "Maggiori informazioni", pt: "Mais informações" },
  trailsHere: { sv: "Vandringsleder som passerar", no: "Turstier som passerer", da: "Vandreruter forbi", en: "Trails passing here", de: "Wanderwege, die hier vorbeiführen", fr: "Sentiers qui passent ici", es: "Senderos que pasan por aquí", it: "Sentieri che passano di qui", pt: "Trilhos que passam aqui" },
  routesHere: { sv: "Bilrutter som passerar", no: "Bilruter som passerer", da: "Bilruter forbi", en: "Road trips passing here", de: "Autorouten, die hier vorbeiführen", fr: "Itinéraires en voiture passant ici", es: "Rutas en coche que pasan por aquí", it: "Itinerari in auto che passano di qui", pt: "Roteiros de carro que passam aqui" },
  privacy: { sv: "Integritetspolicy", no: "Personvern", da: "Privatlivspolitik", en: "Privacy", de: "Datenschutz", fr: "Confidentialité", es: "Privacidad", it: "Privacy", pt: "Privacidade" },
  terms: { sv: "Köpvillkor och kontakt", no: "Kjøpsvilkår og kontakt", da: "Købsbetingelser og kontakt", en: "Terms and contact", de: "AGB und Kontakt", fr: "Conditions et contact", es: "Condiciones y contacto", it: "Condizioni e contatti", pt: "Condições e contacto" },
  by: { sv: "Av Thomas Bajer", no: "Av Thomas Bajer", da: "Af Thomas Bajer", en: "By Thomas Bajer", de: "Von Thomas Bajer", fr: "Par Thomas Bajer", es: "Por Thomas Bajer", it: "Di Thomas Bajer", pt: "Por Thomas Bajer" },
  language: { sv: "Språk", no: "Språk", da: "Sprog", en: "Language", de: "Sprache", fr: "Langue", es: "Idioma", it: "Lingua", pt: "Idioma" },
  climb: { sv: "Cykelstigning", no: "Sykkelstigning", da: "Cykelstigning", en: "Cycling climb", de: "Radanstieg", fr: "Montée à vélo", es: "Subida en bici", it: "Salita in bici", pt: "Subida de bicicleta" },
  dayhike: { sv: "Dagsvandring", no: "Dagstur", da: "Dagsvandring", en: "Day hike", de: "Tageswanderung", fr: "Randonnée à la journée", es: "Excursión de un día", it: "Escursione giornaliera", pt: "Caminhada de um dia" },
  breadcrumb: { sv: "Brödsmulor", no: "Brødsmuler", da: "Brødkrummer", en: "Breadcrumb", de: "Brotkrumen", fr: "Fil d'Ariane", es: "Ruta de navegación", it: "Percorso", pt: "Navegação" },
  loopYes: { sv: "Rundtur", no: "Rundtur", da: "Rundtur", en: "Loop", de: "Rundtour", fr: "Boucle", es: "Circular", it: "Ad anello", pt: "Circular" },
  loopNo: { sv: "Fram och tillbaka", no: "Tur-retur", da: "Frem og tilbage", en: "Out and back", de: "Hin und zurück", fr: "Aller-retour", es: "Ida y vuelta", it: "Andata e ritorno", pt: "Ida e volta" },
  mapdata: { sv: "Kartdata", no: "Kartdata", da: "Kortdata", en: "Map data", de: "Kartendaten", fr: "Données cartographiques", es: "Datos del mapa", it: "Dati cartografici", pt: "Dados do mapa" },
  type: { sv: "Typ", no: "Type", da: "Type", en: "Type", de: "Art", fr: "Type", es: "Tipo", it: "Tipo", pt: "Tipo" },
};
const DIFF = { "lätt": "Lätt", "medel": "Medel", "svår": "Svår", "mycket svår": "Mycket svår" };
const CC = { FR: "Frankrike", ES: "Spanien", AD: "Andorra" };

/* ---------- hjälpare ---------- */
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Booking.com: sv/no/da via CJ (samma pid/länk-id som AFF.bookingCJ i index.html), övriga språk vanlig länk som Stay22 (LinkSwap) gör om
const CJ_AID = { sv: "13386174", no: "13323638", da: "13375717" };
const bookingCJ = (lang, url) => CJ_AID[lang] ? `https://www.dpbolvw.net/click-101905306-${CJ_AID[lang]}?url=${encodeURIComponent(url)}` : url;
const T = (lang, sv) => lang === "sv" ? sv : (I18N[lang][sv] != null ? I18N[lang][sv] : sv);  // guidens egna etiketter (svensk nyckel)
const M = (lang, k) => MY[k][lang];
const nf = (lang, n) => Number(n).toLocaleString(LOCALE[lang]);
const dec1 = (lang, n) => Number(n).toLocaleString(LOCALE[lang], { maximumFractionDigits: 1 });
const url = (lang, kind, id) => `/${lang}/${kind}/${id}/`;
const hub = lang => `/${lang}/`;
const app = (lang, hash) => `/?lang=${lang}${hash ? "#" + hash : ""}`;
const imgUrl = (k, thumb) => /^cw:/.test(k) ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(k.slice(3))}?width=${thumb ? 500 : 1280}` : `/img/${k}${thumb ? "-t" : ""}.jpg`;
const absImg = k => /^cw:/.test(k) ? imgUrl(k) : SITE + imgUrl(k);
const kmBetween = (a, b) => { const R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r; const x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
function clip(s, n) { s = String(s || "").replace(/\s+/g, " ").trim(); if (s.length <= n) return s; const c = s.slice(0, n - 1); return c.slice(0, Math.max(c.lastIndexOf(" "), n - 30)).replace(/[,.;:–-]+$/, "") + "…"; }
function decPoly(s) { const o = []; let i = 0; while (i < s.length) { let r = 0, sh = 0, b; do { b = s.charCodeAt(i++) - 63; r |= (b & 0x1f) << sh; sh += 5; } while (b >= 0x20); o.push(r & 1 ? ~(r >> 1) : r >> 1); } return o; }
function line(p) { const a = decPoly(p || ""), out = []; let la = 0, lo = 0; for (let i = 0; i < a.length; i += 2) { la += a[i]; lo += a[i + 1]; out.push([la / 1e5, lo / 1e5]); } return out; }
function thin(pts, max) { if (pts.length <= max) return pts; const n = Math.ceil(pts.length / max); return pts.filter((_, i) => i % n === 0 || i === pts.length - 1); }
const r4 = pts => pts.map(([a, b]) => [Math.round(a * 1e4) / 1e4, Math.round(b * 1e4) / 1e4]);
const facts = rows => { rows = rows.filter(r => r[1] != null && r[1] !== ""); return rows.length ? `<dl class="facts">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>` : ""; };
const sec = (h, body) => body ? `<section><h2>${esc(h)}</h2>${body}</section>` : "";
const paras = s => s ? String(s).split(/\n+/).map(x => `<p>${esc(x)}</p>`).join("") : "";
const ul = (items) => items.length ? `<ul>${items.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
const extLinks = links => links.length ? `<ul class="links">${links.map(([t, u]) => `<li><a href="${esc(u)}" rel="noopener" target="_blank">${esc(t)}</a></li>`).join("")}</ul>` : "";

/* ---------- sidmall ---------- */
const CSS = `:root{--bg:#e9edeb;--surface:#fbfcfb;--ink:#18262b;--muted:#56666b;--line:#cdd6d3;--accent:#0d6b6e;--accent-ink:#fff;
--f-display:"Barlow Condensed","Arial Narrow",Arial,sans-serif;--f-ui:"Barlow","Segoe UI",Roboto,Helvetica,Arial,sans-serif;--f-text:"Source Serif 4",Georgia,serif}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#0f1719;--surface:#162226;--ink:#e4ecea;--muted:#9aaba9;--line:#2c3d41;--accent:#4fc2c1;--accent-ink:#0f1719}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 var(--f-text);-webkit-text-size-adjust:100%}
a{color:var(--accent)}
.top{max-width:820px;margin:0 auto;padding:14px 16px 0;display:flex;gap:10px 16px;align-items:center;justify-content:space-between;flex-wrap:wrap;font-family:var(--f-ui);font-size:15px}
.brand{font:700 22px/1 var(--f-display);color:var(--ink);text-decoration:none;letter-spacing:.01em}
.brand span{color:var(--accent)}
.top nav{display:flex;gap:14px;flex-wrap:wrap}.top nav a{font-weight:600;text-decoration:none}.top nav a:hover{text-decoration:underline}
main{max-width:820px;margin:12px auto 0;background:var(--surface);border:1px solid var(--line);border-radius:10px;overflow:hidden}
.pad{padding:22px 22px 28px}
@media (max-width:640px){main{border-radius:0;border-left:0;border-right:0}.pad{padding:18px 16px 24px}}
.crumbs{font:14px/1.4 var(--f-ui);color:var(--muted);margin:0 0 10px}.crumbs a{color:var(--muted)}
.eyebrow{font:600 13px/1.3 var(--f-ui);letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
h1{font:700 clamp(32px,7vw,46px)/1.02 var(--f-display);margin:6px 0 6px;text-wrap:balance}
.sub{font:500 19px/1.35 var(--f-ui);color:var(--muted);margin:0 0 16px}
h2{font:600 24px/1.2 var(--f-display);letter-spacing:.01em;margin:26px 0 8px;padding-top:14px;border-top:1px solid var(--line)}
h3{font:600 19px/1.25 var(--f-display);margin:18px 0 6px}
p{margin:0 0 12px;max-width:68ch}
.hero{margin:0;background:#1d2a2e}.hero img{display:block;width:100%;height:auto;aspect-ratio:16/9;max-height:460px;object-fit:cover}
.hero figcaption{font:13px/1.4 var(--f-ui);color:var(--muted);padding:6px 22px;background:var(--surface);border-bottom:1px solid var(--line)}
.hero figcaption a{color:var(--muted)}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}
.tag{font:600 12px/1 var(--f-ui);letter-spacing:.04em;text-transform:uppercase;padding:5px 8px;border-radius:4px;border:1px solid var(--line);color:var(--muted);text-decoration:none}
.note{border-left:4px solid #e0a800;background:color-mix(in srgb,#e0a800 10%,var(--surface));padding:10px 14px;margin:0 0 16px;border-radius:0 6px 6px 0}
.note .eyebrow{color:#9a7400;display:block;margin-bottom:4px}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .note .eyebrow{color:#e8c25a}}
.box{border:1px solid var(--line);border-left:4px solid var(--accent);padding:10px 14px;margin:0 0 14px;border-radius:0 6px 6px 0}
.box .eyebrow{display:block;margin-bottom:4px}
.facts{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:1px;background:var(--surface);border:1px solid var(--line);border-radius:8px;overflow:hidden;margin:4px 0 16px}
.facts div{background:var(--surface);padding:9px 12px;box-shadow:0 0 0 1px var(--line)}
.facts dt{font:600 12px/1.3 var(--f-ui);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.facts dd{margin:2px 0 0;font:500 16px/1.4 var(--f-ui)}
.actions{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 6px}
.btn{display:inline-flex;align-items:center;gap:6px;font:600 15px/1 var(--f-ui);padding:11px 14px;border-radius:7px;border:1px solid var(--line);color:var(--ink);background:var(--surface);text-decoration:none}
.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.btn:hover{border-color:var(--accent)}
.ad{font:600 10px/1 var(--f-ui);text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border:1px solid var(--line);border-radius:3px;padding:2px 4px}
#map{height:300px;border:1px solid var(--line);border-radius:8px;margin:6px 0 4px;background:var(--bg)}
.list{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
.list a{display:flex;gap:10px;align-items:center;padding:8px;border:1px solid var(--line);border-radius:8px;text-decoration:none;color:var(--ink);height:100%}
.list a:hover{border-color:var(--accent)}
.list img{width:56px;height:56px;object-fit:cover;border-radius:5px;flex:none;background:var(--bg)}
.list .ph{width:56px;height:56px;border-radius:5px;flex:none;background:linear-gradient(160deg,var(--line),var(--bg))}
.list b{display:block;font:600 16px/1.2 var(--f-ui)}
.list small{display:block;font:14px/1.3 var(--f-ui);color:var(--muted)}
.links{padding-left:20px}.links li{margin:2px 0}
ol.steps{padding-left:22px}ol.steps li{margin:0 0 8px}
.dots{display:inline-flex;gap:8px;flex-wrap:wrap}.dots span{display:inline-flex;align-items:center;gap:4px}.dots i{width:10px;height:10px;border-radius:50%;display:inline-block}
.coords,.foot{font:14px/1.5 var(--f-ui);color:var(--muted)}
footer{max-width:820px;margin:0 auto;padding:18px 16px 40px;font:14px/1.6 var(--f-ui);color:var(--muted)}
footer a{color:var(--muted)}
.langs{display:flex;flex-wrap:wrap;gap:4px 12px;margin:0 0 8px}
.langs a[aria-current]{color:var(--ink);font-weight:700;text-decoration:none}
.hubnav{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 4px}`;

const CSS_V = (() => { let h = 0; for (const c of CSS) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(36); })();
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">`;
const DRIVE = `<script data-cfasync="false">(function(){var s=document.createElement("script");s.async=1;s.setAttribute("data-cmp-ab","2");s.src="https://emrldtp.cc/NTg2MTIw.js?t=586120";document.head.appendChild(s)})();</script>`;
// Stay22 bara på språk utan CJ (annars byter LinkSwap ut CJ-länkarna)
const STAY22 = `<script>(function(){window.Stay22=window.Stay22||{};window.Stay22.params={lmaID:"6ad86dc1e41c8b89825ace27"};var s=document.createElement("script");s.async=1;s.src="https://lma.stay22.com/letmeallez.js";document.head.appendChild(s)})();</script>`;

function page({ lang, pathFor, title, desc, image, h1html, body, ld, mapData }) {
  const self = SITE + pathFor(lang);
  const alt = LANGS.map(l => `<link rel="alternate" hreflang="${HL[l]}" href="${SITE}${pathFor(l)}">`).join("") + `<link rel="alternate" hreflang="x-default" href="${SITE}${pathFor("en")}">`;
  const langs = LANGS.map(l => `<a href="${pathFor(l)}" hreflang="${HL[l]}" lang="${HL[l]}" data-l="${l}"${l === lang ? ' aria-current="page"' : ""}>${LNAME[l]}</a>`).join("");
  const map = mapData ? `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"><script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js" defer></script>
<script>window.addEventListener("DOMContentLoaded",function(){var d=${JSON.stringify(mapData)},el=document.getElementById("map");if(!el||!window.L)return;var m=L.map(el,{scrollWheelZoom:false});L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:17,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(m);var b=[];if(d.line){var pl=L.polyline(d.line,{color:"#c4242c",weight:4}).addTo(m);b=b.concat(d.line)}(d.pts||[]).forEach(function(p,i){var mk=L.circleMarker([p[0],p[1]],{radius:i===0&&d.main?9:6,color:"#fff",weight:2,fillColor:i===0&&d.main?"#c4242c":"#0d6b6e",fillOpacity:1}).addTo(m);if(p[2])mk.bindTooltip(p[2]);if(p[3])mk.on("click",function(){location.href=p[3]});b.push([p[0],p[1]])});if(d.main&&!d.line)m.setView([d.pts[0][0],d.pts[0][1]],d.zoom||10);else m.fitBounds(b,{padding:[20,20]})})</script>` : "";
  return `<!doctype html><html lang="${HL[lang]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${self}">${alt}
<meta property="og:type" content="article"><meta property="og:site_name" content="pyreneestrip.com"><meta property="og:url" content="${self}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:locale" content="${OGL[lang]}"><meta property="og:image" content="${esc(image || SITE + "/img/thomas-tdf.jpg")}"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0d6b6e">
<link rel="icon" href="/icons/icon.svg" type="image/svg+xml"><link rel="icon" href="/icons/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"><link rel="manifest" href="/manifest-${lang}.webmanifest">
${FONTS}${DRIVE}${CJ_AID[lang] ? "" : STAY22}
<link rel="stylesheet" href="/sidor.css?v=${CSS_V}">${map}
${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>` : ""}
</head><body>
<header class="top"><a class="brand" href="${app(lang)}">Pyrenees<span>trip</span></a><nav><a href="${hub(lang)}">${esc(T(lang, "Resmål"))}</a><a href="${app(lang, "karta")}">${esc(T(lang, "Karta"))}</a><a href="${app(lang)}">${esc(M(lang, "openGuide"))} →</a></nav></header>
<main>${h1html || ""}${body}</main>
<footer><nav class="langs" aria-label="${esc(M(lang, "language"))}">${langs}</nav>
<p>${esc(M(lang, "site"))} · ${esc(M(lang, "by"))} · <a href="/villkor/?lang=${lang}">${esc(M(lang, "terms"))}</a> · <a href="/integritet/?lang=${lang}">${esc(M(lang, "privacy"))}</a> · <a href="mailto:info@pyreneestrip.com">info@pyreneestrip.com</a></p>
<p>${esc(M(lang, "mapdata"))} © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a></p></footer>
<script>document.querySelectorAll("[data-l]").forEach(function(a){a.addEventListener("click",function(){try{localStorage.setItem("pyr:lang",JSON.stringify(a.getAttribute("data-l")))}catch(e){}})});</script>
</body></html>`;
}

function crumbs(lang, items) {
  return `<nav class="crumbs" aria-label="${esc(M(lang, "breadcrumb"))}"><a href="${app(lang)}">pyreneestrip.com</a> › ${items.map(([t, u]) => u ? `<a href="${u}">${esc(t)}</a>` : esc(t)).join(" › ")}</nav>`;
}
function crumbLd(lang, items) {
  const all = [["pyreneestrip.com", app(lang)]].concat(items);
  return { "@type": "BreadcrumbList", itemListElement: all.map(([t, u], i) => ({ "@type": "ListItem", position: i + 1, name: t, item: SITE + (u || "") })) };
}
function photoBlock(lang, p) {
  const k = p.photos && p.photos[0]; if (!k) return "";
  const cap = p.photoCaption && p.photoCaption[0], cr = p.photoCredit && p.photoCredit[0];
  const fc = [cap ? esc(cap) : "", cr ? `${esc(T(lang, "Foto:"))} <a href="${esc(cr.url)}" rel="noopener" target="_blank">${esc(cr.by)}</a> · ${esc(cr.lic)}` : ""].filter(Boolean).join(" · ");
  return `<figure class="hero"><img src="${esc(imgUrl(k))}" alt="${esc(p.name)}" width="1280" height="720" fetchpriority="high">${fc ? `<figcaption>${fc}</figcaption>` : ""}</figure>`;
}
function listItem(href, title, sub, k) {
  return `<li><a href="${href}">${k ? `<img src="${esc(imgUrl(k, 1))}" alt="" loading="lazy" width="56" height="56">` : `<span class="ph" aria-hidden="true"></span>`}<span><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</span></a></li>`;
}

/* ---------- bygg ---------- */
const sv = loadData("sv");
// samma id två gånger (Saint-Jean-Pied-de-Port): slå ihop kategorierna, behåll första
function uniq(list) { const seen = new Map(); for (const p of list) { if (seen.has(p.id)) { const a = seen.get(p.id); a.cat = [...new Set(a.cat.concat(p.cat))]; if (!a.whs && p.whs) a.whs = p.whs; } else seen.set(p.id, p); } return [...seen.values()]; }

const out = []; // [path, html]
const sitemap = []; // [pathFor, lastmod]

for (const lang of LANGS) {
  const D = loadData(lang);
  D.PLACES = uniq(D.PLACES);
  const BY = Object.fromEntries(D.PLACES.map(p => [p.id, p]));
  const PEAK = Object.fromEntries(D.PEAKS.map(p => [p.id, p]));
  const SKIP = Object.fromEntries(D.SKI.map(s => [s.p, s]));
  const catLabel = c => D.CATS[c] ? D.CATS[c].label : c;
  const mtbAll = D.MTB.areas.concat(D.MTB.routes || []);
  const diff = d => T(lang, DIFF[d] || d);
  const kindHub = { place: [T(lang, "Resmål"), hub(lang) + "#resmal"], trail: [M(lang, "trails"), hub(lang) + "#leder"], ride: [M(lang, "rides"), hub(lang) + "#cykel"], route: [M(lang, "roadtrips"), hub(lang) + "#rutter"], mtb: [T(lang, "Mountainbike"), hub(lang) + "#mtb"] };

  /* ---- resmål ---- */
  for (const p of D.PLACES) {
    const pf = l => url(l, "place", p.id);
    const pk = PEAK[p.id], sk = SKIP[p.id], hk = D.HIKE_AT[p.id];
    let b = "";
    if (p.col) b += sec(M(lang, "climb"), facts([[T(lang, "Höjd"), `${nf(lang, p.col.alt)} m`], [T(lang, "Från"), p.col.from ? esc(p.col.from) : null], [T(lang, "Längd"), p.col.len ? `${dec1(lang, p.col.len)} km` : null], [T(lang, "Snittlutning"), p.col.grad ? `${dec1(lang, p.col.grad)} %` : null]]));
    if (p.t14) b += `<div class="note"><span class="eyebrow">${esc(T(lang, "Ur guiden 2014 – Thomas"))}</span>${esc(p.t14)}</div>`;
    if (p.tLang) b += `<div class="note"><span class="eyebrow">${esc(T(lang, "Ur Languedoc-guiden – Thomas"))}</span>${esc(p.tLang)}</div>`;
    b += paras(p.text);
    if (p.hist) b += sec(T(lang, "Historia"), `<ul>${p.hist.map(h => `<li>${esc(h)}</li>`).join("")}</ul>`);
    if (p.tips) b += `<div class="box"><span class="eyebrow">${esc(T(lang, "Tips"))}</span>${esc(p.tips)}</div>`;
    if (p.tdf) b += `<div class="box" style="border-left-color:#c4242c"><span class="eyebrow" style="color:#c4242c">Tour de France</span>${esc(p.tdf)}</div>`;
    if (pk) {
      b += sec(T(lang, "Bestigning"), facts([[T(lang, "Höjd"), `${nf(lang, pk.alt)} m`], [M(lang, "massif"), esc(pk.massif)], [T(lang, "Land"), esc(pk.country)], [T(lang, "Grad"), pk.grade ? esc(pk.grade) + (pk.level ? " · " + esc(diff(pk.level)) : "") : null], [T(lang, "Dagar"), esc(pk.days)], [T(lang, "Säsong"), esc(pk.season)], [M(lang, "start"), esc(pk.start)], [M(lang, "hut"), esc(pk.hut)], [T(lang, "Höjdmeter"), esc(pk.gain)], [T(lang, "Tid"), esc(pk.time)], [M(lang, "first"), esc(pk.first)]])
        + paras(pk.story)
        + (pk.steps ? `<h3>${esc(T(lang, "Så går man upp – normalvägen steg för steg"))}</h3><ol class="steps">${pk.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>` : "")
        + (pk.warn ? `<div class="box" style="border-left-color:#c62828"><span class="eyebrow" style="color:#c62828">${esc(M(lang, "safety"))}</span>${esc(pk.warn)}</div>` : "")
        + (pk.alt2 ? `<h3>${esc(M(lang, "alt2"))}</h3>${paras(pk.alt2)}` : ""));
    }
    if (hk) b += sec(`${M(lang, "dayhike")}`, facts([[M(lang, "start"), esc(hk.start)], [T(lang, "Längd"), esc(hk.km)], [T(lang, "Höjdmeter"), esc(hk.hm)], [T(lang, "Tid"), esc(hk.time)], [T(lang, "Nivå"), hk.level ? esc(diff(hk.level)) : null], [T(lang, "Säsong"), esc(hk.season)]]) + paras(hk.text));
    if (sk) {
      const alp = sk.kind === "alp";
      const runs = sk.runs ? `<span class="dots">${[["g", "#2e7d32"], ["b", "#1565c0"], ["r", "#c62828"], ["n", "#111"]].filter(([k]) => sk.runs[k]).map(([k, c]) => `<span><i style="background:${c}"></i>${sk.runs[k]}</span>`).join("")}</span>` : null;
      b += sec(T(lang, alp ? "Utförsåkning" : "Längdåkning"),
        facts([[T(lang, "Höjd"), sk.alt ? sk.alt.filter(x => x).map(x => nf(lang, x)).join("–") + " m" : null], [alp ? T(lang, "Pister") : T(lang, "Spår"), sk.km ? `${nf(lang, sk.km)} km` : null], [M(lang, "runs"), runs], [T(lang, "Liftar"), sk.lifts ? String(sk.lifts) : null], [M(lang, "classic"), esc(sk.classic)], [T(lang, "Skate"), esc(sk.skate)], [M(lang, "loops"), esc(sk.loops)], [T(lang, "Säsong"), esc(sk.season)], [alp ? T(lang, "Liftkort") : T(lang, "Spårkort"), esc(sk.pass)], [T(lang, "Nivå"), esc(sk.level)], [M(lang, "snow"), esc(sk.snow)], [M(lang, "park"), esc(sk.park)], [T(lang, "Längdåkning"), alp ? esc(sk.nordic) : null], [M(lang, "other"), esc(sk.other)]])
        + (sk.text && sk.text !== p.text ? paras(sk.text) : "")
        + (sk.highlights ? `<h3>${esc(M(lang, "highlights"))}</h3>${ul(sk.highlights)}` : "")
        + ((sk.air || sk.rail || sk.bus || sk.car) ? `<h3>${esc(T(lang, "Hitta hit"))}</h3>${facts([[T(lang, "Flyg"), esc(sk.air)], [T(lang, "Tåg"), esc(sk.rail)], [T(lang, "Buss"), esc(sk.bus)], [T(lang, "Bil"), esc(sk.car)]])}` : "")
        + ((sk.stay || sk.stayNear) ? `<h3>${esc(T(lang, "Boende"))}</h3>${facts([[T(lang, "Boende"), esc(sk.stay)], [M(lang, "stayNear"), esc(sk.stayNear)]])}` : "")
        + (sk.tips ? `<div class="box"><span class="eyebrow">${esc(T(lang, "Tips"))}</span>${esc(sk.tips)}</div>` : ""));
    }
    if (p.kat) b += sec(T(lang, "Katarernas historia"), paras(p.kat));
    for (const w of (p.whs || [])) { const W = D.WHS[w.ref]; if (!W) continue;
      b += sec(T(lang, "UNESCO:s världsarv"), `<h3>${esc(W.name)}</h3>` + facts([[T(lang, "Världsarv sedan"), esc(W.year)], [T(lang, "Den här platsen"), w.comp ? esc(T(lang, w.comp)) : null]]) + paras(W.desc) + (W.visit ? `<p><b>${esc(T(lang, "Besök:"))}</b> ${esc(W.visit)}</p>` : "")
        + extLinks([[`UNESCO: ${W.name}`, `https://whc.unesco.org/en/list/${w.ref}/`]].concat(W.site ? [W.site] : [])));
    }
    const near = D.PLACES.filter(q => q.id !== p.id).map(q => [q, kmBetween(p, q)]).sort((a, c) => a[1] - c[1]).slice(0, 8);
    const trails = D.TRAILS.filter(t => (t.places || []).includes(p.id));
    const routes = D.ROUTES.filter(r => (r.stops || []).includes(p.id));
    b += `<div class="actions"><a class="btn primary" href="${app(lang, "p-" + p.id)}">${esc(M(lang, "openMap"))}</a><a class="btn" href="https://www.google.com/maps/dir/?api=1&amp;destination=${p.lat},${p.lon}" rel="noopener" target="_blank">${esc(T(lang, "Vägbeskrivning"))}</a>`
      + `<a class="btn" href="${esc(bookingCJ(lang, `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(p.name)}`))}" rel="noopener sponsored" target="_blank">${esc(T(lang, "Boende nära"))} <span class="ad">${esc(T(lang, "Annonslänk"))}</span></a>`
      + `<a class="btn" href="https://www.getyourguide.com/s/?q=${encodeURIComponent(p.name)}" rel="noopener sponsored" target="_blank">${esc(T(lang, "Upplevelser"))} <span class="ad">${esc(T(lang, "Annonslänk"))}</span></a></div>`;
    b += `<div id="map" role="img" aria-label="${esc(p.name)}"></div><p class="coords">${p.lat.toFixed(4)}° N, ${Math.abs(p.lon).toFixed(4)}° ${p.lon < 0 ? "W" : "E"}</p>`;
    if (trails.length) b += sec(M(lang, "trailsHere"), `<ul class="list">${trails.map(t => listItem(url(lang, "trail", t.id), t.name, [t.km, t.days].filter(Boolean).join(" · "))).join("")}</ul>`);
    if (routes.length) b += sec(M(lang, "routesHere"), `<ul class="list">${routes.map(r => listItem(url(lang, "route", r.id), r.name, r.sub)).join("")}</ul>`);
    b += sec(T(lang, "I närheten"), `<ul class="list">${near.map(([q, d]) => listItem(url(lang, "place", q.id), q.name, `${Math.round(d)} km · ${q.sub}`, q.photos && q.photos[0])).join("")}</ul>`);
    const links = (p.photoLinks || []).concat(p.links || []);
    if (links.length) b += sec(T(lang, "Länkar"), extLinks(links));
    const tags = `<div class="tags">${p.cat.map(c => `<a class="tag" href="${hub(lang)}#c-${c}">${esc(catLabel(c))}</a>`).join("")}<span class="tag">${esc(T(lang, CC[p.cc] || p.cc))}</span></div>`;
    const crumbItems = [kindHub.place, [p.name]];
    const head = `${photoBlock(lang, p)}<div class="pad">${crumbs(lang, crumbItems)}${tags}<h1>${esc(p.name)}</h1><p class="sub">${esc(p.sub)}</p>`;
    const desc = clip(`${p.sub}. ${p.text || p.t14 || ""}`, 158);
    const type = sk && sk.kind === "alp" ? "SkiResort" : p.cat.includes("stad") ? "City" : pk ? "Mountain" : "TouristAttraction";
    const ld = { "@context": "https://schema.org", "@graph": [{ "@type": type, name: p.name, description: clip(p.text || p.sub, 300), url: SITE + pf(lang), geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lon }, ...(p.photos && p.photos[0] ? { image: absImg(p.photos[0]) } : {}), address: { "@type": "PostalAddress", addressCountry: p.cc } }, crumbLd(lang, crumbItems.map(([t, u]) => [t, u]).slice(0, 1).concat([[p.name, pf(lang)]]))] };
    const mapData = { main: 1, zoom: pk ? 11 : 10, pts: [[p.lat, p.lon, p.name]].concat(near.slice(0, 6).map(([q]) => [q.lat, q.lon, q.name, url(lang, "place", q.id)])) };
    out.push([pf(lang), page({ lang, pathFor: pf, title: `${p.name} – ${p.sub} | ${M(lang, "site")}`, desc, image: p.photos && p.photos[0] ? absImg(p.photos[0]) : null, h1html: head, body: b + "</div>", ld, mapData })]);
    if (lang === "sv") sitemap.push(pf);
  }

  /* ---- vandringsleder ---- */
  for (const t of D.TRAILS) {
    const pf = l => url(l, "trail", t.id);
    const grp = D.TRAIL_GROUPS[t.grp];
    const along = (t.places || []).map(id => BY[id]).filter(Boolean);
    let b = facts([[T(lang, "Längd"), esc(t.km)], [T(lang, "Dagar"), esc(t.days)], [M(lang, "route"), esc(t.route)], [T(lang, "Högsta punkt"), esc(t.top)]]) + paras(t.text);
    if (t.tips) b += `<div class="box"><span class="eyebrow">${esc(T(lang, "Tips"))}</span>${esc(t.tips)}</div>`;
    b += `<div class="actions"><a class="btn primary" href="${app(lang, "vandring")}">${esc(M(lang, "openMap"))}</a>${t.link ? `<a class="btn" href="${esc(t.link[1])}" rel="noopener" target="_blank">${esc(t.link[0])}</a>` : ""}</div>`;
    let ln = []; (D.TRAIL_LINES[t.id] || []).forEach(s => { ln = ln.concat(line(s)); });
    b += `<div id="map" role="img" aria-label="${esc(t.name)}"></div>`;
    if (along.length) b += sec(T(lang, "Längs leden i guiden"), `<ul class="list">${along.map(q => listItem(url(lang, "place", q.id), q.name, q.sub, q.photos && q.photos[0])).join("")}</ul>`);
    const others = D.TRAILS.filter(x => x.id !== t.id);
    b += sec(M(lang, "trails"), `<ul class="list">${others.map(x => listItem(url(lang, "trail", x.id), x.name, [x.km, x.days].filter(Boolean).join(" · "))).join("")}</ul>`);
    const crumbItems = [kindHub.trail, [t.ref || t.name]];
    const head = `<div class="pad">${crumbs(lang, crumbItems)}<div class="tags"><span class="tag">${esc(M(lang, "trail"))}</span>${grp ? `<span class="tag">${esc(grp[0])}</span>` : ""}</div><h1>${esc(t.name)}</h1><p class="sub">${esc([t.route, t.km].filter(Boolean).join(" · "))}</p>`;
    const desc = clip(`${t.name}: ${t.route}, ${t.km}, ${t.days}. ${t.text}`, 158);
    const ld = { "@context": "https://schema.org", "@graph": [{ "@type": "TouristTrip", name: t.name, description: clip(t.text, 300), url: SITE + pf(lang), touristType: "Hiking" }, crumbLd(lang, [kindHub.trail, [t.name, pf(lang)]])] };
    const mapData = { line: r4(thin(ln, 600)), pts: along.map(q => [q.lat, q.lon, q.name, url(lang, "place", q.id)]) };
    out.push([pf(lang), page({ lang, pathFor: pf, title: `${t.name} | ${M(lang, "site")}`, desc, h1html: head, body: b + "</div>", ld, mapData: ln.length || along.length ? mapData : null })]);
    if (lang === "sv") sitemap.push(pf);
  }

  /* ---- cykelrundor ---- */
  for (const r of D.RUNDOR.routes) {
    const pf = l => url(l, "ride", r.id);
    const top = (r.cols || []).reduce((a, c) => (c.alt_m || 0) > (a.alt_m || 0) ? c : a, {});
    let b = facts([[M(lang, "base"), esc(r.base)], [T(lang, "Längd"), `${nf(lang, r.km)} km`], [T(lang, "Höjdmeter"), `${nf(lang, r.hm)} m`], [T(lang, "Svårighetsgrad"), esc(diff(r.difficulty))], [M(lang, "type"), M(lang, r.loop ? "loopYes" : "loopNo")], [T(lang, "Högsta punkt"), top.name ? `${esc(top.name)}, ${nf(lang, top.alt_m)} m` : null], [T(lang, "Pass"), (r.cols || []).length > 1 ? r.cols.map(c => `${esc(c.name)} (${nf(lang, c.alt_m)} m)`).join(", ") : null], [T(lang, "Säsong"), esc(r.season_sv)]]);
    b += paras(r.text_sv);
    if (r.tips_sv) b += `<div class="box"><span class="eyebrow">${esc(T(lang, "Tips"))}</span>${esc(r.tips_sv)}</div>`;
    b += `<div class="actions"><a class="btn primary" href="${app(lang, "touren")}">${esc(M(lang, "openMap"))}</a>${r.link ? `<a class="btn" href="${esc(r.link)}" rel="noopener" target="_blank">${esc(M(lang, "more"))}</a>` : ""}</div>`;
    const R = D.ROUTED["runda:" + r.id];
    const ln = R ? line(R.p) : (r.waypoints || []).map(w => [w[0], w[1]]);
    b += `<div id="map" role="img" aria-label="${esc(r.name)}"></div>`;
    const near = D.PLACES.map(q => [q, Math.min(...ln.filter((_, i) => i % 10 === 0).map(x => kmBetween({ lat: x[0], lon: x[1] }, q)))]).filter(x => x[1] < 6).sort((a, c) => a[1] - c[1]).slice(0, 8);
    if (near.length) b += sec(T(lang, "I närheten"), `<ul class="list">${near.map(([q]) => listItem(url(lang, "place", q.id), q.name, q.sub, q.photos && q.photos[0])).join("")}</ul>`);
    b += sec(M(lang, "rides"), `<ul class="list">${D.RUNDOR.routes.filter(x => x.id !== r.id).map(x => listItem(url(lang, "ride", x.id), x.name, `${x.km} km · ${nf(lang, x.hm)} m · ${diff(x.difficulty)}`)).join("")}</ul>`);
    const crumbItems = [kindHub.ride, [r.name]];
    const head = `<div class="pad">${crumbs(lang, crumbItems)}<div class="tags"><span class="tag">${esc(M(lang, "ride"))}</span><span class="tag">${esc(diff(r.difficulty))}</span></div><h1>${esc(r.name)}</h1><p class="sub">${r.km} km · ${nf(lang, r.hm)} m · ${esc(r.base)}</p>`;
    const desc = clip(`${M(lang, "ride")} ${r.km} km, ${nf(lang, r.hm)} m. ${r.text_sv}`, 158);
    const ld = { "@context": "https://schema.org", "@graph": [{ "@type": "TouristTrip", name: r.name, description: clip(r.text_sv, 300), url: SITE + pf(lang), touristType: "Cycling" }, crumbLd(lang, [kindHub.ride, [r.name, pf(lang)]])] };
    const mapData = { line: r4(thin(ln, 500)), pts: near.map(([q]) => [q.lat, q.lon, q.name, url(lang, "place", q.id)]) };
    out.push([pf(lang), page({ lang, pathFor: pf, title: `${r.name} – ${M(lang, "ride")} | ${M(lang, "site")}`, desc, h1html: head, body: b + "</div>", ld, mapData: ln.length ? mapData : null })]);
    if (lang === "sv") sitemap.push(pf);
  }

  /* ---- bilrutter ---- */
  for (const r of D.ROUTES) {
    const pf = l => url(l, "route", r.id);
    const stops = (r.stops || []).map(id => BY[id]).filter(Boolean);
    let b = facts([[T(lang, "Längd"), `${nf(lang, r.km)} km`]]) + paras(r.text);
    b += `<div class="actions"><a class="btn primary" href="${app(lang, "rutter")}">${esc(M(lang, "openMap"))}</a></div>`;
    const R = D.ROUTED["rutt:" + r.id]; const ln = R ? line(R.p) : (r.path || []);
    b += `<div id="map" role="img" aria-label="${esc(r.name)}"></div>`;
    b += sec(M(lang, "stops"), `<ol class="list">${stops.map(q => listItem(url(lang, "place", q.id), q.name, q.sub, q.photos && q.photos[0])).join("")}</ol>`);
    b += sec(M(lang, "roadtrips"), `<ul class="list">${D.ROUTES.filter(x => x.id !== r.id).map(x => listItem(url(lang, "route", x.id), x.name, `${x.km} km · ${x.sub}`)).join("")}</ul>`);
    const crumbItems = [kindHub.route, [r.name]];
    const head = `<div class="pad">${crumbs(lang, crumbItems)}<div class="tags"><span class="tag">${esc(M(lang, "roadtrip"))}</span></div><h1>${esc(r.name)}</h1><p class="sub">${esc(r.sub)} · ${nf(lang, r.km)} km</p>`;
    const desc = clip(`${r.sub}. ${r.text}`, 158);
    const ld = { "@context": "https://schema.org", "@graph": [{ "@type": "TouristTrip", name: r.name, description: clip(r.text, 300), url: SITE + pf(lang), itinerary: { "@type": "ItemList", itemListElement: stops.map((q, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "TouristAttraction", name: q.name, url: SITE + url(lang, "place", q.id) } })) } }, crumbLd(lang, [kindHub.route, [r.name, pf(lang)]])] };
    const mapData = { line: r4(thin(ln, 600)), pts: stops.map(q => [q.lat, q.lon, q.name, url(lang, "place", q.id)]) };
    out.push([pf(lang), page({ lang, pathFor: pf, title: `${r.name} – ${M(lang, "roadtrip")} | ${M(lang, "site")}`, desc, h1html: head, body: b + "</div>", ld, mapData })]);
    if (lang === "sv") sitemap.push(pf);
  }

  /* ---- mountainbike ---- */
  for (const a of mtbAll) {
    const pf = l => url(l, "mtb", a.id);
    const isRoute = !a.type;
    const bp = a.type === "bikepark";
    let b = facts(isRoute
      ? [[M(lang, "route"), esc(a.route)], [T(lang, "Längd"), esc(a.km)], [T(lang, "Höjdmeter"), esc(a.hm)], [T(lang, "Dagar"), esc(a.days)], [T(lang, "Säsong"), esc(a.season || a.date)]]
      : [[T(lang, "Spår"), esc(a.trails)], [T(lang, "Liftar"), esc(a.lifts)], [T(lang, "Grenar"), esc(a.disciplines)], [T(lang, "Säsong"), esc(a.season)], [bp ? T(lang, "Liftkort") : T(lang, "Kostnad"), esc(a.pass)], [T(lang, "Nivå"), esc(a.level)], [T(lang, "Uthyrning"), esc(a.rent)]]);
    b += paras(a.text);
    if (a.highlights) b += `<h3>${esc(M(lang, "highlights"))}</h3>${ul(a.highlights)}`;
    if (a.getting || a.stay) b += `<h3>${esc(T(lang, "Hitta hit"))}</h3>${facts([[T(lang, "Hitta hit"), esc(a.getting)], [T(lang, "Boende"), esc(a.stay)]])}`;
    if (a.tips) b += `<div class="box"><span class="eyebrow">${esc(T(lang, "Tips"))}</span>${esc(a.tips)}</div>`;
    b += `<div class="actions"><a class="btn primary" href="${app(lang, "touren")}">${esc(M(lang, "openGuide"))}</a>${a.link ? `<a class="btn" href="${esc(Array.isArray(a.link) ? a.link[1] : a.link)}" rel="noopener" target="_blank">${esc(Array.isArray(a.link) ? a.link[0] : M(lang, "more"))}</a>` : ""}</div>`;
    const near = a.lat ? D.PLACES.map(q => [q, kmBetween(a, q)]).sort((x, y) => x[1] - y[1]).slice(0, 6) : [];
    if (a.lat) b += `<div id="map" role="img" aria-label="${esc(a.name)}"></div>`;
    if (near.length) b += sec(T(lang, "I närheten"), `<ul class="list">${near.map(([q, d]) => listItem(url(lang, "place", q.id), q.name, `${Math.round(d)} km · ${q.sub}`, q.photos && q.photos[0])).join("")}</ul>`);
    if (a.links && a.links.length) b += sec(T(lang, "Länkar"), extLinks(a.links));
    const crumbItems = [kindHub.mtb, [a.name]];
    const head = `<div class="pad">${crumbs(lang, crumbItems)}<div class="tags"><span class="tag">${esc(T(lang, "Mountainbike"))}</span>${a.cc ? `<span class="tag">${esc(T(lang, CC[a.cc] || a.cc))}</span>` : ""}</div><h1>${esc(a.name)}</h1><p class="sub">${esc(a.area || a.route || "")}</p>`;
    const desc = clip(`${T(lang, "Mountainbike")}: ${a.name}${a.area ? ", " + a.area : ""}. ${a.text || ""}`, 158);
    const ld = { "@context": "https://schema.org", "@graph": [{ "@type": isRoute ? "TouristTrip" : "SportsActivityLocation", name: a.name, description: clip(a.text, 300), url: SITE + pf(lang), ...(a.lat ? { geo: { "@type": "GeoCoordinates", latitude: a.lat, longitude: a.lon } } : {}) }, crumbLd(lang, [kindHub.mtb, [a.name, pf(lang)]])] };
    const mapData = a.lat ? { main: 1, zoom: 10, pts: [[a.lat, a.lon, a.name]].concat(near.map(([q]) => [q.lat, q.lon, q.name, url(lang, "place", q.id)])) } : null;
    out.push([pf(lang), page({ lang, pathFor: pf, title: `${a.name} – ${T(lang, "Mountainbike")} | ${M(lang, "site")}`, desc, h1html: head, body: b + "</div>", ld, mapData })]);
    if (lang === "sv") sitemap.push(pf);
  }

  /* ---- översiktssida ---- */
  {
    const pf = l => hub(l);
    const order = ["stad", "tdf", "topp", "natur", "vatten", "grotta", "borg", "varldsarv", "spa", "bad", "vandring", "skidor", "langd"];
    const cats = order.filter(c => D.PLACES.some(p => p.cat.includes(c))).concat(Object.keys(D.CATS).filter(c => !order.includes(c) && D.PLACES.some(p => p.cat.includes(c))));
    const nav = `<div class="hubnav">${cats.map(c => `<a class="tag" href="#c-${c}">${esc(catLabel(c))}</a>`).join("")}<a class="tag" href="#leder">${esc(M(lang, "trails"))}</a><a class="tag" href="#cykel">${esc(M(lang, "rides"))}</a><a class="tag" href="#rutter">${esc(M(lang, "roadtrips"))}</a><a class="tag" href="#mtb">${esc(T(lang, "Mountainbike"))}</a></div>`;
    let b = `<p>${esc(M(lang, "hubIntro"))}</p>${nav}<div class="actions"><a class="btn primary" href="${app(lang, "karta")}">${esc(M(lang, "openMap"))}</a></div>`;
    b += `<h2 id="resmal">${esc(T(lang, "Resmål"))}</h2>`;
    for (const c of cats) {
      const items = D.PLACES.filter(p => p.cat.includes(c)).sort((a, z) => a.name.localeCompare(z.name, LOCALE[lang]));
      b += `<h3 id="c-${c}">${esc(catLabel(c))} <small class="foot">· ${items.length}</small></h3><ul class="list">${items.map(p => listItem(url(lang, "place", p.id), p.name, p.sub, p.photos && p.photos[0])).join("")}</ul>`;
    }
    b += `<h2 id="leder">${esc(M(lang, "trails"))}</h2><ul class="list">${D.TRAILS.map(t => listItem(url(lang, "trail", t.id), t.name, [t.km, t.days].filter(Boolean).join(" · "))).join("")}</ul>`;
    b += `<h2 id="cykel">${esc(M(lang, "rides"))}</h2><ul class="list">${D.RUNDOR.routes.map(r => listItem(url(lang, "ride", r.id), r.name, `${r.km} km · ${nf(lang, r.hm)} m · ${diff(r.difficulty)}`)).join("")}</ul>`;
    b += `<h2 id="rutter">${esc(M(lang, "roadtrips"))}</h2><ul class="list">${D.ROUTES.map(r => listItem(url(lang, "route", r.id), r.name, `${r.km} km · ${r.sub}`)).join("")}</ul>`;
    b += `<h2 id="mtb">${esc(T(lang, "Mountainbike"))}</h2><ul class="list">${D.MTB.areas.map(a => listItem(url(lang, "mtb", a.id), a.name, a.area)).join("")}</ul>`;
    if ((D.MTB.routes || []).length) b += `<h3>${esc(M(lang, "mtbRoutes"))}</h3><ul class="list">${D.MTB.routes.map(a => listItem(url(lang, "mtb", a.id), a.name, [a.route, a.km].filter(Boolean).join(" · "))).join("")}</ul>`;
    const head = `<div class="pad"><span class="eyebrow">${esc(M(lang, "site"))}</span><h1>${esc(M(lang, "hubTitle"))}</h1>`;
    const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: M(lang, "hubTitle"), description: M(lang, "hubIntro"), url: SITE + pf(lang), inLanguage: HL[lang] };
    out.push([pf(lang), page({ lang, pathFor: pf, title: `${M(lang, "hubTitle")} | ${M(lang, "site")}`, desc: clip(M(lang, "hubIntro"), 158), h1html: head, body: b + "</div>", ld })]);
    if (lang === "sv") sitemap.unshift(pf);
  }
}

/* ---------- skriv filer ---------- */
fs.writeFileSync(path.join(ROOT, "sidor.css"), CSS + "\n");
for (const l of LANGS) fs.rmSync(path.join(ROOT, l), { recursive: true, force: true });
for (const [p, h] of out) { const f = path.join(ROOT, p, "index.html"); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, h); }

/* sitemap: startsidan på alla språk + alla nya sidor, med hreflang-alternativ */
const alts = pf => LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${HL[l]}" href="${SITE}${pf(l)}"/>`).join("\n") + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${pf("en")}"/>`;
const home = l => `/?lang=${l}`;
const homeAlts = LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${HL[l]}" href="${SITE}/?lang=${l}"/>`).join("\n") + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>`;
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
for (const l of LANGS) xml += `  <url>\n    <loc>${SITE}${home(l)}</loc>\n${homeAlts}\n  </url>\n`;
xml += `  <url>\n    <loc>${SITE}/</loc>\n${homeAlts}\n  </url>\n  <url>\n    <loc>${SITE}/villkor/</loc>\n  </url>\n  <url>\n    <loc>${SITE}/integritet/</loc>\n  </url>\n`;
for (const pf of sitemap) for (const l of LANGS) xml += `  <url>\n    <loc>${SITE}${pf(l)}</loc>\n${alts(pf)}\n  </url>\n`;
xml += `</urlset>\n`;
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml);
console.log(`${out.length} sidor (${out.length / LANGS.length} per språk), sitemap med ${(xml.match(/<loc>/g) || []).length} adresser`);
