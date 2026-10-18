/* GET  /api/resor          alla publicerade reseförslag (ägaren ser även utkast)
   GET  /api/resor?auth=1   kontrollerar lösenordet (header x-owner-key)
   POST /api/resor          { action: "save", trip } | { action: "delete", id } | { action: "hide", id, on }  – bara ägaren */
import { json, isOwner, noKV, load } from "./_lib.js";

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url), owner = await isOwner(request, env);
  if (u.searchParams.has("auth")) return json({ ok: owner, kv: !!env.RESOR });
  if (!env.RESOR) return noKV();
  const d = await load(env);
  const trips = Object.values(d.trips || {}).filter(t => owner || !t.draft);
  return json({ kv: true, trips, hidden: d.hidden || [] }, 200, owner ? "no-store" : "public, max-age=60");
}

const ID = /^[a-z0-9][a-z0-9-]{2,80}$/;
export async function onRequestPost({ request, env }) {
  if (!(await isOwner(request, env))) return json({ error: "Fel lösenord." }, 401);
  if (!env.RESOR) return noKV();
  let b; try { b = await request.json(); } catch (e) { return json({ error: "Ogiltig JSON." }, 400); }
  const d = await load(env); d.trips = d.trips || {}; d.hidden = d.hidden || [];
  if (b.action === "save") {
    const t = b.trip || {};
    if (!ID.test(t.id || "")) return json({ error: "Ogiltigt id (små bokstäver, siffror och bindestreck)." }, 400);
    if (!t.title) return json({ error: "Titel saknas." }, 400);
    if (JSON.stringify(t).length > 200000) return json({ error: "Reseförslaget är för stort." }, 413);
    t.updated = new Date().toISOString(); t.created = (d.trips[t.id] && d.trips[t.id].created) || t.created || t.updated;
    d.trips[t.id] = t;
  } else if (b.action === "delete") {
    delete d.trips[b.id];
  } else if (b.action === "hide") {
    d.hidden = d.hidden.filter(x => x !== b.id); if (b.on) d.hidden.push(b.id);
  } else return json({ error: "Okänd åtgärd." }, 400);
  await env.RESOR.put("data", JSON.stringify(d));
  return json({ ok: true, trips: Object.values(d.trips), hidden: d.hidden });
}
