'use strict';
/* ---------------- Yorum bileşeni ---------------- */
function commentsHTML(key, heading){
  const list = API.comments(key);
  const u = me();
  const form = u
    ? '<form class="comment-form" data-form="comment" data-key="'+esc(key)+'">'+
        '<textarea class="inp" name="text" placeholder="Düşüncelerini paylaş..." required minlength="2" maxlength="800"></textarea>'+
        '<div class="cf-row">'+
          '<label class="switch"><input type="checkbox" name="spoiler"> Spoiler içeriyor</label>'+
          '<button class="btn btn-primary btn-sm" type="submit">Yorum Gönder</button>'+
        '</div>'+
        '<div class="err" data-err></div>'+
      '</form>'
    : '<div class="comment-form" style="align-items:center;text-align:center">'+
        '<p class="muted" style="margin:0">Yorum yazmak için giriş yapmalısın.</p>'+
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn btn-primary btn-sm" data-act="open-auth" data-mode="login">Giriş Yap</button><button class="btn btn-sm" data-act="open-auth" data-mode="register">Kayıt Ol</button></div>'+
      '</div>';
  return '<div class="sec-head"><div><span class="kicker">Topluluk</span><h2 class="display">'+esc(heading)+'</h2>'+
    '<p class="sec-sub">'+list.length+' yorum · Spoiler içeren yorumlar otomatik olarak gizlenir.</p></div></div>'+
    form+
    '<div class="comment-list">'+(list.length? list.map(c=>commentHTML(c)).join('') :
      emptyState('💬','Henüz yorum yok','Bu içerik için ilk yorumu sen yaz ve topluluğun fikrini başlat.'))+'</div>';
}
function commentHTML(c){
  const u=me();
  const liked = u && c.likes.includes(u.id);
  const canDel = (u && u.id===c.userId) || isAdmin();
  const color = (DB.users.find(x=>x.id===c.userId)||{}).color || PALETTE[hashNum(c.userName)%PALETTE.length][0];
  return '<div class="comment">'+
    '<div class="c-av" style="background:'+color+'">'+esc(c.userName.trim().charAt(0).toUpperCase())+'</div>'+
    '<div class="c-body">'+
      '<div class="c-top"><b>'+esc(c.userName)+'</b><span>'+timeAgo(c.createdAt)+'</span>'+
        (c.spoiler?'<span class="spoiler-tag">Spoiler</span>':'')+'</div>'+
      '<p class="'+(c.spoiler?'spoiler-blur':'')+'" '+(c.spoiler?'data-act="reveal"':'' )+'>'+esc(c.text).replace(/\n/g,'<br>')+'</p>'+
      '<div class="c-acts">'+
        '<button class="cbtn '+(liked?'on':'')+'" data-act="like-comment" data-id="'+c.id+'">▲ Beğen <span>'+(c.likes.length||'')+'</span></button>'+
        (c.spoiler?'<button class="cbtn" data-act="reveal">Spoiler’ı Göster</button>':'')+
        (canDel?'<button class="cbtn" data-act="del-comment" data-id="'+c.id+'" style="color:#ff6b6b">Sil</button>':'')+
      '</div>'+
    '</div>'+
  '</div>';
}

