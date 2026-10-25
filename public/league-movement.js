(()=>{
 const host=document.querySelector('#full-table');if(!host)return;
 const de=()=>window.SLI18n?.language==='de',t=(fr,deText)=>de()?deText:fr;
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const legend=document.createElement('div');legend.className='movement-legend';legend.setAttribute('data-no-i18n','');host.after(legend);
 const panel=document.createElement('section');panel.className='panel promotion-panel';panel.setAttribute('data-no-i18n','');host.closest('.panel').after(panel);
 let data=null,failed=false;
 function mark(){
  host.querySelectorAll('tbody tr').forEach(row=>{
   const rank=Number(row.cells[0]?.textContent);row.classList.toggle('risk-playoff',rank===11);row.classList.toggle('risk-down',rank===12);
   const cell=row.cells[1];if(!cell)return;
   let tag=cell.querySelector('.movement-tag');
   if(rank!==11&&rank!==12){tag?.remove();return;}
   if(!tag){tag=document.createElement('span');tag.className='movement-tag';cell.append(tag);}
   tag.textContent=rank===11?t('↕ Barrage','↕ Barrage'):t('↓ Relégation','↓ Abstieg');
  });
 }
 function render(){
  legend.innerHTML=`<span class="legend-playoff">${t('11e · barrage contre le 2e de Challenge League','11. · Barrage gegen den Zweiten der Challenge League')}</span><span class="legend-down">${t('12e · relégation directe','12. · direkter Abstieg')}</span><p>${t('Places à risque au classement actuel. La décision tombe en fin de saison.','Gefährdete Plätze im aktuellen Klassement. Die Entscheidung fällt am Saisonende.')}</p>`;
  panel.innerHTML=`<div class="section-head"><div><span class="eyebrow">CHALLENGE LEAGUE</span><h2>${t('En route vers la Super League','Auf dem Weg in die Super League')}</h2></div><span class="promotion-symbol" aria-hidden="true">↑</span></div><p class="promotion-intro">${t('Les quatre premiers · la course à la montée','Die ersten vier · das Aufstiegsrennen')}</p>${data?`<div class="promotion-list">${data.standings.map(r=>`<article class="promotion-team promotion-rank-${r.rank}"><span class="promotion-rank">${r.rank}</span><div><strong>${esc(r.name)}</strong><small>${r.rank===1?t('↑ Place de montée directe','↑ Direkter Aufstiegsplatz'):r.rank===2?t('↕ Place de barrage','↕ Barrageplatz'):t('Dans la poursuite','In der Verfolgung')} · ${r.played} ${t('matchs','Spiele')}</small></div><b>${r.points}<small>${t('pts','Pkt.')}</small></b></article>`).join('')}</div><p class="promotion-source">${t('Vérifié','Geprüft')} · ${new Intl.DateTimeFormat(de()?'de-CH':'fr-CH',{timeZone:'Europe/Zurich',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(data.updatedAt))} · <a href="${data.sourceUrl}" target="_blank" rel="noopener">${t('Classement officiel SFL ↗','Offizielle SFL-Tabelle ↗')}</a></p>`:`<p role="status">${failed?t('Classement momentanément indisponible.','Tabelle vorübergehend nicht verfügbar.'):t('Chargement du classement officiel…','Offizielle Tabelle wird geladen…')}</p>`}<p class="promotion-footnote">${t('En fin de saison : le 1er monte directement, le 2e affronte le 11e de Super League en barrage. Sous réserve de la licence requise. Ces places ne constituent pas une prédiction.','Am Saisonende steigt der Erste direkt auf. Der Zweite spielt die Barrage gegen den Elften der Super League. Vorbehaltlich der erforderlichen Lizenz. Diese Plätze sind keine Prognose.')}</p>`;
  mark();
 }
 new MutationObserver(mark).observe(host,{childList:true});
 async function load(){try{const res=await fetch('/api/challenge');if(!res.ok)throw Error();const next=await res.json();if(next.standings?.length!==4||!next.updatedAt)throw Error();data=next;failed=false;}catch{failed=true;}render();}
 window.addEventListener('sl-language-change',render);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&(!data||Date.now()-Date.parse(data.updatedAt)>15*60000))load();});
 render();load();setInterval(()=>{if(document.visibilityState==='visible')load();},15*60000);
})();
