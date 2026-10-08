'use strict';
/* ---------------- Router ---------------- */
let heroTimer=null, revealObserver=null;
function parseHash(){
  const raw = location.hash.replace(/^#\/?/,'');
  const [path, qs] = raw.split('?');
  return { parts: path.split('/').filter(Boolean), q: new URLSearchParams(qs||'') };
}
function go(href){ location.hash = href.startsWith('#')? href.slice(1)?href:'#/' : '#/'+href; }
const NAV = [
  {href:'#/', label:'Ana Sayfa', key:''},
  {href:'#/animeler', label:'Animeler', key:'animeler'},
  {href:'#/kesfet', label:'Keşfet', key:'kesfet', cls:'nav-discover'},
  {href:'#/turler', label:'Türler', key:'turler'},
  {href:'#/populer', label:'Popüler', key:'populer'},
  {href:'#/yeni-bolumler', label:'Yeni Bölümler', key:'yeni-bolumler'},
  {href:'#/takvim', label:'Takvim', key:'takvim'},
  {href:'#/favoriler', label:'Favoriler', key:'favoriler'}
];
function renderNav(){
  const cur = parseHash().parts[0]||'';
  $('#navLinks').innerHTML = NAV.map(n=>'<a href="'+n.href+'" class="'+(n.cls||'')+' '+(cur===n.key?'active':'')+'">'+n.label+'</a>').join('');
  $('#mobileMenu').innerHTML =
    '<div class="mm-search"><input class="inp" id="mmSearch" placeholder="Anime ara..." aria-label="Anime ara"></div>'+
    NAV.map(n=>'<a href="'+n.href+'" data-act="close-menu">'+n.label+'<span>→</span></a>').join('')+
    '<a href="#/listem" data-act="close-menu">İzleme Listem<span>→</span></a>'+
    '<a href="#/profil" data-act="close-menu">Profilim<span>→</span></a>'+
    (isAdmin()?'<a href="#/admin" data-act="close-menu" style="color:var(--accent3)">Yönetim Paneli<span>→</span></a>':'')+
    '<div style="display:flex;gap:10px;margin-top:22px">'+
      (me()
        ? '<button class="btn btn-primary btn-block" data-act="logout">Çıkış Yap</button>'
        : '<button class="btn btn-primary" style="flex:1" data-act="open-auth" data-mode="login">Giriş Yap</button><button class="btn" style="flex:1" data-act="open-auth" data-mode="register">Kayıt Ol</button>')+
    '</div>';
}
function renderUserArea(){
  const u = me();
  const box = $('#userArea');
  if(!u){
    box.innerHTML='<button class="btn btn-primary btn-sm" data-act="open-auth" data-mode="login">Giriş / Kayıt</button>';
    return;
  }
  box.innerHTML =
    '<button class="avatar" data-act="toggle-user" style="background:'+u.color+'" aria-label="Hesap menüsü">'+esc(u.name.trim().charAt(0).toUpperCase())+'</button>'+
    '<div class="user-pop" id="userPop">'+
      '<div class="up-head"><b>'+esc(u.name)+'</b><span class="small muted">'+esc(u.email)+'</span>'+
        (isAdmin()?' <span class="status open" style="margin-top:6px;display:inline-block">Yönetici</span>':'')+
      '</div>'+
      '<a href="#/profil">👤 Profilim</a>'+
      '<a href="#/favoriler">♥ Favorilerim ('+Object.keys(DB.favs).length+')</a>'+
      '<a href="#/listem">📚 İzleme Listem ('+Object.keys(DB.lists).length+')</a>'+
      '<a href="#/yeni-bolumler">🆕 Yeni Bölümler</a>'+
      (isAdmin()?'<a href="#/admin" style="color:var(--accent3)">⚙ Yönetim Paneli</a>':'')+
      '<button data-act="open-support">✉ Destek Talebi</button>'+
      '<button data-act="logout" style="color:#ff6b6b">⏻ Çıkış Yap</button>'+
    '</div>';
}
function isAdmin(){ return !!ADMIN_TOKEN; }

