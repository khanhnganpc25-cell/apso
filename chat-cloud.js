// Authenticated REST transport shares the existing Firebase login, including mobile.
function apsoChatEncode(value){
 if(value===null||value===undefined)return {nullValue:null};
 if(typeof value==='string')return {stringValue:value};
 if(typeof value==='boolean')return {booleanValue:value};
 if(typeof value==='number')return Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value};
 if(Array.isArray(value))return {arrayValue:{values:value.map(apsoChatEncode)}};
 return {mapValue:{fields:Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k,apsoChatEncode(v)]))}};
}
function apsoChatDecode(value){
 if('stringValue'in value)return value.stringValue;if('booleanValue'in value)return value.booleanValue;
 if('timestampValue'in value)return value.timestampValue;
 if('integerValue'in value)return Number(value.integerValue);if('doubleValue'in value)return value.doubleValue;
 if('arrayValue'in value)return (value.arrayValue.values||[]).map(apsoChatDecode);
 if('mapValue'in value)return Object.fromEntries(Object.entries(value.mapValue.fields||{}).map(([k,v])=>[k,apsoChatDecode(v)]));return null;
}
async function apsoChatRequest(path,method='GET',body,expectedUid){
 const {auth}=eh(),user=auth&&auth.currentUser;if(!user||(expectedUid&&user.uid!==expectedUid))throw Error('Phiên đăng nhập đã thay đổi.');
 const token=await user.getIdToken(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 try{const response=await fetch('https://firestore.googleapis.com/v1/projects/'+auth.app.options.projectId+'/databases/(default)/documents'+(path.startsWith(':')?'':'/')+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:controller.signal});
 if(!response.ok)throw Error(response.status===403?'Tài khoản chưa có quyền chat hoặc đã bị khóa.':response.status===401?'Phiên đăng nhập hết hạn.':response.status===429?'Hệ thống đang giới hạn lượt truy cập. Vui lòng thử lại.':'Không kết nối được máy chủ ('+response.status+').');
 if(auth.currentUser?.uid!==user.uid)throw Error('Phiên đăng nhập đã thay đổi.');return await response.json();
 }finally{clearTimeout(timer)}
}
const APSO_CHAT_ROOM_PATH='chatRooms/ta_quang_ty_main/messages';
async function apsoChatWrite(path,data,uid,fields){
 const name='projects/'+eh().auth.app.options.projectId+'/databases/(default)/documents/'+path;
 const write={update:{name,fields:apsoChatEncode(data).mapValue.fields},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]};
 if(fields){write.updateMask={fieldPaths:fields};write.currentDocument={exists:true}}else write.currentDocument={exists:false};
 return apsoChatRequest(':commit','POST',{writes:[write]},uid);
}
async function apsoChatPublish(message,dataUrl){
 const path=APSO_CHAT_ROOM_PATH+'/'+encodeURIComponent(message.id),uid=message.senderUid;
 // create-only prevents a collision/retry from overwriting an existing message.
 await apsoChatWrite(path,message,uid);
 if(dataUrl){for(let index=0,offset=0;offset<dataUrl.length;index++,offset+=240000){
  await apsoChatRequest(path+'/chunks?documentId='+String(index).padStart(3,'0'),'POST',{fields:apsoChatEncode({index,data:dataUrl.slice(offset,offset+240000)}).mapValue.fields},uid);
 }await apsoChatWrite(path,{deliveryState:'ready'},uid,['deliveryState'])}
}
async function apsoChatResolveFile(file){
 if(file.dataUrl)return file;
 if(!file.cloudMessageId)throw Error('Tệp cũ chỉ có trên thiết bị gửi.');
 const uid=eh().auth.currentUser?.uid;
 const result=await apsoChatRequest(APSO_CHAT_ROOM_PATH+'/'+encodeURIComponent(file.cloudMessageId)+'/chunks?pageSize=100','GET',undefined,uid);
 const chunks=(result.documents||[]).map(d=>apsoChatDecode({mapValue:{fields:d.fields}})).sort((a,b)=>a.index-b.index);
 if(chunks.length!==file.chunkCount||chunks.some((c,i)=>c.index!==i))throw Error('Tệp chưa tải lên đầy đủ.');
 const dataUrl=chunks.map(c=>c.data).join('');if(!/^data:[^,]*;base64,/.test(dataUrl))throw Error('Tệp không hợp lệ.');return {...file,dataUrl};
}
async function apsoChatFileAction(file,action){try{await action(await apsoChatResolveFile(file))}catch(error){alert('Không mở được tệp: '+error.message)}}
async function apsoChatDownload(file){
 const cap=window.Capacitor;
 if(cap?.isNativePlatform?.()){
  const filesystem=cap.Plugins?.Filesystem||cap.registerPlugin?.('Filesystem'),share=cap.Plugins?.Share||cap.registerPlugin?.('Share');
  if(!filesystem?.writeFile||!share?.share)throw Error('Hãy cập nhật app tại apso-vn.web.app/download để lưu tệp.');
  const name=String(file.name||'apso-tai-lieu').replace(/[\\/:*?"<>|]/g,'_');
  const saved=await filesystem.writeFile({path:'chat/'+Date.now()+'-'+name,data:file.dataUrl.split(',')[1],directory:'CACHE',recursive:true});
  await share.share({title:'Lưu tệp APSO',files:[saved.uri],dialogTitle:'Chọn nơi lưu tệp'});return;
 }
 const blob=await(await fetch(file.dataUrl)).blob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=file.name||'apso-tai-lieu';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
if(typeof module!=='undefined')module.exports={apsoChatEncode,apsoChatDecode};
