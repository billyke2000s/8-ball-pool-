'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {strikerTapResult:tap}=require('./striker');
const base={elapsedMs:100,dx:0,dy:0,unit:1,candidateId:2,releaseId:2,tapToAim:false};
for(const [name,patch,want] of [
 ['tap selects',{},'choose'],['tap-to-aim prompts',{tapToAim:true},'choose-or-aim'],
 ['200ms selects directly',{tapToAim:true,elapsedMs:200},'choose'],
 ['999ms selects',{elapsedMs:999},'choose'],['1000ms rejected',{elapsedMs:1000},'none'],
 ['7dp boundary rejected',{dx:7},'none'],['inside movement accepted',{dx:6.99},'choose'],
 ['density scales movement',{unit:2,dx:10},'choose'],
 ['changed nearest ball rejected',{releaseId:3},'none'],['no candidate',{candidateId:null,releaseId:null},'none']
])test(name,()=>assert.equal(tap({...base,...patch}),want));
