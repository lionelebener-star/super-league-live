const test=require('node:test');
const assert=require('node:assert/strict');
const {projectTable,normalizeEvent}=require('../lib/live.cjs');
const baseline=require('../lib/season-baseline.json');
const codes=['LUG','YB','SIO','SG','FCZ','SFC','BAS','LUZ','THU','VAD','GCZ','LS'];
const refs=baseline.teams.map(r=>({shortName:codes[r.club],teamId:String(r.club),ranking:r.club+1,gamesPlayed:r.played,gamesWon:r.won,gamesDraw:r.draw,points:r.points}));
const event={home:1,away:3,homeScore:1,awayScore:0,status:'live',week:'11'};
test('temporary winning points are replaced by final defeat without double counting',()=>{
 let table=projectTable(refs,[event]);
 assert.equal(table.find(r=>r.club===1).points,25);
 assert.equal(table.find(r=>r.club===1).played,11);
 table=projectTable(refs,[{...event,homeScore:1,awayScore:2,status:'post-game'}]);
 assert.equal(table.find(r=>r.club===1).points,22);
 assert.equal(table.find(r=>r.club===3).points,19);
 assert.equal(table.find(r=>r.club===1).played,11);
 assert.equal(table.find(r=>r.club===1).live,false);
});
test('missing score and postponed match do not award temporary points',()=>{
 for(const e of [{...event,homeScore:null,awayScore:null},{...event,status:'postponed'}]){
  const row=projectTable(refs,[e]).find(r=>r.club===1);
  assert.equal(row.points,22);assert.equal(row.played,10);
 }
});
test('official points already reflecting a live game are not added a second time',()=>{
 const updated=refs.map(r=>r.shortName==='YB'?{...r,points:25,gamesPlayed:11,gamesWon:7}:r);
 assert.equal(projectTable(updated,[event]).find(r=>r.club===1).points,25);
});
test('incomplete season history refuses a misleading projection',()=>{
 assert.throws(()=>projectTable(refs.map(r=>({...r,gamesPlayed:11})),[]),/Incomplete/);
});
test('Swiss winter kickoff comes from source UTC time and halftime remains live',()=>{
 const match=normalizeEvent({providerId:'test',homeTeamCode:'YB',awayTeamCode:'SG',date:'2026-10-25T00:00:00.000Z',time:'15:30:00Z',gameStatus:'live',periodId:10,homeScore:1,awayScore:0,week:'11'});
 assert.equal(match.kickoff,'2026-10-25T15:30:00Z');
 assert.equal(new Intl.DateTimeFormat('fr-CH',{timeZone:'Europe/Zurich',hour:'2-digit',minute:'2-digit'}).format(new Date(match.kickoff)),'16:30');
 assert.equal(match.halfTime,true);assert.equal(match.status,'live');
});
