const {collectLive,batch,normalizeEvent}=require('../lib/live.cjs');const {call}=require('../lib/site-api.cjs');const {authorizedCron}=require('../lib/cron-auth.cjs');
const names=['Lugano','Young Boys','Sion','Saint-Gall','Zurich','Servette','Bâle','Lucerne','Thoune','Vaduz','Grasshoppers','Lausanne-Sport'];
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'method'});if(!authorizedCron(req))return res.status(401).json({error:'unauthorized'});
 try{const live=await collectLive();let upcoming=[];
 if(live.week<38){const rows=await batch([['matchDays.getEvents',{competitionProviderId:'e0lck99w8meo9qoalfrxgo33o',matchDay:String(live.week+1),language:'fr'}]]);upcoming=rows[0].map(normalizeEvent);}
 const events=[...new Map([...live.results,...live.fixtures,...upcoming].map(x=>[x.id,x])).values()];
 const fixtures=events.filter(x=>Number.isFinite(Date.parse(x.kickoff))).map(x=>({id:String(x.id),homeClub:x.home,awayClub:x.away,home:names[x.home],away:names[x.away],kickoff:x.kickoff,homeScore:x.homeScore,awayScore:x.awayScore,final:['post-game','awarded'].includes(x.status),cancelled:['cancelled','postponed'].includes(x.status)}));
 const result=await call('fixtures.sync',{fixtures});return res.status(200).json({...result,verifiedAt:live.updatedAt});
 }catch{console.error('Official fixture synchronization failed');return res.status(503).json({error:'sync_unavailable'});}
};
