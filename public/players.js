(() => {
  let data,loading,teams,crest,query='',filter='all';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tr=(fr,de)=>window.SLI18n.language==='de'?de:fr;
  const positions={Goalkeeper:['Gardien','Torwart'],Defender:['Défenseur','Verteidiger'],Midfielder:['Milieu','Mittelfeld'],Forward:['Attaquant','Stürmer']};
  const pos=p=>(positions[p.position]||[p.position,p.position])[window.SLI18n.language==='de'?1:0];
  const href=p=>'#joueurs/joueur/'+p.slug;
  const picture=p=>`<div class="portrait-wrap">${p.photo?`<img class="player-portrait" src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy" referrerpolicy="no-referrer">`:''}<span class="portrait-fallback" ${p.photo?'hidden':''}>${esc(p.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}<small>${tr('Photo indisponible','Foto nicht verfügbar')}</small></span></div>`;
  const card=p=>`<a class="player-card" href="${href(p)}">${picture(p)}<div><small>${p.number!=null?'#'+p.number+' · ':''}${esc(pos(p))}</small><h3>${esc(p.name)}</h3><span>${esc(teams[p.club][0])}</span></div><span class="player-card-arrow" aria-hidden="true">↗</span></a>`;
  const source=()=>`<p class="table-note">${tr('Effectifs et fiches SFL vérifiés au 12 octobre 2026. Photos : SFL / clubs. Les données manquantes sont indiquées.','SFL-Kader und Profile geprüft am 12. Oktober 2026. Fotos: SFL / Vereine. Fehlende Angaben sind gekennzeichnet.')} <a href="https://sfl.ch/player-list/joueurs-super-league" target="_blank" rel="noopener">SFL ↗</a></p>`;
  async function load(){if(data)return data;if(!loading)loading=fetch('/players-data.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>data=d).catch(e=>{loading=null;throw e;});return loading;}
  function roster(club,exclude){return data.players.filter(p=>p.club===club&&p.slug!==exclude).sort((a,b)=>(a.number??999)-(b.number??999));}
  function navigate(){if(location.hash.startsWith('#joueurs'))window.renderPlayers(teams,crest);}
  let scoringData=null,scoringPending=null,scoringFailed=false;
  function seasonStats(player){const current=scoringData?.players?.find(p=>p.slug===player.slug),goals=current?.goals??player.goals;
    const rank=current?.rank?(window.SLI18n.language==='de'?current.rank+'.':current.rank===1?'1er':current.rank+'e'):'–';
    const extra=current?.rank?(current.tied?tr('ex æquo','geteilt'):''):current?.goals===0?tr('Aucun but','Noch kein Tor'):tr('Non disponible','Nicht verfügbar');
    const stamp=scoringData?tr('Super League 2026/27 · buts et rang · SFL vérifié le ','Super League 2026/27 · Tore und Rang · SFL geprüft am ')+new Intl.DateTimeFormat(window.SLI18n.language==='de'?'de-CH':'fr-CH',{timeZone:'Europe/Zurich',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(scoringData.updatedAt)):scoringFailed?tr('Buts enregistrés au 12.10.2026 · rang indisponible.','Gespeicherte Tore vom 12.10.2026 · Rang nicht verfügbar.'):tr('Actualisation des buts et du rang…','Tore und Rang werden aktualisiert…');
    return `<div class="player-season-stats player-season-ranked" aria-label="${tr('Super League · saison 2026/27','Super League · Saison 2026/27')}">${[[current?.games??player.games,tr('Matchs','Spiele')],[goals,tr('Buts','Tore')],[current?.assists??player.assists,tr('Passes décisives','Assists')]].map(([n,label])=>`<div><strong>${n??'–'}</strong><small>${label}</small></div>`).join('')}<div class="player-scorer-rank"><strong>${rank}</strong><small>${tr('Classement buteurs','Torschützenrang')}</small><small>${extra}</small></div></div><p class="player-scoring-source">${esc(stamp)}${scoringData?` · <a href="${scoringData.sourceUrl}" target="_blank" rel="noopener">${tr('Classement SFL ↗','SFL-Torschützen ↗')}</a>`:''}</p>`;
  }
  function updateScoring(){document.querySelectorAll('[data-player-scoring]').forEach(slot=>{const player=data?.players.find(p=>p.slug===slot.dataset.playerScoring);if(player)slot.innerHTML=seasonStats(player);});}
  async function refreshScoring(){if(scoringPending||scoringData&&Date.now()-Date.parse(scoringData.updatedAt)<5*60000)return;scoringPending=(async()=>{try{const response=await fetch('/api/scorers');if(!response.ok)throw Error();const next=await response.json();if(next.season!=='2026/27'||!Array.isArray(next.players)||!next.updatedAt)throw Error();scoringData=next;scoringFailed=false;}catch{scoringFailed=true;}finally{scoringPending=null;updateScoring();}})();return scoringPending;}
  function profileMarkup(player){
    refreshScoring();
    const club=player.club,locale=window.SLI18n.language==='de'?'de-CH':'fr-CH',date=player.birth?new Date(player.birth).toLocaleDateString(locale,{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}):tr('Non renseignée','Nicht angegeben');
    const nat=window.SLI18n.language==='de'?player.nationalityDE:player.nationality,missing=tr('Non renseigné','Nicht angegeben');
    const clubLink=i=>`<a href="#joueurs/equipe/${i}">${crest(i)}${esc(teams[i][0])}</a>`;
    return `<article class="panel player-profile">${picture(player)}<div><span class="eyebrow">${esc(pos(player))}${player.number!=null?' · #'+player.number:''}</span><h1 tabindex="-1">${esc(player.name)}</h1><div class="profile-club">${clubLink(club)}</div><dl class="player-facts"><div><dt>${tr('Naissance','Geburtsdatum')}</dt><dd>${date}</dd></div><div><dt>${tr('Nationalité','Nationalität')}</dt><dd>${esc(nat||missing)}</dd></div><div><dt>${tr('Taille','Grösse')}</dt><dd>${player.height?player.height+' cm':missing}</dd></div><div><dt>${tr('Pied préféré','Bevorzugter Fuss')}</dt><dd>${esc(({right:tr('Droit','Rechts'),left:tr('Gauche','Links'),both:tr('Les deux','Beide')})[player.foot]||missing)}</dd></div></dl><div data-player-scoring="${esc(player.slug)}">${seasonStats(player)}</div><h2>${tr('En quelques mots','Kurz vorgestellt')}</h2><p>${esc(tr(`${player.name} joue comme ${pos(player).toLowerCase()} pour ${teams[club][0]}.`,`${player.name} spielt als ${pos(player)} bei ${window.SLI18n.translate(teams[club][0])}.`))} ${player.birth?tr(`Né le ${date}.`,`Geboren am ${date}.`):''} ${player.height?tr(`Il mesure ${player.height} cm.`,`Er ist ${player.height} cm gross.`):''}</p><a href="https://sfl.ch/players/${esc(player.slug)}" target="_blank" rel="noopener">${tr('Fiche officielle SFL ↗','Offizielles SFL-Profil ↗')}</a></div></article>`;
  }
  const profileDialog=document.createElement('dialog');profileDialog.className='player-profile-modal';profileDialog.setAttribute('data-no-i18n','');profileDialog.setAttribute('aria-labelledby','player-modal-name');document.body.append(profileDialog);
  let modalSlug=null,modalOpener=null,modalRequest=0;
  function renderModal(player){profileDialog.innerHTML=`<div class="player-modal-toolbar"><span>${tr('Fiche joueur','Spielerprofil')}</span><button type="button" data-close-player-modal aria-label="${tr('Fermer','Schliessen')}">×</button></div>${profileMarkup(player)}${source()}`;const heading=profileDialog.querySelector('h1');heading.id='player-modal-name';}
  window.openPlayerProfile=async(slug,t,c,opener)=>{
    teams=t;crest=c;modalSlug=slug;modalOpener=opener;const serial=++modalRequest;
    profileDialog.innerHTML=`<div class="player-modal-toolbar"><span id="player-modal-name">${tr('Fiche joueur','Spielerprofil')}</span><button type="button" data-close-player-modal aria-label="${tr('Fermer','Schliessen')}">×</button></div><p role="status">${tr('Chargement du joueur…','Spieler wird geladen…')}</p>`;
    if(!profileDialog.open)profileDialog.showModal();
    try{await load();if(serial!==modalRequest||!profileDialog.open)return;const player=data.players.find(p=>p.slug===slug);if(!player)throw Error();renderModal(player);}catch{if(serial===modalRequest&&profileDialog.open)profileDialog.querySelector('[role=status]').textContent=tr('Fiche indisponible pour le moment.','Profil derzeit nicht verfügbar.');}
  };
  profileDialog.addEventListener('click',e=>{if(e.target.closest('[data-close-player-modal]')||e.target.closest('a[href^="#"]'))profileDialog.close();else if(e.target===profileDialog){const r=profileDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)profileDialog.close();}});
  profileDialog.addEventListener('close',()=>{modalRequest++;const slug=modalSlug;modalSlug=null;const target=modalOpener?.isConnected?modalOpener:document.querySelector('[data-player-profile="'+slug+'"]');target?.focus({preventScroll:true});});
  window.addEventListener('sl-language-change',()=>{if(profileDialog.open&&modalSlug&&data){const player=data.players.find(p=>p.slug===modalSlug);if(player)renderModal(player);}});
  window.renderPlayers=async(t,c)=>{
    teams=t;crest=c;const root=document.querySelector('#players-content'),route=location.hash;
    if(!data)root.innerHTML=`<p role="status">${tr('Chargement des joueurs…','Spieler werden geladen…')}</p>`;
    try{if(!data)await load();}catch{root.innerHTML=`<p role="alert">${tr('Les fiches sont indisponibles pour le moment.','Die Profile sind derzeit nicht verfügbar.')}</p><button data-retry-players>${tr('Réessayer','Erneut versuchen')}</button>`;return;}
    if(location.hash!==route)return;
    const [,kind,id]=route.slice(1).split('/');
    const player=kind==='joueur'?data.players.find(p=>p.slug===id):null;
    const club=player?player.club:kind==='equipe'?Number(id):null;
    const validClub=club!==null&&Number.isInteger(club)&&club>=0&&club<teams.length;
    const clubLink=i=>`<a href="#joueurs/equipe/${i}">${crest(i)}${esc(teams[i][0])}</a>`;
    const crumbs=`<nav class="player-breadcrumb" aria-label="${tr('Fil d’Ariane','Brotkrumennavigation')}"><a href="#joueurs">${tr('Équipes & joueurs','Teams & Spieler')}</a>${validClub?`<span aria-hidden="true">/</span>${clubLink(club)}`:''}${player?`<span aria-hidden="true">/</span><span aria-current="page">${esc(player.name)}</span>`:''}</nav>`;
    if((kind==='joueur'&&!player)||(kind==='equipe'&&!validClub)){root.innerHTML=crumbs+`<p>${tr('Cette fiche est introuvable.','Dieses Profil wurde nicht gefunden.')}</p><a href="#joueurs">${tr('Toutes les équipes','Alle Teams')}</a>`;return;}
    if(player){
      const locale=window.SLI18n.language==='de'?'de-CH':'fr-CH',date=player.birth?new Date(player.birth).toLocaleDateString(locale,{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'}):tr('Non renseignée','Nicht angegeben');
      const nat=window.SLI18n.language==='de'?player.nationalityDE:player.nationality;
      const missing=tr('Non renseigné','Nicht angegeben');
      root.innerHTML=crumbs+`<div class="player-actions"><a href="#joueurs/equipe/${club}">← ${tr('Retour à l’effectif','Zurück zum Kader')}</a><a href="#joueurs">${tr('Toutes les équipes','Alle Teams')} ×</a></div>${profileMarkup(player)}<section class="teammates"><div class="section-head"><h2>${tr('Les autres joueurs de','Weitere Spieler von')} ${esc(teams[club][0])}</h2><a href="#joueurs/equipe/${club}">${tr('Tout l’effectif →','Ganzer Kader →')}</a></div><div class="player-grid">${roster(club,player.slug).map(card).join('')}</div></section>`+source();
      document.title=player.name+' · '+teams[club][0]+' — Super League';
    }else if(validClub){
      root.innerHTML=crumbs+`<div class="player-actions"><a href="#joueurs">← ${tr('Toutes les équipes','Alle Teams')}</a><label>${tr('Changer d’équipe','Team wechseln')}<select id="browse-team">${teams.map((x,i)=>`<option value="${i}" ${i===club?'selected':''}>${esc(x[0])}</option>`).join('')}</select></label></div><div class="panel roster-heading">${crest(club)}<div><span class="eyebrow">SUPER LEAGUE · 2026/27</span><h1 tabindex="-1">${esc(teams[club][0])}</h1><p>${roster(club).length} ${tr('joueurs dans l’effectif SFL','Spieler im SFL-Kader')}</p></div></div><div class="player-grid">${roster(club).map(card).join('')}</div>`+source();
      document.title=teams[club][0]+' — '+tr('Effectif','Kader')+' · Super League';
    }else{
      root.innerHTML=crumbs+`<div class="page-heading players-hero"><img src="/assets/players-celebration.webp" alt="" aria-hidden="true" class="players-hero-image" fetchpriority="high"><div class="players-hero-copy"><span class="eyebrow">SUPER LEAGUE · 2026/27</span><h1>${tr('Équipes & joueurs','Teams & Spieler')}</h1><p>${tr('Choisis une équipe ou cherche directement un joueur.','Wähle ein Team oder suche direkt einen Spieler.')}</p></div></div><div class="club-grid">${teams.map((x,i)=>`<a class="club-browser-card" href="#joueurs/equipe/${i}">${crest(i)}<strong>${esc(x[0])}</strong><small>${roster(i).length} ${tr('joueurs','Spieler')} →</small></a>`).join('')}</div><section class="panel player-search-panel"><h2>${tr('Trouver un joueur','Spieler finden')}</h2><div class="player-search"><label>${tr('Nom du joueur','Spielername')}<input id="player-search" type="search" value="${esc(query)}" placeholder="${tr('Ex. Essende, Boteli…','Z. B. Essende, Boteli…')}"></label><label>${tr('Équipe','Team')}<select id="player-team-filter"><option value="all">${tr('Toutes les équipes','Alle Teams')}</option>${teams.map((x,i)=>`<option value="${i}" ${filter===String(i)?'selected':''}>${esc(x[0])}</option>`).join('')}</select></label></div><p id="player-search-count" role="status"></p><div id="search-player-results" class="player-grid"></div></section>`+source();results();
    }
    window.SLI18n.apply();
    root.querySelector?.('h1[tabindex]')?.focus({preventScroll:true});
  };
  function results(){const list=data.players.filter(p=>(filter==='all'||p.club===Number(filter))&&p.name.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().includes(query.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()));document.querySelector('#player-search-count').textContent=list.length+' '+tr('joueurs trouvés','Spieler gefunden');document.querySelector('#search-player-results').innerHTML=list.length?list.map(card).join(''):`<p>${tr('Aucun joueur trouvé.','Kein Spieler gefunden.')}</p>`;window.SLI18n.apply();}
  document.addEventListener('input',e=>{if(e.target.id==='player-search'){query=e.target.value;results();}});
  document.addEventListener('change',e=>{if(e.target.id==='browse-team')location.hash='#joueurs/equipe/'+e.target.value;if(e.target.id==='player-team-filter'){filter=e.target.value;results();}});
  document.addEventListener('click',e=>{if(e.target.closest('[data-retry-players]'))navigate();});
  document.addEventListener('error',e=>{if(!e.target.matches?.('.player-portrait'))return;e.target.hidden=true;e.target.nextElementSibling.hidden=false;},true);
  setInterval(()=>{if(document.visibilityState!=='hidden'&&(profileDialog.open||location.hash.startsWith('#joueurs/joueur/')))refreshScoring();},5*60000);

})();
