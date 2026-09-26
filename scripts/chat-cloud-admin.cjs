// Uses the existing Firebase CLI account; never prints credentials or user data.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
async function main(){
 const auth=require('C:/Users/KhanhNgan/AppData/Local/Programs/nodejs/node_modules/firebase-tools/lib/auth.js');
 const token=await auth.getAccessToken(auth.getGlobalDefaultAccount().tokens.refresh_token,[]);
 async function api(url,method='GET',body){const r=await fetch(url,{method,headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error(method+' '+r.status+' '+(await r.text()).slice(0,180));return r.json()}
 const rulesBase='https://firebaserules.googleapis.com/v1/projects/apso-vn',db='https://firestore.googleapis.com/v1/projects/apso-vn/databases/(default)/documents';
 const release=await api(rulesBase+'/releases/cloud.firestore'),ruleset=await api('https://firebaserules.googleapis.com/v1/'+release.rulesetName);
 const rules=ruleset.source.files.find(f=>f.name.includes('firestore')||f.content.includes('service cloud.firestore')).content;
 if(process.argv[2]==='verify'){
  const expected=fs.readFileSync(path.join(root,'tmp/chat-deployed-rules.txt'),'utf8');if(rules!==expected)throw Error('Deployed rules mismatch');
  const directory=await api(db+'/chatDirectory?pageSize=100');
  console.log(JSON.stringify({rulesMatch:true,directoryCount:directory.documents?.length||0}));return;
 }
 if(process.argv[2]==='inspect'){
  fs.mkdirSync(path.join(root,'tmp'),{recursive:true});fs.writeFileSync(path.join(root,'tmp/chat-live-rules.txt'),rules);
  let users=[],next='';do{const page=await api(db+'/users?pageSize=100'+(next?'&pageToken='+encodeURIComponent(next):''));users.push(...page.documents||[]);next=page.nextPageToken}while(next);
  const decoded=users.map(d=>({uid:d.name.split('/').pop(),id:d.fields.id?.stringValue,name:d.fields.name?.stringValue,role:d.fields.role?.stringValue,active:d.fields.active?.booleanValue,hamlet:d.fields.scope?.mapValue?.fields?.hamlet?.stringValue}));
  fs.writeFileSync(path.join(root,'tmp/chat-directory-source.json'),JSON.stringify(decoded));
  console.log(JSON.stringify({ruleset:release.rulesetName,total:decoded.length,active:decoded.filter(u=>u.active).length,hamlets:[...new Set(decoded.filter(u=>u.active).map(u=>u.hamlet||'(all)'))],hasChatRule:rules.includes('match /chatRooms/')}));return;
 }
 if(process.argv[2]==='deploy'){
  const strip=s=>s.replace(/    \/\/ APSO internal chat:[\s\S]*?(?=    match \/\{document=\*\*\})/,'');
  const previous=fs.readFileSync(path.join(root,'tmp/chat-live-rules.txt'),'utf8');if(strip(rules)!==strip(previous))throw Error('Live rules changed; re-inspect before deployment');
  const extra=fs.readFileSync(path.join(root,'chat-firestore.rules.fragment'),'utf8');
  const anchor='    match /{document=**} {';if(rules.split(anchor).length!==2)throw Error('Rules anchor mismatch');
  const merged=strip(rules).replace(anchor,extra+'\n'+anchor);
  const created=await api(rulesBase+'/rulesets','POST',{source:{files:[{name:'firestore.rules',content:merged}]}});
  await api(rulesBase+'/releases/cloud.firestore','PATCH',{release:{name:'projects/apso-vn/releases/cloud.firestore',rulesetName:created.name}});
  console.log('Chat rules deployed; existing rules preserved. Previous ruleset: '+release.rulesetName);
  const users=JSON.parse(fs.readFileSync(path.join(root,'tmp/chat-directory-source.json'),'utf8'));
  let count=0;for(const u of users.filter(u=>u.active&&(u.role==='ADMIN'||u.hamlet==='Ấp Tạ Quang Tỷ'))){
   const values={id:u.id||u.uid,uid:u.uid,name:u.name||'Cán bộ',role:u.role||'OFFICER',channelId:'ta_quang_ty_main'};
   await api(db+'/chatDirectory/'+encodeURIComponent(u.uid),'PATCH',{fields:Object.fromEntries(Object.entries(values).map(([k,v])=>[k,{stringValue:v}]))});count++;
  }console.log('Minimal staff directory enrolled: '+count);fs.writeFileSync(path.join(root,'tmp/chat-deployed-rules.txt'),merged);return;
 }
 throw Error('Use inspect or deploy');
}main().catch(e=>{console.error(e.message);process.exitCode=1});
