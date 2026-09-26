const fs=require('fs'),path=require('path');
module.exports=(code,root)=>{
 const once=(from,to)=>{if(code.split(from).length!==2)throw Error('Cloud chat anchor: '+from.slice(0,90));code=code.replace(from,to)};
 const source=fs.readFileSync(path.join(root,'chat-cloud.js'),'utf8').replace(/\nif\(typeof module[^\n]+/,'');
 once('function tv(){var e,t,l,k,I,K,L,B,V,P,q,F,X;',source+'\nfunction tv(){var e,t,l,k,I,K,L,B,V,P,q,F,X;');
 once('[chatMessages,setChatMessages]=(0,a.useState)(()=>getLocalChatMessages())','[chatMessages,setChatMessages]=(0,a.useState)([])');
 once('useApsoChatLayout(a,tk==="chat");','const [chatCloudStatus,setChatCloudStatus]=(0,a.useState)("Đang kết nối…"),[chatDirectory,setChatDirectory]=(0,a.useState)([]),[chatSending,setChatSending]=(0,a.useState)(false);useApsoChatLayout(a,tk==="chat");(0,a.useEffect)(()=>{setChatMessages([]);setChatDirectory([]);setChatInputText("");setChatAttachment(null);setChatRanges([])},[sC?.uid]);');
 once('chatReferenceContext.marker==="@"?eG(tO).filter(e=>e&&e.active!==false)','chatReferenceContext.marker==="@"?chatDirectory');
 once('const [chatCloudStatus,setChatCloudStatus]','const chatSyncCursor=(0,a.useRef)(null);const [chatCloudStatus,setChatCloudStatus]');
 once('setChatMessages([]);setChatDirectory([]);','chatSyncCursor.current=null;setChatMessages([]);setChatDirectory([]);');
 const begin=code.indexOf('  function sendApsoChatMessage('),end=code.indexOf('  function selectChatReference(',begin);
 if(begin<0||end<0)throw Error('Missing chat handlers');
 code=code.slice(0,begin)+fs.readFileSync(path.join(root,'chat-cloud-handlers.js'),'utf8')+'\n'+code.slice(end);
 once('(0,a.useEffect)(()=>{if("chat"===tk&&sC)syncApsoChatMessages(!0)},[tk,sC])',`(0,a.useEffect)(()=>{
 if(tk!=="chat"||!sC)return;let stopped=false,busy=false;const uid=sC.uid;
 const refresh=async()=>{if(stopped||busy||document.hidden)return;busy=true;try{await syncApsoChatMessages(true)}finally{busy=false}};
 refresh();apsoChatRequest('chatDirectory?pageSize=100','GET',undefined,uid).then(result=>{if(!stopped)setChatDirectory((result.documents||[]).map(d=>apsoChatDecode({mapValue:{fields:d.fields}})))}).catch(()=>{if(!stopped)setChatDirectory([])});
 const timer=setInterval(refresh,15000);document.addEventListener('visibilitychange',refresh);window.addEventListener('online',refresh);
 return()=>{stopped=true;clearInterval(timer);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('online',refresh)}
},[tk,sC?.uid])`);
 once('children:"Chưa xác nhận đồng bộ chat tới các thiết bị khác."','children:chatCloudStatus');
 once('children:"Lưu trên thiết bị • Chưa xác nhận gửi tới người nhận"','children:m.deliveryStatus==="sending"?"Đang gửi…":m.deliveryStatus==="failed"?"Gửi lỗi — chưa tới người nhận":"Đã gửi lên hệ thống"');
 once('(0,s.jsxs)("form",{onSubmit:e=>{\n      e.preventDefault();\n      if (!chatInputText.trim() && !chatAttachment) return;','(0,s.jsxs)("form",{onSubmit:async e=>{\n      e.preventDefault();\n      if(chatSending||(!chatInputText.trim()&&!chatAttachment))return;setChatSending(true);');
 once('sendApsoChatMessage({text:chatInputText,file:chatAttachment,mentions:chatRanges.filter(r=>r.kind==="user"),residentRefs:chatRanges.filter(r=>r.kind==="resident")});setChatRanges([]);setChatCaret(0);setChatDismissed(false);','const sent=await sendApsoChatMessage({text:chatInputText,file:chatAttachment,mentions:chatRanges.filter(r=>r.kind==="user"),residentRefs:chatRanges.filter(r=>r.kind==="resident")});setChatSending(false);if(!sent)return;setChatRanges([]);setChatCaret(0);setChatDismissed(false);');
 once('rows:1,value:chatInputText','rows:1,disabled:chatSending,maxLength:12000,value:chatInputText');
 once('disabled:!chatInputText.trim()&&!chatAttachment','disabled:chatSending||(!chatInputText.trim()&&!chatAttachment)');
 once('children:"Gửi ✈"','children:chatSending?"Đang gửi…":"Gửi ✈"');
 once('(0,s.jsx)("img",{src:m.file.dataUrl,alt:m.file.name,onClick:()=>setPreviewImageModal(m.file.dataUrl),className:"max-h-60 rounded-lg object-cover cursor-pointer hover:opacity-95 transition border border-white/20"})','(0,s.jsx)("button",{type:"button",onClick:()=>apsoChatFileAction(m.file,file=>setPreviewImageModal(file.dataUrl)),className:"rounded-lg border p-3 text-sm font-bold",children:"🖼 Bấm xem ảnh: "+m.file.name})');
 code=code.replaceAll('onClick:()=>openDriveHelper(m.file)','onClick:()=>apsoChatFileAction(m.file,openDriveHelper)').replaceAll('onClick:()=>downloadLocalFile(m.file)','onClick:()=>apsoChatFileAction(m.file,apsoChatDownload)');
 const ts=code.indexOf('  function handleUpdateChatTaskStatus('),te=code.indexOf('  function handleCreateChatTask(',ts);
 code=code.slice(0,ts)+`  async function handleUpdateChatTaskStatus(msgId,newStatus){
 const message=chatMessages.find(m=>m.id===msgId);if(!message?.task)return;
 try{await apsoChatWrite(APSO_CHAT_ROOM_PATH+'/'+encodeURIComponent(msgId),{task:{status:newStatus}},eh().auth.currentUser?.uid,['task.status']);await syncApsoChatMessages(true)}catch(error){alert('Chưa cập nhật được nhiệm vụ: '+error.message)}
 }
`+code.slice(te);
 once('function handleCreateChatTask(e) {','async function handleCreateChatTask(e) {');
 once('    sendApsoChatMessage({\n      text: "⚡ PHÂN CÔNG NHIỆM VỤ: " + title,','    if(!await sendApsoChatMessage({\n      text: "⚡ PHÂN CÔNG NHIỆM VỤ: " + title,');
 once('      task: taskObj\n    });','      task: taskObj\n    }))return;');
 // Do not create a local notification before the chat send has succeeded.
 const notificationStart=code.indexOf('    // 1. Sync to global notifications list tI / tH'),notificationEnd=code.indexOf('    // 2. Drop Task Card in Chat',notificationStart);
 if(notificationStart<0||notificationEnd<0)throw Error('Missing task notification block');
 let notification=code.slice(notificationStart,notificationEnd).replace('        id: taskId,','        id: taskId,\n        creatorUid: eh().auth.currentUser.uid,\n        assigneeUid: chatDirectory.find(user=>user.name===assignedTo)?.uid||eh().auth.currentUser.uid,\n        ...(tL.scope||{}),');
 code=code.slice(0,notificationStart)+code.slice(notificationEnd);
 once('      task: taskObj\n    }))return;','      task: taskObj\n    }))return;\n'+notification);
 once('href:m.location.mapUrl||("https://www.google.com/maps?q="+m.location.latitude+","+m.location.longitude)','href:"https://www.google.com/maps?q="+encodeURIComponent(Number(m.location.latitude)+","+Number(m.location.longitude))');
 return code;
};
