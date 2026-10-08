'use strict';
/* ---------------- Render sonrası davranışlar ---------------- */
function animateReveal(){
  if(revealObserver) revealObserver.disconnect();
  const els=$$('.reveal');
  if(!('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('in')); return; }
  revealObserver=new IntersectionObserver((entries)=>{
    entries.forEach((en,i)=>{ if(en.isIntersecting){ const t=setTimeout(()=>en.target.classList.add('in'), Math.min(i*45,260)); en.target._t=t; revealObserver.unobserve(en.target); } });
  },{rootMargin:'0px 0px -40px 0px', threshold:.06});
  els.forEach(e=>revealObserver.observe(e));
}
function afterRender(view, parts, q){
  /* Hero rotasyonu */
  if(view===''){
    const featured = ['frieren','aot','jjk','demon-slayer'].map(id=>API.get(id)).filter(Boolean);
    let i=0;
    const update = ()=>{
      const a=featured[i];
      $('#heroInfo').innerHTML=heroInfoHTML(a);
      $('#heroPoster').innerHTML=posterHTML(a)+'<div class="float-tag"><b>KAGE Puanı</b><strong class="accent3">★ '+a.rating.toFixed(1)+'</strong></div>';
      const bg=$('#heroBg'); if(bg){ bg.style.setProperty('--c1',a.colors[0]); bg.style.setProperty('--c2',a.colors[1]); }
      $$('#heroDots button').forEach((b,bi)=>b.classList.toggle('on',bi===i));
    };
    window.__heroGo = (n)=>{ i=n; update(); };
    heroTimer=setInterval(()=>{ i=(i+1)%featured.length; update(); }, 7000);
    /* Tür panelleri */
    const chips=$$('#homeGenreChips .chip');
    chips.forEach(c=>c.addEventListener('click',()=>{
      chips.forEach(x=>x.classList.remove('on')); c.classList.add('on');
      const g=c.dataset.genre;
      $('#homeGenreGrid').innerHTML=gridHTML(API.list().filter(a=>a.genres.includes(g)).slice(0,6));
      animateReveal();
    }));
  }

  /* Keşfet: rastgele anime */
  if(view==='kesfet'){
    const btn=$('[data-act="random-anime"]');
    if(btn) btn.addEventListener('click',()=>{
      const all=API.list(); const a=all[Math.floor(Math.random()*all.length)];
      toast('Rastgele seçim: '+a.title,'ok','Keşfet');
      setTimeout(()=>{ location.hash='#/anime/'+a.id; },420);
    });
  }

  /* Katalog filtreleri */
  if(view==='animeler'){
    const inputs=['fQ','fGenre','fYear','fStatus','fRate','fSort'];
    const run=()=>{
      const params={
        q:$('#fQ').value, genre:$('#fGenre').value, year:$('#fYear').value,
        status:$('#fStatus').value, minRating:$('#fRate').value, sort:$('#fSort').value
      };
      const res=API.search(params);
      $('#fCount').textContent = res.length+' anime bulundu';
      $('#fResults').innerHTML = res.length? gridHTML(res) : emptyState('🔍','Sonuç bulunamadı','Filtreleri değiştirerek tekrar deneyebilirsin.','<button class="btn btn-primary" data-act="clear-filters">Filtreleri Temizle</button>');
      animateReveal();
    };
    inputs.forEach(id=>{ const el=$('#'+id); if(el){ el.addEventListener('input',run); el.addEventListener('change',run); } });
    run();
    const clr=$('[data-act="clear-filters"]');
    if(clr) clr.addEventListener('click',()=>{ ['fQ','fGenre','fYear','fStatus','fRate'].forEach(id=>{const e=$('#'+id); if(e) e.value='';}); $('#fSort').value='pop'; run(); });
  }

  /* İzleme listesi sekmeleri */
  if(view==='listem'){
    $$('[data-act="list-tab"]').forEach(b=>b.addEventListener('click',()=>{ location.hash='#/listem/'+encodeURIComponent(b.dataset.status); }));
  }

  /* Yönetim paneli */
  if(view==='admin'){
    $$('[data-act="admin-tab"]').forEach(b=>b.addEventListener('click',()=>{ location.hash='#/admin/'+b.dataset.tab; }));
    const se=$('#adminAnimeSearch');
    if(se) se.addEventListener('input',()=>{
      const v=se.value.toLowerCase();
      $$('#adminAnimeTable tbody tr').forEach(tr=>{ tr.style.display = tr.dataset.search.includes(v)?'':'none'; });
    });
    const ea=$('#epAnime');
    if(ea){
      const fill=()=>{
        const a=API.get(ea.value);
        $('#epSeason').innerHTML = a.seasons.map(s=>'<option value="'+s.n+'">'+s.n+'. Sezon ('+s.e+' bölüm)</option>').join('');
      };
      ea.addEventListener('change',fill); fill();
    }
  }

  /* Profil: izleme geçmişi kartlarını da animasyonla aç */
  if(view==='profil') animateReveal();
}

