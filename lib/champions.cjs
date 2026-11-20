const BASE='https://api.football-data.org/v4/competitions/CL/';
let cache=null,pending=null;
function normalize(standings,matches,teams){
 if(!Array.isArray(standings.standings)||!Array.isArray(matches.matches)||!Array.isArray(teams.teams)||!teams.teams.length)throw Error('Invalid competition data');
 const clubs=teams.teams.map(t=>({id:t.id,name:t.shortName||t.name,fullName:t.name,crest:t.crest||null,coach:t.coach?.name||null,squad:(t.squad||[]).map(p=>({id:p.id,name:p.name,position:p.position||null,birth:p.dateOfBirth||null,nationality:p.nationality||null}))}));
 const tables=standings.standings.filter(t=>t.type==='TOTAL').map(t=>({stage:t.stage,group:t.group,rows:t.table.map(r=>({rank:r.position,teamId:r.team.id,name:r.team.shortName||r.team.name,played:r.playedGames,won:r.won,draw:r.draw,lost:r.lost,gf:r.goalsFor,ga:r.goalsAgainst,diff:r.goalDifference,points:r.points}))}));
 const fixtures=matches.matches.map(m=>({id:m.id,kickoff:m.utcDate,status:m.status,stage:m.stage,matchday:m.matchday,homeId:m.homeTeam.id,awayId:m.awayTeam.id,home:m.homeTeam.shortName||m.homeTeam.name||'À déterminer',away:m.awayTeam.shortName||m.awayTeam.name||'À déterminer',homeScore:m.score?.fullTime?.home??null,awayScore:m.score?.fullTime?.away??null}));
 return {competition:'CL',name:'Champions League',season:standings.season,source:'football-data.org',scoresDelayed:true,updatedAt:new Date().toISOString(),teams:clubs,tables,matches:fixtures};
}
async function collectChampions(fetcher=fetch,key=process.env.FOOTBALL_DATA_API_KEY){
 if(!key){const e=Error('Free data source not configured');e.code='NOT_CONFIGURED';throw e;}
 if(cache&&Date.now()-cache.time<60000)return cache.data;
 if(pending)return pending;
 pending=(async()=>{const data=[];for(const endpoint of ['standings','matches','teams']){const r=await fetcher(BASE+endpoint,{headers:{'X-Auth-Token':key},signal:AbortSignal.timeout(20000)});if(!r.ok){const e=Error('Football data source unavailable');e.code=r.status===429?'RATE_LIMIT':'SOURCE_ERROR';throw e;}data.push(await r.json());}const result=normalize(...data);cache={time:Date.now(),data:result};return result;})();
 try{return await pending;}finally{pending=null;}
}
module.exports={collectChampions,normalize};
