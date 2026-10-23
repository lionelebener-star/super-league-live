const {configured,db,owner,validSubscription}=require('../lib/push.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');const send=(n,x)=>res.status(n).json(x);
 if(!['GET','POST','DELETE'].includes(req.method))return send(405,{error:'method'});
 if(!configured())return send(503,{available:false,reason:'setup_required'});
 const key=owner(req);if(!key)return send(401,{error:'unauthorized'});
 if(req.method!=='GET'){try{if(new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'origin'});}catch{return send(403,{error:'origin'});}}
 try{
 if(req.method==='GET'){
 const [rows,fixtures]=await Promise.all([db('push_subscriptions?owner_hash=eq.'+key+'&select=club,language'),db('push_fixtures?verified_at=gte.'+encodeURIComponent(new Date(Date.now()-48*3600000).toISOString())+'&kickoff=gt.'+encodeURIComponent(new Date().toISOString())+'&select=id&limit=1')]);
 return send(200,{available:fixtures.length>0,reason:fixtures.length?'ready':'fixtures_required',publicKey:process.env.VAPID_PUBLIC_KEY,subscription:rows[0]||null});}
 if(req.method==='DELETE'){await db('push_subscriptions?owner_hash=eq.'+key,{method:'DELETE'});return send(200,{ok:true});}
 const data=typeof req.body==='string'?JSON.parse(req.body):req.body;
 if(!Number.isInteger(data?.club)||data.club<0||data.club>11||!['fr','de'].includes(data.language)||!validSubscription(data.subscription))return send(400,{error:'invalid_subscription'});
 await db('push_subscriptions?on_conflict=owner_hash',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({owner_hash:key,club:data.club,language:data.language,subscription:data.subscription,updated_at:new Date().toISOString()})});return send(200,{ok:true});
 }catch{console.error('Push subscription operation failed');return send(503,{error:'storage_unavailable'});}
};
