const fs = require("fs");
const path = require("path");

const root = __dirname;
const target = path.join(root, "_next", "static", "chunks", "app", "page-ef1198d6a6018514.js.unified-master");
const backup = `${target}.before-chat-mentions-location`;

if (!fs.existsSync(target)) throw new Error(`Không tìm thấy bundle: ${target}`);
let code = fs.readFileSync(target, "utf8");
if (code.includes("APSO_CHAT_RICH_REFERENCES_V1")) {
  console.log("[SKIP] Chat nâng cao đã được áp dụng.");
  process.exit(0);
}
if (!fs.existsSync(backup)) fs.copyFileSync(target, backup);

function replaceOnce(search, replacement, label) {
  const count = code.split(search).length - 1;
  if (count !== 1) throw new Error(`${label}: cần đúng 1 điểm thay thế, hiện có ${count}`);
  code = code.replace(search, replacement);
}

replaceOnce(
  "}function tv(){var e,t,l,k,I,K,L,B,V,P,q,F,X;",
  `}

// APSO_CHAT_RICH_REFERENCES_V1
const APSO_CHAT_NOTIFICATION_KEY = "apso_chat_notifications_enabled_v1";
function getChatNotificationSetting(){
  try{return window.localStorage.getItem(APSO_CHAT_NOTIFICATION_KEY)==="true"}catch(e){return!1}
}
function getChatReferenceContext(text){
  let value=String(text||""),match=value.match(/([@#])([^@#\\s]*)$/u);
  return match?{marker:match[1],query:match[2]||"",start:value.length-match[0].length}:null
}
function normalizeChatSearch(value){
  return String(value||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().trim()
}
function tv(){var e,t,l,k,I,K,L,B,V,P,q,F,X;`,
  "thêm hàm chat nâng cao"
);

replaceOnce(
  `[previewImageModal,setPreviewImageModal]=(0,a.useState)(null),[unreadChatCount,setUnreadChatCount]=(0,a.useState)(0),[tD,tE]=`,
  `[previewImageModal,setPreviewImageModal]=(0,a.useState)(null),[unreadChatCount,setUnreadChatCount]=(0,a.useState)(0),[chatMentionRefs,setChatMentionRefs]=(0,a.useState)([]),[chatResidentRefs,setChatResidentRefs]=(0,a.useState)([]),[chatNotificationsEnabled,setChatNotificationsEnabled]=(0,a.useState)(()=>getChatNotificationSetting()),[chatLocationBusy,setChatLocationBusy]=(0,a.useState)(!1),[tD,tE]=`,
  "thêm state chat"
);

replaceOnce(
  `a1=a0.find(e=>e.id===tk)||a0[0];
  // Chat Sync & Action Handlers`,
  `a1=a0.find(e=>e.id===tk)||a0[0];
  let chatReferenceContext=getChatReferenceContext(chatInputText),chatReferenceSuggestions=chatReferenceContext?(chatReferenceContext.marker==="@"?eG(tO).filter(e=>e&&e.active!==!1&&normalizeChatSearch((e.name||"")+" "+(e.title||e.position||S[e.role]||"")).includes(normalizeChatSearch(chatReferenceContext.query))).slice(0,6):tD.filter(e=>e&&normalizeChatSearch((e.name||"")+" "+(e.idNumber||"")+" "+(e.householdId||"")).includes(normalizeChatSearch(chatReferenceContext.query))).slice(0,6)):[];
  // Chat Sync & Action Handlers`,
  "tính gợi ý @ và #"
);

replaceOnce(
  `      type: payload.task ? "task" : payload.file ? (payload.file.type && payload.file.type.startsWith("image/") ? "image" : "file") : "text",
      text: payload.text || "",
      file: payload.file || null,
      task: payload.task || null,`,
  `      type: payload.location ? "location" : payload.task ? "task" : payload.file ? (payload.file.type && payload.file.type.startsWith("image/") ? "image" : "file") : "text",
      text: payload.text || "",
      file: payload.file || null,
      task: payload.task || null,
      mentions: Array.isArray(payload.mentions) ? payload.mentions : [],
      residentRefs: Array.isArray(payload.residentRefs) ? payload.residentRefs : [],
      location: payload.location || null,`,
  "lưu tham chiếu và vị trí"
);

replaceOnce(
  `  function handleUpdateChatTaskStatus(msgId, newStatus) {`,
  `  function selectChatReference(kind,item){
    let context=getChatReferenceContext(chatInputText);
    if(!context)return;
    let token=(kind==="user"?"@":"#")+String(item.name||"").trim();
    setChatInputText(chatInputText.slice(0,context.start)+token+" ");
    if(kind==="user")setChatMentionRefs(prev=>prev.some(e=>e.id===item.id)?prev:[...prev,{id:item.id,name:item.name,role:item.title||item.position||S[item.role]||item.role||"Cán bộ"}]);
    else setChatResidentRefs(prev=>prev.some(e=>e.id===item.id)?prev:[...prev,{id:item.id,name:item.name,householdId:item.householdId||"",idNumber:item.idNumber||""}]);
  }

  function openResidentFromChat(residentId){
    if(!sV("VIEW_RESIDENTS"))return alert("Tài khoản của bạn chưa được cấp quyền xem nhân khẩu.");
    let resident=tD.find(e=>e.id===residentId);
    if(!resident)return alert("Không tìm thấy hồ sơ nhân khẩu này hoặc hồ sơ đã được cập nhật.");
    tV(resident);tq(resident.householdId||"");t1("resident");tT("residents");
  }

  function renderChatRichText(message,isMe){
    let value=String(message.text||""),refs=[];
    (message.mentions||[]).forEach(e=>refs.push({token:"@"+e.name,type:"user",ref:e}));
    (message.residentRefs||[]).forEach(e=>refs.push({token:"#"+e.name,type:"resident",ref:e}));
    let parts=[],cursor=0,key=0;
    while(cursor<value.length){
      let found=null,index=-1;
      refs.forEach(e=>{let i=value.indexOf(e.token,cursor);if(i>=0&&(index<0||i<index)){index=i;found=e}});
      if(!found){parts.push(value.slice(cursor));break}
      if(index>cursor)parts.push(value.slice(cursor,index));
      if(found.type==="resident")parts.push((0,s.jsx)("button",{type:"button",onClick:()=>openResidentFromChat(found.ref.id),className:"inline font-bold underline underline-offset-2 "+(isMe?"text-cyan-100 hover:text-white":"text-blue-700 hover:text-blue-900"),title:"Bấm để mở hồ sơ nhân khẩu",children:found.token},"chat-ref-"+(key++)));
      else parts.push((0,s.jsx)("span",{className:"font-bold "+(isMe?"text-cyan-100":"text-blue-700"),title:found.ref.role||"Cán bộ",children:found.token},"chat-ref-"+(key++)));
      cursor=index+found.token.length;
    }
    return parts.length?parts:value
  }

  function showApsoNotification(title,body){
    if(!chatNotificationsEnabled||typeof Notification==="undefined"||Notification.permission!=="granted")return;
    try{new Notification(title,{body:body||"APSO có nội dung mới cần xem.",icon:"/icons/apso-192.png",tag:"apso-chat-task"})}catch(e){console.warn("APSO notification:",e)}
  }

  async function toggleChatNotifications(){
    if(chatNotificationsEnabled){setChatNotificationsEnabled(!1);try{window.localStorage.setItem(APSO_CHAT_NOTIFICATION_KEY,"false")}catch(e){}return}
    if(typeof Notification==="undefined")return alert("Thiết bị hoặc trình duyệt này chưa hỗ trợ thông báo APSO.");
    let permission=Notification.permission;
    if(permission!=="granted")permission=await Notification.requestPermission();
    if(permission!=="granted")return alert("Bạn chưa cho phép thông báo. Có thể bật lại trong cài đặt của ứng dụng hoặc trình duyệt.");
    setChatNotificationsEnabled(!0);try{window.localStorage.setItem(APSO_CHAT_NOTIFICATION_KEY,"true")}catch(e){}
    try{new Notification("Đã bật thông báo APSO",{body:"Bạn sẽ nhận thông báo nhiệm vụ mới khi APSO đang hoạt động.",icon:"/icons/apso-192.png",tag:"apso-notification-enabled"})}catch(e){}
  }

  function handleSendChatLocation(){
    if(chatLocationBusy)return;
    if(!navigator.geolocation)return alert("Thiết bị này không hỗ trợ lấy vị trí.");
    setChatLocationBusy(!0);
    navigator.geolocation.getCurrentPosition(position=>{
      let latitude=Number(position.coords.latitude.toFixed(6)),longitude=Number(position.coords.longitude.toFixed(6)),accuracy=Math.round(position.coords.accuracy||0);
      sendApsoChatMessage({text:"📍 Vị trí hiện tại",location:{latitude,longitude,accuracy,mapUrl:"https://www.google.com/maps?q="+latitude+","+longitude}});
      setChatLocationBusy(!1);
    },error=>{setChatLocationBusy(!1);alert(error.code===1?"Bạn chưa cấp quyền vị trí. Hãy cho phép vị trí rồi bấm gửi lại.":error.code===3?"Lấy vị trí quá lâu. Hãy bật GPS và thử lại.":"Không lấy được vị trí hiện tại.")},{enableHighAccuracy:!0,timeout:15000,maximumAge:0});
  }

  function handleUpdateChatTaskStatus(msgId, newStatus) {`,
  "thêm hành vi tham chiếu, vị trí, thông báo"
);

replaceOnce(
  `    setTaskAssignModalOpen(!1);
    alert("Đã phân công nhiệm vụ và gửi vào phòng trao đổi Ấp Tạ Quang Tỷ thành công!");`,
  `    setTaskAssignModalOpen(!1);
    showApsoNotification("Nhiệm vụ APSO mới",title+" • "+assignedTo);
    alert("Đã phân công nhiệm vụ và gửi vào phòng trao đổi Ấp Tạ Quang Tỷ thành công!");`,
  "thông báo nhiệm vụ"
);

replaceOnce(
  `"chat"===tk && (0,s.jsxs)("section",{className:"flex flex-col rounded-2xl border border-blue-200/80 bg-white shadow-sm overflow-hidden min-h-[680px]",children:[`,
  `"chat"===tk && (0,s.jsxs)("section",{className:"flex h-[calc(100dvh-8rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-sm lg:h-[760px]",children:[`,
  "cố định khung chat"
);

replaceOnce(
  `        (0,s.jsxs)("button",{type:"button",onClick:()=>setTaskAssignModalOpen(!0),className:"flex items-center gap-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 px-3 py-1.5 text-xs font-bold shadow-sm active:scale-95 transition",children:[`,
  `        (0,s.jsxs)("button",{type:"button",role:"switch","aria-checked":chatNotificationsEnabled,onClick:toggleChatNotifications,className:"flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm active:scale-95 transition "+(chatNotificationsEnabled?"bg-emerald-400 text-emerald-950 hover:bg-emerald-300":"bg-white/20 text-white hover:bg-white/30"),title:"Bật hoặc tắt thông báo APSO trên thiết bị này",children:[(0,s.jsx)("span",{children:chatNotificationsEnabled?"🔔":"🔕"}),chatNotificationsEnabled?"Thông báo bật":"Thông báo tắt"]}),
        (0,s.jsxs)("button",{type:"button",onClick:()=>setTaskAssignModalOpen(!0),className:"flex items-center gap-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 px-3 py-1.5 text-xs font-bold shadow-sm active:scale-95 transition",children:[`,
  "thêm công tắc thông báo"
);

replaceOnce(
  `  (0,s.jsx)("div",{className:"flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 max-h-[520px] min-h-[380px]",children:chatMessages`,
  `  (0,s.jsx)("div",{className:"min-h-0 flex-1 overflow-y-auto bg-slate-50/60 p-4 space-y-4",children:chatMessages`,
  "dòng tin nhắn co giãn"
);

replaceOnce(
  `            m.text && (0,s.jsx)("p",{className:"whitespace-pre-wrap leading-relaxed "+(isMe?"text-white":"text-slate-800"),children:m.text}),`,
  `            m.text && (0,s.jsx)("p",{className:"whitespace-pre-wrap leading-relaxed "+(isMe?"text-white":"text-slate-800"),children:renderChatRichText(m,isMe)}),
            m.location && (0,s.jsxs)("div",{className:"mt-2 rounded-xl border p-3 "+(isMe?"border-blue-400/60 bg-blue-800/70":"border-emerald-200 bg-emerald-50"),children:[(0,s.jsxs)("div",{className:"font-bold",children:["📍 ",m.location.latitude,", ",m.location.longitude]}),m.location.accuracy>0&&(0,s.jsxs)("div",{className:"mt-1 text-[10px] opacity-80",children:["Độ chính xác khoảng ",m.location.accuracy," m"]}),(0,s.jsx)("a",{href:m.location.mapUrl||("https://www.google.com/maps?q="+m.location.latitude+","+m.location.longitude),target:"_blank",rel:"noreferrer",className:"mt-2 inline-flex rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700",children:"Mở trên bản đồ"})]}),`,
  "hiển thị tham chiếu và tọa độ"
);

replaceOnce(
  `  (0,s.jsxs)("div",{className:"border-t border-slate-200 bg-white p-3",children:[
    (0,s.jsxs)("form",{onSubmit:e=>{
      e.preventDefault();
      if (!chatInputText.trim() && !chatAttachment) return;
      sendApsoChatMessage({
        text: chatInputText.trim(),
        file: chatAttachment
      });
      setChatInputText("");
      setChatAttachment(null);
    },className:"flex items-center gap-2",children:[`,
  `  (0,s.jsxs)("div",{className:"relative z-20 border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",children:[
    chatReferenceContext&&chatReferenceSuggestions.length>0&&(0,s.jsx)("div",{className:"absolute bottom-full left-3 right-3 mb-2 max-h-64 overflow-y-auto rounded-xl border border-blue-200 bg-white p-1.5 shadow-2xl",children:chatReferenceSuggestions.map(item=>(0,s.jsxs)("button",{type:"button",onClick:()=>selectChatReference(chatReferenceContext.marker==="@"?"user":"resident",item),className:"flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-blue-50",children:[(0,s.jsx)("span",{className:"flex h-9 w-9 shrink-0 items-center justify-center rounded-full "+(chatReferenceContext.marker==="@"?"bg-blue-100 text-blue-700":"bg-emerald-100 text-emerald-700"),children:chatReferenceContext.marker}),(0,s.jsxs)("span",{className:"min-w-0",children:[(0,s.jsx)("span",{className:"block truncate text-sm font-bold text-slate-900",children:item.name}),(0,s.jsx)("span",{className:"block truncate text-[11px] text-slate-500",children:chatReferenceContext.marker==="@"?(item.title||item.position||S[item.role]||item.role||"Cán bộ"):("Hộ "+(item.householdId||"chưa rõ")+(item.idNumber?" • CCCD "+item.idNumber:""))})]})]},item.id))}),
    (0,s.jsxs)("form",{onSubmit:e=>{
      e.preventDefault();
      if (!chatInputText.trim() && !chatAttachment) return;
      sendApsoChatMessage({text:chatInputText.trim(),file:chatAttachment,mentions:chatMentionRefs,residentRefs:chatResidentRefs});
      setChatInputText("");setChatAttachment(null);setChatMentionRefs([]);setChatResidentRefs([]);
    },className:"flex items-end gap-2",children:[`,
  "khung gợi ý và gửi refs"
);

replaceOnce(
  `      // Quick Task Button
      (0,s.jsx)("button",{type:"button",onClick:()=>setTaskAssignModalOpen(!0),className:"flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 active:scale-95 transition font-bold",title:"Phân công nhiệm vụ",children:"⚡"}),
      // Input text field
      (0,s.jsx)("input",{type:"text",value:chatInputText,onChange:e=>setChatInputText(e.target.value),placeholder:"Nhập nội dung trao đổi tại Ấp Tạ Quang Tỷ...",className:"h-10 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"}),`,
  `      // Quick Task Button
      (0,s.jsx)("button",{type:"button",onClick:()=>setTaskAssignModalOpen(!0),className:"flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 active:scale-95 transition font-bold",title:"Phân công nhiệm vụ",children:"⚡"}),
      (0,s.jsx)("button",{type:"button",onClick:handleSendChatLocation,disabled:chatLocationBusy,className:"flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 active:scale-95 transition disabled:opacity-50",title:"Gửi vị trí hiện tại",children:chatLocationBusy?"…":"📍"}),
      // Input text field
      (0,s.jsx)("textarea",{rows:1,value:chatInputText,onChange:e=>setChatInputText(e.target.value),onKeyDown:e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form&&e.currentTarget.form.requestSubmit()}},placeholder:"Nhắn tin… Dùng @ để gọi cán bộ, # để gắn nhân khẩu",className:"min-h-10 max-h-28 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"}),`,
  "ô nhập kiểu Zalo và nút vị trí"
);

fs.writeFileSync(target, code, "utf8");
console.log(`[OK] Đã nâng cấp chat: ${target}`);
