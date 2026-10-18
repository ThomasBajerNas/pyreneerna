/* POST /api/super/portal (header x-super) – länk till Stripes kundportal: säga upp, byta kort, se kvitton.
   Kundportalen slås på i Stripe: Settings → Billing → Customer portal. */
import { json, stripe, readToken } from "./_lib.js";
export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: "Betalning är inte påslagen." }, 424);
  const cus = await readToken(env, request.headers.get("x-super"));
  if (!cus) return json({ error: "Okänd nyckel." }, 401);
  let o; try { o = await request.json(); } catch (e) { o = {}; }
  const origin = new URL(request.url).origin, lang = /^(sv|no|da|en|de|fr|es|it|pt)$/.test(o.lang) ? o.lang : "";
  try { const s = await stripe(env, "billing_portal/sessions", { customer: cus, return_url: `${origin}/${lang ? "?lang=" + lang : ""}#om` }); return json({ url: s.url }); }
  catch (e) { return json({ error: e.message }, 424); }
}
