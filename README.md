# Pyrenéerna – reseguide

Thomas Bajers reseguide över Pyrenéerna (2014, uppdaterad 2026): resmål, rutter, cykling (Tour de France, Vuelta, Route d'Occitanie, motionscykling), mountainbike, vandring, skidåkning (alpina skidorter och längdåkningsområden i Frankrike, Andorra och Spanien) och Min resa.

- Webbplats: https://thomasbajernas.github.io/pyreneerna/
- Karta: Leaflet med CyclOSM, OpenTopoMap, OpenStreetMap och Esri som bakgrund. Kartdata © OpenStreetMap-bidragsgivare. Skidpister och längdspår som kartlager från OpenSnowMap (CC BY-SA).
- Vägföljande linjer och höjdprofiler är beräknade i förväg med BRouter (brouter.de) och ligger i `index.html` som kodade polylinjer.
- Egen cykeltur (ritverktyget): vägen räknas ut direkt i webbläsaren med BRouters öppna tjänst (brouter.de), och ortssökningen använder OpenStreetMaps Nominatim. Sparade turer ligger i besökarens webbläsare (localStorage) och kan delas som länk (`#tur=…`).

- Språk: svenska, norska, danska, engelska, tyska, franska, spanska, italienska och portugisiska. Översättningarna ligger i `i18n/<språk>.js` och laddas bara när det språket är valt (väljaren uppe till höger, eller `?lang=en` i adressen).
