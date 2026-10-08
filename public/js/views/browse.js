'use strict';
function viewBrowse(params){
  const q = parseHash().q;
  const initial = { q:q.get('q')||'', genre:q.get('tur')||'', year:q.get('yil')||'', status:q.get('durum')||'', minRating:q.get('puan')||'', sort:q.get('sirala')||'pop' };
  const years = Array.from(new Set(API.list().map(a=>a.year))).sort((a,b)=>b-a);
  return '<section class="sec" style="margin-top:26px">'+
    '<div class="sec-head"><div><span class="kicker">Katalog</span><h2 class="display">Animeler</h2>'+
      '<p class="sec-sub">Ad, tür, yıl, durum ve puana göre filtreleyerek aradığın animeyi bul.</p></div></div>'+
    '<div class="filters" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;background:var(--panel);border:1.5px solid var(--line);border-radius:var(--r);padding:16px;margin-bottom:22px">'+
      '<label class="f" style="margin:0"><span>Arama</span><input class="inp" id="fQ" value="'+esc(initial.q)+'" placeholder="Anime adı, stüdyo, etiket..."></label>'+
      '<label class="f" style="margin:0"><span>Tür</span><select class="inp" id="fGenre"><option value="">Tümü</option>'+API.genres().map(g=>'<option '+(initial.genre===g?'selected':'')+'>'+esc(g)+'</option>').join('')+'</select></label>'+
      '<label class="f" style="margin:0"><span>Yayın Yılı</span><select class="inp" id="fYear"><option value="">Tümü</option>'+years.map(y=>'<option '+(String(initial.year)===String(y)?'selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
      '<label class="f" style="margin:0"><span>Durum</span><select class="inp" id="fStatus"><option value="">Tümü</option><option '+(initial.status==='Devam Ediyor'?'selected':'')+'>Devam Ediyor</option><option '+(initial.status==='Tamamlandı'?'selected':'')+'>Tamamlandı</option></select></label>'+
      '<label class="f" style="margin:0"><span>Min. Puan</span><select class="inp" id="fRate"><option value="">Tümü</option>'+[9,8,7,6].map(v=>'<option value="'+v+'" '+(String(initial.minRating)===String(v)?'selected':'')+'>'+v+'+</option>').join('')+'</select></label>'+
      '<label class="f" style="margin:0"><span>Sıralama</span><select class="inp" id="fSort">'+
        [['pop','Popülerlik'],['rating','Puan'],['year','Yıl (yeni)'],['az','A-Z'],['episodes','Bölüm sayısı']].map(([v,l])=>'<option value="'+v+'" '+(initial.sort===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label>'+
    '</div>'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap">'+
      '<span class="muted small" id="fCount"></span>'+
      '<button class="btn btn-sm" data-act="clear-filters">Filtreleri Temizle</button>'+
    '</div>'+
    '<div id="fResults"></div>'+
  '</section>';
}
function viewGenres(){
  const all=API.list();
  return '<section class="sec" style="margin-top:26px"><div class="sec-head"><div><span class="kicker">Kategoriler</span><h2 class="display">Türler</h2>'+
  '<p class="sec-sub">Her türün altında kaç yapım var? Keşfetmek için bir türe dokun.</p></div></div>'+
  '<div class="grid wide">'+API.genres().map(g=>{
    const list=all.filter(a=>a.genres.includes(g));
    const [c1,c2]=PALETTE[hashNum(g)%PALETTE.length];
    return '<a class="card reveal" href="#/tur/'+encodeURIComponent(g)+'" style="text-decoration:none">'+
      '<div style="position:relative;border-radius:var(--r);overflow:hidden;border:1.5px solid var(--line);min-height:150px;background:linear-gradient(140deg,'+c1+','+c2+');display:flex;flex-direction:column;justify-content:space-between;padding:18px">'+
        '<span style="font-size:.66rem;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.75)">'+list.length+' Yapım</span>'+
        '<div><h3 class="display" style="font-size:1.6rem;color:#fff">'+esc(g)+'</h3>'+
        '<span class="small" style="color:rgba(255,255,255,.8)">'+esc(list.slice(0,2).map(x=>x.title).join(' · '))+'</span></div>'+
      '</div></a>';
  }).join('')+'</div></section>';
}
function viewGenre(genre){
  const list = API.list().filter(a=>a.genres.includes(genre));
  if(!list.length) return notFound('Bu türde yapım bulunamadı.');
  return '<section class="sec" style="margin-top:26px"><div class="sec-head"><div><span class="kicker">Tür</span><h2 class="display">'+esc(genre)+'</h2>'+
  '<p class="sec-sub">'+list.length+' anime listeleniyor.</p></div><a class="sec-link" href="#/turler">← Tüm Türler</a></div>'+
  gridHTML(list)+'</section>';
}
function viewPopular(){
  const list = API.list().slice().sort((a,b)=> b.rating-a.rating || b.popularity-a.popularity);
  return '<section class="sec" style="margin-top:26px"><div class="sec-head"><div><span class="kicker">Zirve</span><h2 class="display">Popüler Animeler</h2>'+
  '<p class="sec-sub">KAGE topluluğunun puanlarına ve izlenme verilerine göre sıralandı.</p></div></div>'+
  '<div class="rank-list">'+list.slice(0,12).map((a,i)=>{
    const [c1,c2]=a.colors;
    return '<div class="rank-item" data-act="go" data-href="#/anime/'+a.id+'">'+
      '<span class="rank-num">'+String(i+1).padStart(2,'0')+'</span>'+
      '<div class="rank-poster" style="--c1:'+c1+';--c2:'+c2+'">'+esc((a.jp||'#').charAt(0))+'</div>'+
      '<div class="rank-info"><h4>'+esc(a.title)+'</h4><p>'+esc(a.jp)+' · '+a.year+' · '+a.episodeCount+' Bölüm · '+esc(a.genres.slice(0,3).join(', '))+'</p></div>'+
      '<div class="rank-score"><b>★ '+a.rating.toFixed(1)+'</b><span>'+esc(a.status)+'</span></div>'+
    '</div>';
  }).join('')+'</div>'+
  '<div style="margin-top:34px">'+sectionHTML('', 'Sıralamanın Devamı','',null,null,gridHTML(list.slice(12)))+'</div></section>';
}
function viewLatest(){
  const eps = API.latestEpisodes(24);
  return '<section class="sec" style="margin-top:26px"><div class="sec-head"><div><span class="kicker">Güncel</span><h2 class="display">Yeni Bölümler</h2>'+
  '<p class="sec-sub">Yayında olan animelerin en son eklenen bölümleri.</p></div></div>'+
  (eps.length? '<div class="grid wide">'+eps.map(x=>{
      const live=/Devam/.test(x.a.status);
      return '<div class="ep-item" data-act="go" data-href="#/izle/'+x.a.id+'/'+x.season.n+'/'+x.ep.no+'" style="padding:12px">'+
        '<div style="width:66px;flex-shrink:0">'+posterHTML(x.a)+'</div>'+
        '<div class="epinfo" style="flex:1">'+
          '<b>'+esc(x.a.title)+'</b>'+
          '<i>'+x.season.n+'. Sezon · '+x.ep.no+'. Bölüm — '+esc(x.ep.title)+'</i>'+
          '<div class="small muted" style="margin-top:4px">'+fmtDate(x.ep.date)+' · '+fmtTime(x.ep.dur)+'</div>'+
        '</div>'+
        '<span class="badge '+(live?'badge-live':'badge-done')+'" style="position:static">'+(live?'YENİ':'OK')+'</span>'+
      '</div>';
    }).join('')+'</div>'
    : emptyState('📺','Yeni bölüm yok','Şu anda yayınlanan yeni bölüm bulunmuyor. Daha sonra tekrar bak.','<a class="btn btn-primary" href="#/animeler">Animelere Göz At</a>'))+
  '</section>';
}
function viewCalendar(){
  const map = API.schedule();
  const today = DAYS[(new Date().getDay()+6)%7];
  return '<section class="sec" style="margin-top:26px"><div class="sec-head"><div><span class="kicker">Takvim</span><h2 class="display">Yayın Takvimi</h2>'+
  '<p class="sec-sub">Haftanın hangi günü hangi anime yayınlanıyor? (Türkiye saati ile temsili)</p></div>'+
  '<span class="meta-pill"><b>Bugün</b> '+esc(today)+'</span></div>'+
  '<div class="cal">'+DAYS.map(d=>{
    const items = map[d]||[];
    const date = new Date(); date.setDate(date.getDate() + ((DAYS.indexOf(d) - DAYS.indexOf(today)+7)%7 - 0));
    return '<div class="cal-day '+(d===today?'today':'')+'">'+
      '<h4>'+esc(d.slice(0,3))+ (d===today?' <span class="accent" style="font-size:.6rem">BUGÜN</span>':'')+'</h4>'+
      '<div class="cd-date">'+(d===today?'Bugün':fmtDate(date))+'</div>'+
      (items.length? items.map(it=>{
        const [c1,c2]=it.a.colors;
        return '<div class="cal-item" data-act="go" data-href="#/anime/'+it.a.id+'">'+
          '<div class="ci-p" style="--c1:'+c1+';--c2:'+c2+'"></div>'+
          '<div style="min-width:0"><b>'+esc(it.a.title)+'</b><i>'+it.time+' · '+it.ep+'. Bölüm</i></div>'+
        '</div>';
      }).join('') : '<p class="small muted" style="margin:0">Yayın yok</p>')+
    '</div>';
  }).join('')+'</div></section>';
}
function viewDiscover(){
  const all = API.list();
  const picks = all.slice().sort(()=>Math.random()-.5).slice(0,8);
  const topRated = all.slice().sort((a,b)=>b.rating-a.rating).slice(0,4);
  const hidden = all.slice().sort((a,b)=> a.popularity-b.popularity).slice(0,4);
  const watchCount = API.watchCount();
  return '<section class="sec" style="margin-top:26px">'+
  '<div class="empty" style="border-style:solid;background:linear-gradient(120deg,rgba(139,92,255,.16),rgba(255,43,94,.1));text-align:left;padding:clamp(24px,4vw,44px)">'+
    '<span class="kicker">Keşfet</span>'+
    '<h2 class="display" style="font-size:clamp(1.8rem,5vw,3.4rem);margin-bottom:12px">Bu akşam ne izlesem?</h2>'+
    '<p style="max-width:60ch">Kataloğu karıştır, rastgele bir anime keşfet ya da gizli kalmış yapımlara göz at. Toplam '+
      API.stats().anime+' anime ve '+API.stats().episodes.toLocaleString('tr-TR')+' bölüm seni bekliyor.</p>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">'+
      '<button class="btn btn-primary" data-act="random-anime">🎲 Rastgele Anime</button>'+
      '<a class="btn btn-lime" href="#/animeler">Filtreli Ara</a>'+
      (watchCount? '<a class="btn" href="#/listem">İzlemeye Devam Et ('+watchCount+')</a>':'')+
    '</div>'+
  '</div></section>'+
  sectionHTML('Karışık','Sana Önerilenler','Kataloğun genelinden rastgele seçilmiş yapımlar.','#/animeler','Tümü',gridHTML(picks))+
  sectionHTML('Gizli Kalmış','Gizli Kalmış Yapımlar','Popülerlik gölgesinde kalmış ama puanı yüksek animeler.',null,null,gridHTML(hidden))+
  sectionHTML('Efsaneler','Tüm Zamanların En İyileri','Puan bazlı zirve listesi.','#/populer','Popüler Sayfası',gridHTML(topRated))+
  sectionHTML('Türler','Türlere Göre Keşfet','','#/turler','Tüm Türler',
    '<div class="season-pills">'+API.genres().map(g=>'<a class="chip" href="#/tur/'+encodeURIComponent(g)+'">'+esc(g)+'</a>').join('')+'</div>');
}
function viewFavorites(){
  const u=me();
  if(!u) return authRequired('Favorilerini görmek için giriş yapmalısın.');
  const favs = API.favs();
  return '<section class="sec" style="margin-top:26px"><div class="sec-head"><div><span class="kicker">Hesabım</span><h2 class="display">Favoriler</h2>'+
  '<p class="sec-sub">'+favs.length+' anime favori listende.</p></div></div>'+
  (favs.length? gridHTML(favs) : emptyState('♡','Henüz favori yok','Beğendiğin animeleri kalp ikonu ile favorilerine ekleyerek buradan hızlıca ulaşabilirsin.','<a class="btn btn-primary" href="#/animeler">Animeleri Keşfet</a>'))+
  '</section>';
}
const LIST_STATUSES = ['İzliyor','İzlenecek','Tamamlandı','Bırakıldı'];
function viewMyList(status){
  const u=me();
  if(!u) return authRequired('İzleme listene ulaşmak için giriş yapmalısın.');
  status = status || 'İzliyor';
  const list = API.listBy(status);
  return '<section class="sec" style="margin-top:26px"><div class="sec-head"><div><span class="kicker">Hesabım</span><h2 class="display">İzleme Listem</h2>'+
  '<p class="sec-sub">Animeleri izleme durumuna göre kategorilere ayır ve takip et.</p></div></div>'+
  '<div class="tabs">'+LIST_STATUSES.map(s=>'<button class="'+(s===status?'on':'')+'" data-act="list-tab" data-status="'+esc(s)+'">'+esc(s)+' ('+API.listBy(s).length+')</button>').join('')+'</div>'+
  (list.length? gridHTML(list) : emptyState('📚','Bu kategoride anime yok','Anime detay sayfasından "İzleme Listeme Ekle" alanını kullanarak bu kategoriye anime ekleyebilirsin.','<a class="btn btn-primary" href="#/animeler">Animeleri Keşfet</a>'))+
  '</section>';
}
function viewSearchPage(){
  const q = parseHash().q.get('q')||'';
  const results = q? API.search({q}) : [];
  return '<section class="sec" style="margin-top:26px">'+
  '<div class="sec-head"><div><span class="kicker">Arama</span><h2 class="display">'+(q?esc(q):'Ne izlemek istiyorsun?')+'</h2>'+
  '<p class="sec-sub">'+(q? results.length+' sonuç bulundu.':'Anime adı, Japonca adı, tür, stüdyo veya etiket ile arayabilirsin.')+'</p></div></div>'+
  '<div style="display:flex;gap:10px;margin-bottom:22px;flex-wrap:wrap;max-width:640px">'+
    '<input class="inp" id="pgSearch" style="flex:1;min-width:220px" placeholder="Ara..." value="'+esc(q)+'">'+
    '<button class="btn btn-primary" data-act="search-page-go">Ara</button>'+
    (q?'<a class="btn" href="#/animeler">Filtreli Arama</a>':'')+
  '</div>'+
  (q? (results.length? gridHTML(results) : emptyState('🔍','Sonuç bulunamadı','"'+esc(q)+'" için sonuç yok. Farklı bir kelime dene veya filtreli aramayı kullan.','<a class="btn btn-primary" href="#/animeler">Filtreli Arama</a>'))
     : '<div class="season-pills">'+API.genres().map(g=>'<a class="chip" href="#/tur/'+encodeURIComponent(g)+'">'+esc(g)+'</a>').join('')+'</div>')+
  '</section>';
}

