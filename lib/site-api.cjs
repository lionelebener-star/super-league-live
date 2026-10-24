const configured=()=>Boolean(process.env.SUPABASE_SITE_API&&process.env.SITE_API_KEY&&process.env.SUPABASE_EDGE_JWT);
async function call(action,data={},token=''){
 if(!configured()){const e=Error('setup_required');e.status=503;throw e;}
 const scheduler=['fixtures.sync','push.claim','push.complete'].includes(action);
 const response=await fetch(process.env.SUPABASE_SITE_API,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.SUPABASE_EDGE_JWT,'x-app-key':process.env.SITE_API_KEY,...(scheduler?{'x-scheduler-key':process.env.CRON_SECRET}:{})},body:JSON.stringify({action,data,token}),signal:AbortSignal.timeout(20000)});
 const result=await response.json();if(!response.ok){const e=Error(result.error||'service_unavailable');e.status=response.status;throw e;}return result;
}
module.exports={call,configured};
