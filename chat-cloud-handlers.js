async function sendApsoChatMessage(payload){
 const user=eh().auth?.currentUser;if(!user||!tL)return false;
 const uid=user.uid,now=Date.now(),id='MSG-'+now+'-'+(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2));
 const originalFile=payload.file||null;
 if(originalFile&&(!originalFile.dataUrl||originalFile.size>15*1024*1024)){alert('Tệp phải nhỏ hơn hoặc bằng 15 MB và đã đọc xong.');return false}
 const file=originalFile?{name:originalFile.name,type:originalFile.type||'application/octet-stream',size:originalFile.size,chunkCount:Math.ceil(originalFile.dataUrl.length/240000),cloudMessageId:id}:null;
 const message={id,channelId:'ta_quang_ty_main',hamlet:'Ấp Tạ Quang Tỷ',senderUid:uid,senderId:tL.id,senderName:tL.name,senderRole:tL.title||S[tL.role]||tL.role||'Cán bộ',type:payload.location?'location':payload.task?'task':file?(file.type.startsWith('image/')?'image':'file'):'text',text:payload.text||'',file,task:payload.task||null,mentions:payload.mentions||[],residentRefs:payload.residentRefs||[],location:payload.location||null,createdAt:now,expiresAt:now+14*86400000,deliveryState:file?'uploading':'ready'};
 if(message.text.length>12000){alert('Tin nhắn tối đa 12.000 ký tự.');return false}
 setChatMessages(prev=>[...prev,{...message,deliveryStatus:'sending'}]);
 try{await apsoChatPublish(message,originalFile?.dataUrl);if(eh().auth.currentUser?.uid===uid){setChatMessages(prev=>prev.map(m=>m.id===id?{...message,deliveryState:'ready',deliveryStatus:'sent'}:m));setChatCloudStatus('Đã kết nối phòng chat');}return true}
 catch(error){if(eh().auth.currentUser?.uid===uid){setChatMessages(prev=>prev.map(m=>m.id===id?{...m,deliveryStatus:'failed',deliveryError:error.message}:m));setChatCloudStatus(error.message);alert('Gửi chưa thành công. Nội dung được giữ lại để bạn thử lại. '+error.message)}return false}
}
// APSO_CHAT_CLOUD_SYNC_ON_OPEN_V1
async function syncApsoChatMessages(silent){
 const uid=eh().auth?.currentUser?.uid;if(!uid)return;
 try{
  const cursor=silent?chatSyncCursor.current:null;
  const query={from:[{collectionId:'messages'}],orderBy:[{field:{fieldPath:'updatedAt'},direction:cursor?'ASCENDING':'DESCENDING'}],limit:100};
  if(cursor)query.where={fieldFilter:{field:{fieldPath:'updatedAt'},op:'GREATER_THAN_OR_EQUAL',value:{timestampValue:cursor}}};
  const result=await apsoChatRequest('chatRooms/ta_quang_ty_main:runQuery','POST',{structuredQuery:query},uid);
  const records=result.filter(r=>r.document).map(r=>apsoChatDecode({mapValue:{fields:r.document.fields}}));
  const cloud=records.filter(m=>m.deliveryState==='ready'&&m.expiresAt>Date.now()).map(m=>({...m,deliveryStatus:'sent'}));
  if(eh().auth.currentUser?.uid!==uid)return;
  const newest=records[cursor?records.length-1:0]?.updatedAt;if(newest)chatSyncCursor.current=newest;else if(!cursor&&result[0]?.readTime)chatSyncCursor.current=result[0].readTime;
  setChatMessages(previous=>{const merged=new Map(previous.filter(m=>m.expiresAt>Date.now()&&(cursor||m.senderUid===uid&&m.deliveryStatus!=='sent')).map(m=>[m.id,m]));cloud.forEach(m=>merged.set(m.id,m));return [...merged.values()].sort((a,b)=>a.createdAt-b.createdAt).slice(-200)});
  setChatCloudStatus('Đã kết nối • Tự cập nhật mỗi 15 giây');
  if(!silent)alert('Đã tải '+cloud.length+' tin gần nhất từ hệ thống.');
 }catch(error){if(eh().auth?.currentUser?.uid===uid)setChatCloudStatus(error.message);if(!silent)alert(error.message)}
}
