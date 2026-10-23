const {collectLive}=require('../lib/live.cjs');
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try{
  const data=await collectLive();
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=30');
  return res.status(200).json(data);
 }catch(error){
  console.error('SFL live refresh failed:',error.message);
  res.setHeader('Cache-Control','no-store');
  return res.status(503).json({error:'Live SFL data temporarily unavailable',updatedAt:null});
 }
};
