const {batch,normalizeEvent}=require('./live.cjs');
const COMPETITION='e0lck99w8meo9qoalfrxgo33o';
let cached=null,loaded=0;
async function collectSchedule(fetcher=fetch){
 if(fetcher===fetch&&cached&&Date.now()-loaded<3600000)return cached;
 const events=[];
 // The five split rounds are scheduled separately after round 33.
 for(let round=1;round<=33;round+=6){
  const queries=Array.from({length:Math.min(6,34-round)},(_,i)=>['matchDays.getEvents',{competitionProviderId:COMPETITION,matchDay:String(round+i),language:'fr'}]);
  const groups=await batch(queries,fetcher);
  for(const raw of groups.flat())if(raw.date&&Number.isFinite(Date.parse(raw.date)))events.push({...normalizeEvent(raw),timeConfirmed:Boolean(raw.time)});
 }
 const result={updatedAt:new Date().toISOString(),events:[...new Map(events.map(e=>[e.id,e])).values()].sort((a,b)=>Date.parse(a.kickoff)-Date.parse(b.kickoff))};
 if(fetcher===fetch){cached=result;loaded=Date.now();}return result;
}
module.exports={collectSchedule};
