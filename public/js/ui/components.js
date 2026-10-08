'use strict';
/* ---------------- Hydrate: türetilmiş alanlar ---------------- */
function hydrate(a){
  const seasons = (a.seasons && a.seasons.length ? a.seasons : [{n:1, e:a.ep||12, y:a.year}]).map(s=>({n:s.n, e:s.e, y:s.y||a.year, title: s.title || s.n+'. Sezon'}));
  const episodeCount = seasons.reduce((t,s)=>t+s.e,0);
  const colors = PALETTE[hashNum(a.id)%PALETTE.length];
  return Object.assign({}, a, {
    seasons, episodeCount, colors,
    rating: Number(a.rating||7.5),
    popularity: Number(a.popularity||a.pop||50),
    tags: a.tags||[], genres: a.genres||[], synopsis: a.synopsis||''
  });
}

/* ---------------- Görsel & bileşen üreticileri ---------------- */
function posterHTML(a, extraClass){
  const [c1,c2]=a.colors;
  const glyph = (a.jp||'#').trim().charAt(0) || '#';
  return '<div class="poster '+(extraClass||'')+'" style="--c1:'+c1+';--c2:'+c2+'">'+
    '<span class="p-lines"></span>'+
    '<span class="p-year">'+esc(String(a.year))+'</span>'+
    '<span class="p-glyph">'+esc(glyph)+'</span>'+
    '<span class="p-foot">'+esc(a.title)+'</span>'+
  '</div>';
}
function cardHTML(a){
  const fav = !!DB.favs[a.id];
  const live = /Devam/.test(a.status);
  return '<article class="card reveal" data-act="go" data-href="#/anime/'+a.id+'" tabindex="0" role="link" aria-label="'+esc(a.title)+' detay sayfası">'+
    '<div class="card-poster">'+ posterHTML(a) +
      '<span class="badge '+(live?'badge-live':'badge-done')+'">'+(live?'Devam Ediyor':'Tamamlandı')+'</span>'+
      '<span class="score">★ '+a.rating.toFixed(1)+'</span>'+
      '<div class="card-over">'+
        '<button class="btn btn-primary btn-sm" data-act="play-first" data-id="'+a.id+'">▶ İzle</button>'+
        '<button class="btn btn-sm '+(fav?'btn-fav-on':'')+'" data-act="toggle-fav" data-id="'+a.id+'" aria-label="Favorilere ekle">'+(fav?'♥ Favoride':'♡ Favori')+'</button>'+
      '</div>'+
    '</div>'+
    '<h3 class="card-title">'+esc(a.title)+'</h3>'+
    '<p class="card-jp">'+esc(a.jp)+'</p>'+
    '<div class="card-meta"><span>'+a.year+'</span><span>•</span><span>'+a.episodeCount+' Bölüm</span><span>•</span><span>'+esc(a.age||'13+')+'</span></div>'+
    '<div class="card-genres">'+a.genres.slice(0,3).map(g=>'<span>'+esc(g)+'</span>').join('')+'</div>'+
  '</article>';
}
function gridHTML(list, wide){
  return '<div class="grid'+(wide?' wide':'')+'">'+list.map(cardHTML).join('')+'</div>';
}
function sectionHTML(kicker, title, sub, linkHref, linkText, inner){
  return '<section class="sec">'+
    '<div class="sec-head"><div>'+
      (kicker?'<span class="kicker">'+esc(kicker)+'</span>':'')+
      '<h2 class="display">'+esc(title)+'</h2>'+
      (sub?'<p class="sec-sub">'+esc(sub)+'</p>':'')+
    '</div>'+
    (linkHref?'<a class="sec-link" href="'+linkHref+'">'+esc(linkText||'Tümünü Gör')+' <span>→</span></a>':'')+
    '</div>'+ inner +'</section>';
}
function emptyState(icon, title, text, btnHTML){
  return '<div class="empty"><div class="e-ico">'+icon+'</div><h3>'+esc(title)+'</h3><p>'+esc(text)+'</p>'+(btnHTML||'')+'</div>';
}
function skeletonGrid(n){
  let s='<div class="grid">';
  for(let i=0;i<n;i++) s+='<div class="skel card-s"></div>';
  return s+'</div>';
}
function toast(msg, type, title){
  const el=document.createElement('div');
  el.className='toast '+(type||'');
  el.innerHTML=(title?'<b>'+esc(title)+'</b>':'')+esc(msg);
  $('#toasts').appendChild(el);
  setTimeout(()=>{ el.style.transition='.4s'; el.style.opacity='0'; el.style.transform='translateX(24px)'; setTimeout(()=>el.remove(),420); }, 3600);
}

