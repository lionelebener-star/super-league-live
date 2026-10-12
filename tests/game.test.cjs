const {test}=require('node:test'),assert=require('node:assert/strict'),{points,validScore}=require('../lib/game.cjs');
test('Score exact sans cumul',()=>assert.equal(points(2,1,2,1),3));
test('Bonne issue victoire et nul',()=>{assert.equal(points(3,0,2,1),1);assert.equal(points(0,0,2,2),1);});
test('Mauvaise issue',()=>assert.equal(points(0,1,2,1),0));
test('Validation stricte',()=>{for(const value of [-1,31,'2',1.5,null])assert.equal(validScore(value),false);for(const value of [0,2,30])assert.equal(validScore(value),true);});
