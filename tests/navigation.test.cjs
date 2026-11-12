const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('public/app.js','utf8');
const route=source.slice(source.indexOf('function route(){'),source.indexOf("\nwindow.addEventListener('hashchange',route);"));
function setup(reduced=false){
 const views=['actu','classement','matchs','joueurs','pronos'].map(id=>({id,hidden:id!=='actu',style:{},animate(frames,options){const animation={frames,options,cancelled:false,cancel(){this.cancelled=true;}};animations.push(animation);return animation;}}));
 const animations=[];let pending;const location={hash:'#actu'};const scrolls=[];
 const context={location,history:{state:null,replaceState(s){this.state=s;}},window:{innerWidth:390,scrollY:0,matchMedia:()=>({matches:reduced}),scrollTo(p){scrolls.push(p);}},document:{querySelectorAll:()=>views,querySelector:()=>views.find(v=>!v.hidden)},applyRoute(){views.forEach(v=>v.hidden!==undefined&&(v.hidden=v.id!==location.hash.slice(1)));return pending;},routeKey:()=>location.hash};
 vm.createContext(context);vm.runInContext('let navigationSerial=0,previousNavigation="",navigationAnimation=null,routeRendering=false;'+route,context);
 return {views,animations,scrolls,go(hash,p){pending=p;location.hash=hash;context.route();},context};
}
test('navigation is immediate during pending player load; directional motion lasts 300 ms',()=>{
 const s=setup();s.go('#actu');s.go('#joueurs',new Promise(()=>{}));
 assert.equal(s.views.find(v=>!v.hidden).id,'joueurs');
 assert.equal(s.animations.at(-1).options.duration,300);
 assert.equal(s.animations.at(-1).frames[0].transform,'translate3d(390px,0,0)');
 assert.equal(s.views.find(v=>!v.hidden).style.opacity,'');
 s.go('#classement');assert.equal(s.animations[0].cancelled,true);
 assert.equal(s.animations.at(-1).frames[0].transform,'translate3d(-390px,0,0)');
 assert.equal(s.views.find(v=>!v.hidden).id,'classement');
});
test('rapid navigation cancels old animation, never animates navigation shell, and respects reduced motion',()=>{
 const s=setup();s.go('#actu');for(const id of ['matchs','pronos','actu','joueurs','classement'])s.go('#'+id);
 assert.equal(s.views.filter(v=>!v.hidden).length,1);assert.equal(s.animations.length,5);
 assert.ok(s.animations.slice(0,-1).every(a=>a.cancelled));
 assert.equal(route.includes('mobileNav.animate'),false);
 const r=setup(true);r.go('#actu');r.go('#matchs');assert.equal(r.animations.length,0);
 assert.equal(fs.readFileSync('public/brand-motion.js','utf8').includes('nav-shot-ball'),false);
});
