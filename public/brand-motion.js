(()=>{
 const names=['suisse','berne','valais','zurich','geneve'];
 const asset=(name,small=false)=>'/assets/brand/aligned-'+name+(small?'-32':'')+'.png';
 const logo=document.querySelector('.crystal-logo'),favicon=document.querySelector('#site-favicon');
 if(!logo)return;
 const layers=logo.querySelectorAll('img'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,timer=null,fade=null,serial=0;
 names.forEach(name=>{const img=new Image();img.src=asset(name);});
 function reset(){clearInterval(timer);clearTimeout(fade);serial++;current=0;logo.classList.remove('is-changing');layers.forEach(img=>img.src=asset(names[0]));if(favicon)favicon.href=asset(names[0],true);}
 function start(){reset();if(reduced.matches||document.hidden)return;timer=setInterval(()=>{const next=(current+1)%names.length,token=++serial;layers[1].src=asset(names[next]);logo.classList.add('is-changing');fade=setTimeout(()=>{if(token!==serial)return;layers[0].src=asset(names[next]);logo.classList.remove('is-changing');current=next;if(favicon)favicon.href=asset(names[current],true);},850);},4000);}
 reduced.addEventListener('change',start);document.addEventListener('visibilitychange',start);start();
})();
