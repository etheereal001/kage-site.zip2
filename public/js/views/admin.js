'use strict';
/* ---------------- Admin paneli ---------------- */
let adminTab='overview';
function viewAdmin(tab){
  if(!isAdmin()){
    return '<section class="sec" style="margin-top:26px"><div class="comment-form" style="max-width:420px;margin:0 auto">'+
      '<b style="font-size:1.1rem">Yönetici Girişi</b>'+
      '<p class="muted small" style="margin:6px 0 10px">Yönetim paneli için sunucuda tanımlı yönetici parolasını gir.</p>'+
      '<form data-form="admin-login" style="display:grid;gap:8px">'+
        '<label class="f" style="margin:0"><span>Parola</span><input class="inp" name="password" type="password" required autocomplete="current-password"></label>'+
        '<button class="btn btn-primary btn-block" type="submit">Giriş Yap</button>'+
        '<div class="err" data-err></div>'+
      '</form></div></section>';
  }
  adminTab = tab || adminTab || 'overview';
  const s = API.stats();
  const tabs = [['overview','Genel Bakış'],['anime','Animeler'],['episode','Bölümler'],['comments','Yorumlar'],['tickets','Talepler'],['genres','Türler']];
  if(!tabs.some(t=>t[0]===adminTab)) adminTab='overview';
  let body='';

  if(adminTab==='overview'){
    body = '<div class="stat-grid">'+
      '<div class="stat"><b>'+s.anime+'</b><span>Toplam Anime</span></div>'+
      '<div class="stat"><b>'+s.episodes.toLocaleString('tr-TR')+'</b><span>Toplam Bölüm</span></div>'+
      '<div class="stat"><b>'+s.comments+'</b><span>Yorum</span></div>'+
      '<div class="stat"><b>'+s.tickets+'</b><span>Destek Talebi</span></div>'+
      '<div class="stat"><b>'+s.views.toLocaleString('tr-TR')+'</b><span>Tahmini İzlenme</span></div>'+
    '</div>'+
    '<div class="sec-head" style="margin-top:28px"><h3 class="display">Haftalık İzlenme Trendi</h3></div>'+
    '<div class="chart">'+s.days.map(d=>'<div class="bar"><i style="height:'+d.v+'%"></i><span>'+esc(d.label)+'</span></div>').join('')+'</div>'+
    '<div class="sec-head" style="margin-top:28px"><h3 class="display">En Çok İzlenenler</h3></div>'+
    '<div class="rank-list">'+s.top.map((a,i)=>'<div class="rank-item" data-act="go" data-href="#/anime/'+a.id+'"><span class="rank-num">'+String(i+1).padStart(2,'0')+'</span><div class="rank-poster" style="--c1:'+a.colors[0]+';--c2:'+a.colors[1]+'">'+esc(a.jp.charAt(0))+'</div><div class="rank-info"><h4>'+esc(a.title)+'</h4><p>'+a.episodeCount+' bölüm · ★ '+a.rating.toFixed(1)+'</p></div><div class="rank-score"><b>'+(((DB.views[a.id]||0)+a.popularity*37)).toLocaleString('tr-TR')+'</b><span>izlenme</span></div></div>').join('')+'</div>';
  }
  else if(adminTab==='anime'){
    const list = API.list();
    body = '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px">'+
      '<input class="inp" id="adminAnimeSearch" placeholder="Anime ara..." style="max-width:320px" value="">'+
      '<button class="btn btn-primary btn-sm" data-act="admin-anime-new">+ Yeni Anime Ekle</button></div>'+
    '<div class="tbl-wrap"><table class="tbl" id="adminAnimeTable"><thead><tr><th>Anime</th><th>Tür</th><th>Yıl</th><th>Bölüm</th><th>Puan</th><th>Durum</th><th></th></tr></thead><tbody>'+
    list.map(a=>'<tr data-search="'+esc((a.title+' '+a.jp+' '+a.studio).toLowerCase())+'">'+
      '<td><b>'+esc(a.title)+'</b><div class="small muted">'+esc(a.jp)+'</div></td>'+
      '<td class="small muted">'+esc(a.genres.slice(0,2).join(', '))+'</td>'+
      '<td>'+a.year+'</td><td>'+a.episodeCount+'</td><td class="accent3">★ '+a.rating.toFixed(1)+'</td>'+
      '<td><span class="status '+(/Devam/.test(a.status)?'answered':'closed')+'">'+esc(a.status)+'</span></td>'+
      '<td style="white-space:nowrap"><button class="btn btn-sm" data-act="admin-anime-edit" data-id="'+a.id+'">Düzenle</button> <button class="btn btn-sm" data-act="admin-anime-del" data-id="'+a.id+'" style="color:#ff6b6b">Sil</button></td>'+
    '</tr>').join('')+'</tbody></table></div>';
  }
  else if(adminTab==='episode'){
    const list = API.list();
    body = '<form class="comment-form" data-form="admin-episode" style="max-width:760px">'+
      '<b>Yeni Bölüm Ekle</b>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:10px">'+
        '<label class="f" style="margin:0"><span>Anime</span><select class="inp" name="animeId" id="epAnime" required>'+list.map(a=>'<option value="'+a.id+'">'+esc(a.title)+'</option>').join('')+'</select></label>'+
        '<label class="f" style="margin:0"><span>Sezon</span><select class="inp" name="season" id="epSeason" required></select></label>'+
        '<label class="f" style="margin:0"><span>Bölüm No</span><input class="inp" name="no" type="number" min="1" max="1200" value="1" required></label>'+
        '<label class="f" style="margin:0"><span>Bölüm Adı</span><input class="inp" name="title" placeholder="Örn: Karanlığın Eşiği" maxlength="60"></label>'+
        '<label class="f" style="margin:0"><span>Süre (dk)</span><input class="inp" name="dur" type="number" min="5" max="180" value="24"></label>'+
      '</div>'+
      '<button class="btn btn-primary btn-sm" type="submit">Bölümü Ekle</button>'+
      '<div class="err" data-err></div>'+
    '</form>'+
    '<div class="tbl-wrap" style="margin-top:8px"><table class="tbl"><thead><tr><th>Anime</th><th>Sezon</th><th>Bölüm Sayısı</th><th>Son Bölüm</th><th></th></tr></thead><tbody>'+
      list.map(a=>{ const last=a.seasons[a.seasons.length-1]; const eps=API.episodes(a.id,last.n); return '<tr><td><b>'+esc(a.title)+'</b></td><td>'+a.seasons.length+' sezon</td><td>'+a.episodeCount+'</td><td class="small muted">'+last.n+'. Sezon '+eps.length+'. Bölüm</td><td><a class="btn btn-sm" href="#/anime/'+a.id+'">Bölümleri Gör</a></td></tr>'; }).join('')+
    '</tbody></table></div>';
  }
  else if(adminTab==='comments'){
    const list = DB.comments.slice().sort((a,b)=>b.createdAt-a.createdAt);
    body = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kullanıcı</th><th>İçerik</th><th>Yorum</th><th>Tarih</th><th></th></tr></thead><tbody>'+
      (list.length? list.map(c=>{
        const [aid]=c.key.split(':');
        const a=API.get(aid);
        return '<tr><td><b>'+esc(c.userName)+'</b></td><td class="small muted">'+esc(a? a.title : c.key)+(c.key.includes(':')?' / Bölüm Yorumu':'')+'</td>'+
        '<td class="small">'+esc(c.text.slice(0,90))+(c.text.length>90?'…':'')+(c.spoiler?' <span class="spoiler-tag">Spoiler</span>':'')+'</td>'+
        '<td class="small muted">'+timeAgo(c.createdAt)+'</td>'+
        '<td><button class="btn btn-sm" data-act="admin-comment-del" data-id="'+c.id+'" style="color:#ff6b6b">Sil</button></td></tr>';
      }).join('') : '<tr><td colspan="5" class="muted small">Yorum bulunmuyor.</td></tr>')+'</tbody></table></div>';
  }
  else if(adminTab==='tickets'){
    body = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Konu</th><th>Kullanıcı</th><th>Kategori</th><th>Durum</th><th>Mesaj</th><th></th></tr></thead><tbody>'+
      (DB.tickets.length? DB.tickets.map(t=>'<tr>'+
        '<td><b>'+esc(t.subject)+'</b><div class="small muted">'+timeAgo(t.createdAt)+'</div></td>'+
        '<td class="small">'+esc(t.name)+'<div class="muted">'+esc(t.email||'')+'</div></td>'+
        '<td class="small muted">'+esc(t.category)+'</td>'+
        '<td><select class="inp" style="padding:.35rem .5rem;font-size:.76rem" data-act="admin-ticket-status" data-id="'+t.id+'">'+
          ['Açık','Yanıtlandı','Kapalı'].map(s=>'<option '+(t.status===s?'selected':'')+'>'+s+'</option>').join('')+'</select></td>'+
        '<td class="small" style="max-width:280px">'+esc(t.message.slice(0,90))+(t.message.length>90?'…':'')+
          (t.replies||[]).map(r=>'<div class="t-reply"><b>'+esc(r.by)+':</b> '+esc(r.text)+'</div>').join('')+'</td>'+
        '<td style="white-space:nowrap"><button class="btn btn-sm" data-act="admin-ticket-reply" data-id="'+t.id+'">Yanıtla</button> <button class="btn btn-sm" data-act="admin-ticket-del" data-id="'+t.id+'" style="color:#ff6b6b">Sil</button></td>'+
      '</tr>').join('') : '<tr><td colspan="6" class="muted small">Destek talebi yok.</td></tr>')+'</tbody></table></div>';
  }
  else if(adminTab==='genres'){
    const counts = {}; API.list().forEach(a=>a.genres.forEach(g=>counts[g]=(counts[g]||0)+1));
    body = '<form class="comment-form" data-form="admin-genre" style="max-width:520px;display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">'+
      '<label class="f" style="margin:0;flex:1;min-width:200px"><span>Yeni Tür Ekle</span><input class="inp" name="genre" placeholder="Örn: Müzik" required maxlength="24"></label>'+
      '<button class="btn btn-primary btn-sm" type="submit">Ekle</button><div class="err" data-err></div></form>'+
    '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tür</th><th>Yapım Sayısı</th><th></th></tr></thead><tbody>'+
      DB.genres.map(g=>'<tr><td><b>'+esc(g)+'</b></td><td>'+(counts[g]||0)+' anime</td><td><button class="btn btn-sm" data-act="admin-genre-del" data-genre="'+esc(g)+'" style="color:#ff6b6b">Sil</button></td></tr>').join('')+
    '</tbody></table></div>';
  }

  return '<section class="sec" style="margin-top:26px">'+
  '<div class="sec-head"><div><span class="kicker">Yönetim</span><h2 class="display">Yönetim Paneli</h2>'+
  '<p class="sec-sub">Anime, bölüm, yorum, destek talebi ve tür yönetimi; site istatistikleri.</p></div>'+
  '<button class="btn btn-sm" data-act="admin-logout">Oturumu Kapat</button></div>'+
  '<div class="tabs violet">'+tabs.map(([k,l])=>'<button class="'+(adminTab===k?'on':'')+'" data-act="admin-tab" data-tab="'+k+'">'+l+'</button>').join('')+'</div>'+
  body+'</section>';
}

