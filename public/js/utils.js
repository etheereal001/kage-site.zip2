'use strict';
/* ---------------- Yardımcılar ---------------- */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const uid = p => (p||'id')+'-'+Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);
const hsh = s => { let h=5381; for(const ch of 'kage$'+s){ h=((h<<5)+h)^ch.charCodeAt(0); h|=0; } return 'h'+(h>>>0).toString(36); };
const hashNum = s => { let h=2166136261; for(const ch of String(s)) h=(h^ch.charCodeAt(0))*16777619>>>0; return h; };
const fmtTime = s => { s=Math.max(0,Math.floor(s||0)); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60;
  return (h?h+':'+String(m).padStart(2,'0'):String(m)) + ':' + String(x).padStart(2,'0'); };
const fmtDate = d => new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',year:'numeric'}).format(d);
const timeAgo = ts => { const d=Date.now()-ts, m=Math.floor(d/60000);
  if(m<1) return 'az önce'; if(m<60) return m+' dk önce';
  const h=Math.floor(m/60); if(h<24) return h+' saat önce';
  const dd=Math.floor(h/24); if(dd<30) return dd+' gün önce';
  return fmtDate(new Date(ts)); };

