'use strict';
/* ---------------- Arama (üst bar) ---------------- */
function initSearch(){
  const inp=$('#navSearch'), drop=$('#searchDrop');
  if(inp){
    inp.addEventListener('input',()=>{
      const v=inp.value.trim();
      if(v.length<1){ drop.classList.remove('show'); return; }
      const res=API.search({q:v, sort:'pop', limit:6});
      drop.innerHTML = res.length? res.map(a=>{
        const [c1,c2]=a.colors;
        return '<a href="#/anime/'+a.id+'"><span class="dposter" style="--c1:'+c1+';--c2:'+c2+'"></span><span><b>'+esc(a.title)+'</b><i>'+esc(a.jp)+' · '+a.year+' · ★ '+a.rating.toFixed(1)+'</i></span></a>';
      }).join('') + '<a href="#/arama?q='+encodeURIComponent(v)+'" style="justify-content:center;font-weight:800;font-size:.78rem;color:var(--accent)">Tüm sonuçları gör →</a>'
      : '<div class="dnone">"'+esc(v)+'" için sonuç bulunamadı.</div>';
      drop.classList.add('show');
    });
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); location.hash='#/arama?q='+encodeURIComponent(inp.value.trim()); drop.classList.remove('show'); inp.blur(); } });
    document.addEventListener('click',e=>{ if(!e.target.closest('.nav-search')) drop.classList.remove('show'); });
  }
  const mm=$('#mmSearch');
  if(mm) mm.addEventListener('keydown',e=>{ if(e.key==='Enter'){ location.hash='#/arama?q='+encodeURIComponent(mm.value.trim()); closeMenu(); } });
}

