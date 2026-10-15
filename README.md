# Pyrenéerna – reseguide

Thomas Bajers reseguide över Pyrenéerna (2014, uppdaterad 2026): resmål, rutter, cykling (Tour de France, Vuelta, Route d'Occitanie, motionscykling), mountainbike, vandring, skidåkning (alpina skidorter och längdåkningsområden i Frankrike, Andorra och Spanien) och Min resa.

- Webbplats: https://pyreneestrip.com/ (även mypyrenees.se, som vidarebefordras). Egen domän via filen `CNAME`; DNS hos Loopia: fyra A-poster till GitHub Pages och CNAME www → thomasbajernas.github.io.
- Karta: Leaflet med CyclOSM, OpenTopoMap, OpenStreetMap och Esri som bakgrund. Kartdata © OpenStreetMap-bidragsgivare. Skidpister och längdspår som kartlager från OpenSnowMap (CC BY-SA).
- Vägföljande linjer och höjdprofiler är beräknade i förväg med BRouter (brouter.de) och ligger i `index.html` som kodade polylinjer.
- Egen cykeltur (ritverktyget): vägen räknas ut direkt i webbläsaren med BRouters öppna tjänst (brouter.de), och ortssökningen använder OpenStreetMaps Nominatim. Sparade turer ligger i besökarens webbläsare (localStorage) och kan delas som länk (`#tur=…`).

- Språk: svenska, norska, danska, engelska, tyska, franska, spanska, italienska och portugisiska. Översättningarna ligger i `i18n/<språk>.js` och laddas bara när det språket är valt (väljaren uppe till höger, eller `?lang=en` i adressen).

## Min guide och nedladdningar
- Under Min resa → 4 · Min guide bygger besökaren en egen guide (av Min resa eller teman + områden, med valbara kapitel och GPX-paket) eller väljer en av Thomas färdiga guider. Förhandsvisningen visar två provsidor, resten är låst.
- Allt som laddas ner – guiden och alla GPX-filer på sajten – går via köpdialogen (`shopCheckout`). Priser och färdiga guider ställs in i `SHOP` och `READY` i `index.html`.
- Betalning är inte inkopplad: köpknappen visar "Betalningen öppnar snart". När den kopplas in fylls `SHOP.pay` i.
- Testläge: `?provkop=1` i adressen ger köpdialogen en testknapp som laddar ner utan betalning (`?provkop=0` stänger av). Sätt `SHOP.testParam = ""` före lansering.
- Webbsidorna går inte att skriva ut – utskrift visar bara en hänvisning till Min guide.

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
