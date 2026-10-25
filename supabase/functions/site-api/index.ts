const encoder=new TextEncoder();
async function hash(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(s))),v=>v.toString(16).padStart(2,'0')).join('');}
function random(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');}
async function pinHash(pin,salt,pepper){const key=await crypto.subtle.importKey('raw',encoder.encode(pin+pepper),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:210000,hash:'SHA-256'},key,256);return Array.from(new Uint8Array(bits),v=>v.toString(16).padStart(2,'0')).join('');}
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function db(path,options={}){const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');const r=await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/'+path,{...options,headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(10000)});const data=JSON.parse((await r.text())||'null');if(!r.ok){const e=new Error('storage');e.code=data?.code;throw e;}return data;}
const write=(path,data,prefer='resolution=merge-duplicates')=>db(path,{method:'POST',headers:{Prefer:prefer},body:JSON.stringify(data)});
async function player(token){if(!/^[a-f0-9]{64}$/.test(token||''))return null;const sessions=await db('game_sessions?token_hash=eq.'+await hash(token)+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=key_hash');return sessions[0]?.key_hash||null;}
Deno.serve(async(req)=>{
 if(req.method!=='POST')return reply({error:'method'},405);
 const key=req.headers.get('x-app-key')||'';
 if(await hash(key)!=='__APP_KEY_DIGEST__')return reply({error:'unauthorized'},401);
 try{
 const text=await req.text();if(text.length>100000)return reply({error:'too_large'},413);const p=JSON.parse(text),data=p.data||{};
 if(['fixtures.sync','push.claim','push.complete'].includes(p.action)&&await hash(req.headers.get('x-scheduler-key')||'')!=='__CRON_KEY_DIGEST__')return reply({error:'scheduler_unauthorized'},401);
 if(p.action==='game.authenticate'){
 const name=typeof data.name==='string'?data.name.trim().replace(/\s+/g,' '):'',pin=data.pin;
 if(name.length<2||name.length>30||/[\x00-\x1f]/.test(name)||!/^\d{4}$/.test(pin||''))return reply({error:'invalid_credentials'},400);
 const nameKey=name.normalize('NFKC').toLocaleLowerCase('fr');
 for(const bucket of ['name:'+nameKey,'ip:'+String(data.ip||'unknown')]){if(!await db('rpc/consume_game_attempt',{method:'POST',body:JSON.stringify({p_bucket:await hash(bucket)})}))return reply({error:'too_many_attempts'},429);}
 const rows=await db('game_players?name_key=eq.'+encodeURIComponent(nameKey)+'&select=*');let account=rows[0];
 if(data.register){if(account)return reply({error:'name_used'},409);const salt=random(),id=random();account={key_hash:id,name,name_key:nameKey,pin_salt:salt,pin_hash:await pinHash(pin,salt,key)};await write('game_players',account,'return=minimal');}
 else if(!account?.pin_hash||await pinHash(pin,account.pin_salt,key)!==account.pin_hash)return reply({error:'invalid_credentials'},401);
 const token=random();await write('game_sessions',{token_hash:await hash(token),key_hash:account.key_hash,expires_at:new Date(Date.now()+30*86400000).toISOString()});return reply({ok:true,token,name:account.name});
 }
 if(p.action==='game.logout'){if(/^[a-f0-9]{64}$/.test(p.token||''))await db('game_sessions?token_hash=eq.'+await hash(p.token),{method:'DELETE'});return reply({ok:true});}
 if(p.action==='game.snapshot'){
 const id=await player(p.token);const [players,predictions,fixtures]=await Promise.all([db('game_players?select=key_hash,name'),db('game_predictions?select=key_hash,fixture_id,home,away'),db('game_fixtures?select=*&order=kickoff.asc')]);
 const points=(a,b,x,y)=>a===x&&b===y?3:Math.sign(a-b)===Math.sign(x-y)?1:0;
 const leaderboard=players.map(v=>({name:v.name,points:predictions.filter(q=>q.key_hash===v.key_hash).reduce((n,q)=>{const f=fixtures.find(f=>f.id===q.fixture_id);return n+(f?.final&&f.home_score!==null&&f.away_score!==null?points(q.home,q.away,f.home_score,f.away_score):0)},0)})).sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name));
 return reply({player:players.find(x=>x.key_hash===id)?.name??null,leaderboard,fixtures:fixtures.map(f=>{const locked=Date.now()>=Date.parse(f.kickoff),mine=predictions.find(x=>x.key_hash===id&&x.fixture_id===f.id);return {id:f.id,home:f.home,away:f.away,kickoff:f.kickoff,cancelled:f.cancelled,final:f.final,homeScore:f.home_score,awayScore:f.away_score,locked,mine:mine?{home:mine.home,away:mine.away}:null,others:locked?predictions.filter(x=>x.fixture_id===f.id&&x.key_hash!==id).map(x=>({name:players.find(v=>v.key_hash===x.key_hash)?.name||'Joueur',home:x.home,away:x.away})):[]}})});
 }
 if(p.action==='game.predict'){
 const id=await player(p.token);if(!id)return reply({error:'login_required'},401);
 if(!Number.isInteger(data.home)||!Number.isInteger(data.away)||Math.min(data.home,data.away)<0||Math.max(data.home,data.away)>30||typeof data.fixtureId!=='string')return reply({error:'invalid_score'},400);
 await write('game_predictions?on_conflict=key_hash,fixture_id',{key_hash:id,fixture_id:data.fixtureId,home:data.home,away:data.away});return reply({ok:true});
 }
 if(p.action==='fixtures.sync'){
 if(!Array.isArray(data.fixtures)||data.fixtures.length>100)return reply({error:'invalid_fixtures'},400);
 const verified=new Date().toISOString(),games=[],push=[];
 for(const f of data.fixtures){if(typeof f.id!=='string'||f.id.length>100||!Number.isInteger(f.homeClub)||!Number.isInteger(f.awayClub)||Math.min(f.homeClub,f.awayClub)<0||Math.max(f.homeClub,f.awayClub)>11||typeof f.home!=='string'||typeof f.away!=='string'||!Number.isFinite(Date.parse(f.kickoff)))return reply({error:'invalid_fixture'},400);games.push({id:f.id,home:f.home,away:f.away,kickoff:f.kickoff,cancelled:f.cancelled===true,final:f.final===true,home_score:f.homeScore,away_score:f.awayScore});push.push({id:f.id,home:f.home,away:f.away,home_club:f.homeClub,away_club:f.awayClub,kickoff:f.kickoff,verified_at:verified,cancelled:f.cancelled===true});}
 if(games.length){await write('game_fixtures?on_conflict=id',games);await write('push_fixtures?on_conflict=id',push);}return reply({ok:true,count:games.length});
 }
 if(p.action.startsWith('push.')){
 if(!/^[a-f0-9]{64}$/.test(p.token||'')&&!['push.claim','push.complete'].includes(p.action))return reply({error:'unauthorized'},401);
 const owner=await hash(p.token||'');
 if(p.action==='push.status'){const [subs,fixtures]=await Promise.all([db('push_subscriptions?owner_hash=eq.'+owner+'&select=club,clubs,reminders,language'),db('push_fixtures?cancelled=eq.false&verified_at=gte.'+encodeURIComponent(new Date(Date.now()-48*3600000).toISOString())+'&kickoff=gt.'+encodeURIComponent(new Date().toISOString())+'&select=id&limit=1')]);return reply({available:fixtures.length>0,reason:fixtures.length?'ready':'fixtures_required',subscription:subs[0]||null});}
 if(p.action==='push.test'){if(!await db('rpc/consume_game_attempt',{method:'POST',body:JSON.stringify({p_bucket:'push-test:'+owner})}))return reply({error:'too_many_attempts'},429);const rows=await db('push_subscriptions?owner_hash=eq.'+owner+'&select=subscription,language');return rows[0]?reply(rows[0]):reply({error:'subscription_missing'},404);}
 if(p.action==='push.delete'){await db('push_subscriptions?owner_hash=eq.'+owner,{method:'DELETE'});return reply({ok:true});}
 if(p.action==='push.subscribe'){
 const previous=await db('push_subscriptions?owner_hash=eq.'+owner+'&select=clubs,club,reminders');const clubs=Array.isArray(data.clubs)?[...new Set(data.clubs)]:[...new Set([...(previous[0]?.clubs||[]),data.club])];
 const reminders=data.reminders??Object.fromEntries(clubs.map(c=>[c,previous[0]?.reminders?.[c]||[24,2]]));
 if(!reminders||typeof reminders!=='object'||Array.isArray(reminders)||Object.keys(reminders).some(k=>!clubs.includes(Number(k))||String(Number(k))!==k)||clubs.some(c=>!Array.isArray(reminders[c])||!reminders[c].length||reminders[c].length>2||reminders[c].some(h=>h!==24&&h!==2)))return reply({error:'invalid_reminders'},400);
 const s=data.subscription;let url;try{url=new URL(s.endpoint)}catch{return reply({error:'invalid_subscription'},400)}
 if(!clubs.length||clubs.length>12||clubs.some(c=>!Number.isInteger(c)||c<0||c>11)||!['fr','de'].includes(data.language)||url.protocol!=='https:'||url.port||url.username||url.password||!['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].some(h=>url.hostname===h||url.hostname.endsWith('.'+h))||! /^[\w-]{87}$/.test(s.keys?.p256dh||'')||! /^[\w-]{22}$/.test(s.keys?.auth||''))return reply({error:'invalid_subscription'},400);
 await write('push_subscriptions?on_conflict=owner_hash',{owner_hash:owner,club:clubs[0],clubs,reminders,language:data.language,subscription:s,updated_at:new Date().toISOString()});return reply({ok:true});}
 if(p.action==='push.claim')return reply(await db('rpc/claim_push_reminders',{method:'POST',body:'{}'}));
 if(p.action==='push.complete'){if(!Number.isInteger(data.id)||!['sent','failed'].includes(data.status))return reply({error:'invalid_delivery'},400);if(data.expired){const rows=await db('push_deliveries?id=eq.'+data.id+'&select=owner_hash');if(rows[0])await db('push_subscriptions?owner_hash=eq.'+rows[0].owner_hash,{method:'DELETE'});}else await db('push_deliveries?id=eq.'+data.id,{method:'PATCH',body:JSON.stringify({status:data.status})});return reply({ok:true});}
 }
 return reply({error:'unknown_action'},400);
 }catch(e){if(e.code==='P0001')return reply({error:'locked'},409);if(e.code==='23505')return reply({error:'name_used'},409);if(e.code==='23503')return reply({error:'invalid_fixture'},400);console.error('Site business API failure');return reply({error:'storage_unavailable'},503);}
});
