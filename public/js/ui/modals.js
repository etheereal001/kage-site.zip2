'use strict';
/* ---------------- Modal: giriş / kayıt ---------------- */
function openModal(html){ $('#overlayRoot').innerHTML=html; document.body.style.overflow='hidden'; }
function closeModal(){ $('#overlayRoot').innerHTML=''; document.body.style.overflow=''; }
function authModal(mode){
  const login =
    '<form data-form="login" style="display:grid;gap:4px">'+
      '<label class="f"><span>E-posta</span><input class="inp" name="email" type="email" required placeholder="ornek@mail.com"></label>'+
      '<label class="f"><span>Şifre</span><input class="inp" name="pass" type="password" required minlength="6" placeholder="••••••"></label>'+
      '<button class="btn btn-primary btn-block" type="submit">Giriş Yap</button>'+
      '<div class="err" data-err></div>'+
    '</form>';
  const reg =
    '<form data-form="register" style="display:grid;gap:4px">'+
      '<label class="f"><span>Ad Soyad</span><input class="inp" name="name" required minlength="2" maxlength="40" placeholder="Adın Soyadın"></label>'+
      '<label class="f"><span>E-posta</span><input class="inp" name="email" type="email" required placeholder="ornek@mail.com"></label>'+
      '<label class="f"><span>Şifre</span><input class="inp" name="pass" type="password" required minlength="6" placeholder="En az 6 karakter"></label>'+
      '<label class="f"><span>Şifre Tekrar</span><input class="inp" name="pass2" type="password" required minlength="6" placeholder="Şifreyi tekrarla"></label>'+
      '<label class="switch" style="margin:6px 0 12px"><input type="checkbox" name="terms" required> <span>Kullanım şartlarını kabul ediyorum</span></label>'+
      '<button class="btn btn-primary btn-block" type="submit">Ücretsiz Kayıt Ol</button>'+
      '<div class="err" data-err></div>'+
    '</form>';
  openModal(
    '<div class="modal-bg" data-act="close-modal"><div class="modal">'+
      '<button class="modal-x" data-act="close-modal" aria-label="Kapat">✕</button>'+
      '<h3>'+(mode==='register'?'KAGE’ye Katıl':'Tekrar Hoş Geldin')+'</h3>'+
      '<p class="muted small" style="margin:0 0 18px">'+(mode==='register'?'Favori listesi, izleme geçmişi ve yorumlar için hesap oluştur.':'Kaldığın yerden devam etmek için giriş yap.')+'</p>'+
      '<div class="modal-tabs">'+
        '<button class="'+(mode!=='register'?'on':'')+'" data-act="auth-tab" data-mode="login">Giriş Yap</button>'+
        '<button class="'+(mode==='register'?'on':'')+'" data-act="auth-tab" data-mode="register">Kayıt Ol</button>'+
      '</div>'+
      (mode==='register'? reg : login)+
      '<p class="modal-hint">Hesap bilgilerin, favorilerin ve listen yalnızca bu tarayıcıda saklanır.</p>'+
    '</div></div>'
  );
}

/* ---------------- Admin: anime formu ---------------- */
function adminAnimeModal(id){
  const editing = id? API.get(id) : null;
  const g = API.genres();
  const seasons = editing? editing.seasons : [{n:1,e:12,y:new Date().getFullYear()}];
  openModal(
  '<div class="modal-bg" data-act="close-modal"><div class="modal" style="width:min(760px,100%)">'+
    '<button class="modal-x" data-act="close-modal">✕</button>'+
    '<h3>'+(editing?'Animeyi Düzenle':'Yeni Anime Ekle')+'</h3>'+
    '<p class="muted small" style="margin:0 0 18px">Zorunlu alanları doldur, sezon ve bölüm sayılarını belirle.</p>'+
    '<form data-form="admin-anime" data-id="'+(editing?editing.id:'')+'" style="display:grid;gap:2px">'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'+
        '<label class="f"><span>Anime Adı *</span><input class="inp" name="title" required minlength="2" maxlength="80" value="'+esc(editing?editing.title:'')+'"></label>'+
        '<label class="f"><span>Japonca Adı</span><input class="inp" name="jp" maxlength="80" value="'+esc(editing?editing.jp:'')+'"></label>'+
        '<label class="f"><span>Yayın Yılı *</span><input class="inp" name="year" type="number" min="1950" max="2035" required value="'+(editing?editing.year:new Date().getFullYear())+'"></label>'+
        '<label class="f"><span>Puan (0-10) *</span><input class="inp" name="rating" type="number" min="0" max="10" step="0.1" required value="'+(editing?editing.rating:8)+'"></label>'+
        '<label class="f"><span>Durum *</span><select class="inp" name="status"><option '+(editing&&editing.status==='Devam Ediyor'?'selected':'')+'>Devam Ediyor</option><option '+(editing&&editing.status==='Tamamlandı'?'selected':'')+'>Tamamlandı</option></select></label>'+
        '<label class="f"><span>Yaş Sınırı</span><select class="inp" name="age">'+['7+','13+','16+','18+'].map(x=>'<option '+(editing&&editing.age===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
        '<label class="f"><span>Stüdyo</span><input class="inp" name="studio" maxlength="60" value="'+esc(editing?editing.studio:'')+'"></label>'+
        '<label class="f"><span>Yönetmen</span><input class="inp" name="director" maxlength="60" value="'+esc(editing?editing.director:'')+'"></label>'+
        '<label class="f"><span>Yayın Günü</span><select class="inp" name="day"><option value="">-</option>'+DAYS.map(d=>'<option '+(editing&&editing.day===d?'selected':'')+'>'+d+'</option>').join('')+'</select></label>'+
        '<label class="f"><span>Popülerlik (0-100)</span><input class="inp" name="popularity" type="number" min="0" max="100" value="'+(editing?editing.popularity:70)+'"></label>'+
      '</div>'+
      '<label class="f"><span>Açıklama *</span><textarea class="inp" name="synopsis" required minlength="10" maxlength="900">'+esc(editing?editing.synopsis:'')+'</textarea></label>'+
      '<label class="f"><span>Etiketler (virgülle ayır)</span><input class="inp" name="tags" maxlength="120" value="'+esc(editing?(editing.tags||[]).join(', '):'')+'"></label>'+
      '<div class="f"><span style="display:block;font-size:.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:7px">Türler *</span>'+
        '<div class="season-pills" id="genrePick">'+g.map(x=>'<button type="button" class="chip '+((editing&&editing.genres.includes(x))?'on':'')+'" data-genre="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div>'+
      '</div>'+
      '<div class="f"><span style="display:block;font-size:.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:7px">Sezonlar *</span>'+
        '<div id="seasonRows">'+seasons.map(s=>seasonRowHTML(s)).join('')+'</div>'+
        '<button type="button" class="btn btn-sm" data-act="add-season">+ Sezon Ekle</button>'+
      '</div>'+
      '<div style="display:flex;gap:10px;margin-top:10px"><button class="btn btn-primary" type="submit">'+(editing?'Değişiklikleri Kaydet':'Animeyi Ekle')+'</button><button type="button" class="btn" data-act="close-modal">İptal</button></div>'+
      '<div class="err" data-err></div>'+
    '</form>'+
  '</div></div>');
  const pick=$('#genrePick');
  pick.addEventListener('click',e=>{ const c=e.target.closest('.chip'); if(c){ c.classList.toggle('on'); } });
}
function seasonRowHTML(s){
  return '<div class="season-row" style="display:grid;grid-template-columns:repeat(3,1fr) auto;gap:8px;margin-bottom:8px">'+
    '<input class="inp" name="sNo" type="number" min="1" max="30" value="'+(s.n||1)+'" placeholder="Sezon" aria-label="Sezon no">'+
    '<input class="inp" name="sEp" type="number" min="1" max="1200" value="'+(s.e||12)+'" placeholder="Bölüm" aria-label="Bölüm sayısı">'+
    '<input class="inp" name="sY" type="number" min="1950" max="2035" value="'+(s.y||new Date().getFullYear())+'" placeholder="Yıl" aria-label="Sezon yılı">'+
    '<button type="button" class="btn btn-sm" data-act="del-season" style="color:#ff6b6b">✕</button>'+
  '</div>';
}

