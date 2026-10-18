/* POST /api/resor/img – ägaren laddar upp en bild (jpeg, png eller webp, högst 5 MB). Svarar { src: "/api/resor/img/<id>" }. */
import { json, isOwner, noKV } from "../_lib.js";
const TYPES = ["image/jpeg", "image/png", "image/webp"];
export async function onRequestPost({ request, env }) {
  if (!(await isOwner(request, env))) return json({ error: "Fel lösenord." }, 401);
  if (!env.RESOR) return noKV();
  const type = (request.headers.get("content-type") || "").split(";")[0].trim();
  if (!TYPES.includes(type)) return json({ error: "Bara JPEG, PNG eller WebP." }, 415);
  const buf = await request.arrayBuffer();
  if (!buf.byteLength || buf.byteLength > 5 * 1024 * 1024) return json({ error: "Bilden måste vara mindre än 5 MB." }, 413);
  const id = [...crypto.getRandomValues(new Uint8Array(12))].map(x => x.toString(16).padStart(2, "0")).join("");
  await env.RESOR.put("img:" + id, buf, { metadata: { type, size: buf.byteLength, at: new Date().toISOString() } });
  return json({ src: "/api/resor/img/" + id });
}
