'use strict';
/* ---------------- Oynatıcı ---------------- */
const PV = { mode:'sim', playing:false, cur:0, dur:0, vol:1, muted:false, cc:'tr', quality:'1080p', autoplay:true, sim:false, raf:null, last:0, anime:null, s:1, e:1, eps:[], savedAt:0 };

function initPlayer(a, sNo, ep, eps){
  const video=$('#pv'); const player=$('#player');
  if(!video||!player) return;
  PV.anime=a; PV.s=sNo; PV.e=ep.no; PV.eps=eps;
  PV.playing=false; PV.cur=0; PV.dur=ep.dur; PV.mode='sim'; PV.sim=false; PV.quality='1080p';
  const h=DB.history[a.id+':'+sNo+':'+ep.no];
  if(h && h.t < (h.d||ep.dur)-8 && h.t>5){ PV.cur=h.t; showPVToast('Kaldığın yerden devam ediliyor · '+fmtTime(h.t)); }
  video.volume=PV.vol; video.muted=false;

  /* Lisanslı/demo video kaynağını dene; erişilemezse simülasyon moduna geç */
  try{ video.src=DEMO_VIDEO; video.load(); }catch(e){ enableSim(); }
  video.addEventListener('loadedmetadata',()=>{
    if(video.duration && isFinite(video.duration) && video.duration>1){
      PV.mode='video'; PV.sim=false; PV.dur=video.duration; $('#pvArt').style.display='none';
      if(PV.cur>0){ try{ video.currentTime=PV.cur; }catch(e){} }
      paint();
    } else enableSim();
  },{once:true});
  video.addEventListener('error',()=>enableSim(),{once:true});
  video.addEventListener('ended',()=>onEnded());
  video.addEventListener('progress',()=>{ if(PV.mode==='video'&&video.buffered.length){
    const b=video.buffered.end(video.buffered.length-1); $('#pvBuf').style.width=Math.min(100,(b/PV.dur*100))+'%'; } });
  setTimeout(()=>{ if(PV.mode!=='video') enableSim(); }, 2600);
  PV.sim=true; /* simülasyon zamanlayıcısı her durumda çalışır (video modunda zaman video'dan okunur) */

  /* Kontroller */
  const seek=$('#pvSeek');
  const seekTo=(clientX)=>{
    const r=seek.getBoundingClientRect();
    const ratio=Math.min(1,Math.max(0,(clientX-r.left)/r.width));
    PV.cur=ratio*PV.dur;
    if(PV.mode==='video'&&!PV.sim){ try{ video.currentTime=PV.cur; }catch(e){} }
    paint(); saveProgress();
  };
  let dragging=false;
  seek.addEventListener('pointerdown',e=>{ dragging=true; seek.setPointerCapture(e.pointerId); seekTo(e.clientX); });
  seek.addEventListener('pointermove',e=>{ if(dragging) seekTo(e.clientX); });
  seek.addEventListener('pointerup',e=>{ dragging=false; });
  player.addEventListener('click',e=>{ if(e.target.closest('.pv-ctrl')||e.target.closest('.pv-sub')||e.target.closest('[data-act]')) return; togglePlay(); });
  const vol=$('#pvVol');
  vol.addEventListener('input',()=>{ PV.vol=Number(vol.value); video.volume=PV.vol; PV.muted=PV.vol===0; video.muted=PV.muted; updateVolUI(); });

  /* Klavye kısayolları */
  if(window.__pvKeys) document.removeEventListener('keydown', window.__pvKeys);
  window.__pvKeys=(e)=>{
    if(!document.getElementById('player')) return;
    const tag=(e.target.tagName||'').toLowerCase();
    if(tag==='input'||tag==='textarea'||tag==='select') return;
    if(e.code==='Space'){ e.preventDefault(); togglePlay(); }
    else if(e.key==='ArrowRight'){ PV.cur=Math.min(PV.dur,PV.cur+10); syncVideo(); paint(); e.preventDefault(); }
    else if(e.key==='ArrowLeft'){ PV.cur=Math.max(0,PV.cur-10); syncVideo(); paint(); e.preventDefault(); }
    else if(e.key==='ArrowUp'){ PV.vol=Math.min(1,PV.vol+.1); vol.value=PV.vol; video.volume=PV.vol; updateVolUI(); e.preventDefault(); }
    else if(e.key==='ArrowDown'){ PV.vol=Math.max(0,PV.vol-.1); vol.value=PV.vol; video.volume=PV.vol; updateVolUI(); e.preventDefault(); }
    else if(e.key.toLowerCase()==='f'){ toggleFull(); }
    else if(e.key.toLowerCase()==='m'){ PV.muted=!PV.muted; video.muted=PV.muted; updateVolUI(); }
  };
  document.addEventListener('keydown', window.__pvKeys);

  /* Oynatıcı butonları (delege) */
  const act=(sel,fn)=>{ const el=$(sel); if(el) el.addEventListener('click',fn); };
  act('[data-act="pv-toggle"]',togglePlay);
  act('[data-act="pv-prev"]',()=>{ if(window.__pvPrev) location.hash=window.__pvPrev; else toast('Bu ilk bölüm.','warn'); });
  act('[data-act="pv-next"]',()=>{ if(window.__pvNext) location.hash=window.__pvNext; else toast('Sonraki bölüm bulunmuyor.','warn'); });
  act('[data-act="pv-mute"]',()=>{ PV.muted=!PV.muted; video.muted=PV.muted; if(!PV.muted&&PV.vol===0){PV.vol=1;vol.value=1;video.volume=1;} updateVolUI(); });
  act('[data-act="pv-full"]',toggleFull);
  act('[data-act="pv-cc"]',()=>{ PV.cc = PV.cc==='tr'?'en':PV.cc==='en'?'off':'tr'; updateCCUI(); showPVToast('Altyazı: '+(PV.cc==='tr'?'Türkçe':PV.cc==='en'?'İngilizce':'Kapalı')); });
  act('[data-act="pv-autoplay"]',()=>{ PV.autoplay=!PV.autoplay; const b=$('#pvAutoBtn'); b.classList.toggle('on',PV.autoplay); b.textContent = PV.autoplay? '⏭ OTO AÇIK':'⏭ OTO KAPALI'; showPVToast('Otomatik sonraki bölüm: '+(PV.autoplay?'Açık':'Kapalı')); });

  const qmenu=$('#pvQualMenu');
  act('[data-act="pv-menu"]',(e)=>{ const btn=e.currentTarget; const m=btn.dataset.menu? $('#'+btn.dataset.menu) : qmenu; document.querySelectorAll('.pv-menu').forEach(x=>{ if(x!==m) x.classList.remove('show'); }); m.classList.toggle('show'); });
  document.querySelectorAll('[data-act="pv-set-quality"]').forEach(b=>b.addEventListener('click',()=>{
    PV.quality=b.dataset.q; qmenu.classList.remove('show');
    document.querySelectorAll('#pvQualMenu button').forEach(x=>x.classList.toggle('on',x.dataset.q===PV.quality));
    $('#pvQualBtn').textContent='⚙ '+PV.quality; $('#pvBadge').textContent='KALİTE: '+PV.quality;
    if(PV.mode==='video'&&!PV.sim){ const t=PV.cur; try{ video.load(); video.currentTime=t; if(PV.playing) video.play().catch(()=>{}); }catch(e){} }
    showPVToast('Kalite değiştirildi: '+PV.quality);
  }));
  document.querySelectorAll('[data-act="pv-set-cc"]').forEach(b=>b.addEventListener('click',()=>{
    PV.cc=b.dataset.v; updateCCUI(); $('#pvSubMenu').classList.remove('show');
    showPVToast('Altyazı: '+(PV.cc==='tr'?'Türkçe':PV.cc==='en'?'İngilizce':'Kapalı'));
  }));
  act('[data-act="pv-set-cc"]',()=>{});

  /* İlk boya */
  $('#pvSub').innerHTML=''; $('#pvAutoBtn').classList.add('on'); $('#pvAutoBtn').textContent='⏭ OTO AÇIK';
  updateCCUI(); updateVolUI(); paint();

  /* Zamanlayıcı */
  PV.last=performance.now();
  const tick=(now)=>{
    const dt=(now-PV.last)/1000; PV.last=now;
    if(PV.playing){
      if(PV.mode==='video' && !PV.sim){
        PV.cur=video.currentTime;
        if(video.duration&&isFinite(video.duration)) PV.dur=video.duration;
      } else {
        PV.cur=Math.min(PV.dur, PV.cur + dt);
        if(PV.cur>=PV.dur) onEnded();
      }
      paint();
      if(Date.now()-PV.savedAt>5000){ saveProgress(); PV.savedAt=Date.now(); }
    }
    PV.raf=requestAnimationFrame(tick);
  };
  cancelAnimationFrame(PV.raf); PV.raf=requestAnimationFrame(tick);

  /* Önceki/sonraki bağlantıları */
  const prev=eps.find(x=>x.no===ep.no-1), next=eps.find(x=>x.no===ep.no+1);
  window.__pvPrev = prev? '#/izle/'+a.id+'/'+sNo+'/'+prev.no : null;
  window.__pvNext = next? '#/izle/'+a.id+'/'+sNo+'/'+next.no : null;
  window.__pvNextEp = next? {s:sNo, e:next.no} : null;
  $('#watchSeason').addEventListener('change',function(){ location.hash='#/izle/'+a.id+'/'+this.value+'/1'; });
  document.getElementById('pvSubMenu').style.right='0';
}
function enableSim(){
  PV.sim=true; PV.mode='sim';
  const art=$('#pvArt'); if(art) art.style.display='';
  const v=$('#pv'); if(v){ try{ v.style.display='none'; }catch(e){} }
}
function syncVideo(){
  const v=$('#pv');
  if(PV.mode==='video'&&!PV.sim&&v){ try{ v.currentTime=PV.cur; }catch(e){} }
}
function togglePlay(){
  const v=$('#pv'); const player=$('#player'); const art=$('#pvArt');
  PV.playing=!PV.playing;
  player.classList.toggle('playing',PV.playing);
  const btn=$('#pvPlayBtn'); if(btn) btn.textContent = PV.playing? '❚❚':'▶';
  const big=$('#pvCenter'); if(big) big.style.display = PV.playing? 'none':'grid';
  if(art && PV.mode==='sim') art.style.display='';
  if(v && PV.mode==='video' && !PV.sim){
    if(PV.playing){ v.play().catch(()=>{ enableSim(); }); } else { v.pause(); }
  }
  if(PV.playing) saveProgress();
  paint();
}
function onEnded(){
  PV.playing=false;
  paint();
  saveProgress(true);
  if(PV.autoplay && window.__pvNextEp){
    showPVToast('Sonraki bölüme geçiliyor...');
    setTimeout(()=>{ location.hash='#/izle/'+PV.anime.id+'/'+window.__pvNextEp.s+'/'+window.__pvNextEp.e; }, 1400);
  } else {
    showPVToast('Bölüm tamamlandı.');
  }
}
function saveProgress(force){
  if(!PV.anime) return;
  API.saveProgress(PV.anime.id, PV.s, PV.e, PV.cur, PV.dur);
  if(force || PV.cur>PV.dur*0.9){
    const bar=document.querySelector('.ep-item.playing');
    if(bar && PV.cur>PV.dur*0.9) bar.classList.add('watched');
  }
}
function paint(){
  const pct = PV.dur? Math.min(100, PV.cur/PV.dur*100) : 0;
  const play=$('#pvPlay'); if(play) play.style.width=pct+'%';
  const t=$('#pvTime'); if(t) t.textContent=fmtTime(PV.cur)+' / '+fmtTime(PV.dur);
  const sub=$('#pvSub');
  if(sub){
    if(PV.cc==='off'){ sub.innerHTML=''; }
    else{
      const total=SUB_LINES.length;
      const idx=Math.floor(PV.cur/7)%total;
      const line=SUB_LINES[idx];
      const tr = PV.cc==='tr';
      sub.innerHTML = PV.playing? '<span>'+(tr?esc(line):esc(translateDemo(idx)))+'</span>' : '';
    }
  }
}
function translateDemo(i){
  const en=['Nobody tells the truth in this city.','I have to make a choice... and it scares me.',
  'If you have power, you must use it to protect.','We already crossed the point of no return.',
  'As long as I am breathing, I will keep fighting.','I will never get back what I lost that day.',
  'Even shadows will meet the light one day.'];
  return en[i%en.length];
}
function showPVToast(msg){
  const t=$('#pvToast'); if(!t) return;
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2200);
}
function updateVolUI(){
  const b=$('#pvMuteBtn'); if(!b) return;
  b.textContent = PV.muted||PV.vol===0? '🔇' : PV.vol<.5? '🔉':'🔊';
}
function updateCCUI(){
  const b=$('#pvCCBtn'); if(b) b.textContent='CC · '+(PV.cc==='tr'?'TR':PV.cc==='en'?'EN':'OFF');
  b && b.classList.toggle('on', PV.cc!=='off');
  ['tr','en','off'].forEach(v=>{ const el=$('#ccOpt-'+v); if(el) el.querySelector('span').textContent = PV.cc===v? '✓':''; });
}
function toggleFull(){
  const p=$('#player'); if(!p) return;
  if(!document.fullscreenElement){ (p.requestFullscreen||p.webkitRequestFullscreen||function(){}).call(p); }
  else { (document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document); }
}

