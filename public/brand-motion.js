(()=>{
 const names=['suisse','berne','valais','zurich','geneve'];
 const asset=(name,small=false)=>'/assets/brand/'+name+(small?'-32':'')+'.png';
 const logo=document.querySelector('.crystal-logo'),favicon=document.querySelector('#site-favicon'),nav=document.querySelector('.floating-nav');
 if(!logo)return;
 const layers=logo.querySelectorAll('img'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,timer=null,fade=null,shot=null,serial=0;
 names.forEach(name=>{const img=new Image();img.src=asset(name);});
 function reset(){clearInterval(timer);clearTimeout(fade);serial++;shot?.remove();shot=null;current=0;logo.classList.remove('is-changing');layers.forEach(img=>img.src=asset(names[0]));if(favicon)favicon.href=asset(names[0],true);}
 function start(){reset();if(reduced.matches||document.hidden)return;timer=setInterval(()=>{const next=(current+1)%names.length,token=++serial;layers[1].src=asset(names[next]);logo.classList.add('is-changing');fade=setTimeout(()=>{if(token!==serial)return;layers[0].src=asset(names[next]);logo.classList.remove('is-changing');current=next;if(favicon)favicon.href=asset(names[current],true);},850);},4000);}
 nav?.addEventListener('click',event=>{
  const link=event.target.closest('a[data-tab]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||reduced.matches||!matchMedia('(max-width: 700px)').matches||typeof Element.prototype.animate!=='function')return;
  shot?.remove();const ball=document.createElement('img');ball.className='nav-shot-ball';ball.alt='';ball.setAttribute('aria-hidden','true');ball.src=asset(names[current]);
  const rect=link.getBoundingClientRect(),x=rect.left+rect.width/2-22,y=rect.top+rect.height/2-22;
  ball.style.left=x+'px';ball.style.top=y+'px';document.body.append(ball);shot=ball;
  const dx=innerWidth-52-x,dy=38-y;
  const animation=ball.animate([{transform:'translate(0,0) rotate(0deg) scale(.65)',opacity:0},{transform:`translate(${dx*.12}px,${dy*.26}px) rotate(70deg) scale(1.12)`,opacity:1,offset:.2},{transform:`translate(${dx*.55-35}px,${dy*.7}px) rotate(250deg) scale(.84)`,opacity:1,offset:.65},{transform:`translate(${dx}px,${dy}px) rotate(500deg) scale(.25)`,opacity:0}],{duration:850,easing:'cubic-bezier(.2,.55,.4,1)',fill:'forwards'});
  animation.finished.catch(()=>{}).finally(()=>{ball.remove();if(shot===ball)shot=null;});
 });
 reduced.addEventListener('change',start);document.addEventListener('visibilitychange',start);start();
})();
