'use strict';
/* ---------------- Render motoru ---------------- */
function render(){
  if(heroTimer){ clearInterval(heroTimer); heroTimer=null; }
  const {parts, q} = parseHash();
  const view = parts[0]||'';
  let html='', title='Ana Sayfa', desc='KAGE · Anime izleme platformu';

  switch(view){
    case '': html=viewHome(); title='Ana Sayfa'; desc='Popüler animeler, güncel bölümler ve kişisel izleme listen. KAGE ile anime keşfet.'; break;
    case 'animeler': html=viewBrowse(); title='Animeler'; desc='Tüm animeleri tür, yıl, durum ve puana göre filtreleyerek keşfet.'; break;
    case 'turler': html=viewGenres(); title='Türler'; desc='Aksiyon, Macera, Komedi, Dram, Fantastik, Romantik, Korku, Gizem, Bilim Kurgu, Spor, Okul, Slice of Life türleri.'; break;
    case 'tur': html=viewGenre(decodeURIComponent(parts[1]||'')); title=decodeURIComponent(parts[1]||'')+' Animeleri'; desc=decodeURIComponent(parts[1]||'')+' türündeki animeler.'; break;
    case 'populer': html=viewPopular(); title='Popüler Animeler'; desc='KAGE topluluğunun en çok izlediği ve en yüksek puan verdiği animeler.'; break;
    case 'yeni-bolumler': html=viewLatest(); title='Yeni Bölümler'; desc='Yayında olan animelerin en yeni bölümleri.'; break;
    case 'takvim': html=viewCalendar(); title='Yayın Takvimi'; desc='Haftanın günlerine göre anime yayın takvimi.'; break;
    case 'kesfet': html=viewDiscover(); title='Keşfet'; desc='Rastgele anime önerileri, gizli kalmış yapımlar ve tür keşfi.'; break;
    case 'favoriler': html=viewFavorites(); title='Favorilerim'; desc='Favori animelerin listesi.'; break;
    case 'listem': html=viewMyList(parts[1]); title='İzleme Listem'; desc='İzliyor, İzlenecek, Tamamlandı ve Bırakıldı kategorileriyle izleme listesi.'; break;
    case 'arama': html=viewSearchPage(); title='Arama'; desc='Anime ara: ad, tür, yıl, puan ve durum filtreleri.'; break;
    case 'profil': html=viewProfile(); title='Profilim'; desc='Hesap bilgileri, izleme istatistikleri ve ayarlar.'; break;
    case 'admin': html=viewAdmin(parts[1]); title='Yönetim Paneli'; desc='Anime, bölüm, kullanıcı ve içerik yönetimi.'; break;
    case 'hakkinda': html=aboutView(); title='Hakkımızda'; desc='KAGE hakkında bilgi, kullanım şartları ve gizlilik.'; break;
    case 'anime': {
      const a=API.get(parts[1]);
      if(!a){ html=notFound(); break; }
      html=viewAnime(parts[1], parts[2]); title=a.title+' İzle'; desc=a.synopsis.slice(0,150);
      setLD(a);
      break;
    }
    case 'izle': {
      const a=API.get(parts[1]);
      if(!a){ html=notFound(); break; }
      html=viewWatch(parts[1], parts[2], parts[3]);
      title=a.title+' '+parts[2]+'. Sezon '+parts[3]+'. Bölüm İzle'; desc=a.title+' dizisinin '+parts[3]+'. bölümünü Türkçe altyazılı izle.';
      setLD(a);
      break;
    }
    default: html=notFound();
  }
  $('#view').innerHTML = html;
  document.title = title+' · KAGE Anime';
  const meta=$('meta[name="description"]'); if(meta) meta.setAttribute('content', desc.slice(0,300));
  renderNav(); renderUserArea(); animateReveal();
  window.scrollTo({top: view==='izle'?0:0, behavior:'auto'});
  afterRender(view, parts, q);
}
function aboutView(){
  return '<section class="sec" style="margin-top:26px"><div class="sec-head"><div><span class="kicker">Kurumsal</span>'+
  '<h1 class="display">Hakkımızda</h1></div></div>'+
  '<div class="split" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)">'+
    '<div class="comment-form" style="gap:16px">'+
      '<b style="font-size:1.05rem">KAGE nedir?</b>'+
      '<p class="muted" style="margin:0">KAGE, anime kültürüne uygun modern bir izleme deneyimi sunmayı hedefleyen bir demo platformdur. Keşfet, izleme listesi, favoriler, kaldığın yerden devam etme, yorumlar, puanlama, yayın takvimi ve yönetim paneli gibi uçtan uca işlevleri tek bir akışta bir araya getirir.</p>'+
      '<b style="font-size:1.05rem;margin-top:8px">İçerik politikası</b>'+
      '<p class="muted" style="margin:0">Bu proje <b class="accent3">telif hakkı ihlali içermez</b>. Video oynatıcı yalnızca kamuya açık, lisanslı demo bir video dosyasını kullanır; tüm anime bilgileri tanıtım amaçlı temsili verilerdir. Gerçek bir yayın servisi için yalnızca yasal lisanslı kaynaklar kullanılmalıdır.</p>'+
      '<b style="font-size:1.05rem;margin-top:8px">Teknik mimari</b>'+
      '<p class="muted" style="margin:0">Arayüz tarayıcıda çalışır. Katalog, yorumlar ve destek talepleri Cloudflare üzerindeki bir API ve D1 veritabanında tutulur; hesap profilin, favorilerin ve izleme listen ise yalnızca kendi tarayıcında saklanır.</p>'+
    '</div>'+
    '<div class="comment-form">'+
      '<b>Kısa Bilgiler</b>'+
      '<p class="muted small" style="margin:0">Sürüm: 2.0 · Arayüz dili: Türkçe<br>Tema: Koyu / premium<br>Modüller: 12</p>'+
      '<div class="stat-grid" style="grid-template-columns:1fr 1fr"><div class="stat"><b>'+API.stats().anime+'</b><span>Anime</span></div><div class="stat"><b>'+API.stats().episodes.toLocaleString('tr-TR')+'</b><span>Bölüm</span></div></div>'+
      '<button class="btn btn-primary btn-sm" data-act="open-support">Destek Talebi Oluştur</button>'+
    '</div>'+
  '</div></section>';
}
function setLD(a){
  const el=$('#ldRoot');
  if(!el) return;
  el.textContent = JSON.stringify({
    '@context':'https://schema.org','@type':'TVSeries', name:a.title, alternateName:a.jp,
    inLanguage:'ja', numberOfEpisodes:a.episodeCount, numberOfSeasons:a.seasons.length,
    genre:a.genres, description:a.synopsis, datePublished:String(a.year),
    aggregateRating:{'@type':'AggregateRating',ratingValue:a.rating,bestRating:10,ratingCount:Math.max(12,Math.round(a.popularity*13))},
    productionCompany:{'@type':'Organization',name:a.studio}
  });
}

