const {timingSafeEqual}=require('node:crypto');
function authorizedCron(req){const expected='Bearer '+(process.env.CRON_SECRET||''),given=req.headers.authorization||'';return Boolean(process.env.CRON_SECRET&&Buffer.byteLength(given)===Buffer.byteLength(expected)&&timingSafeEqual(Buffer.from(given),Buffer.from(expected)));}
module.exports={authorizedCron};
