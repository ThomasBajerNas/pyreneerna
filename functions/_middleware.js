/* Språk för sökmotorer: startsidan får titel, beskrivning, lang och hreflang-länkar på rätt språk.
   /?lang=xx ger språk xx. / utan lang är x-default (engelska) – besökaren får ändå sitt eget språk via JavaScript i sidan. */
const SITE = "https://pyreneestrip.com";
const META = {"sv": {"t": "Reseguide Pyrenéerna – cykling, vandring, skidor och resmål", "d": "Reseguide över Pyrenéerna och södra Frankrike: Tour de France-pass, cykelrundor, vandringsleder, skidorter, varma källor, världsarv och interaktiv karta.", "h": "sv", "o": "sv_SE"}, "no": {"t": "Reiseguide Pyreneene – sykling, fjellturer, ski og reisemål", "d": "Reiseguide til Pyreneene og Sør-Frankrike: Tour de France-pass, sykkelruter, turstier, skisteder, varme kilder, verdensarv og interaktivt kart.", "h": "nb", "o": "nb_NO"}, "da": {"t": "Rejseguide Pyrenæerne – cykling, vandring, ski og rejsemål", "d": "Rejseguide til Pyrenæerne og Sydfrankrig: Tour de France-pas, cykelruter, vandreruter, skisportssteder, varme kilder, verdensarv og interaktivt kort.", "h": "da", "o": "da_DK"}, "en": {"t": "Pyrenees Travel Guide – cycling, hiking, skiing and places to visit", "d": "Travel guide to the Pyrenees and southern France: Tour de France climbs, cycling routes, hiking trails, ski resorts, hot springs, World Heritage sites and an interactive map.", "h": "en", "o": "en_GB"}, "de": {"t": "Reiseführer Pyrenäen – Radfahren, Wandern, Skifahren und Reiseziele", "d": "Reiseführer für die Pyrenäen und Südfrankreich: Tour-de-France-Pässe, Radrouten, Wanderwege, Skigebiete, heiße Quellen, Welterbestätten und interaktive Karte.", "h": "de", "o": "de_DE"}, "fr": {"t": "Guide de voyage des Pyrénées – vélo, randonnée, ski et destinations", "d": "Guide de voyage des Pyrénées et du sud de la France : cols du Tour de France, itinéraires vélo, sentiers de randonnée, stations de ski, sources chaudes, sites du patrimoine mondial et carte interactive.", "h": "fr", "o": "fr_FR"}, "es": {"t": "Guía de viaje de los Pirineos – ciclismo, senderismo, esquí y destinos", "d": "Guía de viaje de los Pirineos y el sur de Francia: puertos del Tour de Francia, rutas en bici, senderos, estaciones de esquí, aguas termales, Patrimonio Mundial y mapa interactivo.", "h": "es", "o": "es_ES"}, "it": {"t": "Guida di viaggio dei Pirenei – ciclismo, escursionismo, sci e mete", "d": "Guida di viaggio dei Pirenei e del sud della Francia: salite del Tour de France, percorsi in bici, sentieri, stazioni sciistiche, sorgenti termali, siti Patrimonio dell'Umanità e mappa interattiva.", "h": "it", "o": "it_IT"}, "pt": {"t": "Guia de viagem dos Pirenéus – ciclismo, caminhadas, esqui e destinos", "d": "Guia de viagem dos Pirenéus e do sul de França: subidas do Tour de France, percursos de bicicleta, trilhos, estâncias de esqui, termas, Património Mundial e mapa interativo.", "h": "pt", "o": "pt_PT"}};
const attr = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export async function onRequest(ctx) {
  const res = await ctx.next();
  const url = new URL(ctx.request.url);
  if (url.pathname !== "/" || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  const q = url.searchParams.get("lang");
  const lang = META[q] ? q : null, m = META[lang || "en"];
  const self = lang ? `${SITE}/?lang=${lang}` : `${SITE}/`;
  const head = Object.keys(META).map(k => `<link rel="alternate" hreflang="${META[k].h}" href="${SITE}/?lang=${k}">`).join("")
    + `<link rel="alternate" hreflang="x-default" href="${SITE}/"><link rel="canonical" href="${self}">`
    + `<meta property="og:type" content="website"><meta property="og:site_name" content="pyreneestrip.com"><meta property="og:url" content="${self}">`
    + `<meta property="og:title" content="${attr(m.t)}"><meta property="og:description" content="${attr(m.d)}"><meta property="og:locale" content="${m.o}">`
    + `<meta property="og:image" content="${SITE}/img/thomas-tdf.jpg">`;
  return new HTMLRewriter()
    .on("html", { element(e) { e.setAttribute("lang", m.h); } })
    .on("meta[charset]", { element(e) { e.after(head, { html: true }); } })
    .on("title", { element(e) { e.setInnerContent(m.t); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute("content", m.d); } })
    .transform(res);
}
