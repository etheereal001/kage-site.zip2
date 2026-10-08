'use strict';
/* ================================================================
   Sunucu katmanı — Cloudflare Pages Functions + D1 ile konuşur
   Paylaşılan içerik: katalog düzenlemeleri, yorumlar, destek talepleri
   ================================================================ */
let ADMIN_TOKEN = null;

const Remote = (() => {
  const BASE = ((window.KAGE_CONFIG||{}).apiBase || '/api').replace(/\/$/,'');
  const KEY_ADMIN = 'kage.admin.v1';
  let queue = Promise.resolve();

  async function req(method, path, body, opt){
    opt = opt || {};
    const headers = {};
    if(body !== undefined) headers['Content-Type'] = 'application/json';
    if(opt.admin && ADMIN_TOKEN) headers['Authorization'] = 'Bearer ' + ADMIN_TOKEN;
    if(opt.owner) headers['X-Owner'] = opt.owner;
    let res;
    try{
      res = await fetch(BASE + path, { method, headers, cache:'no-store', body: body===undefined ? undefined : JSON.stringify(body) });
    }catch(e){ throw new Error('Sunucuya ulaşılamadı.'); }
    let data = null;
    try{ data = await res.json(); }catch(e){}
    if(!res.ok){
      if(res.status===401 && opt.admin) setAdmin(null);
      throw new Error((data && data.error) || ('Sunucu hatası ('+res.status+')'));
    }
    return data || {};
  }
  const warn = msg => { try{ toast(msg,'warn','Sunucu'); }catch(e){} };

  /* ---- yönetici oturumu ---- */
  function setAdmin(token){
    ADMIN_TOKEN = token || null;
    try{ token ? localStorage.setItem(KEY_ADMIN, token) : localStorage.removeItem(KEY_ADMIN); }catch(e){}
  }
  function restoreAdmin(){
    let t=null; try{ t = localStorage.getItem(KEY_ADMIN); }catch(e){}
    const exp = t ? Number(String(t).split('.')[0]) : 0;
    ADMIN_TOKEN = (t && exp > Date.now()) ? t : null;
    if(t && !ADMIN_TOKEN) setAdmin(null);
  }
  async function adminLogin(password){
    const r = await req('POST', '/admin/login', { password });
    setAdmin(r.token);
    await sync();
    return true;
  }
  function adminLogout(){
    setAdmin(null);
    DB.tickets = DB.tickets.filter(t=>DB.myTicketIds.includes(t.id));
    save();
  }

  /* ---- içerik eşitleme ---- */
  const snapshot = () => JSON.stringify([DB.custom, DB.overrides, DB.deleted, DB.extraEps, DB.genres, DB.comments, DB.tickets, !!ADMIN_TOKEN]);

  async function sync(){
    const before = snapshot();
    try{
      const site = await req('GET', '/site');
      const c = site.content || {};
      DB.custom    = Array.isArray(c.custom) ? c.custom : [];
      DB.overrides = (c.overrides && typeof c.overrides==='object') ? c.overrides : {};
      DB.deleted   = Array.isArray(c.deleted) ? c.deleted : [];
      DB.extraEps  = (c.extraEps && typeof c.extraEps==='object') ? c.extraEps : {};
      DB.genres    = (Array.isArray(c.genres) && c.genres.length) ? c.genres : GENRES.slice();
      DB.comments  = Array.isArray(site.comments) ? site.comments : [];
    }catch(e){ return false; }          /* çevrimdışı: önbellekle devam */
    if(ADMIN_TOKEN){
      try{ DB.tickets = (await req('GET', '/tickets', undefined, {admin:true})).tickets || []; }catch(e){}
    } else {
      await refreshMyTickets();
    }
    save();
    return snapshot() !== before;
  }
  async function refreshMyTickets(){
    if(ADMIN_TOKEN || !DB.myTicketIds.length) return false;
    try{
      const r = await req('GET', '/tickets/mine?ids=' + encodeURIComponent(DB.myTicketIds.slice(-20).join(',')));
      DB.tickets = r.tickets || []; save(); return true;
    }catch(e){ return false; }
  }

  /* ---- yönetici: içerik yazma (sıraya alınır, son durum gönderilir) ---- */
  function pushContent(){
    queue = queue.then(() => req('PUT', '/content', {
      custom: DB.custom, overrides: DB.overrides, deleted: DB.deleted, extraEps: DB.extraEps, genres: DB.genres
    }, {admin:true})).catch(e => { warn('Değişiklik sunucuya kaydedilemedi: ' + e.message); if(!ADMIN_TOKEN) render(); });
    return queue;
  }

  /* ---- yorumlar ---- */
  async function postComment(c, user){
    try{
      await req('POST', '/comments', { id:c.id, key:c.key, userId:c.userId, userName:c.userName, text:c.text, spoiler:!!c.spoiler, owner:user.secret });
    }catch(e){
      DB.comments = DB.comments.filter(x=>x.id!==c.id); save();
      warn('Yorum gönderilemedi: ' + e.message); render();
    }
  }
  function ownerFor(commentId){
    const c = DB.comments.find(x=>x.id===commentId), u = me();
    return (c && u && c.userId===u.id) ? u.secret : undefined;
  }
  async function deleteComment(id, owner){
    try{ await req('DELETE', '/comments/' + encodeURIComponent(id), undefined, {admin:true, owner}); }
    catch(e){ warn('Yorum sunucudan silinemedi: ' + e.message); }
  }
  function likeComment(id, userId){ req('POST', '/comments/' + encodeURIComponent(id) + '/like', { userId }).catch(()=>{}); }

  /* ---- destek talepleri ---- */
  async function postTicket(data){ return (await req('POST', '/tickets', data)).ticket; }
  function patchTicket(id, patch){ return req('PATCH', '/tickets/' + encodeURIComponent(id), patch, {admin:true}).catch(e=>warn('Talep güncellenemedi: ' + e.message)); }
  function deleteTicket(id){ return req('DELETE', '/tickets/' + encodeURIComponent(id), undefined, {admin:true}).catch(e=>warn('Talep silinemedi: ' + e.message)); }

  return { req, sync, refreshMyTickets, pushContent, postComment, ownerFor, deleteComment, likeComment,
           postTicket, patchTicket, deleteTicket, adminLogin, adminLogout, restoreAdmin };
})();
