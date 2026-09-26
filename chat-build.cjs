const fs=require('fs');
module.exports=function enhanceChat(code,root){
 const replace=(from,to)=>{if(code.split(from).length!==2)throw Error('Chat patch anchor not unique: '+from.slice(0,80));code=code.replace(from,to)};
 const helpers=fs.readFileSync(require('path').join(root,'chat-enhancements.js'),'utf8').replace(/\nif\(typeof module[^\n]+/,'');
 replace('function tv(){var e,t,l,k,I,K,L,B,V,P,q,F,X;',helpers+'\nfunction tv(){var e,t,l,k,I,K,L,B,V,P,q,F,X;');
 const start=code.indexOf('  let chatReferenceContext='),end=code.indexOf('  // Chat Sync & Action Handlers',start);
 if(start<0||end<0)throw Error('Missing chat context');
 replace('(0,a.useEffect)(()=>{let e=()=>sb(navigator.onLine);','const [chatCaret,setChatCaret]=(0,a.useState)(0),[chatSelected,setChatSelected]=(0,a.useState)(0),[chatDismissed,setChatDismissed]=(0,a.useState)(false),[chatRanges,setChatRanges]=(0,a.useState)([]);useApsoChatLayout(a,tk==="chat");(0,a.useEffect)(()=>{let e=()=>sb(navigator.onLine);');
 const contextStart=code.indexOf('  let chatReferenceContext='),contextEnd=code.indexOf('  // Chat Sync & Action Handlers',contextStart);
 code=code.slice(0,contextStart)+`
  const chatReferenceContext=chatDismissed?null:apsoChatContext(chatInputText,chatCaret,chatRanges);
  const chatReferenceSuggestions=chatReferenceContext?(chatReferenceContext.marker==="@"?eG(tO).filter(e=>e&&e.active!==false):sV("VIEW_RESIDENTS")?tD:[]).filter(e=>apsoChatNormalize((e.name||"")+" "+(e.title||e.position||e.householdId||"")).includes(apsoChatNormalize(chatReferenceContext.query))).sort((x,y)=>Number(apsoChatNormalize(y.name).startsWith(apsoChatNormalize(chatReferenceContext.query)))-Number(apsoChatNormalize(x.name).startsWith(apsoChatNormalize(chatReferenceContext.query)))).slice(0,8):[];
  function changeChatText(e){const value=e.target.value;setChatRanges(apsoChatReconcile(chatInputText,value,chatRanges));setChatInputText(value);setChatCaret(e.target.selectionStart);setChatSelected(0);setChatDismissed(false)}
  function chatKeyDown(e){if(e.nativeEvent.isComposing)return;if(chatReferenceContext&&chatReferenceSuggestions.length){if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();setChatSelected((chatSelected+(e.key==="ArrowDown"?1:-1)+chatReferenceSuggestions.length)%chatReferenceSuggestions.length);return}if(e.key==="Enter"||e.key==="Tab"){e.preventDefault();selectChatReference(chatReferenceContext.marker==="@"?"user":"resident",chatReferenceSuggestions[chatSelected]||chatReferenceSuggestions[0]);return}}if(e.key==="Escape"){setChatDismissed(true);return}if(e.key==="Enter"&&!e.shiftKey&&window.matchMedia('(min-width:1024px)').matches){e.preventDefault();e.currentTarget.form.requestSubmit()}}
`+code.slice(contextEnd);
 const ss=code.indexOf('  function selectChatReference('),se=code.indexOf('  function openResidentFromChat',ss);
 code=code.slice(0,ss)+`  function selectChatReference(kind,item){
    const context=chatReferenceContext;if(!context)return;
    const token=(kind==="user"?"@":"#")+String(item.name||"").trim(),value=chatInputText.slice(0,context.start)+token+" "+chatInputText.slice(context.end),caret=context.start+token.length+1;
    setChatRanges([...apsoChatReconcile(chatInputText,value,chatRanges),{id:item.id,name:item.name,kind,token,start:context.start,end:context.start+token.length}]);
    setChatInputText(value);setChatCaret(caret);setChatDismissed(true);setChatSelected(0);
    requestAnimationFrame(()=>{const el=document.querySelector('[data-apso-chat] textarea');if(el){el.focus();el.setSelectionRange(caret,caret)}});
  }
`+code.slice(se);
 replace('className:"flex h-[calc(100dvh-8rem)] min-h-[560px]', '"data-apso-chat":true,className:"flex h-[calc(100dvh-8rem)] min-h-0');
 replace('onChange:e=>setChatInputText(e.target.value),onKeyDown:e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form&&e.currentTarget.form.requestSubmit()}}','onChange:changeChatText,onClick:e=>{setChatCaret(e.target.selectionStart);setChatDismissed(false)},onKeyUp:e=>{setChatCaret(e.target.selectionStart)},onKeyDown:chatKeyDown,"aria-label":"Nội dung tin nhắn"');
 const ps=code.indexOf('    chatReferenceContext&&chatReferenceSuggestions.length>0&&'),pe=code.indexOf('    (0,s.jsxs)("form",{onSubmit:',ps);
 code=code.slice(0,ps)+`    chatReferenceContext&&(0,s.jsx)("div",{"data-chat-picker":true,role:"listbox","aria-label":"Gợi ý tên",children:chatReferenceSuggestions.length?chatReferenceSuggestions.map((item,index)=>(0,s.jsxs)("button",{type:"button",role:"option","aria-selected":index===chatSelected,onMouseDown:e=>e.preventDefault(),onClick:()=>selectChatReference(chatReferenceContext.marker==="@"?"user":"resident",item),children:[item.name,(0,s.jsx)("small",{children:chatReferenceContext.marker==="@"?(item.title||item.position||S[item.role]||"Cán bộ"):("Hộ "+(item.householdId||"—")+" • Mã "+item.id)})]},item.id)):(0,s.jsx)("p",{className:"p-3 text-sm text-slate-500",children:"Không có tên phù hợp trong danh sách bạn được quyền xem."})}),
`+code.slice(pe);
 replace('sendApsoChatMessage({text:chatInputText.trim(),file:chatAttachment,mentions:chatMentionRefs,residentRefs:chatResidentRefs});','sendApsoChatMessage({text:chatInputText,file:chatAttachment,mentions:chatRanges.filter(r=>r.kind==="user"),residentRefs:chatRanges.filter(r=>r.kind==="resident")});setChatRanges([]);setChatCaret(0);setChatDismissed(false);');
 replace('children:"Xã Vĩnh Hòa Hưng • Cơ chế Zalo Client-Storage • Tiết kiệm dung lượng"','children:"Chưa xác nhận đồng bộ chat tới các thiết bị khác."');
 replace('placeholder:"Nhắn tin… Dùng @ để gọi cán bộ, # để gắn nhân khẩu"','title:"Nhắn tin… Dùng @ để gọi cán bộ, # để gắn nhân khẩu",placeholder:"Nhắn tin… @ cán bộ, # nhân khẩu"');
 replace('children:"⏳ Tự hủy sau 14 ngày (bảo vệ bộ nhớ máy)"','children:"Lưu trên thiết bị • Chưa xác nhận gửi tới người nhận"');
 // Offset references prevent duplicate names or edited tokens opening the wrong record.
 const rs=code.indexOf('  function renderChatRichText('),re=code.indexOf('  function showApsoNotification',rs);
 code=code.slice(0,rs)+`  function renderChatRichText(message,isMe){
    const text=String(message.text||""),refs=apsoChatLegacyRefs(text,[...(message.mentions||[]).map(r=>({...r,kind:"user"})),...(message.residentRefs||[]).map(r=>({...r,kind:"resident"}))]).filter(r=>Number.isInteger(r.start)&&Number.isInteger(r.end)&&text.slice(r.start,r.end)===r.token).sort((x,y)=>x.start-y.start),parts=[];let cursor=0;
    for(const r of refs){if(r.start<cursor)continue;parts.push(text.slice(cursor,r.start));parts.push((0,s.jsx)(r.kind==="resident"?"button":"span",{type:r.kind==="resident"?"button":undefined,onClick:r.kind==="resident"?()=>openResidentFromChat(r.id):undefined,className:"font-bold underline "+(isMe?"text-cyan-100":"text-blue-700"),children:r.token},r.start));cursor=r.end}parts.push(text.slice(cursor));return parts;
  }
`+code.slice(re);
 return code;
};
