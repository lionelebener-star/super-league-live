const {call}=require('../lib/site-api.cjs');const {groupReminders,groupedPayload,reminderMinutes}=require('../lib/push.cjs');const {authorizedCron}=require('../lib/cron-auth.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'method'});if(!authorizedCron(req))return res.status(401).json({error:'unauthorized'});
 try{const push=require('web-push');push.setVapidDetails(process.env.VAPID_SUBJECT,process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);const jobs=await call('push.claim');let sent=0;
 const groups=groupReminders(jobs);
 for(const group of groups){const j=group[0];try{await push.sendNotification(j.subscription,JSON.stringify(groupedPayload(group)),{TTL:reminderMinutes(j)===5?Math.max(1,Math.min(300,Math.floor((Date.parse(j.fixture.kickoff)-Date.now())/1000))):900,timeout:8000});for(const item of group)await call('push.complete',{id:item.id,status:'sent'});sent++;}catch(e){for(const item of group)await call('push.complete',{id:item.id,status:'failed',expired:[404,410].includes(e.statusCode)});console.error('Push delivery failed',{status:e.statusCode||'network'});}}

 return res.status(200).json({sent,attempted:groups.length,matches:jobs.length});}catch{console.error('Push dispatch failed');return res.status(503).json({error:'dispatch_unavailable'});}
};
