const {batch}=require('../lib/live.cjs');
const names={SLO:'Stade Lausanne Ouchy',WIN:'FC Winterthur',YS:'Yverdon Sport',XAM:'Neuchâtel Xamax',KRI:'SC Kriens',AAR:'FC Aarau',CAR:'Étoile Carouge',RAP:'FC Rapperswil-Jona',WIL:'FC Wil',NYO:'Stade Nyonnais'};
module.exports=async(req,res)=>{
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try{
  const [data]=await batch([['rankings.getOne',{competitionProviderId:'8v97rcbthsxmzqk4ufxws9mug',language:'fr'}]]);
  const rows=data.rankings.find(s=>s.rankings.length===10)?.rankings;
  if(!rows||new Set(rows.map(r=>r.ranking)).size!==10||rows.some(r=>!Number.isInteger(r.points)||!Number.isInteger(r.gamesPlayed)))throw Error('Invalid Challenge League standings');
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
  return res.status(200).json({updatedAt:new Date().toISOString(),sourceUrl:'https://sfl.ch/fr/challengeleague-classement',standings:rows.slice().sort((a,b)=>a.ranking-b.ranking).slice(0,4).map(r=>({rank:r.ranking,name:names[r.shortName]||r.shortName,code:r.shortName,points:r.points,played:r.gamesPlayed,difference:r.goalDifference}))});
 }catch(e){res.setHeader('Cache-Control','no-store');return res.status(503).json({error:'Challenge League standings unavailable'});}
};
