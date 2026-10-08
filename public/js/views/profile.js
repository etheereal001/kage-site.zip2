'use strict';
/* ---------------- Profil ---------------- */
function viewProfile(){
  const u = me();
  if(!u) return authRequired('Profilini görmek için giriş yapmalısın.');
  const watched = API.watchCount();
  const completed = API.completedAnime();
  const favs = API.favs();
  const ratings = Object.keys(DB.ratings);
  const avg = ratings.length? (ratings.reduce((t,id)=>t+DB.ratings[id],0)/ratings.length).toFixed(1) : '-';
  const history = API.recentHistory(8);
  const tickets = API.myTickets();

  return '<section class="sec" style="margin-top:26px">'+
  '<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;background:var(--panel);border:1.5px solid var(--line);border-radius:var(--r-lg);padding:clamp(18px,3vw,30px)">'+
    '<div class="avatar" style="width:78px;height:78px;font-size:2rem;background:'+u.color+'">'+esc(u.name.charAt(0).toUpperCase())+'</div>'+
    '<div style="flex:1;min-width:220px">'+
      '<h1 class="display" style="font-size:clamp(1.5rem,4vw,2.6rem)">'+esc(u.name)+'</h1>'+
      '<p class="muted small" style="margin:6px 0 0">'+esc(u.email)+' · Üyelik: '+fmtDate(new Date(u.joined))+(isAdmin()?' · <span class="accent3">Yönetici</span>':'')+'</p>'+
    '</div>'+
    '<div style="display:flex;gap:9px;flex-wrap:wrap">'+
      '<a class="btn btn-sm" href="#/listem">İzleme Listem</a>'+
      '<a class="btn btn-sm" href="#/favoriler">Favorilerim</a>'+
      '<button class="btn btn-sm" data-act="logout">Çıkış</button>'+
    '</div>'+
  '</div>'+
  '<div class="stat-grid" style="margin-top:18px">'+
    '<div class="stat"><b>'+watched+'</b><span>İzlenen Bölüm</span></div>'+
    '<div class="stat"><b>'+completed+'</b><span>Tamamlanan Anime</span></div>'+
    '<div class="stat"><b>'+favs.length+'</b><span>Favori</span></div>'+
    '<div class="stat"><b>'+Object.keys(DB.lists).length+'</b><span>Listedeki Anime</span></div>'+
    '<div class="stat"><b>'+avg+'</b><span>Ortalama Puanın</span></div>'+
  '</div></section>'+
  '<section class="sec"><div class="sec-head"><div><span class="kicker">Devam Et</span><h2 class="display">İzlemeye Devam Et</h2></div>'+
    '<a class="sec-link" href="#/listem">Listem →</a></div>'+
    (history.length? gridHTML(history.map(h=>API.get(h.animeId)).filter(Boolean)) : emptyState('🎬','İzleme geçmişin boş','Bir bölüm izlemeye başladığında kaldığın yer burada görünecek.','<a class="btn btn-primary" href="#/animeler">Animeleri Keşfet</a>'))+
  '</section>'+
  '<section class="sec"><div class="sec-head"><div><span class="kicker">Hesap</span><h2 class="display">Hesap Ayarları</h2></div></div>'+
    '<div class="split" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">'+
      '<form class="comment-form" data-form="profile">'+
        '<b>Profil Bilgilerini Güncelle</b>'+
        '<label class="f" style="margin-top:8px"><span>Ad Soyad</span><input class="inp" name="name" value="'+esc(u.name)+'" required maxlength="40"></label>'+
        '<label class="f"><span>E-posta</span><input class="inp" name="email" type="email" value="'+esc(u.email)+'" required></label>'+
        '<label class="f"><span>Avatar Rengi</span><select class="inp" name="color">'+PALETTE.map(p=>'<option value="'+p[0]+'" '+(u.color===p[0]?'selected':'')+'>'+p[0]+'</option>').join('')+'</select></label>'+
        '<label class="f"><span>Yeni Şifre (opsiyonel)</span><input class="inp" name="pass" type="password" minlength="6" placeholder="••••••"></label>'+
        '<button class="btn btn-primary btn-sm" type="submit">Kaydet</button>'+
        '<div class="err" data-err></div>'+
      '</form>'+
      '<div class="comment-form">'+
        '<b>Destek Taleplerim</b>'+
        '<div style="margin-top:10px">'+(tickets.length? tickets.slice(0,4).map(t=>'<div class="ticket"><div class="t-top"><b>'+esc(t.subject)+'</b><span class="status '+(t.status==='Yanıtlandı'?'answered':t.status==='Kapalı'?'closed':'open')+'">'+esc(t.status)+'</span></div><p>'+esc(t.category)+' · '+timeAgo(t.createdAt)+'</p></div>').join('')
          : '<p class="muted small">Henüz destek talebin yok. Sağ alttaki ✉ butonundan talep oluşturabilirsin.</p>')+'</div>'+
        '<button class="btn btn-sm" data-act="open-support" style="margin-top:6px">Yeni Talep Oluştur</button>'+
      '</div>'+
    '</div>'+
  '</section>';
}
function authRequired(msg){
  return '<section class="sec" style="margin-top:26px">'+emptyState('🔒','Giriş Gerekli',msg,
    '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn btn-primary" data-act="open-auth" data-mode="login">Giriş Yap</button><button class="btn" data-act="open-auth" data-mode="register">Ücretsiz Kayıt Ol</button></div>')+'</section>';
}
function notFound(msg){
  return '<section class="sec" style="margin-top:26px">'+emptyState('🌀','Sayfa bulunamadı',msg||'Aradığın içerik taşınmış veya kaldırılmış olabilir.',
    '<a class="btn btn-primary" href="#/">Ana Sayfaya Dön</a>')+'</section>';
}

