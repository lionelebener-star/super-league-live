const {collectMatch}=require('../lib/match-detail.cjs');
module.exports=async(req,res)=>{
 if(req.method!=='GET')return res.status(405).json({error:'method'});
 const id=req.query?.id;if(typeof id!=='string'||!/^[a-z0-9]{20,32}$/.test(id))return res.status(400).json({error:'invalid_match'});
 try{const data=await collectMatch(id);res.setHeader('Cache-Control','public, max-age=0, s-maxage=30');return res.status(200).json(data);}
 catch{res.setHeader('Cache-Control','no-store');return res.status(503).json({error:'match_unavailable'});}
};
