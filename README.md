# Pyrenéerna – reseguide

Thomas Bajers reseguide över Pyrenéerna (2014, uppdaterad 2026): resmål, rutter, cykling (Tour de France, Vuelta, Route d'Occitanie, motionscykling), mountainbike, vandring, skidåkning (alpina skidorter och längdåkningsområden i Frankrike, Andorra och Spanien) och Min resa.

- Webbplats: https://thomasbajernas.github.io/pyreneerna/
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
- Travelpayouts (`AFF.tp`): `marker` + program-id `p` för Discover Cars, Omio, GetYourGuide, Aviasales och BikesBooking. Länkarna går via `tp.media/r` – jämför med en länk du skapar i Travelpayouts-panelen.
- Boende: Booking.com direkt (`AFF.booking.aid`) eller Stay22 (`AFF.stay22.aid` + `script`), som också gör Hotels.com- och Vrbo-länkarna till partnerlänkar.
- Cykeluthyrare med eget avtal: lägg namnet i `AFF.shops` så visas de först med märket Partner.
- Bokningsknappar finns i Boka & kalkyl (flyg, boende, hyrbil, tåg/buss, cykel, upplevelser), i varje resmål (Boende nära, Upplevelser), på etapperna (Bo i målorten), ryktena om nästa Tour (Säkra boende nu), motionsloppen (Boende kvällen före loppet), skidorterna (Boende i orten) och under Övrig sport (Boka aktivitet, Boende).
- Aktiva partnerlänkar märks med "Annonslänk" och `rel="sponsored"`.
