const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {initializeTestEnvironment, assertFails} = require('@firebase/rules-unit-testing');
const sdk = require('firebase/firestore');
const area = {province:'An Giang',commune:'Xã Vĩnh Hòa Hưng',hamlet:'Ấp Tạ Quang Tỷ',group:''};
const permissions = ['VIEW_RESIDENTS','VIEW_HOUSEHOLDS','VIEW_TASKS','UPDATE_ASSIGNED_TASKS'];
const users = {
  officer: {role:'OFFICER',active:true,scope:area,permissions},
  viewer: {role:'OFFICER',active:true,scope:area,permissions:['VIEW_RESIDENTS']},
  assignee: {role:'OFFICER',active:true,scope:area,permissions:['UPDATE_ASSIGNED_TASKS']},
  group: {role:'SECURITY',active:true,scope:{...area,group:'1'},permissions},
  admin: {role:'ADMIN',active:true,scope:{},permissions:[]},
  disabled: {role:'OFFICER',active:false,scope:area,permissions}
};
async function main() {
  const env = await initializeTestEnvironment({projectId:'demo-apso-login',firestore:{host:'127.0.0.1',port:8189,rules:fs.readFileSync(__dirname+'/production-firestore.rules','utf8')}});
  try {
    await env.withSecurityRulesDisabled(async context => {
      const db=context.firestore();
      for(const [id,data] of Object.entries(users)) await sdk.setDoc(sdk.doc(db,'users',id),data);
      for(const collection of ['residents','households']) {
        await sdk.setDoc(sdk.doc(db,collection,'inside'),{id:'inside',...area,group:'1'});
        await sdk.setDoc(sdk.doc(db,collection,'group2'),{id:'group2',...area,group:'2'});
        await sdk.setDoc(sdk.doc(db,collection,'outside'),{id:'outside',...area,hamlet:'Khác'});
      }
      for(const [id,data] of Object.entries({
        inside:{...area,group:'1',assigneeUid:'officer',creatorUid:'admin'},
        group2:{...area,group:'2',assigneeUid:'someone',creatorUid:'admin'},
        outside:{...area,hamlet:'Khác',assigneeUid:'someone',creatorUid:'admin'},
        assigned:{...area,hamlet:'Khác',assigneeUid:'assignee',creatorUid:'admin'},
        created:{...area,hamlet:'Khác',assigneeUid:'someone',creatorUid:'assignee'}
      })) await sdk.setDoc(sdk.doc(db,'notifications',id),{id,...data});
    });
    const source=fs.readFileSync(__dirname+'/../scoped-cloud-read.js','utf8');
    function loader(uid) {
      const db=env.authenticatedContext(uid).firestore(), ep=users[uid];
      const ctx=vm.createContext({ep,ex:new Map(),eo:{rJ:sdk.collection,P:sdk.query,_M:sdk.where,GG:sdk.getDocs},eh:()=>({auth:{currentUser:{uid}}}),ef:x=>x,eN:JSON.stringify,ej:ps=>ps.some(p=>ep.permissions.includes(p))});
      vm.runInContext(source,ctx);
      return {db,read:name=>ctx.ew(db,name),ctx};
    }
    const officer=loader('officer');
    await assertFails(sdk.getDocs(sdk.collection(officer.db,'residents')));
    console.log('PASS: original unscoped read reproduces permission-denied');
    for(const collection of ['residents','households']) {
      assert.deepEqual(Array.from(await officer.read(collection),x=>x.id).sort(),['group2','inside']);
    }
    assert.deepEqual(Array.from(await officer.read('notifications'),x=>x.id).sort(),['group2','inside']);
    console.log('PASS: officer reads only assigned area; overlapping task results deduplicated');
    assert.equal((await loader('viewer').read('residents')).length,2);
    assert.deepEqual(Array.from(await loader('group').read('residents'),x=>x.id),['inside']);
    assert.deepEqual(Array.from(await loader('assignee').read('notifications'),x=>x.id).sort(),['assigned','created']);
    console.log('PASS: read-only user, group restriction, and assignee/creator access');
    assert.equal((await loader('admin').read('residents')).length,3);
    await assertFails(loader('disabled').read('residents'));
    await assertFails(loader('viewer').read('households'));
    console.log('PASS: admin unchanged; disabled and unauthorized users still denied');
    const bundle=fs.readFileSync(__dirname+'/../_next/static/chunks/app/page-ef1198d6a6018514.js','utf8');
    const loadStart=bundle.indexOf('try{a=await eS()}catch(loadError)'),loadEnd=bundle.indexOf('let l=',loadStart);
    assert(loadStart>0 && loadEnd>loadStart);
    let signedOut=false;const state={};
    const ctx=vm.createContext({eS:async()=>{throw Object.assign(Error('denied'),{code:'permission-denied'})},console:{error(){}},s:{id:'officer'},i:{CI:()=>{signedOut=true}},...Object.fromEntries(['tE','tM','tH','tR','tK','sT','tV','sg','su'].map(key=>[key,value=>{state[key]=value}]))});
    await vm.runInContext('(async()=>{let a;'+bundle.slice(loadStart,loadEnd)+'})()',ctx);
    assert.equal(signedOut,false);assert.equal(state.sg,false);assert.equal(state.tE.length,0);assert.equal(state.tR[0].id,'officer');
    assert(state.su.includes('permission-denied'));
    assert(bundle.includes('async function eT(e){if(!apsoCloudReady)throw Error('));
    console.log('PASS: data load failure keeps login, clears stale data, and blocks auto-save');
  } finally { await env.cleanup(); }
}
main().catch(error=>{console.error(error);process.exitCode=1});
