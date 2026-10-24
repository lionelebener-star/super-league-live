const BASELINE=require('./season-baseline.json');
const COMPETITION='e0lck99w8meo9qoalfrxgo33o';
const API='https://origins-webex-orchestrator.origins-digital.com/trpc/';
// Public tenant identifier shipped by sfl.ch's own browser client, not a user credential.
const HEADERS={'x-account-key':'Os-hXumIK'};
const codes=['LUG','YB','SIO','SG','FCZ','SFC','BAS','LUZ','THU','VAD','GCZ','LS'];
async function batch(queries, fetcher=fetch){
 return Promise.all(queries.map(async ([path,input])=>{
  const response=await fetcher(API+path+'?batch=1&input='+encodeURIComponent(JSON.stringify({'0':input})),{headers:HEADERS,signal:AbortSignal.timeout(18000)});
  if(!response.ok)throw Error('SFL request failed: '+response.status);
  const raw=await response.json(),result=raw[0];
  if(!result?.result||!('data' in result.result))throw Error('Invalid SFL response: '+path);
  return result.result.data;
 }));
}
function normalizeEvent(e){
 const home=codes.indexOf(e.homeTeamCode),away=codes.indexOf(e.awayTeamCode);
 if(home<0||away<0)throw Error('Unknown SFL club');
 const kickoff=e.date.slice(0,10)+'T'+(e.time||'00:00:00Z');
 if(!Number.isFinite(Date.parse(kickoff)))throw Error('Invalid kickoff');
 const scoreValid=Number.isInteger(e.homeScore)&&e.homeScore>=0&&Number.isInteger(e.awayScore)&&e.awayScore>=0;
 return {id:e.providerId,home,away,kickoff,homeScore:scoreValid?e.homeScore:null,awayScore:scoreValid?e.awayScore:null,
  status:e.gameStatus,halfTime:[10,12].includes(e.periodId),minute:e.matchTime,venue:e.stadiumName||'',week:e.week};
}
function projectTable(official,events){
 const rows=official.map(r=>({club:codes.indexOf(r.shortName),providerId:r.teamId,rank:r.ranking,...BASELINE.teams.find(t=>t.club===codes.indexOf(r.shortName)),live:false}));
 if(rows.length!==12||rows.some(r=>r.club<0)||new Set(rows.map(r=>r.club)).size!==12)throw Error('Invalid SFL table');
 const lookup=new Map(rows.map(r=>[r.club,r]));
 function add(event){
  if(event.homeScore===null||event.awayScore===null)return;
  const h=lookup.get(event.home),a=lookup.get(event.away),x=event.homeScore,y=event.awayScore;
  h.played++;a.played++;h.gf+=x;h.ga+=y;a.gf+=y;a.ga+=x;
  if(x>y){h.won++;a.lost++;h.points+=3;}else if(x<y){a.won++;h.lost++;a.points+=3;}else{h.draw++;a.draw++;h.points++;a.points++;}
 }
 events.filter(e=>Number(e.week)>BASELINE.throughWeek&&['post-game','awarded'].includes(e.status)).forEach(add);
 for(const row of rows){
  const ref=official.find(o=>codes.indexOf(o.shortName)===row.club);
  // Preserve official penalties/bonuses while reconstructing completed matches.
  row.points+=ref.points-(3*ref.gamesWon+ref.gamesDraw);
  const active=events.filter(e=>['live','suspended'].includes(e.status)&&[e.home,e.away].includes(row.club)).length;
  if(row.played<ref.gamesPlayed-active)throw Error('Incomplete season results; projection refused');
 }
 for(const event of events.filter(e=>['live','suspended'].includes(e.status))){
  if(event.homeScore===null||event.awayScore===null)continue;
  add(event);lookup.get(event.home).live=true;lookup.get(event.away).live=true;
 }
 rows.sort((a,b)=>b.points-a.points||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.rank-b.rank);
 return rows.map((r,i)=>({...r,rank:i+1,goalDifference:r.gf-r.ga}));
}
async function collectLive(fetcher=fetch){
 const homepage=await fetcher('https://sfl.ch/',{signal:AbortSignal.timeout(18000)});
 if(!homepage.ok)throw Error('SFL homepage unavailable');
 const html=await homepage.text(),match=html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
 if(!match)throw Error('SFL current round unavailable');
 const sections=JSON.parse(match[1]).props.pageProps.page.sections;
 const competition=sections.flatMap(s=>s.competitions||[]).find(c=>c.providerId===COMPETITION);
 const week=Number(competition?.activeMatchDay);
 if(!Number.isInteger(week)||week<BASELINE.throughWeek||week>38)throw Error('Invalid SFL round');
 const queries=[['rankings.getOne',{competitionProviderId:COMPETITION,language:'fr'}],
  ...Array.from({length:week-BASELINE.throughWeek+1},(_,i)=>['matchDays.getEvents',{competitionProviderId:COMPETITION,matchDay:String(i+BASELINE.throughWeek),language:'fr'}])];
 const chunks=[];for(let i=0;i<queries.length;i+=6)chunks.push(queries.slice(i,i+6));
 const all=(await Promise.all(chunks.map(c=>batch(c,fetcher)))).flat();
 const official=all[0].rankings.find(r=>r.rankings.length===12)?.rankings;
 if(!official)throw Error('Official SFL standings unavailable');
 const raw=all.slice(1).flat(),events=[...new Map(raw.map(e=>[e.providerId,normalizeEvent(e)])).values()];
 const now=Date.now(),seasonStart=new Date(new Date(now).getUTCFullYear()-(new Date(now).getUTCMonth()<6?1:0),6,1).getTime();
 if(seasonStart>new Date('2026-07-01T00:00:00Z').getTime()||!events.length||!events.some(e=>Date.parse(e.kickoff)>=seasonStart))throw Error('SFL season out of date');
 const standings=projectTable(official,events);
 return {source:'Swiss Football League',sourceUrl:'https://sfl.ch/',updatedAt:new Date().toISOString(),week,
  provisional:events.some(e=>['live','suspended'].includes(e.status)),standings,
  fixtures:events.filter(e=>Number(e.week)===week||['live','suspended'].includes(e.status)).sort((a,b)=>Date.parse(a.kickoff)-Date.parse(b.kickoff)),
  results:events.filter(e=>['post-game','awarded'].includes(e.status)).sort((a,b)=>Date.parse(b.kickoff)-Date.parse(a.kickoff)).slice(0,12)};
}
module.exports={collectLive,normalizeEvent,projectTable,batch};
