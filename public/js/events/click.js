'use strict';
/* ---------------- Global olay delegasyonu ---------------- */
document.addEventListener('click', async (e)=>{
  const el = e.target.closest('[data-act]');
  if(!el) return;
  const act = el.dataset.act;

  switch(act){
    case 'go': {
      const href=el.dataset.href;
      if(href){ e.preventDefault(); location.hash=href.replace(/^#/,''); }
      break;
    }
    case 'toggle-menu': {
      const mm=$('#mobileMenu'); const open=mm.classList.toggle('show');
      document.body.style.overflow = open? 'hidden':'';
      break;
    }
    case 'close-menu': {
      $('#mobileMenu').classList.remove('show'); document.body.style.overflow='';
      break;
    }
    case 'toggle-user': {
      const p=$('#userPop'); if(p) p.classList.toggle('show');
      break;
    }
    case 'open-auth': { e.preventDefault(); authModal(el.dataset.mode||'login'); break; }
    case 'auth-tab': { authModal(el.dataset.mode); break; }
    case 'close-modal': {
      if(el.classList.contains('modal-bg')){
        if(e.target===el) closeModal();
      } else closeModal();
      break;
    }
    case 'logout': {
      API.logout(); closeModal();
      $('#userPop') && $('#userPop').classList.remove('show');
      toast('Çıkış yapıldı. Görüşürüz!','ok','Oturum');
      render();
      break;
    }
    case 'admin-logout': {
      Remote.adminLogout(); toast('Yönetici oturumu kapatıldı.','ok','Yönetim'); render(); break;
    }
    case 'toggle-fav': {
      e.stopPropagation();
      const u=me();
      if(!u){ toast('Favorilere eklemek için giriş yapmalısın.','warn','Giriş gerekli'); authModal('login'); break; }
      const on=API.toggleFav(el.dataset.id);
      toast(on? 'Favorilere eklendi.' : 'Favorilerden çıkarıldı.', on?'ok':'', 'Favoriler');
      render();
      break;
    }
    case 'play-first': {
      e.stopPropagation();
      const id=el.dataset.id; const a=API.get(id);
      if(!a) break;
      const r=API.resumeFor(id);
      location.hash = r? '#/izle/'+id+'/'+r.s+'/'+r.e : '#/izle/'+id+'/'+a.seasons[0].n+'/1';
      break;
    }
    case 'season-select': {
      const id=el.dataset.id, s=el.dataset.season;
      const a=API.get(id);
      location.hash='#/anime/'+id+'/'+s;
      break;
    }
    case 'hero-go': { if(window.__heroGo) window.__heroGo(Number(el.dataset.i)); break; }
    case 'home-genre': break;
    case 'clear-filters': break;
    case 'list-tab': break;
    case 'reveal': {
      const p=el.classList.contains('spoiler-blur')? el : el.parentElement.querySelector('.spoiler-blur');
      if(p) p.classList.toggle('shown');
      break;
    }
    case 'like-comment': {
      const r=API.likeComment(el.dataset.id);
      if(r && r.needAuth){ toast('Beğenmek için giriş yapmalısın.','warn','Giriş gerekli'); authModal('login'); break; }
      render();
      break;
    }
    case 'del-comment': {
      if(!confirm('Bu yorumu silmek istediğine emin misin?')) break;
      API.deleteComment(el.dataset.id); toast('Yorum silindi.','ok'); render(); break;
    }
    case 'set-list': break;
    case 'random-anime': break;
    case 'search-page-go': {
      const v=$('#pgSearch').value.trim();
      location.hash = v? '#/arama?q='+encodeURIComponent(v) : '#/arama';
      break;
    }
    /* pv kontrolleri initPlayer içinde bağlanır */
    /* Destek paneli */
    case 'open-support': { e.preventDefault(); openSupport(); break; }
    case 'close-support': { closeSupport(); break; }
    case 'support-goto-ticket': { supportTab='ticket'; $$('.sp-tabs button').forEach(b=>b.classList.toggle('on', b.dataset.tab==='ticket')); renderSupport(); break; }
    case 'support-tab': {
      supportTab=el.dataset.tab;
      $$('.sp-tabs button').forEach(b=>b.classList.toggle('on', b.dataset.tab===supportTab));
      renderSupport(); break;
    }
    /* Yönetim */
    case 'admin-tab': break;
    case 'admin-anime-new': { adminAnimeModal(null); break; }
    case 'admin-anime-edit': { adminAnimeModal(el.dataset.id); break; }
    case 'admin-anime-del': {
      const a=API.get(el.dataset.id);
      if(!confirm('"'+a.title+'" animelerden silinsin mi?')) break;
      API.removeAnime(el.dataset.id); toast('Anime silindi.','ok','Yönetim'); render(); break;
    }
    case 'add-season': {
      const rows=$('#seasonRows');
      const n=rows.children.length+1;
      rows.insertAdjacentHTML('beforeend', seasonRowHTML({n:n, e:12, y:new Date().getFullYear()}));
      break;
    }
    case 'del-season': {
      const rows=$('#seasonRows');
      if(rows.children.length<=1){ toast('En az bir sezon olmalı.','warn'); break; }
      el.closest('.season-row').remove();
      break;
    }
    case 'admin-comment-del': {
      if(!confirm('Yorum silinsin mi?')) break;
      API.deleteComment(el.dataset.id); toast('Yorum silindi.','ok','Yönetim'); render(); break;
    }
    case 'admin-genre-del': {
      const g=el.dataset.genre;
      const used=API.list().some(a=>a.genres.includes(g));
      if(used){ toast('"'+g+'" türü kullanımda olduğu için silinemez.','warn','Yönetim'); break; }
      DB.genres=DB.genres.filter(x=>x!==g); save(); Remote.pushContent(); toast('Tür silindi.','ok','Yönetim'); render(); break;
    }
    case 'admin-ticket-reply': {
      const t=DB.tickets.find(x=>x.id===el.dataset.id);
      const text=prompt('Yanıtını yaz:', t.replies.length? '': 'Merhaba, talebiniz için teşekkürler.');
      if(!text) break;
      const reply={by:'Yönetim', text, at:Date.now()};
      t.replies.push(reply); t.status='Yanıtlandı'; save(); Remote.patchTicket(t.id,{reply, status:'Yanıtlandı'}); toast('Yanıt gönderildi.','ok','Destek'); render(); break;
    }
    case 'admin-ticket-del': {
      if(!confirm('Talep silinsin mi?')) break;
      DB.tickets=DB.tickets.filter(x=>x.id!==el.dataset.id); save(); Remote.deleteTicket(el.dataset.id); toast('Talep silindi.','ok','Yönetim'); render(); break;
    }
  }
});
