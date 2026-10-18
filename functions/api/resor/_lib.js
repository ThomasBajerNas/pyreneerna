/* Gemensamt för Thomas egna reseförslag (/api/resor).
   Inställningar i Cloudflare Pages → Settings:
     KV-bindning  RESOR            ett KV-namnområde där reseförslagen och bilderna sparas
     Hemlighet    OWNER_PASSWORD   (valfritt) lösenord för ägarläget – annars används STATS_PASSWORD */
export const json = (o, s = 200, cache = "no-store") => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache, "x-robots-tag": "noindex" } });
async function same(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const u = new Uint8Array(x), v = new Uint8Array(y); let d = 0; for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i]; return d === 0;
}
export async function isOwner(request, env) {
  const pw = env.OWNER_PASSWORD || env.STATS_PASSWORD; if (!pw) return false;
  const k = request.headers.get("x-owner-key") || ""; if (!k) return false;
  return same(k, pw);
}
export const noKV = () => json({ kv: false, trips: [], hidden: [], error: "KV-bindningen RESOR saknas i Cloudflare Pages (Settings → Bindings)." }, 424);
export async function load(env) { return (await env.RESOR.get("data", "json")) || { trips: {}, hidden: [] }; }
