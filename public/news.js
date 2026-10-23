(() => {
  const root = document.querySelector('#news-feed');
  if (!root) return;
  let data, expanded = false, unseen = new Set();
  const words = {
    fr: {eyebrow:'LE FIL DU FOOT SUISSE', title:'À la une', fresh:'Nouvelles actus', more:'Toutes les actualités', less:'Réduire le fil', read:'Lire l’article', loading:'Chargement des actualités…', empty:'Aucune actualité disponible pour le moment.', failed:'Actualités indisponibles. Réessaie un peu plus tard.', stale:'La mise à jour a du retard. Les derniers articles disponibles restent affichés.', partial:'Certaines sources sont temporairement indisponibles.', updated:'Dernière collecte réussie', daily:'Actualisation quotidienne', retry:'Réessayer'},
    de: {eyebrow:'DEIN SCHWEIZER FUSSBALL-FEED', title:'Aktuell', fresh:'Neue News', more:'Alle Nachrichten', less:'Weniger anzeigen', read:'Artikel lesen', loading:'Nachrichten werden geladen…', empty:'Zurzeit sind keine Nachrichten verfügbar.', failed:'Nachrichten nicht verfügbar. Bitte später erneut versuchen.', stale:'Die Aktualisierung ist überfällig. Die letzten verfügbaren Artikel werden weiterhin angezeigt.', partial:'Einige Quellen sind vorübergehend nicht verfügbar.', updated:'Letzte erfolgreiche Abfrage', daily:'Tägliche Aktualisierung', retry:'Erneut versuchen'}
  };
  const language = () => window.SLI18n?.language === 'de' ? 'de' : 'fr';
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = value => {try {const u = new URL(value); return u.protocol === 'https:' ? u.href : '';} catch {return '';}};
  const date = (value, full = false) => new Intl.DateTimeFormat(language()+'-CH', {timeZone:'Europe/Zurich',day:'numeric',month:'short',...(full?{hour:'2-digit',minute:'2-digit'}:{})}).format(new Date(value));
  function article(item, index) {
    const image = safeUrl(item.image), url = safeUrl(item.url);
    return `<article class="news-story${unseen.has(item.id)?' news-unread':''}" style="--story-index:${index}">
      <a class="news-story-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(item.title)}">
        <div class="news-image${image?'':' news-image-empty'}">${image?`<img src="${esc(image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:'<span aria-hidden="true">⚽</span>'}</div>
        <div class="news-story-copy"><div class="news-meta"><span class="news-source">${esc(item.source)}</span><span>${esc(item.language.toUpperCase())}</span><time datetime="${esc(item.publishedAt)}">${date(item.publishedAt,true)}</time>${unseen.has(item.id)?'<i class="news-dot" aria-hidden="true"></i>':''}</div>
          <h3>${esc(item.title)}</h3>${item.excerpt?`<p>${esc(item.excerpt)}</p>`:''}<span class="news-read">${words[language()].read} <span aria-hidden="true">↗</span></span></div>
      </a></article>`;
  }
  function render(error) {
    const w = words[language()], items = data?.articles || [];
    const stale = data && (!data.updatedAt || Date.now()-Date.parse(data.updatedAt)>36*3600000 || data.status==='error');
    root.innerHTML = `<div class="news-heading"><div><span class="eyebrow">${w.eyebrow}</span><h2>${w.title}<span class="news-total">${items.length || ''}</span></h2></div>${unseen.size?`<span class="news-new-badge" role="status"><span aria-hidden="true">✦</span> ${unseen.size} ${w.fresh}</span>`:''}</div>
      ${error?`<p class="news-status" role="status">${w.failed} <button type="button" data-news-retry>${w.retry}</button></p>`:''}
      ${stale?`<p class="news-status" role="status">${w.stale}</p>`:data?.status==='partial'?`<p class="news-status news-status-subtle">${w.partial}</p>`:''}
      ${!data&&!error?`<p class="news-loading" role="status">${w.loading}</p>`:''}
      ${data&&!items.length?`<p>${w.empty}</p>`:''}
      <div id="news-stories" class="news-stories${expanded?' is-expanded':''}">${items.slice(0,3).map(article).join('')}<div id="news-remaining" ${expanded?'':'hidden'}>${items.slice(3).map((item,i)=>article(item,i+3)).join('')}</div></div>
      ${items.length>3?`<div class="news-expand-wrap${expanded?' is-expanded':''}"><button class="news-expand" type="button" aria-expanded="${expanded}" aria-controls="news-remaining"><span>${expanded?w.less:w.more}</span>${expanded?'':`<span class="news-expand-count">+${items.length-3}</span>`}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>`:''}
      ${data?.updatedAt?`<div class="news-footer"><span>${w.updated} · ${date(data.updatedAt,true)}</span><span><i aria-hidden="true"></i>${w.daily}</span></div>`:''}`;
    root.querySelectorAll('.news-image img').forEach(img => img.addEventListener('error',()=>{img.parentElement.classList.add('news-image-empty');img.replaceWith(Object.assign(document.createElement('span'),{textContent:'⚽'}));},{once:true}));
  }
  async function load() {
    render();
    try {
      const response = await fetch('/news.json', {cache:'no-store'});
      if (!response.ok) throw Error('feed unavailable');
      const next = await response.json();
      if (!Array.isArray(next.articles)) throw Error('invalid feed');
      data = next;
      try {
        const previous = JSON.parse(localStorage.getItem('sl-news-seen-v1') || 'null');
        if (Array.isArray(previous)) unseen = new Set(data.articles.filter(a=>!previous.includes(a.id)).map(a=>a.id));
        localStorage.setItem('sl-news-seen-v1', JSON.stringify(data.articles.map(a=>a.id)));
      } catch { /* Browsing works when local storage is disabled. */ }
      render();
    } catch { render(true); }
  }
  root.addEventListener('click', e => {
    if(e.target.closest('[data-news-retry]')) return load();
    if(!e.target.closest('.news-expand')) return;
    const y = root.getBoundingClientRect().top + window.scrollY;
    expanded = !expanded;
    render();
    if(!expanded && window.scrollY>y) root.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
  window.addEventListener('sl-language-change',()=>render());
  load();
})();
