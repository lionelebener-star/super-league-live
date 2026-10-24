(()=>{
 // Accent, readable dark ink, and pale surfaces chosen from each club's identity.
 const palettes=[
  ['#242424','#e0e0e0','#f5f5f5','#181818'],
  ['#242018','#f4ce36','#fff9df','#211e15'],
  ['#b52534','#df3648','#fff4f4','#301c20'],
  ['#176b47','#249b68','#f0f8f2','#193b2a'],
  ['#165a9b','#2984cd','#f1f7fc','#1b3046'],
  ['#852b43','#a63d58','#fbf1f4','#3b2029'],
  ['#21488d','#c52d43','#f2f5fc','#202c46'],
  ['#14539a','#2883ca','#f1f6fc','#1c3046'],
  ['#b52435','#db3245','#fff3f3','#3b2026'],
  ['#b02336','#d83248','#fff3f4','#3b2026'],
  ['#1e5ba3','#4692ce','#f1f7fc','#1c3046'],
  ['#1454a2','#2689ce','#f0f7fd','#1c3046']
 ];
 function apply(value){const n=Number(value),i=Number.isInteger(n)&&n>=0&&n<palettes.length?n:2;const [primary,accent,bg,ink]=palettes[i],root=document.documentElement;root.dataset.clubTheme=String(i);for(const [key,val] of Object.entries({'--green':primary,'--club-accent':accent,'--bg':bg,'--ink':ink,'--soft':`color-mix(in srgb, ${accent} 12%, white)`,'--line':`color-mix(in srgb, ${primary} 16%, white)`,'--muted':`color-mix(in srgb, ${ink} 74%, white)`,'--club-action':i===1?accent:primary,'--club-action-text':i===1?ink:'#ffffff'}))root.style.setProperty(key,val);}
 try{apply(localStorage.getItem('sl-club')??2);}catch{apply(2);}
 document.addEventListener('DOMContentLoaded',()=>{const picker=document.querySelector('#club-select');if(!picker)return;apply(picker.value);picker.addEventListener('change',()=>apply(picker.value));});
})();
