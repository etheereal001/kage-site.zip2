/* ================================================================
   KAGE API — Cloudflare Pages Functions + D1
   Tüm /api/* istekleri buraya düşer.

   Ortam değişkenleri (Cloudflare panelinde "Secret" olarak ekle):
     ADMIN_PASSWORD  yönetici parolası
     TOKEN_SECRET    en az 16 karakterlik rastgele metin (oturum imzası)
     ALLOWED_ORIGIN  (opsiyonel) arayüz başka alan adındaysa o adres
   Bağlantı: D1 veritabanı "DB"
   ================================================================ */
const enc = new TextEncoder();

class HttpError extends Error { constructor(status, msg){ super(msg); this.status = status; } }
const bad = m => new HttpError(400, m);

const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra }
});

/* ---------- kriptografi ---------- */
const b64url = buf => {
  let s = ''; for (const x of new Uint8Array(buf)) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
async function hmac(secret, msg){
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
async function sha256hex(s){
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)));
  return [...d].map(x => x.toString(16).padStart(2, '0')).join('');
}
function safeEq(a, b){
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}
function secretOf(env){
  if (!env.TOKEN_SECRET || env.TOKEN_SECRET.length < 16) throw new HttpError(500, 'Sunucuda TOKEN_SECRET tanımlı değil (en az 16 karakter).');
  return env.TOKEN_SECRET;
}

/* ---------- yönetici kimliği ---------- */
async function passwordOk(env, given){
  if (!env.ADMIN_PASSWORD) throw new HttpError(500, 'Sunucuda ADMIN_PASSWORD tanımlı değil.');
  const k = secretOf(env);
  return safeEq(await hmac(k, 'pw.' + given), await hmac(k, 'pw.' + env.ADMIN_PASSWORD));
}
async function makeToken(env){
  const exp = Date.now() + 7 * 864e5;
  return exp + '.' + b64url(await hmac(secretOf(env), 'admin.' + exp));
}
async function verifyToken(env, token){
  const [exp, sig] = String(token || '').split('.');
  if (!/^\d{10,16}$/.test(exp || '') || !sig || Number(exp) < Date.now()) return false;
  return safeEq(enc.encode(b64url(await hmac(secretOf(env), 'admin.' + exp))), enc.encode(sig));
}
async function isAdmin(env, request){
  const m = /^Bearer (.+)$/.exec(request.headers.get('Authorization') || '');
  return m ? verifyToken(env, m[1]) : false;
}
async function requireAdmin(env, request){
  if (!(await isAdmin(env, request))) throw new HttpError(401, 'Yönetici girişi gerekli.');
}

/* ---------- yardımcılar ---------- */
const safeJson = (s, d) => { try { return JSON.parse(s); } catch (e) { return d; } };
function str(v, min, max, name){
  if (typeof v !== 'string') throw bad(name + ' gerekli.');
  const s = v.trim();
  if (s.length < min || s.length > max) throw bad(name + ' ' + min + '-' + max + ' karakter olmalı.');
  return s;
}
async function readBody(request){
  const t = await request.text();
  if (t.length > 1_000_000) throw new HttpError(413, 'İstek çok büyük.');
  try { return t ? JSON.parse(t) : {}; } catch (e) { throw bad('Geçersiz JSON.'); }
}
async function throttle(env, request, kind, limit, windowMs){
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'local';
  const h = (await sha256hex(ip + '|' + (env.TOKEN_SECRET || ''))).slice(0, 20);
  const now = Date.now();
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM hits WHERE kind=? AND ip=? AND at>?').bind(kind, h, now - windowMs).first();
  if (row && row.n >= limit) throw new HttpError(429, 'Çok fazla istek. Biraz bekleyip tekrar dene.');
  await env.DB.prepare('INSERT INTO hits(kind,ip,at) VALUES(?,?,?)').bind(kind, h, now).run();
  if (Math.random() < 0.05) await env.DB.prepare('DELETE FROM hits WHERE at<?').bind(now - 864e5).run();
  return h;
}
const commentOut = r => ({ id: r.id, key: r.key, userId: r.user_id, userName: r.user_name, text: r.text,
  spoiler: !!r.spoiler, likes: safeJson(r.likes, []), createdAt: r.created_at });
const ticketOut = r => ({ id: r.id, userId: r.user_id || null, name: r.name, email: r.email, category: r.category,
  subject: r.subject, message: r.message, status: r.status, replies: safeJson(r.replies, []), createdAt: r.created_at });

function cleanContent(d){
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const custom = Array.isArray(d.custom) ? d.custom.filter(isObj).slice(0, 500) : [];
  const deleted = Array.isArray(d.deleted) ? d.deleted.filter(x => typeof x === 'string').slice(0, 2000) : [];
  const genres = Array.isArray(d.genres) ? d.genres.filter(x => typeof x === 'string' && x.length <= 24).slice(0, 60) : [];
  if (!genres.length) throw bad('En az bir tür olmalı.');
  return { custom, deleted, genres,
    overrides: isObj(d.overrides) ? d.overrides : {},
    extraEps: isObj(d.extraEps) ? d.extraEps : {} };
}

function corsHeaders(env, request){
  const o = request.headers.get('Origin');
  if (!env.ALLOWED_ORIGIN || !o || (env.ALLOWED_ORIGIN !== '*' && env.ALLOWED_ORIGIN !== o)) return {};
  return { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN === '*' ? '*' : o, 'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Owner',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
}

/* ---------- yönlendirme ---------- */
async function route(method, p, url, request, env){
  const db = env.DB;
  const [a, b, c] = p;

  if (a === 'health' && method === 'GET') return json({ ok: true });

  /* Herkese açık: katalog düzenlemeleri + yorumlar */
  if (a === 'site' && method === 'GET'){
    const kv = await db.prepare("SELECT v FROM kv WHERE k='content'").first();
    const rows = await db.prepare('SELECT id,key,user_id,user_name,text,spoiler,likes,created_at FROM comments ORDER BY created_at DESC LIMIT 500').all();
    return json({ content: kv ? safeJson(kv.v, null) : null, comments: (rows.results || []).map(commentOut) });
  }

  /* Yönetici girişi */
  if (a === 'admin' && b === 'login' && method === 'POST'){
    await throttle(env, request, 'login', 8, 600000);
    const d = await readBody(request);
    if (!(await passwordOk(env, String(d.password || '')))) throw new HttpError(401, 'Parola hatalı.');
    return json({ token: await makeToken(env) });
  }
  if (a === 'admin' && b === 'me' && method === 'GET'){ await requireAdmin(env, request); return json({ ok: true }); }

  /* Yönetici: katalog içeriğini kaydet */
  if (a === 'content' && method === 'PUT'){
    await requireAdmin(env, request);
    const text = JSON.stringify(cleanContent(await readBody(request)));
    if (text.length > 900000) throw new HttpError(413, 'İçerik çok büyük.');
    await db.prepare("INSERT INTO kv(k,v,updated_at) VALUES('content',?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v, updated_at=excluded.updated_at")
      .bind(text, Date.now()).run();
    return json({ ok: true });
  }

  /* Yorumlar */
  if (a === 'comments'){
    if (!b && method === 'POST'){
      const ip = await throttle(env, request, 'comment', 6, 60000);
      const d = await readBody(request);
      const id = str(d.id, 6, 40, 'id');            if (!/^[a-z]+-[a-z0-9]+$/i.test(id)) throw bad('Geçersiz id.');
      const key = str(d.key, 1, 80, 'key');         if (!/^[A-Za-z0-9_-]+(:\d{1,3}:\d{1,5})?$/.test(key)) throw bad('Geçersiz anahtar.');
      const userId = str(d.userId, 1, 40, 'userId');
      const userName = str(d.userName, 1, 40, 'Ad');
      const text = str(d.text, 2, 800, 'Yorum');
      const owner = str(d.owner, 8, 80, 'owner');
      try {
        await db.prepare('INSERT INTO comments(id,key,user_id,user_name,text,spoiler,likes,created_at,owner_hash,ip) VALUES(?,?,?,?,?,?,?,?,?,?)')
          .bind(id, key, userId, userName, text, d.spoiler ? 1 : 0, '[]', Date.now(), await sha256hex(owner), ip).run();
      } catch (e) { if (/UNIQUE|constraint/i.test(String(e.message))) throw new HttpError(409, 'Bu yorum zaten var.'); throw e; }
      return json({ ok: true }, 201);
    }
    if (b && c === 'like' && method === 'POST'){
      await throttle(env, request, 'like', 60, 60000);
      const d = await readBody(request);
      const who = str(d.userId, 1, 40, 'userId');
      const row = await db.prepare('SELECT likes FROM comments WHERE id=?').bind(b).first();
      if (!row) throw new HttpError(404, 'Yorum bulunamadı.');
      const likes = safeJson(row.likes, []);
      const i = likes.indexOf(who);
      if (i > -1) likes.splice(i, 1); else if (likes.length < 2000) likes.push(who);
      await db.prepare('UPDATE comments SET likes=? WHERE id=?').bind(JSON.stringify(likes), b).run();
      return json({ likes });
    }
    if (b && !c && method === 'DELETE'){
      const row = await db.prepare('SELECT owner_hash FROM comments WHERE id=?').bind(b).first();
      if (!row) return json({ ok: true });
      let allowed = await isAdmin(env, request).catch(() => false);
      if (!allowed){
        const owner = request.headers.get('X-Owner') || '';
        allowed = owner.length >= 8 && (await sha256hex(owner)) === row.owner_hash;
      }
      if (!allowed) throw new HttpError(403, 'Bu yorumu silme yetkin yok.');
      await db.prepare('DELETE FROM comments WHERE id=?').bind(b).run();
      return json({ ok: true });
    }
  }

  /* Destek talepleri */
  if (a === 'tickets'){
    if (!b && method === 'POST'){
      const ip = await throttle(env, request, 'ticket', 3, 600000);
      const d = await readBody(request);
      const name = str(d.name, 2, 40, 'Ad');
      const email = str(d.email, 5, 120, 'E-posta'); if (!/^\S+@\S+\.\S+$/.test(email)) throw bad('Geçerli bir e-posta gir.');
      const category = str(d.category || 'Diğer', 1, 40, 'Kategori');
      const subject = str(d.subject, 3, 80, 'Konu');
      const message = str(d.message, 10, 1000, 'Mesaj');
      const userId = (typeof d.userId === 'string' && d.userId.length <= 40) ? d.userId : null;
      const id = 't-' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);
      const now = Date.now();
      await db.prepare('INSERT INTO tickets(id,user_id,name,email,category,subject,message,status,replies,created_at,ip) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
        .bind(id, userId, name, email, category, subject, message, 'Açık', '[]', now, ip).run();
      return json({ ticket: { id, userId, name, email, category, subject, message, status: 'Açık', replies: [], createdAt: now } }, 201);
    }
    if (b === 'mine' && method === 'GET'){
      const ids = (url.searchParams.get('ids') || '').split(',').filter(x => /^t-[a-f0-9]{20}$/.test(x)).slice(0, 20);
      if (!ids.length) return json({ tickets: [] });
      const rows = await db.prepare('SELECT * FROM tickets WHERE id IN (' + ids.map(() => '?').join(',') + ') ORDER BY created_at DESC').bind(...ids).all();
      return json({ tickets: (rows.results || []).map(ticketOut) });
    }
    if (!b && method === 'GET'){
      await requireAdmin(env, request);
      const rows = await db.prepare('SELECT * FROM tickets ORDER BY created_at DESC LIMIT 300').all();
      return json({ tickets: (rows.results || []).map(ticketOut) });
    }
    if (b && method === 'PATCH'){
      await requireAdmin(env, request);
      const d = await readBody(request);
      const row = await db.prepare('SELECT status, replies FROM tickets WHERE id=?').bind(b).first();
      if (!row) throw new HttpError(404, 'Talep bulunamadı.');
      let status = row.status, replies = safeJson(row.replies, []);
      if (d.status !== undefined){
        if (!['Açık', 'Yanıtlandı', 'Kapalı'].includes(d.status)) throw bad('Geçersiz durum.');
        status = d.status;
      }
      if (d.reply){
        replies.push({ by: str(d.reply.by || 'Yönetim', 1, 40, 'Yanıtlayan'), text: str(d.reply.text, 1, 1000, 'Yanıt'), at: Date.now() });
        replies = replies.slice(-50);
      }
      await db.prepare('UPDATE tickets SET status=?, replies=? WHERE id=?').bind(status, JSON.stringify(replies), b).run();
      return json({ ok: true });
    }
    if (b && method === 'DELETE'){
      await requireAdmin(env, request);
      await db.prepare('DELETE FROM tickets WHERE id=?').bind(b).run();
      return json({ ok: true });
    }
  }

  throw new HttpError(404, 'Bulunamadı.');
}

export async function onRequest({ request, env }){
  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const cors = corsHeaders(env, request);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  try {
    if (!env.DB) throw new HttpError(500, 'D1 bağlantısı (DB) tanımlı değil.');
    const res = await route(request.method, parts, url, request, env);
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    return json({ error: e instanceof HttpError ? e.message : 'Sunucu hatası.' }, e instanceof HttpError ? e.status : 500, cors);
  }
}
