(() => {
 const baseFixture=fixture,baseTable=table,baseRenderResults=renderResults,baseRenderMatches=renderMatches;
 let live=null,failed=false,timer=null,inFlight=false,lastFetch=0;
 const de=()=>window.SLI18n?.language==='de';
 const text=(fr,german)=>de()?german:fr;
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const locale=()=>de()?'de-CH':'fr-CH';
 const format=(iso,full=false)=>new Intl.DateTimeFormat(locale(),{timeZone:'Europe/Zurich',...(full?{day:'numeric',month:'short'}:{}),hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
 const day=iso=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));
 const status=e=>e.status==='live'?(e.halfTime?text('Mi-temps','Halbzeit'):text('En cours','Läuft')+(e.minute!==null?' · '+e.minute+'′':'')):e.status==='suspended'?text('Interrompu','Unterbrochen'):e.status==='post-game'?text('Terminé','Beendet'):e.status==='awarded'?text('Résultat attribué','Gewertet'):e.status==='postponed'?text('Reporté','Verschoben'):e.status==='cancelled'?text('Annulé','Abgesagt'):text('À venir','Bevorstehend');
 const active=e=>['live','suspended'].includes(e.status);
 const currentRank=club=>live?.standings.find(r=>r.club===club)?.rank||club+1;
 const sourceDate=()=>live?format(live.updatedAt,true):'12.10.2026';
 fixture=function(f){
  if(!live)return baseFixture(f);
  const e=live.fixtures.find(e=>e.home===f[0]&&e.away===f[1]);
  if(!e)return baseFixture(f);
  const date=new Intl.DateTimeFormat(locale(),{timeZone:'Europe/Zurich',weekday:'short',day:'numeric',month:'short'}).format(new Date(e.kickoff));
  const score=e.homeScore!==null&&e.awayScore!==null&&e.status!=='pre-game';
  const matchDay=day(e.kickoff),today=day(Date.now()),yesterday=day(Date.now()-86400000);
  const banner=matchDay===today?text('Aujourd’hui','Heute'):matchDay===yesterday?text('Hier','Gestern'):'';
  return `<article class="fixture ${banner?'has-day-banner':''}" data-no-i18n>${banner?`<div class="match-day-banner ${matchDay===today?'day-today':'day-past'}">${banner}${['post-game','awarded'].includes(e.status)?' · '+text('Terminé','Beendet'):''}</div>`:''}<div class="team ${e.home===favorite?'favorite-team':''}">${crest(e.home)}<span>${escape(window.SLI18n.translate(teams[e.home][0]))}</span></div><div class="fixture-mid"><small>${date}</small><strong class="${active(e)?'live-score':''}">${score?e.homeScore+' – '+e.awayScore:format(e.kickoff)}</strong><small class="live-match-state ${active(e)?'live-active':''}">${status(e)}</small><small class="venue">${escape(e.venue)}</small></div><div class="team ${e.away===favorite?'favorite-team':''}">${crest(e.away)}<span>${escape(window.SLI18n.translate(teams[e.away][0]))}</span></div></article>`;
 };
 table=function(limit){
  if(!live)return baseTable(limit);
  const heads=de()?['#','Verein','Sp','S','U','N','Diff.','Pkt.']:['#','Club','MJ','V','N','D','Diff.','Pts'];
  return `<table data-no-i18n><caption class="sr-only">${text('Classement','Tabelle')} · ${live.provisional?text('Provisoire','Vorläufig'):text('Résultats finaux','Endergebnisse')} · ${sourceDate()}</caption><thead><tr>${heads.map((h,i)=>`<th scope="col" class="${i>=3&&i<=5?'detail-col':''}">${h}</th>`).join('')}</tr></thead><tbody>${live.standings.slice(0,limit).map(r=>`<tr class="${r.club===favorite?'favorite':''}"><td>${r.rank}</td><td><a class="standings-club-link" href="#joueurs/equipe/${r.club}">${crest(r.club)}${escape(window.SLI18n.translate(teams[r.club][0]))}${r.live?'<span class="live-team-dot" aria-label="'+text('Match en cours','Spiel läuft')+'"></span>':''}<span class="club-link-arrow" aria-hidden="true">↗</span></a></td><td>${r.played}</td><td class="detail-col">${r.won}</td><td class="detail-col">${r.draw}</td><td class="detail-col">${r.lost}</td><td>${r.goalDifference>0?'+':''}${r.goalDifference}</td><td>${r.points}</td></tr>`).join('')}</tbody></table>`;
 };
 renderResults=function(limit){
  if(!live)return baseRenderResults(limit);
  return live.results.slice(0,limit).map(e=>`<div class="result" data-no-i18n><span>${escape(window.SLI18n.translate(teams[e.home][0]))}</span><strong class="score">${e.homeScore} – ${e.awayScore}</strong><span>${escape(window.SLI18n.translate(teams[e.away][0]))}</span></div>`).join('');
 };
 renderMatches=function(){
  if(!live||matchFilter!=='next')return baseRenderMatches();
  document.querySelector('#match-list').innerHTML=live.fixtures.map(e=>`<div class="panel">${fixture([e.home,e.away])}</div>`).join('');
 };
 const banner=document.createElement('section');banner.className='live-overview';banner.setAttribute('data-no-i18n','');banner.setAttribute('aria-live','polite');document.querySelector('#stats').before(banner);
 const tableNote=document.createElement('p');tableNote.className='live-table-note';tableNote.setAttribute('data-no-i18n','');document.querySelector('#full-table').before(tableNote);
 function decorate(){
  const stale=live&&Date.now()-Date.parse(live.updatedAt)>(live.provisional?20*60000:26*3600000);
  const title=live?.provisional?text('Classement provisoire · matchs en cours','Vorläufige Tabelle · laufende Spiele'):text('Scores & classement SFL','Resultate & Tabelle SFL');
  const failure=failed||stale;
  const message=failure?text('Actualisation indisponible ou en retard. Dernières données conservées.','Aktualisierung nicht verfügbar oder verspätet. Letzter Stand bleibt sichtbar.'):live?text('Source officielle · actualisation automatique chaque minute pendant les matchs','Offizielle Quelle · automatische Aktualisierung jede Minute während der Spiele'):text('Connexion à la source officielle… Données enregistrées du 12.10.2026 en attendant.','Offizielle Quelle wird geladen… Bis dahin gespeicherte Daten vom 12.10.2026.');
  banner.innerHTML=`<div><strong>${title}</strong><p>${message}</p></div><span class="live-checked">${live?text('Vérifié','Geprüft')+' · '+sourceDate():''}</span>`;
  banner.classList.toggle('live-warning',!!failure);
  tableNote.textContent=live?(live.provisional?text('PROVISOIRE — points calculés selon les scores en cours. Matchs non terminés.','VORLÄUFIG — Punkte nach aktuellem Spielstand. Spiele noch nicht beendet.'):text('Classement calculé sur les matchs terminés.','Tabelle auf Grundlage beendeter Spiele.'))+' '+text('Dernière vérification SFL : ','Letzte SFL-Abfrage: ')+sourceDate():message;
  if(!live)return;
  const footer=document.querySelector('footer');
  if(footer?.firstChild?.nodeType===3){footer.setAttribute('data-no-i18n','');footer.firstChild.nodeValue=text('Scores et classement : source officielle SFL · ','Resultate und Tabelle: offizielle SFL-Quelle · ')+sourceDate()+'. '+text('Actualités : collecte quotidienne.','Nachrichten: tägliche Abfrage.');}
  // Club identity stays fixed; only sporting totals change.
  const favoriteNumbers=document.querySelectorAll('#favorite-card .favorite-numbers strong');
  if(favoriteNumbers[0])favoriteNumbers[0].innerHTML=currentRank(favorite)+'<span> / 12</span>';
  const badge=document.querySelector('#favorite-card .badge');if(badge){badge.setAttribute('data-no-i18n','');badge.textContent=sourceDate();}
  const heading=document.querySelector('#classement .page-heading p');if(heading){heading.setAttribute('data-no-i18n','');heading.textContent='Super League · '+(live.provisional?text('Provisoire','Vorläufig'):text('Matchs terminés','Beendete Spiele'))+' · '+sourceDate();}
  const note=document.querySelector('#classement .table-note');if(note){note.setAttribute('data-no-i18n','');note.textContent=text('MJ : matchs joués · Diff. : différence de buts · Pts : points. Source : Swiss Football League.','Sp: Spiele · Diff.: Tordifferenz · Pkt.: Punkte. Quelle: Swiss Football League.');}
  const matchIntro=document.querySelector('#matchs .page-heading p');if(matchIntro){matchIntro.setAttribute('data-no-i18n','');matchIntro.textContent=text('Journée ','Spieltag ')+live.week+' · '+text('heures suisses','Schweizer Zeit')+' · '+sourceDate()+' · '+text('Actualisation automatique','Automatische Aktualisierung');}
  const stats=document.querySelectorAll('#stats .stat');
  if(stats[0]){stats[0].querySelector('strong').textContent=String(live.standings.reduce((s,r)=>s+r.gf,0));stats[0].querySelector('.caption').textContent=live.provisional?text('Inclut les matchs en cours','Inkl. laufender Spiele'):text('Matchs terminés','Beendete Spiele');}
  if(stats[1]){stats[1].querySelector('strong').textContent=String(live.standings.reduce((s,r)=>s+r.played,0)/2);stats[1].querySelector('.caption').textContent=text('Journée ','Spieltag ')+live.week;}
  if(stats[2]){const leader=live.standings[0];stats[2].querySelector('strong').textContent=window.SLI18n.translate(teams[leader.club][0]);stats[2].querySelector('.caption').textContent=leader.points+' '+text('points','Punkte')+(live.provisional?' · '+text('provisoire','vorläufig'):'');}
 }
 const originalRender=render;
 render=function(){originalRender();decorate();};
 function apply(data){
  if(!Array.isArray(data.standings)||data.standings.length!==12||!Array.isArray(data.fixtures)||!data.updatedAt)throw Error('Invalid live data');
  live=data;window.SLLive=data;
  for(const row of data.standings){const t=teams[row.club];if(!t)throw Error('Invalid club');t[2]=row.points;t[3]=row.won;t[4]=row.draw;t[5]=row.lost;t[6]=row.gf;t[7]=row.ga;}
  const upcoming=data.fixtures.filter(e=>!['post-game','awarded','cancelled'].includes(e.status));
  fixtures.splice(0,fixtures.length,...upcoming.map(e=>[e.home,e.away,new Intl.DateTimeFormat(locale(),{timeZone:'Europe/Zurich',weekday:'short',day:'numeric',month:'short'}).format(new Date(e.kickoff)),format(e.kickoff),e.kickoff,e.id]));
  results.splice(0,results.length,...data.results.map(e=>[e.home,e.away,e.homeScore,e.awayScore,new Intl.DateTimeFormat(locale(),{timeZone:'Europe/Zurich',day:'numeric',month:'short'}).format(new Date(e.kickoff))]));
  render();window.SLI18n.apply();window.dispatchEvent(new Event('sl-live-updated'));
 }
 function refreshDelay(){
  if(failed||!live)return 60000;
  const now=Date.now(),today=day(now);
  const ongoing=live.fixtures.some(e=>active(e)||(e.status==='pre-game'&&Date.parse(e.kickoff)<=now+5*60000&&Date.parse(e.kickoff)>=now-3*3600000));
  if(ongoing)return 60000;
  if(live.fixtures.some(e=>day(e.kickoff)===today))return 5*60000;
  const next=live.fixtures.filter(e=>e.status==='pre-game').map(e=>Date.parse(e.kickoff)-now-5*60000).filter(t=>t>0).sort((a,b)=>a-b)[0];
  return Math.max(30000,Math.min(15*60000,next||15*60000));
 }
 function schedule(){clearTimeout(timer);if(document.visibilityState!=='hidden')timer=setTimeout(load,refreshDelay());}
 async function load(){
  if(inFlight||document.visibilityState==='hidden')return;
  inFlight=true;clearTimeout(timer);
  try{const response=await fetch('/api/live',{cache:'no-cache'});if(!response.ok)throw Error('Source unavailable');const data=await response.json();failed=false;apply(data);lastFetch=Date.now();}catch{failed=true;decorate();}finally{inFlight=false;schedule();}
 }
 function refreshWhenNeeded(){if(document.visibilityState==='hidden')return;if(!live||failed||Date.now()-lastFetch>=30000)load();else schedule();}
 window.addEventListener('sl-language-change',()=>{if(live)apply(live);else decorate();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')clearTimeout(timer);else refreshWhenNeeded();});
 window.addEventListener('focus',refreshWhenNeeded);
 window.addEventListener('online',()=>{if(document.visibilityState!=='hidden')load();});
 window.addEventListener('hashchange',()=>{if(['#matchs','#classement'].includes(location.hash))refreshWhenNeeded();});
 decorate();load();
})();
