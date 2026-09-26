const fs = require("fs");
const path = require("path");

const target = path.join(__dirname, "_next", "static", "chunks", "app", "page-ef1198d6a6018514.js.unified-master");
let code = fs.readFileSync(target, "utf8");
if (code.includes("APSO_CHAT_CLOUD_SYNC_ON_OPEN_V1")) {
  console.log("[SKIP] Đồng bộ chat đã tồn tại.");
  process.exit(0);
}

function replaceOnce(search, replacement, label) {
  const count = code.split(search).length - 1;
  if (count !== 1) throw new Error(`${label}: cần 1 điểm thay thế, hiện có ${count}`);
  code = code.replace(search, replacement);
}

replaceOnce(
  `  function selectChatReference(kind,item){`,
  `  // APSO_CHAT_CLOUD_SYNC_ON_OPEN_V1
  async function syncApsoChatMessages(silent){
    try{
      let{firestore}=eh();
      if(!firestore)throw Error("Firebase chưa sẵn sàng");
      const chatDb=n(9708);
      let snapshot=await(0,chatDb.GG)((0,chatDb.rJ)(firestore,"chatMessages")),cloud=[],now=Date.now();
      snapshot.forEach(doc=>{let message=doc.data();message&&message.id&&message.channelId==="ta_quang_ty_main"&&(!message.expiresAt||message.expiresAt>now)&&cloud.push(message)});
      setChatMessages(previous=>{
        let merged=new Map(previous.filter(message=>!message.expiresAt||message.expiresAt>now).map(message=>[message.id,message]));
        cloud.forEach(message=>merged.set(message.id,message));
        let updated=Array.from(merged.values()).sort((left,right)=>(left.createdAt||0)-(right.createdAt||0));
        saveLocalChatMessages(updated);return updated
      });
      if(!silent)alert("Đã đồng bộ "+cloud.length+" tin nhắn từ hệ thống.");
    }catch(error){
      console.warn("APSO chat sync:",error);
      if(!silent)alert("Chưa đồng bộ được tin nhắn. Hãy kiểm tra mạng hoặc dung lượng Firebase rồi thử lại.")
    }
  }

  function selectChatReference(kind,item){`,
  "thêm hàm đồng bộ chat"
);

replaceOnce(
  `}if((0,a.useEffect)(()=>{let e=window.localStorage.getItem("apso-remember-email")||"";`,
  `}if((0,a.useEffect)(()=>{if("chat"===tk&&sC)syncApsoChatMessages(!0)},[tk,sC]),(0,a.useEffect)(()=>{let e=window.localStorage.getItem("apso-remember-email")||"";`,
  "đồng bộ khi mở chat"
);

replaceOnce(
  `        (0,s.jsxs)("button",{type:"button",role:"switch","aria-checked":chatNotificationsEnabled,onClick:toggleChatNotifications,`,
  `        (0,s.jsxs)("button",{type:"button",onClick:()=>syncApsoChatMessages(!1),className:"flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-white/30 active:scale-95 transition",title:"Tải tin nhắn mới từ hệ thống",children:[(0,s.jsx)("span",{children:"↻"}),"Đồng bộ"]}),
        (0,s.jsxs)("button",{type:"button",role:"switch","aria-checked":chatNotificationsEnabled,onClick:toggleChatNotifications,`,
  "thêm nút đồng bộ"
);

fs.writeFileSync(target, code, "utf8");
console.log("[OK] Đã thêm đồng bộ chat khi mở phòng.");
