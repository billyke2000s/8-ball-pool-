'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {nativeShotFoul:foul,nativePyramidCredits:credits}=require('./pocket_rules');
test('contact without rail or pot is legal',()=>assert.equal(foul(2,false),false));
test('no contact is a foul',()=>assert.equal(foul(null,false),true));
test('event foul survives a later valid contact',()=>assert.equal(foul(2,true),true));
test('only contact-linked pots earn points',()=>assert.deepEqual(credits({strikerId:0,potted:[0,1,2],nativePotted:[1]}),{objects:1,striker:0}));
test('contact-linked striker earns a point',()=>assert.deepEqual(credits({strikerId:0,potted:[0,1],nativePotted:[0,1]}),{objects:1,striker:1}));
test('nonzero striker identity is honoured',()=>assert.deepEqual(credits({strikerId:3,potted:[0,3],nativePotted:[0,3]}),{objects:1,striker:1}));
