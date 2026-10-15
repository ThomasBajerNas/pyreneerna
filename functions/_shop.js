/* Priser och produkter för köp i guiden. Servern räknar alltid priset själv här –
   priset som visas i guiden (SHOP.price i index.html) ska vara samma. */
export const PRICE = {
  guide:  { SEK: 49,  NOK: 49,  DKK: 35,  EUR: 4.9 },   // egen guide
  gpxAdd: { SEK: 19,  NOK: 19,  DKK: 15,  EUR: 1.9 },   // GPX-paket till egen guide
  gpx:    { SEK: 15,  NOK: 15,  DKK: 12,  EUR: 1.5 },   // en GPX-fil
  ready:  { SEK: 69,  NOK: 69,  DKK: 49,  EUR: 6.9 },   // Thomas färdiga guider
  full:   { SEK: 149, NOK: 149, DKK: 109, EUR: 14.9 },  // hela guiden
};
export const READY = { hela: "full", "2014": "ready", tdf: "ready", katar: "ready", spa: "ready", unesco: "ready", vandra: "ready", skidor: "ready" };
export const CURRENCIES = ["SEK", "NOK", "DKK", "EUR"];

export function lineItems(o) {
  const cur = CURRENCIES.includes(o.cur) ? o.cur : "EUR";
  const name = s => String(s || "Reseguide Pyrenéerna").replace(/[<>]/g, "").slice(0, 120);
  const item = (key, label) => ({ key, label, amount: Math.round(PRICE[key][cur] * 100) });
  let items;
  if (o.kind === "gpx") items = [item("gpx", "GPX: " + name(o.title))];
  else if (o.kind === "guide" && o.ready && READY[o.ready]) items = [item(READY[o.ready], name(o.title))];
  else if (o.kind === "guide") items = [item("guide", name(o.title))].concat(o.gpx ? [item("gpxAdd", "GPX-paket")] : []);
  else throw new Error("okänd produkt");
  return { cur, items };
}
export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
export async function stripe(env, path, form, method = "POST") {
  const r = await fetch("https://api.stripe.com/v1/" + path, {
    method, headers: { authorization: "Bearer " + env.STRIPE_SECRET_KEY, ...(form ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || "Stripe-fel");
  return j;
}
