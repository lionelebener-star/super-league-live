const {call}=require('../lib/site-api.cjs');const {payload}=require('../lib/push.cjs');const {authorizedCron}=require('../lib/cron-auth.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'method'});if(!authorizedCron(req))return res.status(401).json({error:'unauthorized'});
 try{const push=require('web-push');push.setVapidDetails(process.env.VAPID_SUBJECT,process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);const jobs=await call('push.claim');let sent=0;
 for(const j of jobs){try{await push.sendNotification(j.subscription,JSON.stringify(payload(j.fixture,j.language,j.reminder_hours)),{TTL:900,timeout:8000});await call('push.complete',{id:j.id,status:'sent'});sent++;}catch(e){await call('push.complete',{id:j.id,status:'failed',expired:[404,410].includes(e.statusCode)});console.error('Push delivery failed',{status:e.statusCode||'network'});}}
 return res.status(200).json({sent,attempted:jobs.length});}catch{console.error('Push dispatch failed');return res.status(503).json({error:'dispatch_unavailable'});}
};
