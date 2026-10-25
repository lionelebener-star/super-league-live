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
async function collectScorers(){
 const input={competitionProviderId:'e0lck99w8meo9qoalfrxgo33o',seasonProviderId:'cx0b7yl7kqmgay9wn2c3zyjh0',order:'desc',sortKey:'total goals',statType:'player',limit:200,cursor:0,language:'fr'};
 const [first]=await batch([['stats.getStats',input]]);const rows=[...(first.players||[])],total=Number(first.totalItemsCount);
 if(!Number.isInteger(total)||total<1||total>1000)throw Error('Invalid scorer total');
 for(let cursor=200;cursor<total;cursor+=200){const [page]=await batch([['stats.getStats',{...input,cursor}]]);rows.push(...page.players);}
 return {season:'2026/27',updatedAt:new Date().toISOString(),sourceUrl:'https://sfl.ch/dashboard-stats/stats-superleague?tab=player',players:normalizeScorers(rows,total)};
}
module.exports={collectScorers,normalizeScorers};
