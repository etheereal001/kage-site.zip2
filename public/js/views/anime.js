'use strict';
/* ---------------- Detay sayfası ---------------- */
function viewAnime(id, season){
  const a = API.get(id);
  if(!a) return notFound();
  const seasons = a.seasons;
  const active = seasons.find(s=>Number(s.n)===Number(season)) || seasons[0];
  const eps = API.episodes(a.id, active.n);
  const resume = API.resumeFor(a.id);
  const userRating = API.myRating(a.id);
  const inList = DB.lists[a.id] ? DB.lists[a.id].status : '';
  const similar = API.similar(a.id);
  const tags = (a.tags||[]).concat(a.studio?[a.studio]:[]);

  const epHTML = eps.map(ep=>{
    const h = DB.history[a.id+':'+active.n+':'+ep.no];
    const pct = h && h.d ? Math.min(100, h.t/h.d*100) : 0;
    const watched = API.isWatched(a.id, active.n, ep.no);
    return '<button class="ep-item '+(watched?'watched':'')+'" data-act="go" data-href="#/izle/'+a.id+'/'+active.n+'/'+ep.no+'">'+
      '<span class="epno">'+ep.no+'</span>'+
      '<span class="epinfo"><b>'+esc(ep.title)+'</b><i>'+fmtTime(ep.dur)+' · '+fmtDate(ep.date)+'</i></span>'+
      (pct>1?'<span class="epbar" style="width:'+pct+'%"></span>':'')+
    '</button>';
  }).join('');

  return '<div class="detail-hero" style="--c1:'+a.colors[0]+';--c2:'+a.colors[1]+'">'+
    '<div class="dh-bg"></div><div class="dh-blur"></div>'+
    '<div class="wrap"><div class="dh-grid">'+
      '<div class="dh-poster">'+posterHTML(a)+'</div>'+
      '<div>'+
        '<div class="crumbs" style="margin:0 0 12px"><a href="#/">Ana Sayfa</a><span>›</span><a href="#/animeler">Animeler</a><span>›</span><span>'+esc(a.title)+'</span></div>'+
        '<h1 class="display dh-title">'+esc(a.title)+'</h1>'+
        '<p class="dh-jp">'+esc(a.jp)+'</p>'+
        '<div class="meta-grid">'+
          '<span class="meta-pill"><b>Puan</b> <span class="accent3">★ '+a.rating.toFixed(1)+'</span></span>'+
          '<span class="meta-pill"><b>Yıl</b> '+a.year+'</span>'+
          '<span class="meta-pill"><b>Bölüm</b> '+a.episodeCount+'</span>'+
          '<span class="meta-pill"><b>Sezon</b> '+a.seasons.length+'</span>'+
          '<span class="meta-pill"><b>Durum</b> '+esc(a.status)+'</span>'+
          '<span class="meta-pill"><b>Yaş</b> '+esc(a.age||'13+')+'</span>'+
        '</div>'+
        '<p class="synopsis">'+esc(a.synopsis)+'</p>'+
        '<div class="tag-list">'+tags.map(t=>'<span class="tag">#'+esc(t)+'</span>').join('')+'</div>'+
        '<div class="action-bar">'+
          (resume
            ? '<a class="btn btn-primary" href="#/izle/'+a.id+'/'+resume.s+'/'+resume.e+'">▶ Devam Et · '+resume.s+'. Sezon '+resume.e+'. Bölüm</a>'
            : '<a class="btn btn-primary" href="#/izle/'+a.id+'/'+a.seasons[0].n+'/1">▶ 1. Bölümü İzle</a>')+
          '<button class="btn '+(DB.favs[a.id]?'btn-fav-on':'')+'" data-act="toggle-fav" data-id="'+a.id+'">'+(DB.favs[a.id]?'♥ Favoride':'♡ Favorilere Ekle')+'</button>'+
          '<select class="inp" style="width:auto" data-act="set-list" data-id="'+a.id+'" aria-label="İzleme listesi durumu">'+
            '<option value="">+ İzleme Listeme Ekle</option>'+
            LIST_STATUSES.map(s=>'<option '+(inList===s?'selected':'')+'>'+esc(s)+'</option>').join('')+
          '</select>'+
        '</div>'+
        '<div class="info-cols">'+
          '<div><b>Stüdyo</b><span>'+esc(a.studio||'-')+'</span></div>'+
          '<div><b>Yönetmen</b><span>'+esc(a.director||'-')+'</span></div>'+
          '<div><b>Yayın Tarihi</b><span>'+a.year+'</span></div>'+
          '<div><b>Yayın Günü</b><span>'+esc(a.day||'Bitti')+'</span></div>'+
          '<div><b>İzlenme</b><span>'+(((DB.views[a.id]||0)+a.popularity*37)).toLocaleString('tr-TR')+'</span></div>'+
          '<div><b>Senin Puanın</b><span>'+
            '<span class="stars" data-act="rate" data-id="'+a.id+'">'+
              Array.from({length:10},(_,i)=>'<button data-v="'+(i+1)+'" class="'+(userRating>=i+1?'on':'')+'" aria-label="'+(i+1)+' puan">★</button>').join('')+
            '</span>'+
          '</span></div>'+
        '</div>'+
      '</div>'+
    '</div></div>'+
  '</div>'+
  '<section class="sec"><div class="sec-head"><div><span class="kicker">Bölümler</span><h2 class="display">Sezon ve Bölüm Listesi</h2>'+
    '<p class="sec-sub">'+a.seasons.length+' sezon · '+a.episodeCount+' bölüm. İzlemek istediğin bölüme dokun.</p></div></div>'+
    '<div class="season-pills">'+a.seasons.map(s=>'<button class="chip '+(s.n===active.n?'on':'')+'" data-act="season-select" data-id="'+a.id+'" data-season="'+s.n+'">'+s.n+'. Sezon <span style="opacity:.7">'+s.e+' bölüm</span></button>').join('')+'</div>'+
    (eps.length? '<div class="ep-list">'+epHTML+'</div>' : emptyState('📭','Bölüm bulunamadı','Bu sezon için henüz bölüm eklenmemiş.'))+
  '</section>'+
  sectionHTML('Benzer','Benzer Animeler','Tür ve stüdyo benzerliğine göre öneriler.',null,null,
    similar.length? gridHTML(similar) : '<p class="muted small">Benzer yapım bulunamadı.</p>')+
  '<section class="sec">'+commentsHTML(a.id, 'Anime Yorumları')+'</section>';
}

