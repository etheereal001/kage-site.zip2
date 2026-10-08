'use strict';
/* ---------------- API katmanı (mock REST) ---------------- */
const API = {
  /* GET /api/genres */
  genres(){ return DB.genres.slice(); },

  /* GET /api/anime */
  list(){
    const del = new Set(DB.deleted);
    const base = RAW_ANIME.filter(a=>!del.has(a.id)).map(a=>Object.assign({}, a, DB.overrides[a.id]||{}));
    const custom = DB.custom.filter(a=>!del.has(a.id));
    return base.concat(custom).map(hydrate);
  },
  /* GET /api/anime/:id */
  get(id){ return this.list().find(a=>a.id===id) || null; },
  /* GET /api/anime/:id/similar */
  similar(id, n=6){
    const a=this.get(id); if(!a) return [];
    return this.list().filter(x=>x.id!==id)
      .map(x=>Object.assign({}, x, {_s: x.genres.filter(g=>a.genres.includes(g)).length + (x.studio===a.studio?.6:0)}))
      .sort((p,q)=> q._s-p._s || q.rating-p.rating)
      .filter(x=>x._s>0).slice(0,n);
  },
  /* GET /api/anime/:id/episodes?season= */
  episodes(id, seasonNo){
    const a=this.get(id); if(!a) return [];
    const s = a.seasons.find(x=>x.n===seasonNo) || a.seasons[0];
    const seed = hashNum(a.id+'|'+s.n);
    const extra = DB.extraEps[a.id+':'+s.n] || {max:0, titles:{}};
    const total = Math.max(s.e, extra.max||0);
    const start = new Date((s.y||a.year), 9, 5).getTime();
    const list=[];
    let global = a.seasons.filter(x=>x.n<s.n).reduce((t,x)=>t+x.e,0);
    for(let i=0;i<total;i++){
      const no=i+1;
      const ts = start + i*7*86400000;
      list.push({
        no, season:s.n, global:global+i+1,
        title: extra.titles[no] || EP_TITLES[(seed+i*7)%EP_TITLES.length],
        dur: 1380 + ((seed+i*13)%180),
        ts, date: new Date(ts),
        id: a.id+':'+s.n+':'+no
      });
    }
    return list;
  },
  /* GET /api/anime/:id/all-episodes */
  allEpisodes(id){
    const a=this.get(id); if(!a) return [];
    return a.seasons.flatMap(s=>this.episodes(id, s.n));
  },
  /* GET /api/episodes/latest */
  latestEpisodes(limit=18){
    const out=[];
    this.list().filter(a=>/Devam/.test(a.status)).forEach(a=>{
      const s=a.seasons[a.seasons.length-1];
      this.episodes(a.id, s.n).slice(-3).forEach(ep=> out.push({a, season:s, ep}));
    });
    return out.sort((x,y)=> y.ep.ts-x.ep.ts).slice(0,limit);
  },
  /* GET /api/schedule */
  schedule(){
    const map={}; DAYS.forEach(d=>map[d]=[]);
    this.list().filter(a=>a.day).forEach((a,i)=>{
      const times=['14:30','16:00','18:30','20:00','21:30','22:45','23:30'];
      map[a.day].push({a, time: times[hashNum(a.id)%times.length], ep: (a.seasons[a.seasons.length-1].e)});
    });
    Object.keys(map).forEach(k=> map[k].sort((x,y)=> x.time.localeCompare(y.time)));
    return map;
  },
  /* GET /api/search */
  search({q='', genre='', year='', status='', minRating=0, sort='pop', limit=0}={}){
    const term = q.trim().toLocaleLowerCase('tr');
    let out = this.list().filter(a=>{
      if(term){
        const hay = (a.title+' '+a.jp+' '+a.studio+' '+a.director+' '+a.genres.join(' ')+' '+a.tags.join(' ')).toLocaleLowerCase('tr');
        if(!hay.includes(term)) return false;
      }
      if(genre && !a.genres.includes(genre)) return false;
      if(year && String(a.year)!==String(year)) return false;
      if(status && a.status!==status) return false;
      if(minRating && a.rating < Number(minRating)) return false;
      return true;
    });
    const sorters={
      pop:(x,y)=> (y.popularity+ (DB.views[y.id]||0)/10) - (x.popularity + (DB.views[x.id]||0)/10),
      rating:(x,y)=> y.rating-x.rating,
      year:(x,y)=> y.year-x.year,
      az:(x,y)=> x.title.localeCompare(y.title,'tr'),
      episodes:(x,y)=> y.episodeCount-x.episodeCount
    };
    out.sort(sorters[sort]||sorters.pop);
    return limit? out.slice(0,limit) : out;
  },
  /* POST /api/anime (admin) */
  saveAnime(data, id){
    if(id){
      const idx = DB.custom.findIndex(a=>a.id===id);
      if(idx>-1) DB.custom[idx]=Object.assign(DB.custom[idx], data, {id});
      else DB.overrides[id]=Object.assign({}, DB.overrides[id]||{}, data);
    } else {
      DB.custom.push(Object.assign({id:uid('an'), addedAt:Date.now()}, data));
    }
    save(); Remote.pushContent();
  },
  /* DELETE /api/anime/:id (admin) */
  removeAnime(id){
    DB.custom = DB.custom.filter(a=>a.id!==id);
    if(!DB.deleted.includes(id)) DB.deleted.push(id);
    save(); Remote.pushContent();
  },
  /* POST /api/anime/:id/episodes (admin) */
  addEpisode(animeId, seasonNo, no, title, dur){
    const key=animeId+':'+seasonNo;
    const rec = DB.extraEps[key] || (DB.extraEps[key]={max:0,titles:{}});
    rec.max = Math.max(rec.max||0, no);
    if(title) rec.titles[no]=title;
    save(); Remote.pushContent();
  },
  /* POST /api/favorites/:id */
  toggleFav(id){ const on=!!DB.favs[id]; if(on) delete DB.favs[id]; else DB.favs[id]=Date.now(); save(); return !on; },
  favs(){ return Object.keys(DB.favs).map(id=>this.get(id)).filter(Boolean)
    .sort((a,b)=> DB.favs[b.id]-DB.favs[a.id]); },
  /* PUT /api/watchlist/:id */
  setList(id, status){ if(!status) delete DB.lists[id]; else DB.lists[id]={status, at:Date.now()}; save(); },
  listBy(status){ return Object.keys(DB.lists).filter(id=>DB.lists[id].status===status)
    .map(id=>this.get(id)).filter(Boolean).sort((a,b)=> DB.lists[b.id].at-DB.lists[a.id].at); },
  /* POST /api/ratings/:id */
  rate(id, v){ DB.ratings[id]=v; save(); },
  myRating(id){ return DB.ratings[id]||0; },
  /* POST /api/progress */
  saveProgress(animeId, s, e, t, dur){
    DB.history[animeId+':'+s+':'+e] = {t, d:dur, at:Date.now(), animeId, s, e};
    DB.progress[animeId] = {s, e, t, d:dur, at:Date.now()};
    DB.views[animeId] = (DB.views[animeId]||0)+0;
    save();
  },
  resumeFor(animeId){
    const p = DB.progress[animeId]; if(!p) return null;
    const total = this.allEpisodes(animeId).length;
    return {s:p.s, e:p.e, t:p.t, d:p.d, percent: p.d? Math.min(100, p.t/p.d*100):0, total};
  },
  isWatched(animeId,s,e){ const h=DB.history[animeId+':'+s+':'+e]; return !!h && h.t > h.d*0.9; },
  watchCount(){ return Object.keys(DB.history).length; },
  completedAnime(){
    return Object.keys(DB.progress).filter(id=>{
      const a=this.get(id); if(!a) return false;
      const last = a.seasons[a.seasons.length-1];
      const eps = this.allEpisodes(id);
      const done = eps.filter(ep=> this.isWatched(id, ep.season, ep.no)).length;
      return done >= eps.length && eps.length>0;
    }).length;
  },
  recentHistory(limit=8){
    return Object.values(DB.history).sort((a,b)=> b.at-a.at).slice(0,limit);
  },
  /* POST /api/comments */
  addComment(key, text, spoiler){
    const u=me(); if(!u) return null;
    const c={id:uid('c'), key, userId:u.id, userName:u.name, text, spoiler, likes:[], createdAt:Date.now()};
    DB.comments.unshift(c); save(); Remote.postComment(c, u); return c;
  },
  comments(key){ return DB.comments.filter(c=>c.key===key).sort((a,b)=> b.createdAt-a.createdAt); },
  deleteComment(id){ const owner=Remote.ownerFor(id); DB.comments = DB.comments.filter(c=>c.id!==id); save(); Remote.deleteComment(id, owner); },
  likeComment(id){
    const u=me(); if(!u) return {needAuth:true};
    const c=DB.comments.find(x=>x.id===id); if(!c) return {};
    const i=c.likes.indexOf(u.id);
    if(i>-1) c.likes.splice(i,1); else c.likes.push(u.id);
    save(); Remote.likeComment(id, u.id); return c;
  },
  /* POST /api/tickets */
  async createTicket(data){
    const t = await Remote.postTicket(data);
    DB.tickets.unshift(t); DB.myTicketIds.push(t.id); save(); return t;
  },
  myTickets(){ return DB.tickets.filter(t=>DB.myTicketIds.includes(t.id)); },
  /* POST /api/auth/register */
  register(name, email, pass){
    if(DB.users.some(u=>u.email.toLowerCase()===email.toLowerCase())) return {error:'Bu e-posta adresi ile kayıtlı bir hesap zaten var.'};
    const u={id:uid('u'), name, email, pass:hsh(pass), role:'user', joined:Date.now(), color:PALETTE[hashNum(email)%PALETTE.length][0], banned:false, secret:uid('k')+uid('k')};
    DB.users.push(u); save(); setSession(u.id); return {user:u};
  },
  /* POST /api/auth/login */
  login(email, pass){
    const u=DB.users.find(x=>x.email.toLowerCase()===email.toLowerCase());
    if(!u || u.pass!==hsh(pass)) return {error:'E-posta veya şifre hatalı.'};
    if(u.banned) return {error:'Bu hesap yönetici tarafından askıya alınmış.'};
    setSession(u.id); return {user:u};
  },
  logout(){ setSession(null); },
  updateUser(id, patch){ const u=DB.users.find(x=>x.id===id); if(u){ Object.assign(u,patch); save(); } },
  /* admin */
  stats(){
    const list=this.list();
    const views = Object.values(DB.views).reduce((a,b)=>a+b,0) + list.reduce((t,a)=> t + a.popularity*37, 0);
    const days=[]; const today=new Date();
    for(let i=6;i>=0;i--){
      const d=new Date(today.getTime()-i*86400000);
      days.push({label: new Intl.DateTimeFormat('tr-TR',{weekday:'short'}).format(d), v: 40 + hashNum(d.toDateString())%60});
    }
    return {
      anime: list.length, comments: DB.comments.length,
      tickets: DB.tickets.length, genres: DB.genres.length, episodes: list.reduce((t,a)=>t+a.episodeCount,0),
      views: Math.round(views), days,
      top: list.slice().sort((a,b)=> (DB.views[b.id]||b.popularity) - (DB.views[a.id]||a.popularity)).slice(0,5)
    };
  }
};

