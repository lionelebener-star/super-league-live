const {timingSafeEqual}=require('node:crypto');
const {configured,db,payload}=require('../lib/push.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'method'});
 const expected='Bearer '+(process.env.CRON_SECRET||''),given=req.headers.authorization||'';
 if(!process.env.CRON_SECRET||Buffer.byteLength(given)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(given),Buffer.from(expected)))return res.status(401).json({error:'unauthorized'});
 if(!configured())return res.status(503).json({error:'setup_required'});
 try{const push=require('web-push');push.setVapidDetails(process.env.VAPID_SUBJECT,process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
 const jobs=await db('rpc/claim_push_reminders',{method:'POST',body:'{}'});let sent=0;
 for(const j of jobs){try{await push.sendNotification(j.subscription,JSON.stringify(payload(j.fixture,j.language)),{TTL:900,timeout:8000});await db('push_deliveries?id=eq.'+j.id,{method:'PATCH',body:JSON.stringify({status:'sent'})});sent++;}catch(e){if([404,410].includes(e.statusCode))await db('push_subscriptions?owner_hash=eq.'+j.owner_hash,{method:'DELETE'});await db('push_deliveries?id=eq.'+j.id,{method:'PATCH',body:JSON.stringify({status:'failed'})});console.error('Push delivery failed',{status:e.statusCode||'network'});}}
 return res.status(200).json({sent,attempted:jobs.length});
 }catch{console.error('Push dispatcher failed');return res.status(503).json({error:'dispatch_unavailable'});}
};
