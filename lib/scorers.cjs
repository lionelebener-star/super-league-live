const {batch}=require('./live.cjs');
const roster=require('../public/players-data.json').players;
const CLUBS={'fc-lugano':0,'bsc-young-boys':1,'fc-sion':2,'fc-saint-gall-1879':3,'fc-zurich':4,'servette-fc':5,'fc-bale-1893':6,'fc-lucerne':7,'fc-thoune':8,'fc-vaduz':9,'grasshopper-club-zurich':10,'fc-lausanne-sport':11};
const key=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function matchesName(short,full){const m=String(short||'').match(/^(\S)\.\s*(.+)$/);return m?key(full).startsWith(key(m[1]))&&key(full).endsWith(key(m[2])):key(short)===key(full);}
function normalizeScorers(rows,total){
 if(!Array.isArray(rows)||rows.length!==total||!rows.length)throw Error('Incomplete scorer ranking');
 const stat=(p,type)=>{const raw=p.stats?.find(s=>s.type===type)?.value;if(raw===undefined)return null;const n=Number(raw);if(!Number.isInteger(n)||n<0)throw Error('Invalid scorer statistic');return n;};
 const all=rows.map(p=>{let slug=p.slug;if(!slug){const candidates=roster.filter(r=>r.club===CLUBS[p.team?.slug]&&matchesName(p.name,r.name));if(candidates.length===1)slug=candidates[0].slug;}
  const goals=stat(p,'total goals');if(goals===null)throw Error('Missing goal count');return {slug:slug||null,name:p.name,club:CLUBS[p.team?.slug],goals,games:stat(p,'total games'),assists:stat(p,'total assists')};});
 const players=all.filter(p=>p.slug).map(p=>({...p,rank:p.goals?1+all.filter(q=>q.goals>p.goals).length:null,tied:p.goals?all.filter(q=>q.goals===p.goals).length>1:false}));
 for(const p of roster)if(!players.some(r=>r.slug===p.slug))players.push({slug:p.slug,goals:all.some(r=>!r.slug&&(!r.name||r.club===undefined||r.club===p.club&&matchesName(r.name,p.name)))?null:0,games:null,assists:null,rank:null,tied:false});
 return players;
}
const baseline=require('./scorer-baseline.json');
const {collectLive}=require('./live.cjs'),{collectMatch}=require('./match-detail.cjs');
const matchCache=new Map();
function reconcileScorers(base,matches){
 const totals=new Map(base.players.map(p=>[p.id,{...p,games:null}])),seen=new Set(base.matches||[]);
 for(const match of matches){if(seen.has(match.id))continue;seen.add(match.id);
  if(!Number.isInteger(match.homeScore)||!Number.isInteger(match.awayScore)||match.homeScore+match.awayScore!==match.goals.length)throw Error('Incomplete match goal events');
  const events=new Set();for(const g of match.goals){if(events.has(g.id))throw Error('Duplicate goal event');events.add(g.id);if(g.type==='OG')continue;
   const club=match[g.side].club;const entry=p=>{if(!p.id)throw Error('Missing scorer identifier');if(!totals.has(p.id))totals.set(p.id,{id:p.id,slug:p.slug,name:p.name,club,goals:0,assists:0,games:null});const row=totals.get(p.id);if(p.slug)row.slug=p.slug;return row;};
   entry(g.scorer).goals++;if(g.assist)entry(g.assist).assists++;
  }
 }
 const all=[...totals.values()],players=all.filter(p=>p.slug).map(p=>({...p,rank:p.goals?1+all.filter(q=>q.goals>p.goals).length:null,tied:p.goals?all.filter(q=>q.goals===p.goals).length>1:false}));
 for(const p of roster)if(!players.some(row=>row.slug===p.slug))players.push({slug:p.slug,goals:0,assists:0,games:null,rank:null,tied:false});
 return players;
}
async function collectScorers(){
 const live=await collectLive();if(live.week<baseline.throughWeek)throw Error('Invalid scorer season');
 const queries=Array.from({length:live.week-baseline.throughWeek},(_,i)=>['matchDays.getEvents',{competitionProviderId:'e0lck99w8meo9qoalfrxgo33o',matchDay:String(baseline.throughWeek+i+1),language:'fr'}]);
 const events=queries.length?(await batch(queries)).flat().filter(e=>['post-game','awarded','live','suspended'].includes(e.gameStatus)):[];
 const matches=[],todo=[...new Map(events.map(e=>[e.providerId,e])).values()];
 async function worker(){while(todo.length){const e=todo.shift(),cached=matchCache.get(e.providerId),ttl=['live','suspended'].includes(e.gameStatus)?30000:Date.now()-Date.parse(e.date.slice(0,10))<2*86400000?60000:6*3600000;let m;if(cached&&Date.now()-cached.at<ttl)m=cached.data;else{m=await collectMatch(e.providerId);matchCache.set(e.providerId,{data:m,at:Date.now()});}matches.push(m);}}
 await Promise.all(Array.from({length:Math.min(6,todo.length)},worker));
 return {season:baseline.season,updatedAt:new Date().toISOString(),sourceUrl:'https://sfl.ch/dashboard-stats/stats-superleague?tab=player',provisional:matches.some(m=>['live','suspended'].includes(m.status)),basis:'official-match-goals',players:reconcileScorers(baseline,matches)};
}
module.exports={collectScorers,normalizeScorers,reconcileScorers};
