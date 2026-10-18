# Pyrenéerna – reseguide

Thomas Bajers reseguide över Pyrenéerna (2014, uppdaterad 2026): resmål, rutter, cykling (Tour de France, Vuelta, Route d'Occitanie, motionscykling), mountainbike, vandring, skidåkning (alpina skidorter och längdåkningsområden i Frankrike, Andorra och Spanien) och Min resa.

- Webbplats: https://pyreneestrip.com/ (även mypyrenees.se, som vidarebefordras). Sajten körs på Cloudflare Pages (projekt "pyreneerna", publiceras automatiskt vid push till main). DNS för pyreneestrip.com ligger hos Cloudflare; domänen är registrerad hos Loopia. GitHub Pages-adressen skickar vidare till pyreneestrip.com.
- Karta: Leaflet med CyclOSM, OpenTopoMap, OpenStreetMap och Esri som bakgrund. Kartdata © OpenStreetMap-bidragsgivare. Skidpister och längdspår som kartlager från OpenSnowMap (CC BY-SA).
- Vägföljande linjer och höjdprofiler är beräknade i förväg med BRouter (brouter.de) och ligger i `index.html` som kodade polylinjer.
- Egen cykeltur (ritverktyget): vägen räknas ut direkt i webbläsaren med BRouters öppna tjänst (brouter.de), och ortssökningen använder OpenStreetMaps Nominatim. Sparade turer ligger i besökarens webbläsare (localStorage) och kan delas som länk (`#tur=…`).

- Språk: svenska, norska, danska, engelska, tyska, franska, spanska, italienska och portugisiska. Översättningarna ligger i `i18n/<språk>.js` och laddas bara när det språket är valt (väljaren uppe till höger, eller `?lang=en` i adressen).
- Språkval: `?lang=xx` i adressen går först, sedan besökarens eget val (sparas i webbläsaren), sedan webbläsarens språk. Språk som guiden inte har → engelska.
- Sökmotorer: `functions/_middleware.js` skriver in titel, beskrivning, `lang`, `hreflang`-länkar, canonical och Open Graph på rätt språk för `/?lang=xx`. `/` utan lang är x-default (engelska). `sitemap.xml` listar alla språkversioner och `robots.txt` pekar på den. `_routes.json` gör att funktionerna bara körs för `/` och `/api/*`.

## Egna sidor för sökmotorer
- Varje resmål, vandringsled, cykelrunda, bilrutt och mountainbikeområde har en egen statisk sida på alla nio språk, t.ex. `/sv/place/tourmalet/`, `/en/trail/gr10/`, `/de/ride/arudy-marie-blanque/`. Översiktssidan per språk är `/sv/`, `/en/` osv.
- Sidorna byggs av samma data som appen (`index.html` + `i18n/`) med `node tools/build-pages.mjs`. **Kör skriptet efter varje ändring i guidens innehåll** och checka in mapparna `sv/ … pt/`, `sidor.css` och `sitemap.xml` – annars visar sidorna gammal text.
- Skriptet skriver också om `sitemap.xml` (startsidan, villkor och alla sidor med hreflang-länkar).
- Sidorna länkar in i appen (`/?lang=xx#p-<id>`), och appen länkar ut till dem (Om guiden och "Länk till sidan" i varje resmål).

## Reseförslag
- Under Resmål → **Reseförslag** finns färdiga resor: ett förslag per Pyrenéetapp i nästa Tour de France (boende i start- och målorten, sevärdheter i start, mål och längs banan, de bästa platserna att se loppet, dag för dag, resa dit) och Thomas egna förslag. Etappkorten under Cykling får knappen **Reseförslag** när det finns ett förslag för etappen. Djuplänk: `/?lang=xx#r-<id>`.
- Guidens förslag ligger i `const RESOR = [...]` i `index.html` (i datablocket, direkt efter `TDF27`). Den schemalagda uppdateringen av proffsloppen lägger till ett förslag per Pyrenéetapp när Tourens bana är presenterad.
- Fält per förslag: `id`, `kind` ("tdf" eller "egen"), `year`, `stage` (etappnyckel, t.ex. `tdf-2027-14`), `title`, `sub`, `days`, `date` (valfritt), `when`, `photos` (`"place:<resmål-id>"`, en bild i `img/`, `cw:<Wikimedia-fil>`, `/api/resor/img/<id>` eller `{src, cap, by}`), `intro`, `program` [{`t`, `x`}], `stay` [{`town`, `role` (start/mal/bas), `nights`, `from` (incheckning), `id` (resmål), `lat`, `lon`, `x`, `hotels` [{`n`, `x`, `url`}]}], `spots` [{`n`, `role` (start/bana/titta/mal), `id`, `lat`, `lon`, `km`, `x`}], `travel`, `airports` (flygplatskoder), `tips`, `author`.
- Texterna skrivs på svenska och översätts med `_t()` – lägg in varje text som nyckel i `i18n/<språk>.js`.

### Ägarläge (Thomas egna reseförslag)
- Öppna `https://pyreneestrip.com/?agare` (eller Om guiden → Logga in som ägare) och logga in med samma lösenord som statistiksidan (`STATS_PASSWORD`, eller `OWNER_PASSWORD` om du vill ha ett eget).
- Då kan du skapa nya reseförslag (titel, dagar, bilder, dag för dag, boende med hotell, sevärdheter, flygplatser, tips), spara som utkast, ladda upp egna foton (förminskas till 1800 px), ändra guidens förslag (din version ersätter guidens) och dölja förslag för besökarna.
- Sparas i Cloudflare KV via `functions/api/resor/` (`index.js` = läsa/spara, `img/` = bilder). **Engångsinställning i Cloudflare:** Workers & Pages → KV → Create namespace (t.ex. `pyreneerna-resor`). Sedan Pages-projektet *pyreneerna* → Settings → Bindings → Add → KV namespace, variabelnamn `RESOR`, välj namnområdet, spara och gör en ny deploy (eller Retry deployment).
- Egna förslag visas på svenska tills de är översatta. Den schemalagda uppdateringen hämtar `/api/resor` och lägger in översättningar för nya texter.

## Min guide och nedladdningar
- Under Min resa → 4 · Min guide bygger besökaren en egen guide (av Min resa eller teman + områden, med valbara kapitel och GPX-paket) eller väljer en av Thomas färdiga guider. Förhandsvisningen visar två provsidor, resten är låst.
- Allt som laddas ner – guiden och alla GPX-filer på sajten – går via köpdialogen (`shopCheckout`). Priser och färdiga guider ställs in i `SHOP` och `READY` i `index.html`.
- Betalning med Stripe är inkopplad (live sedan oktober 2026) på Cloudflare Pages. Utan server (t.ex. GitHub Pages) visar köpknappen "Betalningen öppnar snart".
- Testläge: avstängt (`SHOP.testParam = ""`). Sätt `SHOP.testParam = "provkop"` för att slå på det igen; då ger `?provkop=1` köpdialogen en testknapp som laddar ner utan betalning.
- Webbsidorna går inte att skriva ut – utskrift visar bara en hänvisning till Min guide.

## Superanvändare (årsabonnemang)
- Superanvändare laddar ner allt fritt så länge abonnemanget gäller: egna guider, Thomas färdiga guider (även hela guiden) och alla GPX-filer. Köpdialogen (`shopCheckout`) visar då "Ingår för dig som superanvändare" i stället för betalning. Erbjudandet syns i köpdialogen, under Min guide och under Om guiden → Superanvändare.
- Pris per år: `PRICE.super` i `functions/_shop.js` (servern räknar alltid härifrån) och samma värde i `SHOP.price.super` i `index.html`. Nu 249 SEK / 249 NOK / 179 DKK / 24,90 EUR. Förnyas automatiskt varje år. Rabattkoder från Stripe (Products → Coupons → Promotion codes) går att använda i kassan.
- Serverdelen ligger i `functions/api/super/`: `checkout.js` (Stripe Checkout i abonnemangsläge), `verify.js` (efter betalningen – ger nyckeln och mejlar inloggningslänken), `status.js` (är abonnemanget aktivt?), `login.js` (skickar inloggningslänk till e-postadressen), `portal.js` (Stripes kundportal: säga upp, byta kort, kvitton).
- Inloggning: nyckeln `cus_….<signatur>` sparas i webbläsaren. Länken `https://pyreneestrip.com/?medlem=<nyckel>` loggar in på en ny enhet. Den visas efter köpet och skickas med e-post.
- **Engångsinställningar:**
  0. Stripe-nyckeln i Cloudflare (`STRIPE_SECRET_KEY`) är en begränsad nyckel (rk_live_…, "pyreneestrip-cloudflare"). Den behöver: Checkout Sessions – Skriva, Customers – Skriva, Subscriptions – Läsa, Customer Portal – Skriva. Saknas någon svarar Stripe 403 och köpet kan inte bekräftas.
  1. Stripe → Settings → Billing → **Customer portal** → slå på (tillåt uppsägning, byte av betalsätt och fakturahistorik). Behövs för knappen Hantera abonnemang.
  2. Stripe → Settings → Billing → Subscriptions and emails → slå gärna på påminnelse före förnyelse och mejl om misslyckade betalningar.
  3. E-post för inloggningslänkar (rekommenderas): skapa konto på resend.com, lägg till domänen pyreneestrip.com (Resend kan lägga in DNS-posterna i Cloudflare automatiskt), skapa en API-nyckel och lägg den i Cloudflare Pages → Settings → Variables and Secrets som `RESEND_API_KEY`. Valfritt `MAIL_FROM` (standard `Pyreneestrip <info@pyreneestrip.com>`). Utan nyckel fungerar köpet, men inloggning på en ny enhet går bara med länken som visas efter köpet.
- Villkoren för abonnemanget står i `villkor/index.html` (avsnittet Superanvändare) på alla nio språk.

## Köpvillkor och kontakt
- `villkor/index.html` – köpvillkor, ångerrätt, återbetalning och kontakt (info@pyreneestrip.com) på alla nio språk. Länkas från köpdialogen och Om guiden.
- I köpdialogen måste kunden kryssa i att nedladdningen startar direkt och att ångerrätten då upphör innan betalknappen går att trycka på.

## App (PWA)
- Guiden går att installera som app på Android, iPhone och datorn: `manifest-<språk>.webmanifest` (namn på besökarens språk), ikoner i `icons/` och knappen "Installera appen" under Om guiden (visas när webbläsaren erbjuder installation; på iPhone: Dela → Lägg till på hemskärmen).
- `sw.js` (service worker) gör att guiden startar snabbt och fungerar utan täckning: sidan hämtas från nätet först med sparad kopia som reserv, guidens egna filer och Leaflet/typsnitt sparas, och de kartrutor man tittat på i OpenStreetMap-baserade kartor sparas (högst 3000). Google- och Esri-kartor, /api, Stripe, BRouter och sökningen går alltid mot nätet.
- Ändras språkfilerna: höj `?v=` i `index.html`. Ändras cachestrategin: höj `VERSION` i `sw.js`.
- `_headers` gör att `sw.js` aldrig cachas av webbläsaren, så uppdateringar slår igenom.

## Partnerlänkar (affiliate)
- Alla ID:n fylls i på ett ställe: `const AFF` i `index.html` (sök på "Partnerlänkar"). Tomma fält = vanliga länkar utan provision och utan märkning.
- Travelpayouts Drive är installerat i `<head>` (skriptet från emrldtp.cc) och gör länkar till Discover Cars, GetYourGuide, Omio m.fl. till partnerlänkar automatiskt (`AFF.tpDrive`). Alternativt Travelpayouts (`AFF.tp`): `marker` + program-id `p` för Discover Cars, Omio, GetYourGuide, Aviasales och BikesBooking. Länkarna går via `tp.media/r` – jämför med en länk du skapar i Travelpayouts-panelen.
- Boende: Booking.com direkt (`AFF.booking.aid`) eller Stay22 (`AFF.stay22.aid` + `script`), som också gör Hotels.com- och Vrbo-länkarna till partnerlänkar.
- Cykeluthyrare med eget avtal: lägg namnet i `AFF.shops` så visas de först med märket Partner.
- Bokningsknappar finns i Boka & kalkyl (flyg, boende, hyrbil, tåg/buss, cykel, upplevelser), i varje resmål (Boende nära, Upplevelser), på etapperna (Bo i målorten), ryktena om nästa Tour (Säkra boende nu), motionsloppen (Boende kvällen före loppet), skidorterna (Boende i orten) och under Övrig sport (Boka aktivitet, Boende).
- Aktiva partnerlänkar märks med "Annonslänk" och `rel="sponsored"`.

## Betalning med Stripe (Cloudflare Pages)
Serverdelen ligger i `functions/` och körs av Cloudflare Pages (på GitHub Pages finns den inte, och då visar köpdialogen "Betalningen öppnar snart").
- `functions/_shop.js` – priser och produkter. **Servern räknar alltid priset härifrån.** Ändra samtidigt `SHOP.price` i `index.html` så att guiden visar samma pris.
- `functions/api/health.js` – guiden frågar om betalning finns (Stripe-nyckel inlagd).
- `functions/api/checkout.js` – skapar en Stripe Checkout-session (kort, Klarna, Apple Pay/Google Pay, Swish – det som är påslaget i Stripe).
- `functions/api/verify.js` – kontrollerar att köpet är betalt. Köplänken (`?kop=…`) fungerar i 30 dagar.
- Hemliga nycklar läggs **bara** i Cloudflare (Settings → Variables and Secrets): `STRIPE_SECRET_KEY` = `sk_test_…` för test, senare `sk_live_…`.
- Testkort i testläge: 4242 4242 4242 4242, valfritt framtida datum och CVC.

## Statistik (bara för Thomas)
- `statistik/index.html` + `functions/api/stats.js`: lösenordsskyddad sida på https://pyreneestrip.com/statistik/ med besök (Cloudflare Web Analytics), Google-sökningar (Search Console) och försäljning (Stripe). Hämtar nya siffror var femte minut.
- Hemligheter i Cloudflare (Settings → Variables and Secrets): `STATS_PASSWORD`, `CF_ACCOUNT_ID`, `CF_API_TOKEN` (Account Analytics: Read), `GSC_SA_JSON` (JSON-nyckel för ett Google-tjänstekonto som är tillagt som användare i Search Console). Valfritt `GSC_SITE` (standard `sc-domain:pyreneestrip.com`).
- Sidan är `noindex` och spärrad i `robots.txt`.
