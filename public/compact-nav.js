(()=>{
 const nav=document.querySelector('.floating-nav');if(!nav)return;
 const links=[...nav.querySelectorAll('a[data-tab]')];
 const items=document.createElement('div');items.className='nav-items';items.id='floating-nav-items';
 links.forEach((link,index)=>{link.style.setProperty('--nav-index',index);items.append(link);});
 const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
 const minimize=document.createElement('button');minimize.type='button';minimize.className='nav-minimize';minimize.innerHTML=icon;minimize.setAttribute('aria-controls',items.id);
 const open=document.createElement('button');open.type='button';open.className='nav-open';open.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h10M7 12h10M7 15h6"/></svg><span data-no-i18n>Open</span>';open.setAttribute('aria-controls',items.id);open.setAttribute('aria-expanded','false');open.hidden=true;
 nav.append(items,minimize,open);nav.classList.add('nav-can-minimize');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let compact=false,serial=0,timer;
 function label(){minimize.setAttribute('aria-label',window.SLI18n?.language==='de'?'Navigation minimieren':'Réduire la navigation');minimize.title=minimize.getAttribute('aria-label');open.setAttribute('aria-label',window.SLI18n?.language==='de'?'Open — Navigation öffnen':'Open — Ouvrir la navigation');}
 function setCompact(next){
  if(compact===next)return;compact=next;const token=++serial;clearTimeout(timer);
  nav.classList.remove('nav-revealing');nav.classList.add('nav-is-moving');
  nav.classList.toggle('nav-is-compact',compact);items.inert=compact;items.setAttribute('aria-hidden',String(compact));
  minimize.hidden=compact;open.hidden=!compact;open.setAttribute('aria-expanded',String(!compact));
  if(!compact&&!reduced.matches)nav.classList.add('nav-revealing');
  (compact?open:links.find(a=>a.classList.contains('active'))||links[0]).focus({preventScroll:true});
  const settle=()=>{if(token!==serial)return;nav.classList.remove('nav-is-moving');window.dispatchEvent(new Event('resize'));};
  if(reduced.matches)settle();else timer=setTimeout(settle,360);
 }
 minimize.addEventListener('click',()=>setCompact(true));open.addEventListener('click',()=>setCompact(false));
 nav.addEventListener('animationend',e=>{if(e.animationName==='nav-label-heartbeat'&&e.target===links.at(-1)?.querySelector('span'))nav.classList.remove('nav-revealing');});
 window.addEventListener('sl-language-change',label);label();window.dispatchEvent(new Event('resize'));
})();
