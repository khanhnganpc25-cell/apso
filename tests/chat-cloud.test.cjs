const fs=require('fs'),assert=require('node:assert/strict');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const sdk=require('firebase/firestore');
const {apsoChatEncode,apsoChatDecode}=require('../chat-cloud');
async function main(){
 const original=fs.readFileSync('tmp/chat-live-rules.txt','utf8'),rules=original.replace('    match /{document=**} {',fs.readFileSync('chat-firestore.rules.fragment','utf8')+'\n    match /{document=**} {');
 const env=await initializeTestEnvironment({projectId:'demo-apso-login',firestore:{host:'127.0.0.1',port:8189,rules}});
 try{
 const members={sender:{active:true},receiver:{active:true},disabled:{active:false},outsider:{active:true},admin:{active:true,role:'ADMIN'}};
 await env.withSecurityRulesDisabled(async context=>{for(const [uid,extra]of Object.entries(members)){await sdk.setDoc(sdk.doc(context.firestore(),'users',uid),{id:uid,name:uid,role:'OFFICER',scope:{hamlet:'Ấp Tạ Quang Tỷ'},permissions:['VIEW_RESIDENTS'],...extra});if(uid!=='outsider')await sdk.setDoc(sdk.doc(context.firestore(),'chatDirectory',uid),{uid,id:uid,name:uid,role:extra.role||'OFFICER',channelId:'ta_quang_ty_main'})}});
 const db=uid=>env.authenticatedContext(uid).firestore(),path='chatRooms/ta_quang_ty_main/messages';
 const now=Date.now(),message={id:'test',channelId:'ta_quang_ty_main',hamlet:'Ấp Tạ Quang Tỷ',senderUid:'sender',senderId:'sender',senderName:'sender',senderRole:'OFFICER',type:'text',text:'Kiểm tra đồng bộ',file:null,task:null,mentions:[],residentRefs:[],location:null,createdAt:now,expiresAt:now+86400000,deliveryState:'ready'};
 assert.deepEqual(apsoChatDecode(apsoChatEncode(message)),message);
 await assertSucceeds(sdk.setDoc(sdk.doc(db('sender'),path,'test'),{...message,updatedAt:sdk.serverTimestamp()}));
 const received=await sdk.getDocs(sdk.query(sdk.collection(db('receiver'),path),sdk.orderBy('createdAt','desc'),sdk.limit(100)));assert.equal(received.docs[0].data().text,message.text);
 await assertFails(sdk.getDocs(sdk.collection(env.unauthenticatedContext().firestore(),path)));
 for(const uid of ['disabled','outsider'])await assertFails(sdk.getDocs(sdk.collection(db(uid),path)));
 await assertFails(sdk.setDoc(sdk.doc(db('receiver'),path,'spoof'),{...message,id:'spoof'}));
 await assertFails(sdk.updateDoc(sdk.doc(db('receiver'),path,'test'),{text:'spoof'}));
 await assertFails(sdk.getDoc(sdk.doc(db('receiver'),'users','sender')));
 await assertSucceeds(sdk.getDocs(sdk.collection(db('receiver'),'chatDirectory')));
 await assertFails(sdk.setDoc(sdk.doc(db('receiver'),'chatDirectory','outsider'),{uid:'outsider',channelId:'ta_quang_ty_main'}));
 const attachment={...message,id:'file',type:'file',deliveryState:'uploading',file:{name:'test.txt',type:'text/plain',size:4,chunkCount:1,cloudMessageId:'file'}};
 await assertSucceeds(sdk.setDoc(sdk.doc(db('sender'),path,'file'),{...attachment,updatedAt:sdk.serverTimestamp()}));
 await assertFails(sdk.setDoc(sdk.doc(db('receiver'),path,'file','chunks','000'),{index:0,data:'data:text/plain;base64,dGVzdA=='}));
 await assertSucceeds(sdk.setDoc(sdk.doc(db('sender'),path,'file','chunks','000'),{index:0,data:'data:text/plain;base64,dGVzdA=='}));
 await assertSucceeds(sdk.updateDoc(sdk.doc(db('sender'),path,'file'),{deliveryState:'ready',updatedAt:sdk.serverTimestamp()}));
 assert.equal((await sdk.getDoc(sdk.doc(db('receiver'),path,'file','chunks','000'))).data().data,'data:text/plain;base64,dGVzdA==');
 await assertFails(sdk.setDoc(sdk.doc(db('sender'),path,'file','chunks','001'),{index:1,data:'extra'}));
 await assertFails(sdk.setDoc(sdk.doc(db('sender'),path,'task'),{...message,id:'task',task:{title:'Unauthorized'}}));
 // Exercise the exact browser REST transport against security rules, not only SDK calls.
 const vm=require('vm');let uid='sender';
 const token=()=>Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:uid,user_id:uid,aud:'demo-apso-login',iss:'https://securetoken.google.com/demo-apso-login',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,firebase:{sign_in_provider:'custom'}})).toString('base64url')+'.';
 const auth={app:{options:{projectId:'demo-apso-login'}},get currentUser(){return {uid,getIdToken:async()=>token()}}};
 const context=vm.createContext({eh:()=>({auth}),fetch:(url,options)=>fetch(url.replace('https://firestore.googleapis.com','http://127.0.0.1:8189'),options),AbortController,setTimeout,clearTimeout});
 vm.runInContext(fs.readFileSync('chat-cloud.js','utf8'),context);
 const dataUrl='data:text/plain;base64,'+Buffer.alloc(400000,65).toString('base64'),file={name:'large-test.txt',type:'text/plain',size:400000,chunkCount:Math.ceil(dataUrl.length/240000),cloudMessageId:'rest-file'};
 await context.apsoChatPublish({...message,id:'rest-file',file,deliveryState:'uploading'},dataUrl);
 uid='receiver';const downloaded=await context.apsoChatResolveFile(file);assert.equal(downloaded.dataUrl,dataUrl);
 const restList=await context.apsoChatRequest(path+'?pageSize=100&orderBy=createdAt%20desc');assert(restList.documents.some(d=>d.name.endsWith('/rest-file')));
 const incremental=await context.apsoChatRequest('chatRooms/ta_quang_ty_main:runQuery','POST',{structuredQuery:{from:[{collectionId:'messages'}],where:{fieldFilter:{field:{fieldPath:'updatedAt'},op:'GREATER_THAN_OR_EQUAL',value:{timestampValue:new Date(now-1000).toISOString()}}},orderBy:[{field:{fieldPath:'updatedAt'},direction:'ASCENDING'}],limit:100}});assert(incremental.some(r=>r.document?.name.endsWith('/rest-file')));
 uid='disabled';await assert.rejects(()=>context.apsoChatRequest(path+'?pageSize=100'));
 console.log('PASS exact REST transport: authenticated create, multipart file upload, ready acknowledgement, second-account download integrity, disabled account denied');
 console.log('PASS: two-account chat, attachment transfer, anonymous/disabled/unenrolled denial, sender spoof denied, directory minimized, existing user privacy unchanged');
 }finally{await env.cleanup()}
}main().catch(e=>{console.error(e);process.exitCode=1});
