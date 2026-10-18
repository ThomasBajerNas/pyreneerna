/* GET /api/super/verify?session_id=cs_… – efter betalningen: kontrollerar abonnemanget och ger nyckeln.
   Skickar inloggningslänken med e-post första gången (om RESEND_API_KEY finns). */
import { json, stripe, makeToken, subInfo, OK_STATUS, sendLogin, loginLink, LANGS } from "./_lib.js";
export async function onRequestGet({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) return json({ ok: false, error: "Betalning är inte påslagen." }, 424);
  const u = new URL(request.url), id = u.searchParams.get("session_id") || "", lang = LANGS.includes(u.searchParams.get("lang")) ? u.searchParams.get("lang") : "";
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return json({ ok: false, error: "Ogiltigt köp." }, 400);
  try {
    const s = await stripe(env, `checkout/sessions/${id}?expand[]=subscription`, null, "GET");
    const sub = s.subscription && typeof s.subscription === "object" ? s.subscription : null;
    if (s.mode !== "subscription" || s.status !== "complete" || !sub || !OK_STATUS.includes(sub.status)) return json({ ok: false, error: "Abonnemanget är inte betalt." }, 402);
    const cus = typeof s.customer === "string" ? s.customer : s.customer && s.customer.id;
    const token = await makeToken(env, cus), email = (s.customer_details && s.customer_details.email) || null;
    let mailed = false;
    const c = await stripe(env, "customers/" + cus, null, "GET");
    if (email && !(c.metadata && c.metadata.super_welcome === id)) {
      mailed = await sendLogin(env, email, lang, loginLink(u.origin, token, lang)).catch(() => false);
      await stripe(env, "customers/" + cus, { "metadata[super_welcome]": id }).catch(() => {});
    } else mailed = !!(c.metadata && c.metadata.super_welcome === id && env.RESEND_API_KEY);
    return json({ ok: true, token, email, mailed, ...subInfo(sub) });
  } catch (e) { return json({ ok: false, error: e.message }, 424); }
}
