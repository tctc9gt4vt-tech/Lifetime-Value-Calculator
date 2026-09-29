// The team's PULSE standard: GET returns the latest, PUT replaces it. Both need the team password (the TEAM_PASSWORD
// environment variable). The standard arrives already encrypted with that password in the browser, and is kept in a
// private Vercel Blob store, so neither the store nor the repository holds readable PULSE data.
import { put, get } from '@vercel/blob';
import { createHash, timingSafeEqual } from 'node:crypto';

const PATH = 'pulse-standard/current.json';
const hash = (v) => createHash('sha256').update(String(v)).digest();
const same = (a, b) => timingSafeEqual(hash(a), hash(b));
const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
});

export default async function handler(request) {
  const pw = process.env.TEAM_PASSWORD;
  if (!pw) return json({ error: 'password_not_set' }, 503);
  if (!same(request.headers.get('x-team-password') || '', pw)) return json({ error: 'wrong_password' }, 403);
  try {
    if (request.method === 'GET') {
      let r;
      try { r = await get(PATH, { access: 'private', useCache: false }); }
      catch (e) { if (/not.?found/i.test(`${e && e.name} ${e && e.message}`)) return json({ error: 'none' }, 404); throw e; }
      if (!r || r.statusCode !== 200) return json({ error: 'none' }, 404);
      return new Response(r.stream, { headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' } });
    }
    if (request.method === 'PUT') {
      const body = await request.text();
      if (body.length > 4000000) return json({ error: 'too_large' }, 413);
      let o; try { o = JSON.parse(body); } catch { return json({ error: 'bad_json' }, 400); }
      if (!o || o.enc !== 1 || !o.salt || !o.iv || !o.data) return json({ error: 'bad_payload' }, 400);
      await put(PATH, body, { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true });
      // keep every past standard too, in case one needs restoring
      await put(`pulse-standard/history/${Date.now()}.json`, body, { access: 'private', contentType: 'application/json', addRandomSuffix: false });
      return json({ ok: true });
    }
    return json({ error: 'method_not_allowed' }, 405);
  } catch (e) {
    const msg = String((e && e.message) || e);
    if (/token|store|blob|credential|oidc|unauthori[sz]ed/i.test(msg)) return json({ error: 'storage_not_set_up', detail: msg.slice(0, 200) }, 503);
    return json({ error: 'server_error', detail: msg.slice(0, 200) }, 500);
  }
}
