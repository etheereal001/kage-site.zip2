'use strict';
/* ---------------- Başlatma ---------------- */
function boot(){
  loadDB();
  try{ SESSION = localStorage.getItem(KEY_S) || null; }catch(e){ SESSION=null; }
  if(SESSION && !me()) SESSION=null;
  Remote.restoreAdmin();
  $('#year').textContent=new Date().getFullYear();
  initSearch();
  window.addEventListener('hashchange', render);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden && PV.playing) togglePlay(); });
  render();
  /* Sunucudaki güncel içerik gelince (kullanıcı yazmıyorsa, oynatıcıda değilse) yeniden çiz */
  Remote.sync().then(changed=>{
    const ae=document.activeElement;
    const typing = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName);
    if(changed && !typing && !/^#\/izle\//.test(location.hash) && !$('#overlayRoot').innerHTML) render();
  });
  setTimeout(()=>{ if(!me()) toast('Favori ve izleme listesi için ücretsiz hesap oluşturabilirsin.','ok','KAGE’ye hoş geldin'); }, 1600);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
