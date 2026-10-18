import { lineItems, json, stripe } from "../_shop.js";
/* Skapar en Stripe Checkout-session. Priset räknas här på servern, aldrig i webbläsaren. */
const STRIPE_LOCALE = { sv: "sv", no: "nb", da: "da", en: "en-GB", de: "de", fr: "fr", es: "es", it: "it", pt: "pt" };
export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: "Betalning är inte påslagen." }, 424);
  let o; try { o = await request.json(); } catch (e) { return json({ error: "Fel i beställningen." }, 400); }
  let L; try { L = lineItems(o); } catch (e) { return json({ error: e.message }, 400); }
  const origin = new URL(request.url).origin;
  const lang = /^(sv|no|da|en|de|fr|es|it|pt)$/.test(o.lang) ? o.lang : "";
  const f = {
    mode: "payment",
    success_url: `${origin}/?kop={CHECKOUT_SESSION_ID}${lang ? "&lang=" + lang : ""}#minresa`,
    cancel_url: `${origin}/${lang ? "?lang=" + lang : ""}#minresa`,
    locale: STRIPE_LOCALE[o.lang] || "auto",
    "metadata[kind]": o.kind, "metadata[ready]": o.ready || "", "metadata[gpx]": o.gpx ? "1" : "0",
    "metadata[title]": String(o.title || "").slice(0, 200), "metadata[lang]": String(o.lang || "").slice(0, 5),
  };
  L.items.forEach((it, i) => {
    f[`line_items[${i}][quantity]`] = "1";
    f[`line_items[${i}][price_data][currency]`] = L.cur.toLowerCase();
    f[`line_items[${i}][price_data][unit_amount]`] = String(it.amount);
    f[`line_items[${i}][price_data][product_data][name]`] = it.label;
  });
  // Inställningarna för en egen guide sparas i köpet, så att den kan laddas ner igen från en annan enhet.
  const cfg = typeof o.cfg === "string" ? o.cfg.slice(0, 9000) : "";
  for (let i = 0; i * 450 < cfg.length && i < 20; i++) f[`metadata[cfg${i}]`] = cfg.slice(i * 450, i * 450 + 450);
  try { const s = await stripe(env, "checkout/sessions", f); return json({ url: s.url }); }
  catch (e) { return json({ error: e.message }, 424); }
}
