'use strict';
/* ---------------- Destek & hızlı arama paneli ---------------- */
let supportTab='search';
function openSupport(tab){
  supportTab = tab||supportTab;
  $('#support').classList.add('show');
  const badge=$('#fabBadge');
  const mine=API.myTickets().filter(t=>t.status==='Açık').length;
  badge.textContent = String(mine);
  badge.style.display = 'block';
  renderSupport();
  Remote.refreshMyTickets().then(ok=>{ if(ok && $('#support').classList.contains('show') && supportTab==='ticket') renderSupport(); });
}
function closeSupport(){ $('#support').classList.remove('show'); }
function renderSupport(){
  const body=$('#supportBody');
  const u=me();
  if(supportTab==='search'){
    body.innerHTML =
      '<label class="f" style="margin:0 0 12px"><span>Anime Ara</span><input class="inp" id="supSearch" placeholder="Anime adı yaz..." autocomplete="off"></label>'+
      '<div id="supResults"><p class="muted small" style="margin:0">Aramak istediğin animeyi yaz; sonuçlar anında listelenir.</p></div>'+
      '<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:13px">'+
        '<p class="muted small" style="margin:0 0 10px">Popüler aramalar</p>'+
        '<div class="season-pills">'+['Attack on Titan','Jujutsu Kaisen','Frieren','One Piece','Death Note'].map(t=>'<button class="chip" data-sup-q="'+esc(t)+'">'+esc(t)+'</button>').join('')+'</div>'+
      '</div>'+
      '<div style="margin-top:16px;border-top:1px solid var(--line);padding-top:13px">'+
        '<p class="muted small" style="margin:0 0 10px">Aradığını bulamadın mı? Bize yaz.</p>'+
        '<button class="btn btn-primary btn-sm btn-block" data-act="support-goto-ticket">Destek Talebi Oluştur</button>'+
      '</div>';
    const s=$('#supSearch');
    const run=()=>{
      const v=s.value.trim();
      const box=$('#supResults');
      if(!v){ box.innerHTML='<p class="muted small" style="margin:0">Aramak istediğin animeyi yaz; sonuçlar anında listelenir.</p>'; return; }
      const res=API.search({q:v,sort:'pop',limit:8});
      box.innerHTML = res.length? '<div style="display:flex;flex-direction:column;gap:4px">'+res.map(a=>{
        const [c1,c2]=a.colors;
        return '<a href="#/anime/'+a.id+'" data-act="close-support" style="display:flex;gap:11px;align-items:center;padding:8px;border-radius:11px;transition:.18s" onmouseover="this.style.background=\'#16161f\'" onmouseout="this.style.background=\'transparent\'">'+
          '<span class="dposter" style="--c1:'+c1+';--c2:'+c2+'"></span>'+
          '<span><b style="font-size:.84rem">'+esc(a.title)+'</b><i style="display:block;font-style:normal;font-size:.72rem;color:var(--muted)">'+a.year+' · '+a.episodeCount+' bölüm · ★ '+a.rating.toFixed(1)+'</i></span>'+
        '</a>';
      }).join('')+'</div>' : '<p class="muted small" style="margin:0">Sonuç bulunamadı.</p>';
    };
    s.addEventListener('input',run);
    $$('[data-sup-q]').forEach(b=>b.addEventListener('click',()=>{ s.value=b.dataset.supQ; run(); }));
  } else {
    const tickets=API.myTickets();
    body.innerHTML =
      '<form data-form="ticket" style="display:grid;gap:12px">'+
        (u? '' : '<label class="f" style="margin:0"><span>Ad Soyad</span><input class="inp" name="name" required maxlength="40" placeholder="Adın"></label>'+
                 '<label class="f" style="margin:0"><span>E-posta</span><input class="inp" name="email" type="email" required placeholder="ornek@mail.com"></label>')+
        '<label class="f" style="margin:0"><span>Konu</span><input class="inp" name="subject" required maxlength="80" placeholder="Kısa bir başlık"></label>'+
        '<label class="f" style="margin:0"><span>Kategori</span><select class="inp" name="category"><option>Oynatıcı</option><option>Hesap</option><option>İçerik / Bölüm</option><option>Öneri</option><option>Hata Bildirimi</option><option>Diğer</option></select></label>'+
        '<label class="f" style="margin:0"><span>Mesaj</span><textarea class="inp" name="message" required minlength="10" maxlength="1000" placeholder="Sorununu veya talebini detaylı anlat..."></textarea></label>'+
        '<button class="btn btn-primary btn-sm btn-block" type="submit">Talebi Gönder</button>'+
        '<div class="err" data-err></div>'+
      '</form>'+
      '<div style="margin-top:18px;border-top:1px solid var(--line);padding-top:14px">'+
        '<b style="font-size:.86rem">Taleplerim ('+tickets.length+')</b>'+
        '<div style="margin-top:10px">'+(tickets.length? tickets.map(t=>ticketHTML(t)).join('') : '<p class="muted small">Henüz destek talebin yok.</p>')+'</div>'+
      '</div>';
  }
}
function ticketHTML(t){
  return '<div class="ticket">'+
    '<div class="t-top"><b>'+esc(t.subject)+'</b><span class="status '+(t.status==='Yanıtlandı'?'answered':t.status==='Kapalı'?'closed':'open')+'">'+esc(t.status)+'</span></div>'+
    '<p>'+esc(t.category)+' · '+timeAgo(t.createdAt)+'</p>'+
    '<p style="margin-top:6px;color:#c9c9d6">'+esc(t.message)+'</p>'+
    (t.replies||[]).map(r=>'<div class="t-reply"><b>'+esc(r.by)+':</b> '+esc(r.text)+'</div>').join('')+
  '</div>';
}

