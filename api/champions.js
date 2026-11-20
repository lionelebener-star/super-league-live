const {collectChampions}=require('../lib/champions.cjs');
module.exports=async(req,res)=>{
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try{const data=await collectChampions();res.setHeader('Cache-Control','public, max-age=0, s-maxage=60');return res.status(200).json(data);}catch(e){res.setHeader('Cache-Control','no-store');return res.status(503).json({error:e.code||'SOURCE_ERROR'});}
};
