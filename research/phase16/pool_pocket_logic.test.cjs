const test=require('node:test'),assert=require('node:assert/strict');
const {eligibleIds,colourPocket}=require('./pool_pocket_logic.js');
const balls=[{id:0,color:'white',active:true},{id:1,color:'red',active:true},
 {id:9,color:'yellow',active:true},{id:8,color:'black',active:true}];
const opts=(groups)=>({mode:'blackball',balls,groups,player:0,strikerId:0});
test('open table excludes the black',()=>assert.deepEqual(eligibleIds(opts([null,null])),[1,9]));
test('assigned suit only',()=>assert.deepEqual(eligibleIds(opts(['a','b'])),[1]));
test('black eligible after own suit cleared',()=>{
 const copy=balls.map(x=>({...x,active:x.id!==1}));
 assert.deepEqual(eligibleIds({...opts(['a','b']),balls:copy}),[8]);
});
test('first pot assigns suit during a later shot',()=>{
 assert.deepEqual(colourPocket({color:'red',groups:[null,null]}),{groups:['a','b'],firstAssigned:true,foul:false});
});
test('enemy pot immediately flags foul',()=>{
 assert.equal(colourPocket({color:'yellow',groups:['a','b']}).foul,true);
});
test('first break does not assign when option disabled',()=>{
 assert.deepEqual(colourPocket({color:'red',groups:[null,null],firstBreak:true}).groups,[null,null]);
});
test('first break can assign when option enabled',()=>{
 assert.deepEqual(colourPocket({color:'red',groups:[null,null],firstBreak:true,suitOnFirstStrike:true}).groups,['a','b']);
});
