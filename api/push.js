const {call,configured}=require('../lib/site-api.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');const send=(status,x)=>res.status(status).json(x);
 if(!['GET','POST','DELETE'].includes(req.method))return send(405,{error:'method'});
 if(!configured()||process.env.PUSH_ENABLED!=='true'||!process.env.VAPID_PUBLIC_KEY)return send(503,{available:false,reason:'setup_required'});
 const token=(req.headers.authorization||'').replace(/^Bearer /,'');if(!/^[a-f0-9]{64}$/.test(token))return send(401,{error:'unauthorized'});
 try{
 if(req.method==='GET')return send(200,{...await call('push.status',{},token),publicKey:process.env.VAPID_PUBLIC_KEY});
 if(new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'origin'});
 if(req.method==='DELETE')return send(200,await call('push.delete',{},token));
 const d=typeof req.body==='string'?JSON.parse(req.body):req.body;
 return send(200,await call('push.subscribe',{club:d?.club,clubs:d?.clubs,reminders:d?.reminders,language:d?.language,subscription:d?.subscription},token));
 }catch(e){return send(e.status||503,{error:e.status?e.message:'service_unavailable'});}
};
