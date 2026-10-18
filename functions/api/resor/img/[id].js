/* GET /api/resor/img/<id> – visar en uppladdad bild. */
export async function onRequestGet({ params, env }) {
  if (!env.RESOR || !/^[0-9a-f]{24}$/.test(params.id || "")) return new Response("Not found", { status: 404 });
  const { value, metadata } = await env.RESOR.getWithMetadata("img:" + params.id, "arrayBuffer");
  if (!value) return new Response("Not found", { status: 404 });
  return new Response(value, { headers: { "content-type": (metadata && metadata.type) || "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } });
}
