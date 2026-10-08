import test from 'node:test';
import assert from 'node:assert/strict';
import { createD1 } from '../scripts/d1-sqlite.mjs';
import { onRequest } from '../functions/api/[[path]].js';

const env = { DB: createD1(':memory:'), ADMIN_PASSWORD: 'sifre-123', TOKEN_SECRET: 'test-anahtari-en-az-16-karakter' };
let n = 0;
async function call(method, path, body, headers = {}){
  const h = { 'CF-Connecting-IP': '10.0.0.' + (++n), ...headers };   // her çağrı farklı IP: hız sınırı testleri dışında
  if (body !== undefined) h['Content-Type'] = 'application/json';
  const r = await onRequest({ request: new Request('http://x' + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }), env });
  return { status: r.status, data: await r.json().catch(() => null) };
}
const content = { custom: [{ id: 'an-1', title: 'Test' }], overrides: {}, deleted: ['aot'], extraEps: {}, genres: ['Aksiyon'] };

test('yönetici girişi: yanlış parola reddedilir, doğru parola token verir', async () => {
  assert.equal((await call('POST', '/api/admin/login', { password: 'yanlis' })).status, 401);
  const ok = await call('POST', '/api/admin/login', { password: 'sifre-123' });
  assert.equal(ok.status, 200); assert.match(ok.data.token, /^\d+\.[\w-]+$/);
  env.token = ok.data.token;
});

test('içerik yazma yönetici gerektirir; okuma herkese açık', async () => {
  assert.equal((await call('PUT', '/api/content', content)).status, 401);
  assert.equal((await call('PUT', '/api/content', content, { Authorization: 'Bearer 1.sahte' })).status, 401);
  assert.equal((await call('PUT', '/api/content', content, { Authorization: 'Bearer ' + env.token })).status, 200);
  const site = await call('GET', '/api/site');
  assert.equal(site.data.content.custom[0].title, 'Test');
  assert.deepEqual(site.data.content.deleted, ['aot']);
});

test('süresi dolmuş / kurcalanmış token reddedilir', async () => {
  const [, sig] = env.token.split('.');
  assert.equal((await call('GET', '/api/admin/me', undefined, { Authorization: 'Bearer ' + (Date.now() + 1e9) + '.' + sig })).status, 401);
  assert.equal((await call('GET', '/api/admin/me', undefined, { Authorization: 'Bearer ' + (Date.now() - 1000) + '.' + sig })).status, 401);
});

test('yorum: ekle, beğen, sahibi siler, başkası silemez, yönetici siler', async () => {
  const c = { id: 'c-abc123def', key: 'aot', userId: 'u-1', userName: 'Sora', text: 'Harika bölüm', spoiler: false, owner: 'gizli-anahtar-1' };
  assert.equal((await call('POST', '/api/comments', c)).status, 201);
  assert.equal((await call('POST', '/api/comments', c)).status, 409);
  assert.equal((await call('POST', '/api/comments', { ...c, id: 'c-zzz999aaa', text: 'x' })).status, 400);
  const like = await call('POST', '/api/comments/c-abc123def/like', { userId: 'u-2' });
  assert.deepEqual(like.data.likes, ['u-2']);
  assert.equal((await call('GET', '/api/site')).data.comments[0].likes.length, 1);
  assert.equal((await call('DELETE', '/api/comments/c-abc123def', undefined, { 'X-Owner': 'baska-anahtar-99' })).status, 403);
  assert.equal((await call('DELETE', '/api/comments/c-abc123def')).status, 403);
  assert.equal((await call('DELETE', '/api/comments/c-abc123def', undefined, { 'X-Owner': 'gizli-anahtar-1' })).status, 200);
  assert.equal((await call('GET', '/api/site')).data.comments.length, 0);
  await call('POST', '/api/comments', { ...c, id: 'c-second0001' });
  assert.equal((await call('DELETE', '/api/comments/c-second0001', undefined, { Authorization: 'Bearer ' + env.token })).status, 200);
});

test('yorum alanı doğrulaması (anahtar biçimi, uzunluk)', async () => {
  const base = { id: 'c-valid00001', key: 'aot', userId: 'u', userName: 'A', text: 'merhaba', owner: 'gizli-anahtar-1' };
  assert.equal((await call('POST', '/api/comments', { ...base, key: "x'; DROP TABLE comments;--" })).status, 400);
  assert.equal((await call('POST', '/api/comments', { ...base, text: 'a'.repeat(801) })).status, 400);
  assert.equal((await call('POST', '/api/comments', { ...base, owner: 'kisa' })).status, 400);
});

test('destek talebi: oluştur, "benimkiler" ile oku, yönetici yanıtlar/siler', async () => {
  const t = await call('POST', '/api/tickets', { name: 'Ali', email: 'ali@ornek.com', category: 'Oynatıcı', subject: 'Sorun var', message: 'Video açılmıyor, yardım eder misiniz?' });
  assert.equal(t.status, 201); const id = t.data.ticket.id;
  assert.equal((await call('GET', '/api/tickets')).status, 401);
  assert.equal((await call('GET', '/api/tickets/mine?ids=' + id)).data.tickets.length, 1);
  assert.equal((await call('GET', '/api/tickets/mine?ids=t-000000000000000000aa')).data.tickets.length, 0);
  const A = { Authorization: 'Bearer ' + env.token };
  assert.equal((await call('GET', '/api/tickets', undefined, A)).data.tickets.length, 1);
  assert.equal((await call('PATCH', '/api/tickets/' + id, { status: 'Yanıtlandı', reply: { by: 'Yönetim', text: 'Çözüldü' } }, A)).status, 200);
  const mine = (await call('GET', '/api/tickets/mine?ids=' + id)).data.tickets[0];
  assert.equal(mine.status, 'Yanıtlandı'); assert.equal(mine.replies[0].text, 'Çözüldü');
  assert.equal((await call('PATCH', '/api/tickets/' + id, { status: 'Hack' }, A)).status, 400);
  assert.equal((await call('DELETE', '/api/tickets/' + id)).status, 401);
  assert.equal((await call('DELETE', '/api/tickets/' + id, undefined, A)).status, 200);
});

test('hız sınırı: aynı IP kısa sürede çok yorum yazamaz, çok parola deneyemez', async () => {
  const ip = { 'CF-Connecting-IP': '203.0.113.9' };
  const mk = i => ({ id: 'c-rate' + String(i).padStart(5, '0'), key: 'aot', userId: 'u', userName: 'A', text: 'merhaba', owner: 'gizli-anahtar-1' });
  const codes = [];
  for (let i = 0; i < 8; i++) codes.push((await call('POST', '/api/comments', mk(i), ip)).status);
  assert.equal(codes.filter(c => c === 201).length, 6); assert.equal(codes.at(-1), 429);
  const l = [];
  for (let i = 0; i < 10; i++) l.push((await call('POST', '/api/admin/login', { password: 'x' }, { 'CF-Connecting-IP': '203.0.113.77' })).status);
  assert.equal(l.filter(c => c === 401).length, 8); assert.equal(l.at(-1), 429);
});

test('bilinmeyen uç ve eksik yapılandırma anlamlı hata verir', async () => {
  assert.equal((await call('GET', '/api/yok')).status, 404);
  const r = await onRequest({ request: new Request('http://x/api/site'), env: {} });
  assert.equal(r.status, 500);
});
