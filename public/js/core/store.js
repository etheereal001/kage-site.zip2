'use strict';
/* ================================================================
   Yerel depo (localStorage)
   - Kişisel veriler: hesap profili, favoriler, liste, puan, geçmiş
   - Sunucudan gelen paylaşılan içeriğin (katalog, yorum, talep) önbelleği
   Paylaşılan içeriğin asıl kaynağı sunucudur (bkz. core/remote.js).
   ================================================================ */
const KEY_DB='kage.db.v3', KEY_S='kage.session.v3';
let DB = null, SESSION = null;

function freshDB(){
  return {
    /* kişisel (bu tarayıcıya özel) */
    users: [], favs: {}, lists: {}, ratings: {}, history: {}, progress: {}, views: {}, myTicketIds: [],
    /* sunucudan gelen paylaşılan içerik (önbellek) */
    comments: [], tickets: [],
    overrides: {}, custom: [], deleted: [], extraEps: {},
    genres: GENRES.slice()
  };
}
function save(){ try{ localStorage.setItem(KEY_DB, JSON.stringify(DB)); }catch(e){ console.warn('Kayıt hatası', e); } }
function loadDB(){
  let d=null;
  try{ const raw=localStorage.getItem(KEY_DB); if(raw) d=JSON.parse(raw); }catch(e){ d=null; }
  const base = freshDB();
  if(!d || typeof d!=='object') d = base;
  for(const k of Object.keys(base)) if(d[k]===undefined) d[k]=base[k];
  DB = d;
  save();
}
function setSession(id){ SESSION=id; try{ id?localStorage.setItem(KEY_S,id):localStorage.removeItem(KEY_S); }catch(e){} }
function me(){ return SESSION ? (DB.users.find(u=>u.id===SESSION) || null) : null; }
