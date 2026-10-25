const CODES=['LUG','YB','SIO','SG','FCZ','SFC','BAS','LUZ','THU','VAD','GCZ','LS'];
const API='https://origins-widgets-orchestrator.origins-digital.com/api/header?fixtureId=';
function photo(url){try{const u=new URL(url);return u.protocol==='https:'&&['scoreplay-mam-media-transformed.s3.amazonaws.com','origins-common-assets.origins-digital.com'].includes(u.hostname)?u.href:null;}catch{return null;}}
function normalizeMatch(raw,id){
 const match=raw?.fixturesAndResults?.match?.find(m=>m.matchInfo?.id===id),info=match?.matchInfo,live=match?.liveData;
 if(!info||info.competition?.id!=='e0lck99w8meo9qoalfrxgo33o')throw Error('Invalid SFL match');
 const contestants=info.contestant||[],home=contestants.find(c=>c.position==='home'),away=contestants.find(c=>c.position==='away');
 if(!home||!away||!CODES.includes(home.code)||!CODES.includes(away.code))throw Error('Unknown SFL club');
 const players=new Map((live?.lineUp||[]).flatMap(t=>(t.player||[]).map(p=>[p.playerId,p])));
 const player=(pid,fallback)=>{const p=players.get(pid);return {name:p?[p.shortFirstName||p.firstName,p.shortLastName||p.lastName].filter(Boolean).join(' ')||fallback:fallback,photo:photo(p?.profilePictureThumb)};};
 const details=live?.matchDetails||{},rawStatus=details.matchStatus;
 const status=rawStatus==='Played'?'post-game':rawStatus==='Playing'?'live':rawStatus==='Postponed'?'postponed':rawStatus==='Cancelled'?'cancelled':rawStatus==='Suspended'?'suspended':'pre-game';
 const score=details.scores?.totalUnconfirmed??details.scores?.total??details.scores?.ft;
 const scoreValue=x=>Number.isInteger(Number(x))&&x!==null&&x!==undefined?Number(x):null;
 const goals=(live?.goal||[]).filter(g=>['G','PG','OG'].includes(g.type)&&[home.id,away.id].includes(g.contestantId)&&Number(g.periodId)!==5).map((g,index)=>{
  const teamSide=g.contestantId===home.id?'home':'away',side=g.type==='OG'?(teamSide==='home'?'away':'home'):teamSide;
  const minute=Number(g.timeMin),base=Number(g.periodId)===1?45:Number(g.periodId)===2?90:Number(g.periodId)===3?105:120;
  const display=Number.isFinite(minute)?(minute>base?base+'+'+(minute-base):String(minute))+'′':'—';
  return {id:String(g.optaEventId||index),side,type:g.type,minute:display,sort:minute||0,period:Number(g.periodId)||0,scorer:player(g.scorerId,g.scorerName||'—'),assist:g.assistPlayerId||g.assistPlayerName?player(g.assistPlayerId,g.assistPlayerName||'—'):null,homeScore:scoreValue(g.homeScore),awayScore:scoreValue(g.awayScore)};
 }).sort((a,b)=>a.period-b.period||a.sort-b.sort);
 const kickoff=(info.date||'').slice(0,10)+'T'+(info.time||'00:00:00Z');if(!Number.isFinite(Date.parse(kickoff)))throw Error('Invalid match date');
 return {id,status,minute:details.matchTime??null,halfTime:[10,12].includes(details.periodId),home:{club:CODES.indexOf(home.code),name:home.name},away:{club:CODES.indexOf(away.code),name:away.name},homeScore:scoreValue(score?.home),awayScore:scoreValue(score?.away),kickoff,venue:info.venue?.shortName||info.venue?.longName||'',goals,updatedAt:new Date().toISOString(),sourceUrl:'https://sfl.ch/match-center/'+id};
}
async function collectMatch(id,fetcher=fetch){const r=await fetcher(API+encodeURIComponent(id),{headers:{'x-account-key':'Os-hXumIK','Accept-Language':'fr'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Match source unavailable');return normalizeMatch(await r.json(),id);}
module.exports={normalizeMatch,collectMatch};
