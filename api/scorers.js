const {collectScorers}=require('../lib/scorers.cjs');
module.exports=async(req,res)=>{
 if(req.method!=='GET')return res.status(405).json({error:'method'});
 try{const data=await collectScorers();res.setHeader('Cache-Control','public, max-age=0, s-maxage=30');return res.status(200).json(data);}
 catch{res.setHeader('Cache-Control','no-store');return res.status(503).json({error:'scorers_unavailable'});}
};
