const {test}=require('node:test');const assert=require('node:assert/strict');const {normalize,collectChampions}=require('../lib/champions.cjs');
test('Champions League keeps provider IDs, zero scores and unavailable portraits without inventing data',()=>{
 const d=normalize({season:{id:1},standings:[{type:'TOTAL',stage:'LEAGUE_STAGE',table:[{position:1,team:{id:7,name:'Club'},playedGames:1,won:0,draw:1,lost:0,goalsFor:0,goalsAgainst:0,goalDifference:0,points:1}]}]},{matches:[{id:4,homeTeam:{id:7,name:'Club'},awayTeam:{id:8,name:'Other'},score:{fullTime:{home:0,away:0}},status:'IN_PLAY'}]},{teams:[{id:7,name:'Club',squad:[{id:9,name:'Player'}]}]});
 assert.equal(d.matches[0].homeScore,0);assert.equal(d.tables[0].rows[0].teamId,7);assert.equal(d.teams[0].squad[0].id,9);assert.equal(d.scoresDelayed,true);assert.equal(d.teams[0].squad[0].photo,undefined);
});
test('missing free API key stops before any network call',async()=>{let called=false;await assert.rejects(collectChampions(()=>{called=true;},''),{code:'NOT_CONFIGURED'});assert.equal(called,false);});
test('malformed provider responses cannot become a fabricated league table',()=>{assert.throws(()=>normalize({},{},{}));});
