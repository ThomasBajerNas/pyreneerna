/* GET /api/super/status (header x-super: nyckeln) – är abonnemanget aktivt? { ok, until, cancel } */
import { json, readToken, activeSub } from "./_lib.js";
export async function onRequestGet({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) return json({ ok: null, error: "Betalning är inte påslagen." }, 503);
  const cus = await readToken(env, request.headers.get("x-super"));
  if (!cus) return json({ ok: false, reason: "key" });
  try { const s = await activeSub(env, cus); return s ? json({ ok: true, until: s.until, cancel: s.cancel, status: s.status }) : json({ ok: false, reason: "inactive" }); }
  catch (e) { return json({ ok: null, error: e.message }, 502); }
}
