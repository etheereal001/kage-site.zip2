'use strict';
/* ---------------- Views ---------------- */
function viewHome(){
  const all = API.list();
  const featured = ['frieren','aot','jjk','demon-slayer'].map(id=>API.get(id)).filter(Boolean);
  const popular = all.slice().sort((a,b)=> b.rating-a.rating).slice(0,6);
  const recent = all.slice().sort((a,b)=> b.year-a.year).slice(0,6);
  const ongoing = all.filter(a=>/Devam/.test(a.status)).slice(0,6);
  const latest = API.latestEpisodes(6);
  const mostWatched = all.slice().sort((a,b)=> (DB.views[b.id]||b.popularity) - (DB.views[a.id]||a.popularity)).slice(0,6);
  const genres = API.genres().slice(0,10);

  const hero = featured[0];
  const heroHTML =
  '<section class="hero"><div class="hero-bg" id="heroBg" style="--c1:'+hero.colors[0]+';--c2:'+hero.colors[1]+'"><i></i><i></i></div>'+
    '<div class="wrap"><div class="hero-grid">'+
      '<div id="heroInfo">'+ heroInfoHTML(hero) +'</div>'+
      '<div class="hero-card" id="heroPoster">'+ posterHTML(hero) +
        '<div class="float-tag"><b>KAGE Puanı</b><strong class="accent3">★ '+hero.rating.toFixed(1)+'</strong></div>'+
      '</div>'+
    '</div>'+
    '<div class="hero-dots" id="heroDots">'+featured.map((f,i)=>'<button class="'+(i===0?'on':'')+'" data-act="hero-go" data-i="'+i+'" aria-label="Öne çıkan '+(i+1)+'"></button>').join('')+'</div>'+
    '</div></section>';

  const genrePanel =
  '<section class="sec"><div class="sec-head"><div><span class="kicker">Kategoriler</span><h2 class="display">Türlere Göre Keşfet</h2>'+
  '<p class="sec-sub">Ruh halini seç, sana uygun animeyi bulalım.</p></div>'+
  '<a class="sec-link" href="#/turler">Tüm Türler →</a></div>'+
  '<div class="season-pills" id="homeGenreChips">'+genres.map((g,i)=>'<button class="chip '+(i===0?'on':'')+'" data-act="home-genre" data-genre="'+esc(g)+'">'+esc(g)+'</button>').join('')+'</div>'+
  '<div id="homeGenreGrid">'+gridHTML(all.filter(a=>a.genres.includes(genres[0])).slice(0,6))+'</div></section>';

  return heroHTML +
    sectionHTML('Trend', 'Popüler Animeler', 'Şu anda en çok izlenen ve en yüksek puanlı yapımlar.', '#/populer', 'Tümü', gridHTML(popular)) +
    sectionHTML('Güncel', 'Güncel Bölümler', 'Yayında olan animelerin en yeni bölümleri.', '#/yeni-bolumler', 'Tümü', gridHTML(latest.map(x=>x.a))) +
    sectionHTML('Yeni', 'Son Eklenen Animeler', 'Kataloğa en son eklenen başlıklar.', '#/animeler', 'Tümü', gridHTML(recent)) +
    sectionHTML('Başlangıç', 'Yeni Başlayan Animeler', 'Devam eden ve yeni sezona başlayan yapımlar.', '#/animeler', 'Tümü', gridHTML(ongoing)) +
    genrePanel +
    sectionHTML('Zirve', 'En Çok İzlenen Animeler', 'Platform genelinde toplam izlenme sayısına göre.', '#/populer', 'Tümü', gridHTML(mostWatched)) +
    sectionHTML('Rehber', 'İzlemeye Nereden Başlasın?', 'Yeni başlayanlar için en çok önerilen yapımlar.', '#/kesfet', 'Keşfet',
      gridHTML(['death-note','fmab','steins-gate','one-punch-man','erased','violet'].map(id=>API.get(id)).filter(Boolean))) +
    '<section class="sec"><div class="empty" style="border-style:solid;background:linear-gradient(120deg,rgba(255,43,94,.12),rgba(139,92,255,.08))">'+
      '<h3>KAGE’ye Katıl</h3><p>Favori animelerini kaydet, izleme listesi oluştur, kaldığın bölümden devam et ve yorumlarla topluluğa katıl.</p>'+
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'+
        (me()? '<a class="btn btn-primary" href="#/profil">Profilime Git</a><a class="btn" href="#/listem">İzleme Listem</a>'
            : '<button class="btn btn-primary" data-act="open-auth" data-mode="register">Ücretsiz Kayıt Ol</button><button class="btn" data-act="open-auth" data-mode="login">Giriş Yap</button>')+
      '</div></div></section>';
}
function heroInfoHTML(a){
  return '<span class="hero-eyebrow"><span class="dot"></span> Öne Çıkan Anime · '+a.year+'</span>'+
  '<h1 class="display">'+esc(a.title.split(':')[0])+'<span class="grad-txt">'+esc(a.title.split(':')[1]||'')+'</span></h1>'+
  '<p class="small muted" style="margin:0">'+esc(a.jp)+'</p>'+
  '<div class="hero-meta">'+
    '<span class="meta-pill"><b>Puan</b> ★ '+a.rating.toFixed(1)+'</span>'+
    '<span class="meta-pill"><b>Bölüm</b> '+a.episodeCount+'</span>'+
    '<span class="meta-pill"><b>Durum</b> '+esc(a.status)+'</span>'+
    '<span class="meta-pill"><b>Yaş</b> '+esc(a.age||'13+')+'</span>'+
    a.genres.slice(0,3).map(g=>'<span class="meta-pill">'+esc(g)+'</span>').join('')+
  '</div>'+
  '<p class="lead">'+esc(a.synopsis)+'</p>'+
  '<div class="hero-cta">'+
    '<button class="btn btn-primary" data-act="play-first" data-id="'+a.id+'">▶ Hemen İzle</button>'+
    '<a class="btn" href="#/anime/'+a.id+'">Detaylar</a>'+
    '<button class="btn '+(DB.favs[a.id]?'btn-fav-on':'')+'" data-act="toggle-fav" data-id="'+a.id+'">'+(DB.favs[a.id]?'♥ Favoride':'♡ Listeme Ekle')+'</button>'+
  '</div>'+
  '<div class="hero-stats">'+
    '<div><b>'+API.stats().anime+'</b><span>Anime</span></div>'+
    '<div><b>'+API.stats().episodes.toLocaleString('tr-TR')+'</b><span>Bölüm</span></div>'+
    '<div><b>'+API.genres().length+'</b><span>Tür</span></div>'+
    '<div><b>'+API.stats().users+'</b><span>Kullanıcı</span></div>'+
  '</div>';
}

