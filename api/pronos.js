const {createHash}=require('node:crypto');
const {points,validScore}=require('../lib/game.cjs');
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');const send=(status,data)=>res.status(status).json(data);
 if(!['GET','POST'].includes(req.method))return send(405,{error:'Méthode non autorisée.'});
 const token=(req.headers.authorization||'').replace(/^Bearer /,'');if(!/^[a-f0-9]{64}$/.test(token))return send(401,{error:'Identification du navigateur indisponible.'});
 const keyHash=createHash('sha256').update(token).digest('hex');
 if(req.method==='POST'){const origin=req.headers.origin,host=req.headers['x-forwarded-host']||req.headers.host;try{if(!origin||new URL(origin).host!==host)return send(403,{error:'Requête non autorisée.'});}catch{return send(403,{error:'Requête non autorisée.'});}}
 const url=process.env.SUPABASE_URL,secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!secret)return send(503,{error:'Le stockage partagé reste à configurer dans Vercel.'});
 async function db(path,options={}){const response=await fetch(url+'/rest/v1/'+path,{...options,headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(8000)});const text=await response.text();let data;try{data=text?JSON.parse(text):null;}catch{throw Error('db');}if(!response.ok){const error=new Error('db');error.code=data?.code;throw error;}return data;}
 try{
 if(req.method==='GET'){
 const [players,predictions,fixtures]=await Promise.all([db('game_players?select=key_hash,name'),db('game_predictions?select=key_hash,fixture_id,home,away'),db('game_fixtures?select=*&order=kickoff.asc')]);
 const leaderboard=players.map(p=>({name:p.name,points:predictions.filter(x=>x.key_hash===p.key_hash).reduce((total,x)=>{const f=fixtures.find(f=>f.id===x.fixture_id);return total+(f?.final&&f.home_score!==null&&f.away_score!==null?points(x.home,x.away,f.home_score,f.away_score):0);},0)})).sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name));
 return send(200,{player:players.find(p=>p.key_hash===keyHash)?.name??null,leaderboard,fixtures:fixtures.map(f=>{const locked=Date.now()>=Date.parse(f.kickoff),mine=predictions.find(p=>p.key_hash===keyHash&&p.fixture_id===f.id);return{id:f.id,home:f.home,away:f.away,kickoff:f.kickoff,locked,mine:mine?{home:mine.home,away:mine.away}:null,others:locked?predictions.filter(p=>p.key_hash!==keyHash&&p.fixture_id===f.id).map(p=>({name:players.find(x=>x.key_hash===p.key_hash)?.name??'Joueur',home:p.home,away:p.away})):[]};})});
 }
 const data=typeof req.body==='string'?JSON.parse(req.body):req.body;
 if(data?.action==='profile'){
 const name=typeof data.name==='string'?data.name.trim().replace(/\s+/g,' '):'';if(name.length<2||name.length>30||/[\x00-\x1f]/.test(name))return send(400,{error:'Choisis un prénom de 2 à 30 caractères.'});
 await db('game_players?on_conflict=key_hash',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({key_hash:keyHash,name,name_key:name.normalize('NFKC').toLocaleLowerCase('fr')})});return send(200,{ok:true});
 }
 if(data?.action==='predict'){
 if(!validScore(data.home)||!validScore(data.away)||typeof data.fixtureId!=='string')return send(400,{error:'Scores entiers entre 0 et 30 requis.'});
 await db('game_predictions?on_conflict=key_hash,fixture_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({key_hash:keyHash,fixture_id:data.fixtureId,home:data.home,away:data.away})});return send(200,{ok:true});
 }
 return send(400,{error:'Action inconnue.'});
 }catch(e){if(e.code==='23505')return send(409,{error:'Ce prénom est déjà utilisé. Ajoute une initiale.'});if(e.code==='P0001')return send(409,{error:'Match commencé : pronostic verrouillé.'});if(e.code==='23503')return send(400,{error:'Enregistre ton prénom et choisis un match existant.'});return send(503,{error:'Impossible de contacter le stockage. Réessaie plus tard.'});}
};
