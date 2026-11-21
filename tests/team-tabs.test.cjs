const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const window={SLI18n:{language:'fr'}};vm.runInNewContext(fs.readFileSync('public/team-tabs.js','utf8'),{window,Intl,Map});const ui=window.SLTeamUI;
const match=(id,home,away,status,score,date)=>({id,home,away,status,homeScore:score[0],awayScore:score[1],kickoff:date||'2026-11-21T17:00:00Z'});
test('team history includes home and away finals, zero scores and newest authoritative state only',()=>{
 const list=[match('a',0,1,'pre-game',[null,null]),match('b',2,0,'post-game',[0,0],'2026-11-20T17:00:00Z'),match('c',1,2,'post-game',[4,1]),match('d',0,3,'live',[1,0]),match('e',0,4,'postponed',[null,null]),match('a',0,1,'post-game',[2,1])];
 assert.deepEqual(Array.from(ui.completed(list,0),m=>m.id),['a','b']);
 const html=ui.results(list,0,i=>'club '+i);assert.match(html,/2 – 1/);assert.match(html,/0 – 0/);assert.match(html,/score win/);assert.match(html,/score draw/);assert.doesNotMatch(html,/club 3/);
});
test('Champions League finals use their own IDs and teams with no results have a clear empty state',()=>{
 assert.equal(ui.completed([match(1,57,64,'FINISHED',[0,2])],57).length,1);
 assert.match(ui.results([],57,String),/Aucun résultat terminé/);
 window.SLI18n.language='de';assert.match(ui.markup({key:'cl-57',title:'Team',back:'',roster:'',results:''}),/Ergebnisse/);
});
