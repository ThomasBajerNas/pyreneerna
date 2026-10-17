/* Statistik för Thomas (sidan /statistik/). Hämtar färska siffror från
   – Cloudflare Web Analytics (besök, sidvisningar, sidor, varifrån, länder, enheter)
   – Google Search Console (sökord, visningar, klick, placering)
   – Stripe (försäljning)
   Inställningar i Cloudflare (Settings → Variables and Secrets):
     STATS_PASSWORD   lösenordet till statistiksidan
     CF_ACCOUNT_ID    Cloudflare-kontots id
     CF_API_TOKEN     API-token med behörigheten Account → Account Analytics → Read
     GSC_SA_JSON      hela JSON-nyckeln för ett Google-tjänstekonto som lagts till som användare i Search Console
     GSC_SITE         (valfritt) egendomen i Search Console, standard sc-domain:pyreneestrip.com
   STRIPE_SECRET_KEY finns redan för betalningen. */

const H = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: H });
const day = d => d.toISOString().slice(0, 10);

export async function onRequestGet({ request, env }) {
  if (!env.STATS_PASSWORD) return json({ error: "STATS_PASSWORD saknas i Cloudflare." }, 503);
  const key = request.headers.get("x-stats-key") || "";
  if (!(await same(key, env.STATS_PASSWORD))) return json({ error: "Fel lösenord." }, 401);
  const days = Math.min(30, Math.max(1, parseInt(new URL(request.url).searchParams.get("days") || "7", 10) || 7));
  const end = new Date(), start = new Date(end.getTime() - days * 864e5);
  const [cf, gsc, sales] = await Promise.all([
    cloudflare(env, start, end).catch(e => ({ error: e.message })),
    google(env, days).catch(e => ({ error: e.message })),
    stripeSales(env, start).catch(e => ({ error: e.message })),
  ]);
  return json({ days, from: start.toISOString(), to: end.toISOString(), cf, gsc, sales });
}

async function same(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const u = new Uint8Array(x), v = new Uint8Array(y); let d = 0; for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i]; return d === 0;
}

/* ---------- Cloudflare Web Analytics (GraphQL) ---------- */
async function cloudflare(env, start, end) {
  if (!env.CF_ACCOUNT_ID || !env.CF_API_TOKEN) return { error: "CF_ACCOUNT_ID eller CF_API_TOKEN saknas.", setup: true };
  const f = `{ AND: [{ datetime_geq: "${start.toISOString()}", datetime_leq: "${end.toISOString()}" }, { bot: 0 }] }`;
  const grp = (alias, dim, limit, order) => `${alias}: rumPageloadEventsAdaptiveGroups(limit: ${limit}, filter: ${f}, orderBy: [${order}]) { count sum { visits } dimensions { ${dim} } }`;
  const q = `{ viewer { accounts(filter: { accountTag: "${env.CF_ACCOUNT_ID}" }) {
    ${grp("daily", "date", 100, "date_ASC")}
    ${grp("pages", "requestPath", 25, "count_DESC")}
    ${grp("refs", "refererHost", 15, "sum_visits_DESC")}
    ${grp("countries", "countryName", 15, "sum_visits_DESC")}
    ${grp("devices", "deviceType", 5, "sum_visits_DESC")}
  } } }`;
  const r = await fetch("https://api.cloudflare.com/client/v4/graphql", { method: "POST", headers: { authorization: "Bearer " + env.CF_API_TOKEN, "content-type": "application/json" }, body: JSON.stringify({ query: q }) });
  const o = await r.json();
  if (o.errors && o.errors.length) throw new Error("Cloudflare: " + o.errors.map(e => e.message).join("; "));
  const a = (o.data && o.data.viewer.accounts[0]) || {};
  const rows = (list, k) => (list || []).map(x => ({ key: x.dimensions[k] || "", views: x.count, visits: x.sum.visits }));
  const daily = rows(a.daily, "date");
  return {
    totals: { views: daily.reduce((s, x) => s + x.views, 0), visits: daily.reduce((s, x) => s + x.visits, 0) },
    daily, pages: rows(a.pages, "requestPath"), refs: rows(a.refs, "refererHost"), countries: rows(a.countries, "countryName"), devices: rows(a.devices, "deviceType"),
  };
}

/* ---------- Google Search Console ---------- */
async function google(env, days) {
  if (!env.GSC_SA_JSON) return { error: "GSC_SA_JSON saknas.", setup: true };
  let sa; try { sa = JSON.parse(env.GSC_SA_JSON); } catch (e) { throw new Error("GSC_SA_JSON är inte giltig JSON."); }
  const token = await googleToken(sa);
  const site = encodeURIComponent(env.GSC_SITE || "sc-domain:pyreneestrip.com");
  // Search Console har ungefär 2–3 dagars fördröjning – hämta en något längre period så att diagrammet inte blir tomt.
  const end = new Date(), start = new Date(end.getTime() - Math.max(days, 7) * 864e5 - 3 * 864e5);
  const q = (dimensions, rowLimit) => fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`, {
    method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" },
    body: JSON.stringify({ startDate: day(start), endDate: day(end), dimensions, rowLimit, dataState: "all" }),
  }).then(async r => { const o = await r.json(); if (!r.ok) throw new Error("Google: " + ((o.error && o.error.message) || r.status)); return o.rows || []; });
  const [d, qs, pg, cc] = await Promise.all([q(["date"], 100), q(["query"], 25), q(["page"], 25), q(["country"], 15)]);
  const map = rows => rows.map(r => ({ key: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
  const daily = map(d);
  const clicks = daily.reduce((s, x) => s + x.clicks, 0), impressions = daily.reduce((s, x) => s + x.impressions, 0);
  const position = impressions ? daily.reduce((s, x) => s + x.position * x.impressions, 0) / impressions : null;
  return { from: day(start), to: day(end), totals: { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position }, daily, queries: map(qs), pages: map(pg), countries: map(cc) };
}

async function googleToken(sa) {
  const b64 = s => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const pem = String(sa.private_key || "").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const k = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", k, new TextEncoder().encode(head + "." + body)));
  const jwt = head + "." + body + "." + b64(String.fromCharCode(...sig));
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + jwt });
  const o = await r.json();
  if (!o.access_token) throw new Error("Google-inloggning misslyckades: " + (o.error_description || o.error || r.status));
  return o.access_token;
}

/* ---------- Stripe ---------- */
async function stripeSales(env, start) {
  if (!env.STRIPE_SECRET_KEY) return { error: "STRIPE_SECRET_KEY saknas.", setup: true };
  const out = []; let after = "";
  for (let i = 0; i < 5; i++) {
    const u = `https://api.stripe.com/v1/checkout/sessions?limit=100&status=complete&created[gte]=${Math.floor(start.getTime() / 1000)}${after ? "&starting_after=" + after : ""}`;
    const r = await fetch(u, { headers: { authorization: "Bearer " + env.STRIPE_SECRET_KEY } });
    const o = await r.json(); if (!r.ok) throw new Error("Stripe: " + ((o.error && o.error.message) || r.status));
    out.push(...o.data.filter(s => s.payment_status === "paid"));
    if (!o.has_more || !o.data.length) break; after = o.data[o.data.length - 1].id;
  }
  const byCur = {};
  out.forEach(s => { const c = (s.currency || "").toUpperCase(); byCur[c] = (byCur[c] || 0) + (s.amount_total || 0) / 100; });
  return {
    count: out.length, byCur, test: /^sk_test_/.test(env.STRIPE_SECRET_KEY),
    recent: out.slice(0, 10).map(s => ({ at: new Date(s.created * 1000).toISOString(), amount: (s.amount_total || 0) / 100, cur: (s.currency || "").toUpperCase(), title: (s.metadata && s.metadata.title) || "", kind: (s.metadata && s.metadata.kind) || "" })),
  };
}
