/* POST /api/super/login { email, lang } – skickar inloggningslänken till en e-postadress som har ett aktivt abonnemang.
   Svarar alltid likadant, så att ingen kan ta reda på vem som är kund. */
import { json, stripe, makeToken, activeSub, sendLogin, loginLink, LANGS } from "./_lib.js";
export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) return json({ ok: false, error: "Betalning är inte påslagen." }, 424);
  if (!env.RESEND_API_KEY) return json({ ok: false, mail: false });
  let o; try { o = await request.json(); } catch (e) { o = {}; }
  const email = String(o.email || "").trim().toLowerCase(), lang = LANGS.includes(o.lang) ? o.lang : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return json({ ok: false, error: "Ogiltig e-postadress." }, 400);
  try {
    const l = await stripe(env, `customers?email=${encodeURIComponent(email)}&limit=10`, null, "GET");
    for (const c of l.data || []) {
      if (await activeSub(env, c.id)) { await sendLogin(env, email, lang, loginLink(new URL(request.url).origin, await makeToken(env, c.id), lang)); break; }
    }
  } catch (e) {}
  return json({ ok: true, mail: true });
}
