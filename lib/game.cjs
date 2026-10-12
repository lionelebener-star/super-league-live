exports.points=(h,a,x,y)=>h===x&&a===y?3:Math.sign(h-a)===Math.sign(x-y)?1:0;
exports.validScore=v=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=30;
