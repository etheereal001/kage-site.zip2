'use strict';
/* ---------------- İzleme sayfası ---------------- */
function viewWatch(id, seasonNo, epNo){
  const a = API.get(id);
  if(!a) return notFound();
  const sNo = Number(seasonNo) || a.seasons[0].n;
  const seasons = a.seasons;
  const s = seasons.find(x=>Number(x.n)===sNo) || seasons[0];
  const eps = API.episodes(a.id, s.n);
  const ep = eps.find(x=>Number(x.no)===Number(epNo)) || eps[0];
  const prev = eps.find(x=>x.no===ep.no-1);
  const next = eps.find(x=>x.no===ep.no+1);

  return '<div class="crumbs"><a href="#/">Ana Sayfa</a><span>›</span><a href="#/anime/'+a.id+'">'+esc(a.title)+'</a><span>›</span><span>'+s.n+'. Sezon '+ep.no+'. Bölüm</span></div>'+
  '<div class="split">'+
    '<div>'+
      '<div class="pv-wrap">'+
        '<div class="player" id="player" tabindex="0" aria-label="Video oynatıcı" style="--c1:'+a.colors[0]+';--c2:'+a.colors[1]+'">'+
          '<video id="pv" playsinline preload="metadata"></video>'+
          '<div class="pv-art" id="pvArt">'+
            '<div><span class="glyph">'+esc((a.jp||'#').charAt(0))+'</span><em>'+esc(a.title)+'</em>'+
            '<div class="eq"><i></i><i></i><i></i><i></i><i></i></div>'+
            '<div class="small" style="color:rgba(255,255,255,.45);margin-top:16px;letter-spacing:.2em;text-transform:uppercase;font-size:.62rem">Demo Oynatıcı · Yasal Lisanslı Örnek Video</div></div>'+
          '</div>'+
          '<div class="pv-center" id="pvCenter"><button class="pv-big" data-act="pv-toggle" aria-label="Oynat">▶</button></div>'+
          '<div class="pv-badge" id="pvBadge">KALİTE: 1080p</div>'+
          '<div class="pv-toast" id="pvToast"></div>'+
          '<div class="pv-sub" id="pvSub"></div>'+
          '<div class="pv-ctrl">'+
            '<div class="pv-seek" id="pvSeek" aria-label="İlerleme çubuğu"><div class="pv-track"><div class="pv-buf" id="pvBuf"></div><div class="pv-play" id="pvPlay"><i class="pv-knob"></i></div></div></div>'+
            '<div class="pv-row">'+
              '<button class="pv-btn" data-act="pv-toggle" id="pvPlayBtn" title="Oynat / Duraklat (Boşluk)">▶</button>'+
              '<button class="pv-btn" data-act="pv-prev" title="Önceki Bölüm">⏮</button>'+
              '<button class="pv-btn" data-act="pv-next" title="Sonraki Bölüm">⏭</button>'+
              '<div class="pv-vol"><button class="pv-btn" data-act="pv-mute" id="pvMuteBtn" title="Sessiz (M)">🔊</button><input type="range" id="pvVol" min="0" max="1" step="0.05" value="1" aria-label="Ses seviyesi"></div>'+
              '<span class="pv-time" id="pvTime">00:00 / 00:00</span>'+
              '<span class="pv-spacer"></span>'+
              '<button class="pv-btn" data-act="pv-cc" id="pvCCBtn" title="Altyazı">CC · TR</button>'+
              '<div style="position:relative">'+
                '<button class="pv-btn" data-act="pv-menu" id="pvQualBtn" title="Kalite">⚙ 1080p</button>'+
                '<div class="pv-menu" id="pvQualMenu"><div class="mhead">Video Kalitesi</div>'+
                  ['Otomatik','1080p','720p','480p'].map(q=>'<button data-act="pv-set-quality" data-q="'+q+'" class="'+(q==='1080p'?'on':'')+'">'+q+'<span>'+(q==='Otomatik'?'✓':(q==='1080p'?'HD':(q==='720p'?'SD':'LD')))+'</span></button>').join('')+
                '</div>'+
              '</div>'+
              '<button class="pv-btn" data-act="pv-menu" data-menu="pvSubMenu" title="Altyazı dili">🌐</button>'+
              '<div style="position:relative">'+
                '<div class="pv-menu" id="pvSubMenu" style="right:0"><div class="mhead">Altyazı</div>'+
                  [['tr','Türkçe'],['en','İngilizce'],['off','Kapalı']].map(([v,l])=>'<button data-act="pv-set-cc" data-v="'+v+'" id="ccOpt-'+v+'">'+l+'<span></span></button>').join('')+
                '</div>'+
              '</div>'+
              '<button class="pv-btn" data-act="pv-autoplay" id="pvAutoBtn" title="Otomatik sonraki bölüm">⏭ OTO</button>'+
              '<button class="pv-btn" data-act="pv-full" title="Tam ekran (F)">⛶</button>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin:18px 0 6px">'+
        '<div>'+
          '<h1 class="display" style="font-size:clamp(1.3rem,3vw,2.1rem)">'+esc(a.title)+'</h1>'+
          '<p class="muted small" style="margin:6px 0 0">'+s.n+'. Sezon · '+ep.no+'. Bölüm — <b style="color:var(--txt)">'+esc(ep.title)+'</b> · '+fmtTime(ep.dur)+' · '+fmtDate(ep.date)+'</p>'+
        '</div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
          (prev? '<a class="btn btn-sm" href="#/izle/'+a.id+'/'+s.n+'/'+prev.no+'">← Önceki</a>':'<button class="btn btn-sm" disabled>← Önceki</button>')+
          (next? '<a class="btn btn-sm btn-primary" href="#/izle/'+a.id+'/'+s.n+'/'+next.no+'">Sonraki →</a>':'<button class="btn btn-sm" disabled>Sonraki →</button>')+
          '<button class="btn btn-sm '+(DB.favs[a.id]?'btn-fav-on':'')+'" data-act="toggle-fav" data-id="'+a.id+'">'+(DB.favs[a.id]?'♥':'♡')+'</button>'+
        '</div>'+
      '</div>'+
      '<div class="info-cols" style="margin-top:16px">'+
        '<div><b>Stüdyo</b><span>'+esc(a.studio)+'</span></div>'+
        '<div><b>Yönetmen</b><span>'+esc(a.director)+'</span></div>'+
        '<div><b>Sezon</b><span>'+seasons.length+' sezon / '+a.episodeCount+' bölüm</span></div>'+
        '<div><b>Yaş Sınırı</b><span>'+esc(a.age||'13+')+'</span></div>'+
      '</div>'+
      '<section class="sec">'+commentsHTML(a.id+':'+s.n+':'+ep.no, 'Bölüm Yorumları')+'</section>'+
    '</div>'+
    '<aside>'+
      '<div style="background:var(--panel);border:1.5px solid var(--line);border-radius:var(--r);padding:14px;position:sticky;top:86px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'+
          '<b style="font-family:var(--fd);font-weight:800;text-transform:uppercase;font-size:.86rem">Bölüm Listesi</b>'+
          '<select class="inp" style="width:auto;padding:.4rem .6rem;font-size:.76rem" id="watchSeason" data-act="watch-season" data-id="'+a.id+'">'+
            seasons.map(x=>'<option value="'+x.n+'" '+(x.n===s.n?'selected':'')+'>'+x.n+'. Sezon</option>').join('')+
          '</select>'+
        '</div>'+
        '<div style="max-height:60vh;overflow-y:auto;display:flex;flex-direction:column;gap:7px;padding-right:4px">'+
          eps.map(x=>{
            const watched = API.isWatched(a.id, s.n, x.no);
            const active2 = x.no===ep.no;
            return '<a href="#/izle/'+a.id+'/'+s.n+'/'+x.no+'" class="ep-item '+(watched?'watched ':'')+(active2?'playing':'')+'" style="padding:9px">'+
              '<span class="epno" style="font-size:.9rem;min-width:28px">'+x.no+'</span>'+
              '<span class="epinfo"><b style="font-size:.78rem">'+esc(x.title)+'</b><i style="font-size:.66rem">'+fmtTime(x.dur)+'</i></span>'+
            '</a>';
          }).join('')+
        '</div>'+
      '</div>'+
    '</aside>'+
  '</div>';
}

