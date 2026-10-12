(() => {
  const translations = {
    'Équipes & joueurs':'Teams & Spieler','Joueurs':'Spieler',
    'Aller au contenu':'Zum Inhalt springen',
    'Le football suisse, en un coup d’œil':'Schweizer Fussball auf einen Blick',
    'Actu et stats':'News & Statistiken','Classement':'Tabelle','Matchs':'Spiele','Pronos':'Tipps',
    'Mon club':'Mein Verein','Navigation principale':'Hauptnavigation','Navigation mobile':'Mobile Navigation','Choisir mon club':'Lieblingsverein wählen','Langue':'Sprache',
    'SAISON 2026 / 2027':'SAISON 2026 / 2027',
    'Données vérifiées au 12 octobre 2026 · 10ᵉ journée terminée':'Daten geprüft am 12. Oktober 2026 · 10. Spieltag abgeschlossen',
    'FOOTBALL SUISSE':'SCHWEIZER FUSSBALL','Suisse. Football.':'Schweiz. Fussball.','Passion.':'Leidenschaft.',
    'L’actualité, les chiffres clés et les rencontres réunis au même endroit.':'News, Kennzahlen und Spiele an einem Ort.',
    'Voir les matchs':'Spiele ansehen','Buts inscrits':'Erzielte Tore','Matchs joués':'Gespielte Partien','Leader':'Tabellenführer',
    '3,80 par match':'3,80 pro Spiel','Après la 10ᵉ journée':'Nach dem 10. Spieltag','28 points · 6 points d’avance':'28 Punkte · 6 Punkte Vorsprung',
    'TON CLUB FAVORI':'DEIN LIEBLINGSVEREIN','Ton club favori':'Dein Lieblingsverein','12 octobre 2026':'12. Oktober 2026',
    'Position':'Platz','Points':'Punkte','Prochain match':'Nächstes Spiel','Dernier résultat':'Letztes Ergebnis',
    'Voir les rencontres →':'Spiele ansehen →','Pas de rencontre disponible.':'Keine Partie verfügbar.','Pas de résultat disponible.':'Kein Ergebnis verfügbar.',
    'À la une':'Aktuell','LE BILAN DU WEEK-END':'DAS WOCHENENDE IM RÜCKBLICK',
    'Lugano garde six points d’avance.':'Lugano behält sechs Punkte Vorsprung.',
    'Vainqueur 4–0 de Lucerne, Lugano totalise 28 points. Young Boys s’impose 2–0 chez Grasshoppers et reste deuxième avec 22 points.':'Nach dem 4:0 gegen Luzern hat Lugano 28 Punkte. Young Boys gewinnt bei den Grasshoppers 2:0 und bleibt mit 22 Punkten Zweiter.',
    'Voir les six résultats →':'Alle sechs Ergebnisse →','SAINT-GALL · 11 OCTOBRE':'ST. GALLEN · 11. OKTOBER',
    'Görtler donne la victoire contre Lausanne':'Görtler sichert den Sieg gegen Lausanne',
    'Un penalty à la 29ᵉ minute suffit pour gagner 1–0.':'Ein Penalty in der 29. Minute reicht zum 1:0-Sieg.',
    'Lire le compte rendu du club ↗':'Spielbericht des Vereins lesen ↗','RÉSULTATS':'ERGEBNISSE',
    'Servette et Vaduz gagnent 3–0':'Servette und Vaduz gewinnen 3:0',
    'Servette bat Sion ; Vaduz s’impose face à Bâle.':'Servette besiegt Sion; Vaduz gewinnt gegen Basel.',
    'Tous les résultats →':'Alle Ergebnisse →','MON CLUB':'MEIN VEREIN','Votre club favori':'Dein Lieblingsverein',
    'Classement, dernier résultat et prochaine rencontre de votre club.':'Tabellenplatz, letztes Ergebnis und nächste Partie deines Vereins.',
    'Prochaines rencontres':'Nächste Spiele','Voir tout →':'Alle ansehen →','Derniers résultats':'Letzte Ergebnisse',
    'LA LIGUE EN UN COUP D’ŒIL':'DIE LIGA AUF EINEN BLICK',
    'Super League 2026/27 · après les matchs du 11 octobre 2026':'Super League 2026/27 · nach den Spielen vom 11. Oktober 2026',
    'Les clubs':'Die Vereine','Statistiques détaillées':'Detaillierte Statistiken','Vue simplifiée':'Einfache Ansicht',
    'MJ':'Sp.','Club':'Verein','V':'S','N':'U','D':'N','Diff.':'Diff.','Pts':'Pkt.',
    'MJ : matchs joués · Diff. : différence de buts · Pts : points. Classement vérifié au 12 octobre 2026.':'Sp.: Spiele · Diff.: Tordifferenz · Pkt.: Punkte. Tabelle geprüft am 12. Oktober 2026.',
    'Classement Super League 2026/27 au 12 octobre 2026':'Tabelle der Super League 2026/27 am 12. Oktober 2026',
    'CALENDRIER & RÉSULTATS':'SPIELPLAN & ERGEBNISSE','Les matchs':'Die Spiele',
    'Prochaine journée : 24–25 octobre 2026 · heures suisses':'Nächster Spieltag: 24.–25. Oktober 2026 · Schweizer Zeit',
    'Choisir les rencontres':'Spiele auswählen','À venir':'Demnächst','Résultats':'Ergebnisse','Terminé':'Beendet',
    'Sam. 24 octobre':'Sa., 24. Oktober','Dim. 25 octobre':'So., 25. Oktober',
    '10 octobre 2026':'10. Oktober 2026','11 octobre 2026':'11. Oktober 2026',
    'LE JEU ENTRE AMIS':'DAS TIPPSPIEL UNTER FREUNDEN','Vos pronos':'Eure Tipps','En construction':'In Vorbereitung',
    'Les pronostics arrivent bientôt.':'Das Tippspiel kommt bald.',
    'Cette section est en préparation. Vous pourrez bientôt pronostiquer les scores entre amis.':'Dieser Bereich ist in Vorbereitung. Bald könnt ihr unter Freunden Spielergebnisse tippen.',
    'Voir les prochains matchs →':'Nächste Spiele ansehen →',
    'Données vérifiées au 12 octobre 2026 · actualisation automatique à connecter.':'Daten geprüft am 12. Oktober 2026 · automatische Aktualisierung noch einzurichten.',
    'Calendrier officiel SFL ↗':'Offizieller SFL-Spielplan ↗','Classement ↗':'Tabelle ↗','Résultats ↗':'Ergebnisse ↗',
    'Saint-Gall':'St. Gallen','Zurich':'Zürich','Bâle':'Basel','Lucerne':'Luzern','Thoune':'Thun',
    'Stadion Wankdorf · Berne':'Stadion Wankdorf · Bern','Stade de Tourbillon · Sion':'Stade de Tourbillon · Sion',
    'Berit Sitterstadion · Saint-Gall':'Berit Sitterstadion · St. Gallen','Letzigrund · Zurich':'Letzigrund · Zürich',
    'St. Jakob-Park · Bâle':'St. Jakob-Park · Basel','Swissporarena · Lucerne':'Swissporarena · Luzern','Stockhorn Arena · Thoune':'Stockhorn Arena · Thun'
  };
  const originals = new WeakMap(), originalAttrs = new WeakMap();
  let language='fr',scheduled=false;
  try {if(localStorage.getItem('sl-language')==='de')language='de';} catch {}
  function translate(text) {
    if(language==='fr')return text;
    const trim=text.trim(),value=translations[trim];
    if(value!==undefined)return text.replace(trim,value);
    const clubSuffix=' · votre club';
    if(trim.endsWith(clubSuffix)){const club=trim.slice(0,-clubSuffix.length);return text.replace(trim,(translations[club]||club)+' · dein Verein');}
    return text;
  }
  function apply() {
    scheduled=false;
    document.documentElement.lang=language;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()) {
      const node=walker.currentNode;
      if(node.parentElement?.closest('script,style'))continue;
      if(!originals.has(node))originals.set(node,node.nodeValue);
      const next=translate(originals.get(node));
      if(node.nodeValue!==next)node.nodeValue=next;
    }
    document.querySelectorAll('[aria-label],[placeholder]').forEach(el=>{
      if(!originalAttrs.has(el))originalAttrs.set(el,{});
      const values=originalAttrs.get(el);
      for(const attr of ['aria-label','placeholder'])if(el.hasAttribute(attr)){
        if(values[attr]===undefined)values[attr]=el.getAttribute(attr);
        const next=translate(values[attr]);if(el.getAttribute(attr)!==next)el.setAttribute(attr,next);
      }
    });
    document.querySelectorAll('[data-language]').forEach(button=>{
      const active=button.dataset.language===language;
      button.setAttribute('aria-pressed',String(active));button.classList.toggle('active',active);
    });
    const tab=location.hash.slice(1).split('/')[0]||'actu';
    const titles=language==='de'?{actu:'News & Statistiken',classement:'Tabelle',matchs:'Spiele',pronos:'Tippspiel',joueurs:'Teams & Spieler'}:{actu:'Actu et stats',classement:'Classement',matchs:'Matchs',pronos:'Pronos entre amis',joueurs:'Équipes & joueurs'};
    if(tab!=='joueurs')document.title='Super League — '+(titles[tab]||titles.actu);
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-language]');if(!button)return;
    language=button.dataset.language;try{localStorage.setItem('sl-language',language);}catch{}
    window.dispatchEvent(new Event('sl-language-change'));apply();
  });
  new MutationObserver(()=>{if(!scheduled){scheduled=true;queueMicrotask(apply);}}).observe(document.body,{childList:true,subtree:true,characterData:true});
  window.SLI18n={apply,translate,get language(){return language;}};
})();
