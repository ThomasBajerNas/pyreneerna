import { json, stripe } from "../_shop.js";
/* Kontrollerar att ett köp är betalt. Länken med köp-id fungerar i 30 dagar. */
export async function onRequestGet({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) return json({ ok: false, error: "Betalning är inte påslagen." }, 424);
  const id = new URL(request.url).searchParams.get("session_id") || "";
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return json({ ok: false, error: "Ogiltigt köp." }, 400);
  try {
    const s = await stripe(env, "checkout/sessions/" + id, null, "GET");
    const fresh = Date.now() / 1000 - s.created < 30 * 86400;
    if (s.payment_status !== "paid" || !fresh) return json({ ok: false, error: s.payment_status !== "paid" ? "Köpet är inte betalt." : "Länken har gått ut." }, 402);
    const m = s.metadata || {}; let cfg = "";
    for (let i = 0; m["cfg" + i] != null; i++) cfg += m["cfg" + i];
    return json({ ok: true, kind: m.kind, ready: m.ready || null, gpx: m.gpx === "1", title: m.title || "", cfg: cfg || null, email: s.customer_details && s.customer_details.email || null });
  } catch (e) { return json({ ok: false, error: e.message }, 424); }
}
