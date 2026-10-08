'use strict';
/* Change olayları */
document.addEventListener('change',(e)=>{
  const el=e.target.closest('[data-act]'); if(!el) return;
  if(el.dataset.act==='set-list'){
    const u=me();
    if(!u){ toast('İzleme listesi için giriş yapmalısın.','warn','Giriş gerekli'); el.value=''; authModal('login'); return; }
    API.setList(el.dataset.id, el.value);
    toast(el.value? 'İzleme listesine eklendi: '+el.value : 'Listeden çıkarıldı.', el.value?'ok':'');
    render();
  }
  if(el.dataset.act==='watch-season'){
    location.hash='#/izle/'+el.dataset.id+'/'+el.value+'/1';
  }
  if(el.dataset.act==='admin-ticket-status'){
    const t=DB.tickets.find(x=>x.id===el.dataset.id);
    t.status=el.value; save(); Remote.patchTicket(t.id,{status:el.value}); toast('Talep durumu: '+el.value,'ok','Yönetim');
  }
});

/* Puanlama (tıklama delegasyonu, data-act="rate" sarmalayıcı) */
document.addEventListener('click',(e)=>{
  const wrap=e.target.closest('.stars');
  if(!wrap) return;
  const btn=e.target.closest('button[data-v]'); if(!btn) return;
  const u=me();
  if(!u){ toast('Puan vermek için giriş yapmalısın.','warn','Giriş gerekli'); authModal('login'); return; }
  const id=wrap.dataset.id, v=Number(btn.dataset.v);
  API.rate(id, v);
  $$('button[data-v]',wrap).forEach(b=>b.classList.toggle('on', Number(b.dataset.v)<=v));
  toast('Puanın kaydedildi: '+v+'/10','ok','Puanlama');
});

/* Form gönderimleri */
document.addEventListener('submit', async (e)=>{
  const form=e.target.closest('form[data-form]'); if(!form) return;
  e.preventDefault();
  const type=form.dataset.form;
  const err=form.querySelector('[data-err]');
  const showErr=(m)=>{ if(err){ err.textContent=m; err.classList.add('show'); } };
  const clearErr=()=>{ if(err){ err.textContent=''; err.classList.remove('show'); } };
  clearErr();
  const data=Object.fromEntries(new FormData(form).entries());

  if(type==='admin-login'){
    if(!data.password) return showErr('Parola gerekli.');
    try{ await Remote.adminLogin(data.password); }catch(err){ return showErr(err.message||'Giriş başarısız.'); }
    toast('Yönetici girişi başarılı.','ok','Yönetim'); render(); return;
  }
  if(type==='login'){
    if(!data.email||!data.pass) return showErr('Lütfen tüm alanları doldur.');
    if(!/^\S+@\S+\.\S+$/.test(data.email)) return showErr('Geçerli bir e-posta adresi gir.');
    const r=API.login(data.email.trim(), data.pass);
    if(r.error) return showErr(r.error);
    closeModal(); toast('Hoş geldin, '+r.user.name+'!','ok','Giriş başarılı'); render(); return;
  }
  if(type==='register'){
    if(!data.name||data.name.trim().length<2) return showErr('Ad Soyad en az 2 karakter olmalı.');
    if(!/^\S+@\S+\.\S+$/.test(data.email||'')) return showErr('Geçerli bir e-posta adresi gir.');
    if(!data.pass||data.pass.length<6) return showErr('Şifre en az 6 karakter olmalı.');
    if(data.pass!==data.pass2) return showErr('Şifreler birbiriyle uyuşmuyor.');
    if(!data.terms) return showErr('Kullanım şartlarını kabul etmelisin.');
    const r=API.register(data.name.trim(), data.email.trim(), data.pass);
    if(r.error) return showErr(r.error);
    closeModal(); toast('Hesabın oluşturuldu. İyi seyirler!','ok','Kayıt başarılı'); render(); return;
  }
  if(type==='comment'){
    const u=me(); if(!u){ toast('Yorum yazmak için giriş yapmalısın.','warn'); return; }
    const text=(data.text||'').trim();
    if(text.length<2) return showErr('Yorum en az 2 karakter olmalı.');
    if(text.length>800) return showErr('Yorum en fazla 800 karakter olabilir.');
    API.addComment(form.dataset.key, text, !!data.spoiler);
    toast('Yorumun yayınlandı.','ok','Topluluk'); render(); return;
  }
  if(type==='ticket'){
    const u=me();
    if(!u){
      if(!data.name||data.name.trim().length<2) return showErr('Ad Soyad en az 2 karakter olmalı.');
      if(!/^\S+@\S+\.\S+$/.test(data.email||'')) return showErr('Geçerli bir e-posta adresi gir.');
    }
    if(!data.subject||data.subject.trim().length<3) return showErr('Konu en az 3 karakter olmalı.');
    if(!data.message||data.message.trim().length<10) return showErr('Mesaj en az 10 karakter olmalı.');
    try{ await API.createTicket({
      userId: u? u.id : null,
      name: u? u.name : data.name.trim(),
      email: u? u.email : data.email.trim(),
      category: data.category, subject: data.subject.trim(), message: data.message.trim()
    }); }catch(err){ return showErr(err.message||'Talep gönderilemedi.'); }
    toast('Destek talebin oluşturuldu. En kısa sürede dönüş yapacağız.','ok','Destek');
    renderSupport();
    return;
  }
  if(type==='profile'){
    const u=me(); if(!u) return;
    if(!data.name||data.name.trim().length<2) return showErr('Ad Soyad en az 2 karakter olmalı.');
    if(!/^\S+@\S+\.\S+$/.test(data.email||'')) return showErr('Geçerli bir e-posta adresi gir.');
    if(DB.users.some(x=>x.id!==u.id && x.email.toLowerCase()===data.email.toLowerCase())) return showErr('Bu e-posta başka bir hesapta kullanılıyor.');
    if(data.pass && data.pass.length<6) return showErr('Yeni şifre en az 6 karakter olmalı.');
    const patch={name:data.name.trim(), email:data.email.trim(), color:data.color};
    if(data.pass) patch.pass=hsh(data.pass);
    API.updateUser(u.id, patch);
    toast('Profil bilgilerin güncellendi.','ok','Hesap'); render(); return;
  }
  if(type==='admin-anime'){
    const title=(data.title||'').trim();
    if(title.length<2) return showErr('Anime adı en az 2 karakter olmalı.');
    const year=Number(data.year);
    if(!year||year<1950||year>2035) return showErr('Geçerli bir yayın yılı gir (1950-2035).');
    const rating=Number(data.rating);
    if(isNaN(rating)||rating<0||rating>10) return showErr('Puan 0 ile 10 arasında olmalı.');
    if(!data.synopsis||data.synopsis.trim().length<10) return showErr('Açıklama en az 10 karakter olmalı.');
    const genres=$$('#genrePick .chip.on').map(c=>c.dataset.genre);
    if(!genres.length) return showErr('En az bir tür seçmelisin.');
    const rows=$$('#seasonRows .season-row');
    if(!rows.length) return showErr('En az bir sezon eklemelisin.');
    const seasons=rows.map(r=>({ n:Number($('input[name="sNo"]',r).value)||1, e:Number($('input[name="sEp"]',r).value)||1, y:Number($('input[name="sY"]',r).value)||year }));
    if(seasons.some(s=>s.e<1)) return showErr('Bölüm sayısı en az 1 olmalı.');
    const payload={
      title, jp:(data.jp||'').trim(), year, rating, status:data.status, age:data.age,
      studio:(data.studio||'').trim(), director:(data.director||'').trim(), day:data.day||null,
      popularity:Number(data.popularity)||60, synopsis:data.synopsis.trim(),
      tags:(data.tags||'').split(',').map(t=>t.trim()).filter(Boolean).slice(0,8),
      genres, seasons
    };
    API.saveAnime(payload, form.dataset.id||null);
    closeModal(); toast(form.dataset.id? 'Anime güncellendi.':'Yeni anime eklendi.','ok','Yönetim paneli');
    render(); return;
  }
  if(type==='admin-episode'){
    const animeId=data.animeId, season=Number(data.season), no=Number(data.no);
    if(!animeId) return showErr('Anime seçmelisin.');
    if(!no||no<1||no>1200) return showErr('Geçerli bir bölüm numarası gir.');
    const a=API.get(animeId);
    const dur=(Number(data.dur)||24)*60;
    API.addEpisode(animeId, season, no, (data.title||'').trim(), dur);
    toast(a.title+' · '+season+'. Sezon '+no+'. Bölüm eklendi.','ok','Yönetim paneli');
    render(); return;
  }
  if(type==='admin-genre'){
    const g=(data.genre||'').trim();
    if(g.length<2) return showErr('Tür adı en az 2 karakter olmalı.');
    if(DB.genres.some(x=>x.toLocaleLowerCase('tr')===g.toLocaleLowerCase('tr'))) return showErr('Bu tür zaten mevcut.');
    DB.genres.push(g); save(); Remote.pushContent(); toast('Tür eklendi: '+g,'ok','Yönetim'); render(); return;
  }
});

/* ESC ile kapatma */
document.addEventListener('keydown',(e)=>{
  if(e.key==='Escape'){ if($('#overlayRoot').innerHTML) closeModal(); closeSupport(); }
});
