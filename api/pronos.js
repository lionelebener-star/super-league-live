const {call}=require('../lib/site-api.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');const send=(status,data)=>res.status(status).json(data);
 if(!['GET','POST'].includes(req.method))return send(405,{error:'method'});
 const token=(req.headers.authorization||'').replace(/^Bearer /,'');
 try{
 if(req.method==='GET')return send(200,{...await call('game.snapshot',{},token),serverTime:new Date().toISOString()});
 if(new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'origin'});
 const d=typeof req.body==='string'?JSON.parse(req.body):req.body;
 if(d?.action==='authenticate')return send(200,await call('game.authenticate',{name:d.name,pin:d.pin,register:d.register===true,ip:(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim()}));
 if(d?.action==='logout')return send(200,await call('game.logout',{},token));
 if(d?.action==='predict')return send(200,await call('game.predict',{fixtureId:d.fixtureId,home:d.home,away:d.away},token));
 return send(400,{error:'unknown_action'});
 }catch(e){if(e.status>=500||!e.status)console.error('Pronostics API failed');return send(e.status||503,{error:e.status?e.message:'service_unavailable'});}
};
