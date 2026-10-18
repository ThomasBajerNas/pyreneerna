/* POST /api/super/checkout { cur, lang } – startar ett årsabonnemang i Stripe Checkout. Priset räknas här (PRICE.super). */
import { json, stripe, PRICE, CURRENCIES, LANGS } from "./_lib.js";
const STRIPE_LOCALE = { sv: "sv", no: "nb", da: "da", en: "en-GB", de: "de", fr: "fr", es: "es", it: "it", pt: "pt" };
export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: "Betalning är inte påslagen." }, 424);
  let o; try { o = await request.json(); } catch (e) { o = {}; }
  const cur = CURRENCIES.includes(o.cur) ? o.cur : "EUR", lang = LANGS.includes(o.lang) ? o.lang : "";
  const origin = new URL(request.url).origin;
  const f = {
    mode: "subscription",
    success_url: `${origin}/?super={CHECKOUT_SESSION_ID}${lang ? "&lang=" + lang : ""}#om`,
    cancel_url: `${origin}/${lang ? "?lang=" + lang : ""}#om`,
    locale: STRIPE_LOCALE[lang] || "auto",
    allow_promotion_codes: "true",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": cur.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(Math.round(PRICE.super[cur] * 100)),
    "line_items[0][price_data][recurring][interval]": "year",
    "line_items[0][price_data][product_data][name]": "Superanvändare – Reseguide Pyrenéerna (1 år)",
    "metadata[kind]": "super", "metadata[lang]": lang,
    "subscription_data[metadata][kind]": "super", "subscription_data[metadata][lang]": lang,
  };
  try { const s = await stripe(env, "checkout/sessions", f); return json({ url: s.url }); }
  catch (e) { return json({ error: e.message }, 424); }
}
