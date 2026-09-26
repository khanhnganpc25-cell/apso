const fs = require("fs");
const path = require("path");

const masterFile = path.join(
  __dirname,
  "_next",
  "static",
  "chunks",
  "app",
  "page-ef1198d6a6018514.js.unified-master"
);

// Always start from pristine backup if available
const backupFile = masterFile + ".bak-chat";
if (fs.existsSync(backupFile)) {
  fs.copyFileSync(backupFile, masterFile);
  console.log("[OK] Restored pristine backup from", backupFile);
}

let code = fs.readFileSync(masterFile, "utf8");
console.log("Original master length:", code.length);

// ----------------------------------------------------
// 1. INJECT STATE VARIABLES INTO tv()
// ----------------------------------------------------
const stateAnchor = '[otaDismissedVer,setOtaDismissedVer]=(0,a.useState)(""),';
const newChatStates = `[otaDismissedVer,setOtaDismissedVer]=(0,a.useState)(""),[chatMessages,setChatMessages]=(0,a.useState)(()=>getLocalChatMessages()),[chatInputText,setChatInputText]=(0,a.useState)(""),[chatAttachment,setChatAttachment]=(0,a.useState)(null),[chatFilter,setChatFilter]=(0,a.useState)("all"),[taskAssignModalOpen,setTaskAssignModalOpen]=(0,a.useState)(!1),[driveHelperModalOpen,setDriveHelperModalOpen]=(0,a.useState)(!1),[activeDriveFile,setActiveDriveFile]=(0,a.useState)(null),[previewImageModal,setPreviewImageModal]=(0,a.useState)(null),[unreadChatCount,setUnreadChatCount]=(0,a.useState)(0),`;

if (!code.includes(stateAnchor)) {
  console.error("FAIL: stateAnchor not found");
  process.exit(1);
}
code = code.replace(stateAnchor, newChatStates);
console.log("[OK] Injected Chat & Task state variables into tv()");

// ----------------------------------------------------
// 2. INJECT CHAT & DRIVE HELPER FUNCTIONS
// ----------------------------------------------------
const helperAnchor = 'async function zzUpdateUserAccess';
const chatHelperFunctions = `
const CHAT_STORAGE_KEY = "apso_chat_tqt_local_v1";
const CHAT_HAMLET = "Ấp Tạ Quang Tỷ";

function getLocalChatMessages() {
  try {
    let raw = typeof window !== "undefined" ? window.localStorage.getItem(CHAT_STORAGE_KEY) : null;
    if (!raw) return getDefaultChatMessages();
    let parsed = JSON.parse(raw);
    let now = Date.now();
    // Tự động dọn dẹp sau 14 ngày (14 * 24 * 3600 * 1000)
    let valid = parsed.filter(m => !m.expiresAt || m.expiresAt > now);
    if (valid.length !== parsed.length && typeof window !== "undefined") {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(valid));
    }
    return valid.length > 0 ? valid : getDefaultChatMessages();
  } catch(e) {
    return getDefaultChatMessages();
  }
}

function saveLocalChatMessages(msgs) {
  try {
    if (typeof window === "undefined") return;
    let now = Date.now();
    let valid = msgs.filter(m => !m.expiresAt || m.expiresAt > now);
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(valid));
  } catch(e) {
    console.warn("Lỗi lưu trữ chat nội bộ:", e);
  }
}

function getDefaultChatMessages() {
  let now = Date.now();
  let exp = now + 14 * 24 * 60 * 60 * 1000;
  return [
    {
      id: "MSG-TQT-01",
      channelId: "ta_quang_ty_main",
      hamlet: "Ấp Tạ Quang Tỷ",
      senderId: "USR-TQT-008",
      senderName: "Trưởng ấp",
      senderRole: "Trưởng ấp",
      type: "text",
      text: "Kính chào toàn thể cán bộ và các tổ nhân dân tự quản Ấp Tạ Quang Tỷ! Kênh trao đổi công việc nội bộ và giao việc số đã chính thức kích hoạt. Dữ liệu lưu trữ trực tiếp trên thiết bị (theo cơ chế Zalo client-storage) giúp ứng dụng hoạt động mượt mà, bảo mật và hoàn toàn miễn phí máy chủ. Mọi tệp tin sẽ tự động dọn dẹp sau 14 ngày để giải phóng bộ nhớ. Đối với văn bản, hồ sơ quan trọng, các đồng chí bấm 'Lưu vào Google Drive' để lưu trữ vĩnh viễn trên kho 15GB.",
      createdAt: now - 3600000 * 5,
      expiresAt: exp
    },
    {
      id: "MSG-TQT-02",
      channelId: "ta_quang_ty_main",
      hamlet: "Ấp Tạ Quang Tỷ",
      senderId: "USR-TQT-008",
      senderName: "Trưởng ấp",
      senderRole: "Trưởng ấp",
      type: "task",
      text: "Phân công nhiệm vụ rà soát thông tin CCCD và thẻ BHYT cư dân trên địa bàn Ấp Tạ Quang Tỷ.",
      task: {
        taskId: "NV-TQT-001",
        title: "Rà soát thông tin CCCD & BHYT Tổ 1 - Ấp Tạ Quang Tỷ",
        assignedTo: "Tổ trưởng Bảo vệ ANTT",
        deadline: new Date(now + 86400000 * 3).toISOString().slice(0, 10),
        priority: "Quan trọng",
        status: "Đang làm",
        notes: "Kiểm tra danh sách nhân khẩu mới chuyển đến và cập nhật số định danh cá nhân đầy đủ."
      },
      createdAt: now - 3600000 * 3,
      expiresAt: exp
    }
  ];
}
`;

if (!code.includes(helperAnchor)) {
  console.error("FAIL: helperAnchor not found");
  process.exit(1);
}
code = code.replace(helperAnchor, chatHelperFunctions + "\n" + helperAnchor);
console.log("[OK] Injected Chat & Drive helper functions");

// ----------------------------------------------------
// 3. INJECT CHAT DISPATCH & SYNC FUNCTIONS
// ----------------------------------------------------
const tvEndAnchor = 'return(0,s.jsxs)("main",{className:"min-h-screen bg-[#eef6ff] text-slate-900';
if (!code.includes(tvEndAnchor)) {
  console.error("FAIL: tvEndAnchor not found");
  process.exit(1);
}

const chatActionsCode = `
  // Chat Sync & Action Handlers
  function sendApsoChatMessage(payload) {
    let now = Date.now();
    let exp = now + 14 * 24 * 60 * 60 * 1000;
    let senderId = (tL && tL.id) || "USR-TQT-008";
    let senderName = (tL && tL.name) || "Cán bộ ấp";
    let senderRole = (tL && S[tL.role]) || (tL && tL.role) || "Cán bộ";
    let newMsg = {
      id: "MSG-" + now + "-" + Math.random().toString(36).substring(2, 6),
      channelId: "ta_quang_ty_main",
      hamlet: "Ấp Tạ Quang Tỷ",
      senderId: senderId,
      senderName: senderName,
      senderRole: senderRole,
      type: payload.task ? "task" : payload.file ? (payload.file.type && payload.file.type.startsWith("image/") ? "image" : "file") : "text",
      text: payload.text || "",
      file: payload.file || null,
      task: payload.task || null,
      createdAt: now,
      expiresAt: exp
    };

    setChatMessages(prev => {
      let updated = [...prev, newMsg];
      saveLocalChatMessages(updated);
      return updated;
    });

    // Sync to Firestore relay if available
    try {
      let { firestore } = eh();
      if (firestore && (!payload.file || payload.file.size < 200000)) {
        (0, eo.BN)((0, eo.H9)(firestore, "chatMessages", newMsg.id), newMsg, { merge: true }).catch(e => console.warn("Firestore chat relay:", e));
      }
    } catch(e) {
      console.warn("Lỗi sync Firestore chat:", e);
    }
  }

  function handleUpdateChatTaskStatus(msgId, newStatus) {
    setChatMessages(prev => {
      let updated = prev.map(m => {
        if (m.id === msgId && m.task) {
          return { ...m, task: { ...m.task, status: newStatus } };
        }
        return m;
      });
      saveLocalChatMessages(updated);
      return updated;
    });
  }

  function handleCreateChatTask(e) {
    e.preventDefault();
    let fd = new FormData(e.currentTarget);
    let title = String(fd.get("title") || "").trim();
    let assignedTo = String(fd.get("assignedTo") || "Toàn thể cán bộ").trim();
    let priority = String(fd.get("priority") || "Bình thường").trim();
    let deadline = String(fd.get("deadline") || "").trim();
    let notes = String(fd.get("notes") || "").trim();

    if (!title) return alert("Vui lòng nhập tên công việc!");

    let taskId = "NV-" + Date.now().toString().slice(-4);
    let taskObj = {
      taskId: taskId,
      title: title,
      assignedTo: assignedTo,
      priority: priority,
      deadline: deadline || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      status: "Chờ thực hiện",
      notes: notes
    };

    // 1. Sync to global notifications list tI / tH
    tH(prev => [
      {
        id: taskId,
        title: title + " (" + assignedTo + ")",
        message: (notes ? notes + " • " : "") + "Phân công tại Ấp Tạ Quang Tỷ. Hạn chót: " + (deadline || "3 ngày tới"),
        date: deadline || new Date().toISOString().slice(0, 10),
        level: priority === "Khẩn cấp" ? "Khẩn" : priority === "Quan trọng" ? "Nhắc việc" : "Bình thường"
      },
      ...prev
    ]);

    // 2. Drop Task Card in Chat
    sendApsoChatMessage({
      text: "⚡ PHÂN CÔNG NHIỆM VỤ: " + title,
      task: taskObj
    });

    setTaskAssignModalOpen(!1);
    alert("Đã phân công nhiệm vụ và gửi vào phòng trao đổi Ấp Tạ Quang Tỷ thành công!");
  }

  function handleChatFileInput(e) {
    let file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert("Tệp tin vượt quá 15MB. Vui lòng chọn tệp nhỏ hơn hoặc tải trực tiếp lên Google Drive.");
      return;
    }
    let reader = new FileReader();
    reader.onload = function(evt) {
      setChatAttachment({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: evt.target.result
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function openDriveHelper(file) {
    setActiveDriveFile(file);
    setDriveHelperModalOpen(!0);
  }

  function downloadLocalFile(file) {
    if (!file || !file.dataUrl) return;
    let a = document.createElement("a");
    a.href = file.dataUrl;
    a.download = file.name || "apso-tai-lieu";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
`;

code = code.replace(tvEndAnchor, chatActionsCode + "\n  " + tvEndAnchor);
console.log("[OK] Injected chat handlers & action callbacks");

// ----------------------------------------------------
// 4. DESKTOP SIDEBAR TABS UPDATE
// ----------------------------------------------------
const a0Anchor = 'a0=[{id:"overview",label:"Tổng quan",icon:u.A},';
const newA0 = 'a0=[{id:"overview",label:"Tổng quan",icon:u.A},{id:"chat",label:"Trò chuyện nội bộ",icon:function(p){return (0,s.jsx)("svg",{className:p.className||"h-4 w-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:(0,s.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"})})}},';

if (!code.includes(a0Anchor)) {
  console.error("FAIL: a0Anchor not found");
  process.exit(1);
}
code = code.replace(a0Anchor, newA0);
console.log("[OK] Added Chat to Desktop Sidebar tabs (a0)");

// ----------------------------------------------------
// 5. UPDATE MOBILE TOP HEADER
// ----------------------------------------------------
const oldMobileHeader = '(0,s.jsxs)("header",{className:"sticky top-0 z-30 border-b border-blue-600/30 bg-gradient-to-r from-[#0068ff] via-[#0052cc] to-[#004bb5] px-3 py-2 text-white shadow-md lg:hidden",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between gap-2",children:[(0,s.jsxs)("button",{type:"button",onClick:()=>setZaloHubOpen(!0),className:"relative shrink-0 flex items-center gap-1.5 focus:outline-none",title:"Hồ sơ cán bộ & Nghiệp vụ",children:[(0,s.jsx)("img",{src:"/cong-dan-so-logo.svg",alt:"APSO",className:"h-9 w-9 rounded-full bg-white/10 p-0.5 ring-2 ring-white/50 shadow-sm"}),(0,s.jsx)("span",{className:"absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white "+(sx?"bg-emerald-400":"bg-amber-400")})]}),(0,s.jsxs)("div",{className:"relative flex flex-1 items-center",children:[(0,s.jsx)(b.A,{className:"absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70"}),(0,s.jsx)("input",{type:"text",value:W,onChange:e=>G(e.target.value),placeholder:"Tìm dân cư, CCCD, hộ...",className:"h-9 w-full rounded-full border border-white/20 bg-white/20 pl-9 pr-8 text-xs text-white placeholder-white/70 outline-none transition focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:ring-2 focus:ring-white/40"}),W&&(0,s.jsx)("button",{type:"button",onClick:()=>G(""),className:"absolute right-2.5 top-1/2 -translate-y-1/2 text-white/80 hover:text-white focus:outline-none text-xs",children:"✕"})]}),(0,s.jsxs)("div",{className:"flex items-center gap-1 shrink-0",children:[(0,s.jsx)("button",{type:"button",onClick:()=>{nq("");nX(null);nB(!0)},title:"Quét mã CCCD/QR",className:"flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white active:scale-95 transition",children:(0,s.jsx)("span",{className:"text-base leading-none",children:"📷"})}),(0,s.jsx)("button",{type:"button",onClick:()=>setQuickAddOpen(e=>!e),title:"Thêm mới",className:"flex h-9 w-9 items-center justify-center rounded-full bg-white text-blue-700 hover:bg-blue-50 active:scale-95 transition shadow-sm font-bold",children:(0,s.jsx)(j.A,{className:"h-4 w-4 stroke-[2.5]"})}),(0,s.jsxs)("button",{type:"button",onClick:()=>tT("notifications"),title:"Thông báo nhắc việc",className:"relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white active:scale-95 transition",children:[(0,s.jsx)(c.A,{className:"h-4 w-4"}),at.open>0&&(0,s.jsx)("span",{className:"absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-blue-700 shadow-sm animate-pulse",children:at.open>99?"99+":at.open})]})]})]})]}),';

const newFixedMobileHeader = `(0,s.jsxs)("header",{className:"fixed top-0 inset-x-0 z-40 border-b border-slate-200/90 bg-white/95 px-3 pb-2 text-slate-800 shadow-xs backdrop-blur-md lg:hidden",style:{paddingTop:"max(0.625rem, env(safe-area-inset-top, 0px))"},children:[(0,s.jsxs)("div",{className:"flex items-center justify-between gap-2",children:[(0,s.jsxs)("button",{type:"button",onClick:()=>setZaloHubOpen(!0),className:"relative shrink-0 flex items-center gap-1.5 focus:outline-none",title:"Hồ sơ cán bộ & Nghiệp vụ",children:[(0,s.jsx)("img",{src:"/cong-dan-so-logo.svg",alt:"APSO",className:"h-8 w-8 rounded-full bg-blue-50 p-0.5 ring-1 ring-blue-200 shadow-xs"}),(0,s.jsx)("span",{className:"absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white "+(sx?"bg-emerald-500":"bg-amber-400")})]}),(0,s.jsxs)("div",{className:"relative flex flex-1 items-center",children:[(0,s.jsx)(b.A,{className:"absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"}),(0,s.jsx)("input",{type:"text",value:W,onChange:e=>G(e.target.value),placeholder:"Tìm cư dân, CCCD, hộ...",className:"h-8 w-full rounded-full border border-slate-200 bg-slate-100/80 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}),W&&(0,s.jsx)("button",{type:"button",onClick:()=>G(""),className:"absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs",children:"✕"})]}),(0,s.jsxs)("div",{className:"flex items-center gap-1 shrink-0",children:[(0,s.jsx)("button",{type:"button",onClick:()=>{nq("");nX(null);nB(!0)},title:"Quét mã CCCD/QR",className:"flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition",children:(0,s.jsx)("span",{className:"text-sm leading-none",children:"📷"})}),(0,s.jsx)("button",{type:"button",onClick:()=>setQuickAddOpen(e=>!e),title:"Thêm mới",className:"flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition shadow-xs font-bold",children:(0,s.jsx)(j.A,{className:"h-3.5 w-3.5 stroke-[2.5]"})}),(0,s.jsxs)("button",{type:"button",onClick:()=>tT("notifications"),title:"Thông báo nhắc việc",className:"relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition",children:[(0,s.jsx)(c.A,{className:"h-3.5 w-3.5"}),at.open>0&&(0,s.jsx)("span",{className:"absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white shadow-xs animate-pulse",children:at.open>99?"99+":at.open})]})]})]})]}),`;

if (!code.includes(oldMobileHeader)) {
  console.error("FAIL: oldMobileHeader not found");
  process.exit(1);
}
code = code.replace(oldMobileHeader, newFixedMobileHeader);
console.log("[OK] Upgraded Mobile Header to fixed position with safe-area padding and clean style");

// ----------------------------------------------------
// 6. UPDATE MAIN CONTAINER TOP & BOTTOM PADDING
// ----------------------------------------------------
const oldMainPadding = '(0,s.jsxs)("div",{className:"mx-auto flex w-full max-w-[1480px] flex-1 flex-col space-y-6 p-4 pb-28 md:p-6 lg:pb-8 xl:p-8"';
const newMainPadding = '(0,s.jsxs)("div",{className:"mx-auto flex w-full max-w-[1480px] flex-1 flex-col space-y-6 p-4 pt-[calc(env(safe-area-inset-top,0px)+3.75rem)] pb-28 md:p-6 lg:pt-0 lg:pb-8 xl:p-8"';

if (!code.includes(oldMainPadding)) {
  console.error("FAIL: oldMainPadding not found");
  process.exit(1);
}
code = code.replace(oldMainPadding, newMainPadding);
console.log("[OK] Updated container padding with safe-area offset to prevent content overlapping");

// ----------------------------------------------------
// 7. INJECT CHAT VIEW SECTION
// ----------------------------------------------------
const overviewSectionAnchor = '"overview"===tk&&';
const chatSectionJsx = `
"chat"===tk && (0,s.jsxs)("section",{className:"flex flex-col rounded-2xl border border-blue-200/80 bg-white shadow-sm overflow-hidden min-h-[680px]",children:[
  // 1. Chat Header
  (0,s.jsxs)("div",{className:"border-b border-slate-200 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-4 text-white",children:[
    (0,s.jsxs)("div",{className:"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",children:[
      (0,s.jsxs)("div",{className:"flex items-center gap-3",children:[
        (0,s.jsxs)("div",{className:"relative shrink-0",children:[
          (0,s.jsx)("div",{className:"flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl shadow-inner ring-2 ring-white/40",children:"💬"}),
          (0,s.jsx)("span",{className:"absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white"})
        ]}),
        (0,s.jsxs)("div",{children:[
          (0,s.jsxs)("div",{className:"flex items-center gap-2",children:[
            (0,s.jsx)("h2",{className:"font-bold text-base sm:text-lg leading-snug",children:"Trao đổi công việc - Ấp Tạ Quang Tỷ"}),
            (0,s.jsx)("span",{className:"hidden sm:inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",children:"Nội bộ"})
          ]}),
          (0,s.jsx)("p",{className:"text-xs text-blue-100/90",children:"Xã Vĩnh Hòa Hưng • Cơ chế Zalo Client-Storage • Tiết kiệm dung lượng"})
        ]})
      ]}),
      (0,s.jsxs)("div",{className:"flex items-center gap-2 flex-wrap",children:[
        (0,s.jsxs)("button",{type:"button",onClick:()=>setTaskAssignModalOpen(!0),className:"flex items-center gap-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 px-3 py-1.5 text-xs font-bold shadow-sm active:scale-95 transition",children:[
          (0,s.jsx)("span",{className:"text-sm",children:"⚡"}),
          "Giao việc mới"
        ]}),
        (0,s.jsxs)("button",{type:"button",onClick:()=>openDriveHelper(null),className:"flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 text-xs font-bold backdrop-blur-xs active:scale-95 transition",title:"Mở Google Drive Ấp Tạ Quang Tỷ",children:[
          (0,s.jsx)("span",{className:"text-sm",children:"📂"}),
          "Google Drive (15GB)"
        ]})
      ]})
    ]}),
    // Sub-bar with badges & filter
    (0,s.jsxs)("div",{className:"mt-3 flex items-center justify-between border-t border-white/15 pt-2.5 text-xs flex-wrap gap-2",children:[
      (0,s.jsxs)("div",{className:"flex items-center gap-2 text-[11px] text-blue-100",children:[
        (0,s.jsx)("span",{className:"flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 font-medium",children:"⏳ Tự hủy sau 14 ngày"}),
        (0,s.jsx)("span",{className:"flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 font-medium",children:"🔒 Lưu trữ máy khách"})
      ]}),
      (0,s.jsxs)("div",{className:"flex items-center gap-1 bg-white/15 rounded-lg p-0.5 text-[11px]",children:[
        (0,s.jsx)("button",{type:"button",onClick:()=>setChatFilter("all"),className:"px-2.5 py-1 rounded-md transition font-medium "+("all"===chatFilter?"bg-white text-blue-900 font-bold shadow-xs":"text-white hover:bg-white/10"),children:"Tất cả"}),
        (0,s.jsx)("button",{type:"button",onClick:()=>setChatFilter("tasks"),className:"px-2.5 py-1 rounded-md transition font-medium "+("tasks"===chatFilter?"bg-white text-blue-900 font-bold shadow-xs":"text-white hover:bg-white/10"),children:"📋 Nhiệm vụ"}),
        (0,s.jsx)("button",{type:"button",onClick:()=>setChatFilter("files"),className:"px-2.5 py-1 rounded-md transition font-medium "+("files"===chatFilter?"bg-white text-blue-900 font-bold shadow-xs":"text-white hover:bg-white/10"),children:"📎 Tệp tin & Ảnh"})
      ]})
    ]})
  ]}),

  // 2. Chat Message List Stream
  (0,s.jsx)("div",{className:"flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 max-h-[520px] min-h-[380px]",children:chatMessages
    .filter(m=>{
      if (chatFilter==="tasks") return m.type==="task"||!!m.task;
      if (chatFilter==="files") return m.type==="file"||m.type==="image"||!!m.file;
      return !0;
    })
    .map(m=>{
      let isMe = tL && (m.senderId===tL.id || m.senderName===tL.name);
      return (0,s.jsxs)("div",{key:m.id,className:"flex gap-2.5 "+(isMe?"flex-row-reverse":"flex-row"),children:[
        // Avatar
        (0,s.jsx)("div",{className:"flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-xs "+(isMe?"bg-blue-600 text-white":"bg-slate-200 text-slate-700"),children:(m.senderName||"CB").slice(0,2).toUpperCase()}),
        // Message Body
        (0,s.jsxs)("div",{className:"flex max-w-[85%] sm:max-w-[70%] flex-col "+(isMe?"items-end":"items-start"),children:[
          // Sender Header
          (0,s.jsxs)("div",{className:"mb-1 flex items-center gap-1.5 text-[11px] text-slate-400",children:[
            (0,s.jsx)("span",{className:"font-bold text-slate-700",children:m.senderName}),
            (0,s.jsxs)("span",{className:"rounded bg-slate-100 px-1 py-0.2 text-[10px] text-slate-500",children:[m.senderRole||"Cán bộ"]}),
            (0,s.jsx)("span",{children:new Date(m.createdAt).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})})
          ]}),
          // Bubble
          (0,s.jsxs)("div",{className:"rounded-2xl p-3.5 shadow-xs text-xs "+(isMe?"bg-blue-700 text-white rounded-tr-none":"bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"),children:[
            // Text message
            m.text && (0,s.jsx)("p",{className:"whitespace-pre-wrap leading-relaxed "+(isMe?"text-white":"text-slate-800"),children:m.text}),
            // Attachment Photo
            m.file && (m.type==="image" || (m.file.type && m.file.type.startsWith("image/"))) && (0,s.jsxs)("div",{className:"mt-2 space-y-1.5",children:[
              (0,s.jsx)("img",{src:m.file.dataUrl,alt:m.file.name,onClick:()=>setPreviewImageModal(m.file.dataUrl),className:"max-h-60 rounded-lg object-cover cursor-pointer hover:opacity-95 transition border border-white/20"}),
              (0,s.jsxs)("div",{className:"flex items-center justify-between text-[10px] pt-1 opacity-90",children:[
                (0,s.jsx)("span",{children:m.file.name}),
                (0,s.jsxs)("button",{type:"button",onClick:()=>openDriveHelper(m.file),className:"font-bold underline hover:opacity-100 flex items-center gap-1",children:["💾 Lưu Drive"]})
              ]})
            ]}),
            // Attachment Document / File (.pdf, .doc, .docx, .xls, .xlsx)
            m.file && m.type!=="image" && !(m.file.type && m.file.type.startsWith("image/")) && (0,s.jsxs)("div",{className:"mt-2 rounded-xl p-3 border "+(isMe?"bg-blue-800/60 border-blue-500/50 text-white":"bg-slate-50 border-slate-200 text-slate-800"),children:[
              (0,s.jsxs)("div",{className:"flex items-center gap-2.5",children:[
                (0,s.jsx)("span",{className:"text-2xl",children:m.file.name.endsWith(".pdf")?"📄":m.file.name.endsWith(".xlsx")||m.file.name.endsWith(".xls")?"📊":"📁"}),
                (0,s.jsxs)("div",{className:"min-w-0 flex-1",children:[
                  (0,s.jsx)("div",{className:"font-bold truncate text-xs",children:m.file.name}),
                  (0,s.jsxs)("div",{className:"text-[10px] opacity-75",children:[(m.file.size/1024).toFixed(1)," KB • Tự dọn sau 14 ngày"]})
                ]})
              ]}),
              (0,s.jsxs)("div",{className:"mt-2.5 flex items-center gap-2 border-t pt-2 "+(isMe?"border-blue-600/60":"border-slate-200"),children:[
                (0,s.jsx)("button",{type:"button",onClick:()=>downloadLocalFile(m.file),className:"rounded-md bg-white text-blue-700 px-2.5 py-1 text-[11px] font-bold hover:bg-blue-50 transition shadow-2xs",children:"⬇ Tải về"}),
                (0,s.jsx)("button",{type:"button",onClick:()=>openDriveHelper(m.file),className:"rounded-md bg-amber-400 text-slate-900 px-2.5 py-1 text-[11px] font-bold hover:bg-amber-300 transition shadow-2xs",children:"💾 Lưu vào Google Drive (15GB)"})
              ]})
            ]}),
            // Task Card
            m.task && (0,s.jsxs)("div",{className:"mt-2 rounded-xl p-3.5 border shadow-sm "+(isMe?"bg-blue-800/80 border-blue-400 text-white":"bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-slate-900"),children:[
              (0,s.jsxs)("div",{className:"flex items-center justify-between border-b pb-2 "+(isMe?"border-blue-600":"border-amber-200"),children:[
                (0,s.jsxs)("span",{className:"text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-500",children:["📋 NHIỆM VỤ GIAO VIỆC"]}),
                (0,s.jsx)("span",{className:"rounded-full px-2 py-0.5 text-[10px] font-bold "+(m.task.priority==="Khẩn cấp"?"bg-rose-500 text-white":m.task.priority==="Quan trọng"?"bg-amber-500 text-white":"bg-blue-500 text-white"),children:m.task.priority})
              ]}),
              (0,s.jsx)("div",{className:"mt-2 font-bold text-sm leading-snug",children:m.task.title}),
              (0,s.jsxs)("div",{className:"mt-1.5 space-y-1 text-[11px] opacity-90",children:[
                (0,s.jsxs)("div",{children:["👤 ",(0,s.jsx)("strong",{children:"Phụ trách:"})," ",m.task.assignedTo]}),
                (0,s.jsxs)("div",{children:["⏰ ",(0,s.jsx)("strong",{children:"Hạn hoàn thành:"})," ",m.task.deadline]}),
                m.task.notes && (0,s.jsxs)("div",{className:"italic text-[10px] opacity-80 pt-0.5",children:["💬 ",m.task.notes]}),
                (0,s.jsxs)("div",{className:"mt-1 font-semibold flex items-center gap-1.5",children:[
                  "Trạng thái: ",
                  (0,s.jsx)("span",{className:"rounded px-1.5 py-0.5 text-[10px] font-bold "+(m.task.status==="Đã hoàn thành"?"bg-emerald-500 text-white":m.task.status==="Đang làm"?"bg-blue-500 text-white":"bg-amber-500 text-white"),children:m.task.status})
                ]})
              ]}),
              (0,s.jsxs)("div",{className:"mt-3 flex items-center gap-2 border-t pt-2 flex-wrap "+(isMe?"border-blue-600":"border-amber-200"),children:[
                m.task.status!=="Đã hoàn thành" && (0,s.jsx)("button",{type:"button",onClick:()=>handleUpdateChatTaskStatus(m.id,"Đang làm"),className:"rounded-md bg-blue-600 text-white px-2.5 py-1 text-[10px] font-bold hover:bg-blue-700 transition",children:"Nhận việc"}),
                m.task.status!=="Đã hoàn thành" && (0,s.jsx)("button",{type:"button",onClick:()=>handleUpdateChatTaskStatus(m.id,"Đã hoàn thành"),className:"rounded-md bg-emerald-600 text-white px-2.5 py-1 text-[10px] font-bold hover:bg-emerald-700 transition",children:"✓ Báo cáo xong"}),
                (0,s.jsx)("button",{type:"button",onClick:()=>tT("notifications"),className:"rounded-md bg-slate-200 text-slate-800 px-2 py-1 text-[10px] font-bold hover:bg-slate-300 transition",children:"Mở tab Nhắc việc"})
              ]})
            ]})
          ]}),
          // Expiry notice below bubble
          (0,s.jsx)("div",{className:"mt-1 text-[9px] text-slate-400 px-1",children:"⏳ Tự hủy sau 14 ngày (bảo vệ bộ nhớ máy)"})
        ]})
      ]});
    })
  }),

  // 3. Attachment Preview Bar (if file selected)
  chatAttachment && (0,s.jsxs)("div",{className:"flex items-center justify-between border-t border-blue-200 bg-blue-50/90 px-4 py-2 text-xs",children:[
    (0,s.jsxs)("div",{className:"flex items-center gap-2",children:[
      (0,s.jsx)("span",{className:"text-lg",children:chatAttachment.type.startsWith("image/")?"🖼️":"📄"}),
      (0,s.jsxs)("div",{children:[
        (0,s.jsx)("div",{className:"font-bold text-slate-800",children:chatAttachment.name}),
        (0,s.jsxs)("div",{className:"text-[10px] text-slate-500",children:[(chatAttachment.size/1024).toFixed(1)," KB • Đã sẵn sàng gửi"]})
      ]})
    ]}),
    (0,s.jsx)("button",{type:"button",onClick:()=>setChatAttachment(null),className:"rounded-full bg-slate-200 p-1 text-slate-600 hover:bg-slate-300 text-xs",children:"✕"})
  ]}),

  // 4. Chat Input Toolbar
  (0,s.jsxs)("div",{className:"border-t border-slate-200 bg-white p-3",children:[
    (0,s.jsxs)("form",{onSubmit:e=>{
      e.preventDefault();
      if (!chatInputText.trim() && !chatAttachment) return;
      sendApsoChatMessage({
        text: chatInputText.trim(),
        file: chatAttachment
      });
      setChatInputText("");
      setChatAttachment(null);
    },className:"flex items-center gap-2",children:[
      // File Attachment Button
      (0,s.jsxs)("label",{className:"flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer active:scale-95 transition",title:"Đính kèm tệp tin (.pdf, .doc, .docx, .xlsx...)",children:[
        (0,s.jsx)("span",{className:"text-base",children:"📎"}),
        (0,s.jsx)("input",{type:"file",onChange:handleChatFileInput,className:"hidden",accept:".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg"})
      ]}),
      // Camera / Photo Button
      (0,s.jsxs)("label",{className:"flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer active:scale-95 transition",title:"Chụp / Gửi hình ảnh",children:[
        (0,s.jsx)("span",{className:"text-base",children:"📷"}),
        (0,s.jsx)("input",{type:"file",onChange:handleChatFileInput,className:"hidden",accept:"image/*"})
      ]}),
      // Quick Task Button
      (0,s.jsx)("button",{type:"button",onClick:()=>setTaskAssignModalOpen(!0),className:"flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 active:scale-95 transition font-bold",title:"Phân công nhiệm vụ",children:"⚡"}),
      // Input text field
      (0,s.jsx)("input",{type:"text",value:chatInputText,onChange:e=>setChatInputText(e.target.value),placeholder:"Nhập nội dung trao đổi tại Ấp Tạ Quang Tỷ...",className:"h-10 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"}),
      // Send button
      (0,s.jsx)("button",{type:"submit",disabled:!chatInputText.trim()&&!chatAttachment,className:"flex h-10 px-4 items-center justify-center rounded-full bg-blue-700 text-white hover:bg-blue-800 active:scale-95 transition shadow-sm font-bold text-xs disabled:opacity-40",children:"Gửi ✈"})
    ]})
  ]})
]}),
`;

if (!code.includes(overviewSectionAnchor)) {
  console.error("FAIL: overviewSectionAnchor not found");
  process.exit(1);
}
code = code.replace(overviewSectionAnchor, chatSectionJsx + overviewSectionAnchor);
console.log("[OK] Injected Chat View Section");

// ----------------------------------------------------
// 8. UPDATE ZALO MOBILE BOTTOM NAVIGATION
// ----------------------------------------------------
// Exact nav replacement
const navStart = '(0,s.jsxs)("nav",{className:"fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-slate-200/90 bg-white/95 px-1 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden"';
const navEndMarker = 'zaloHubOpen && (0,s.jsx)("div",{className:"fixed inset-0 z-50 bg-slate-950/60';

let navIdx = code.indexOf(navStart);
let navEndIdx = code.indexOf(navEndMarker);

if (navIdx === -1 || navEndIdx === -1) {
  console.error("FAIL: navStart or navEndMarker not found", navIdx, navEndIdx);
  process.exit(1);
}

const newBottomNav = `(0,s.jsxs)("nav",{className:"fixed bottom-0 inset-x-0 z-40 flex items-center justify-between border-t border-slate-200/90 bg-white/95 px-1 py-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md lg:hidden",style:{paddingBottom:"max(0.5rem, env(safe-area-inset-bottom, 0px))"},children:[
  // 1. CHAT TAB FIRST (trên app thì nên ở đầu tiên trước cả hộ khẩu)
  (0,s.jsxs)("button",{type:"button",onClick:()=>{tT("chat");setZaloHubOpen(!1)},className:"relative flex flex-1 flex-col items-center justify-center py-1 transition "+("chat"===tk?"text-blue-700 font-bold":"text-slate-500 hover:text-slate-800 font-medium"),children:[
    (0,s.jsx)("svg",{className:"h-5 w-5 mb-0.5 transition-transform "+("chat"===tk?"scale-110 text-blue-700":""),fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:"2",children:(0,s.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"})}),
    (0,s.jsx)("span",{className:"text-[10px] leading-tight",children:"Trò chuyện"})
  ]}),
  // 2. HỘ KHẨU
  (0,s.jsxs)("button",{type:"button",onClick:()=>{tT("households");setZaloHubOpen(!1)},className:"flex flex-1 flex-col items-center justify-center py-1 transition "+("households"===tk?"text-blue-700 font-bold":"text-slate-500 hover:text-slate-800 font-medium"),children:[(0,s.jsx)(o.A,{className:"h-5 w-5 mb-0.5 transition-transform "+("households"===tk?"scale-110 text-blue-700":"")}),(0,s.jsx)("span",{className:"text-[10px] leading-tight",children:"Hộ khẩu"})]}),
  // 3. NHÂN KHẨU
  (0,s.jsxs)("button",{type:"button",onClick:()=>{tT("residents");setZaloHubOpen(!1)},className:"flex flex-1 flex-col items-center justify-center py-1 transition "+("residents"===tk?"text-blue-700 font-bold":"text-slate-500 hover:text-slate-800 font-medium"),children:[(0,s.jsx)(d.A,{className:"h-5 w-5 mb-0.5 transition-transform "+("residents"===tk?"scale-110 text-blue-700":"")}),(0,s.jsx)("span",{className:"text-[10px] leading-tight",children:"Nhân khẩu"})]}),
  // 4. TỔNG QUAN (RAISED CENTER BUTTON)
  (0,s.jsxs)("button",{type:"button",onClick:()=>{tT("overview");setZaloHubOpen(!1)},className:"relative -top-3 flex flex-1 flex-col items-center justify-center transition active:scale-95",children:[(0,s.jsx)("div",{className:"flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-lg ring-4 ring-white transition "+("overview"===tk?"ring-blue-200 scale-105":""),children:(0,s.jsx)(u.A,{className:"h-5 w-5"})}),(0,s.jsx)("span",{className:"text-[10px] font-bold mt-0.5 "+("overview"===tk?"text-blue-700":"text-slate-600"),children:"Tổng quan"})]}),
  // 5. BẢN ĐỒ
  (0,s.jsxs)("button",{type:"button",onClick:()=>{tT("map");setZaloHubOpen(!1)},className:"flex flex-1 flex-col items-center justify-center py-1 transition "+("map"===tk?"text-blue-700 font-bold":"text-slate-500 hover:text-slate-800 font-medium"),children:[(0,s.jsx)(g.A,{className:"h-5 w-5 mb-0.5 transition-transform "+("map"===tk?"scale-110 text-blue-700":"")}),(0,s.jsx)("span",{className:"text-[10px] leading-tight",children:"Bản đồ"})]}),
  // 6. CÁ NHÂN & VIỆC (ZALO HUB)
  (0,s.jsxs)("button",{type:"button",onClick:()=>setZaloHubOpen(e=>!e),className:"flex flex-1 flex-col items-center justify-center py-1 transition "+(zaloHubOpen||["notifications","reports","admin"].includes(tk)?"text-blue-700 font-bold":"text-slate-500 hover:text-slate-800 font-medium"),children:[(0,s.jsx)(x.A,{className:"h-5 w-5 mb-0.5 transition-transform "+(zaloHubOpen||["notifications","reports","admin"].includes(tk)?"scale-110 text-blue-700":"")}),(0,s.jsx)("span",{className:"text-[10px] leading-tight",children:"Cá nhân & Việc"})]})
]}),\n\n`;

code = code.substring(0, navIdx) + newBottomNav + code.substring(navEndIdx);
console.log("[OK] Updated Bottom Nav: placed Chat as the FIRST tab before Hộ khẩu");

// ----------------------------------------------------
// 9. INJECT TASK MODAL & DRIVE MODAL
// ----------------------------------------------------
const otaDismissedAnchor = 'otaPendingUpdate&&!otaPendingUpdate.isCritical&&otaDismissedVer!==otaPendingUpdate.version';
let otaIdx = code.indexOf(otaDismissedAnchor);
if (otaIdx === -1) {
  console.error("FAIL: otaDismissedAnchor not found");
  process.exit(1);
}

// Find the end of this ota dismissal block
let otaEndMarker = 'children:"Cập nhật ngay"})]})]})})';
let otaEndIdx = code.indexOf(otaEndMarker, otaIdx);
if (otaEndIdx === -1) {
  console.error("FAIL: otaEndMarker not found");
  process.exit(1);
}
let insertPos = otaEndIdx + otaEndMarker.length;

const chatModalsJsx = `

// Task Assignment Modal
,taskAssignModalOpen && (0,s.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200",children:(0,s.jsxs)("div",{className:"w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4",children:[
  (0,s.jsxs)("div",{className:"flex items-center justify-between border-b pb-3",children:[
    (0,s.jsxs)("div",{className:"flex items-center gap-2",children:[
      (0,s.jsx)("span",{className:"text-xl",children:"⚡"}),
      (0,s.jsxs)("div",{children:[
        (0,s.jsx)("h3",{className:"font-bold text-slate-900 text-sm sm:text-base",children:"Phân công nhiệm vụ - Ấp Tạ Quang Tỷ"}),
        (0,s.jsx)("p",{className:"text-xs text-slate-500",children:"Nhiệm vụ sẽ gửi vào phòng chat và đồng bộ tab Thông báo nhắc việc"})
      ]})
    ]}),
    (0,s.jsx)("button",{type:"button",onClick:()=>setTaskAssignModalOpen(!1),className:"text-slate-400 hover:text-slate-600 text-lg",children:"✕"})
  ]}),
  (0,s.jsxs)("form",{onSubmit:handleCreateChatTask,className:"space-y-3.5 text-xs",children:[
    (0,s.jsxs)("label",{className:"block space-y-1 font-semibold text-slate-700",children:[
      "Tên nhiệm vụ / Nội dung cần làm *",
      (0,s.jsx)("input",{name:"title",required:!0,placeholder:"Ví dụ: Rà soát nhân khẩu mới chuyển đến Tổ 2",className:"h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"})
    ]}),
    (0,s.jsxs)("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[
      (0,s.jsxs)("label",{className:"block space-y-1 font-semibold text-slate-700",children:[
        "Cán bộ phụ trách *",
        (0,s.jsxs)("select",{name:"assignedTo",className:"h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500",children:[
          (0,s.jsx)("option",{value:"Toàn thể cán bộ",children:"-- Toàn thể cán bộ ấp --"}),
          (0,s.jsx)("option",{value:"Tổ trưởng Bảo vệ ANTT",children:"Tổ trưởng Bảo vệ ANTT (Tạ Quang Tỷ)"}),
          (0,s.jsx)("option",{value:"Trưởng ấp",children:"Trưởng ấp (Tạ Quang Tỷ)"}),
          (0,s.jsx)("option",{value:"Phó Trưởng ấp",children:"Phó Trưởng ấp (Tạ Quang Tỷ)"}),
          (0,s.jsx)("option",{value:"Bí thư Chi bộ",children:"Bí thư Chi bộ"}),
          (0,s.jsx)("option",{value:"Ấp đội trưởng",children:"Ấp đội trưởng"}),
          (0,s.jsx)("option",{value:"Trưởng ban Công tác Mặt trận",children:"Trưởng ban Công tác Mặt trận"}),
          (0,s.jsx)("option",{value:"Chi hội trưởng Nông dân",children:"Chi hội trưởng Nông dân"}),
          (0,s.jsx)("option",{value:"Chi hội trưởng Phụ nữ",children:"Chi hội trưởng Phụ nữ"}),
          (0,s.jsx)("option",{value:"Bí thư Chi đoàn",children:"Bí thư Chi đoàn"}),
          (0,s.jsx)("option",{value:"Tổ viên ANTT Tổ 1",children:"Tổ viên ANTT Tổ 1"}),
          (0,s.jsx)("option",{value:"Tổ viên ANTT Tổ 2",children:"Tổ viên ANTT Tổ 2"}),
          (0,s.jsx)("option",{value:"Tổ viên ANTT Tổ 3",children:"Tổ viên ANTT Tổ 3"})
        ]})
      ]}),
      (0,s.jsxs)("label",{className:"block space-y-1 font-semibold text-slate-700",children:[
        "Mức độ ưu tiên",
        (0,s.jsxs)("select",{name:"priority",defaultValue:"Bình thường",className:"h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500",children:[
          (0,s.jsx)("option",{value:"Bình thường",children:"Bình thường"}),
          (0,s.jsx)("option",{value:"Quan trọng",children:"Quan trọng (Nhắc việc định kỳ)"}),
          (0,s.jsx)("option",{value:"Khẩn cấp",children:"Khẩn cấp (Ưu tiên xử lý ngay)"})
        ]})
      ]})
    ]}),
    (0,s.jsxs)("label",{className:"block space-y-1 font-semibold text-slate-700",children:[
      "Hạn hoàn thành (Deadline)",
      (0,s.jsx)("input",{name:"deadline",type:"date",defaultValue:new Date(Date.now()+86400000*3).toISOString().slice(0,10),className:"h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500"})
    ]}),
    (0,s.jsxs)("label",{className:"block space-y-1 font-semibold text-slate-700",children:[
      "Lời dặn / Yêu cầu chi tiết",
      (0,s.jsx)("textarea",{name:"notes",rows:2,placeholder:"Nội dung cần lưu ý trong quá trình thực hiện...",className:"w-full rounded-lg border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-500"})
    ]}),
    (0,s.jsxs)("div",{className:"flex items-center justify-end gap-2 pt-2",children:[
      (0,s.jsx)("button",{type:"button",onClick:()=>setTaskAssignModalOpen(!1),className:"rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 transition",children:"Hủy"}),
      (0,s.jsx)("button",{type:"submit",className:"rounded-lg bg-blue-700 px-5 py-2 font-bold text-white shadow-sm hover:bg-blue-800 active:scale-95 transition",children:"Giao nhiệm vụ ngay"})
    ]})
  ]})
]})}),

// Google Drive Helper Modal (15GB Free)
driveHelperModalOpen && (0,s.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200",children:(0,s.jsxs)("div",{className:"w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4",children:[
  (0,s.jsxs)("div",{className:"flex items-start gap-3",children:[
    (0,s.jsx)("div",{className:"flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-2xl shadow-xs",children:"💾"}),
    (0,s.jsxs)("div",{className:"min-w-0 flex-1",children:[
      (0,s.jsx)("h3",{className:"font-bold text-slate-900 text-base",children:"Kho lưu trữ Google Drive (15GB)"}),
      (0,s.jsx)("p",{className:"text-xs text-slate-500",children:"Lưu trữ hồ sơ, văn bản hành chính lâu dài không bị dọn sau 14 ngày."})
    ]})
  ]}),
  activeDriveFile ? (0,s.jsxs)("div",{className:"rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-1",children:[
    (0,s.jsxs)("div",{className:"font-bold text-slate-800 truncate",children:["Tệp: ",activeDriveFile.name]}),
    (0,s.jsxs)("div",{className:"text-slate-500",children:["Dung lượng: ",(activeDriveFile.size/1024).toFixed(1)," KB"]})
  ]}): (0,s.jsx)("div",{className:"rounded-xl bg-blue-50/70 p-3 border border-blue-200 text-xs text-blue-900",children:"💡 Thư mục Google Drive trực tuyến giúp Ấp Tạ Quang Tỷ lưu trữ văn bản chỉ đạo, báo cáo A4 và hồ sơ cư dân vĩnh viễn với 15GB miễn phí."}),
  (0,s.jsxs)("div",{className:"flex flex-col gap-2 pt-1",children:[
    activeDriveFile && (0,s.jsxs)("button",{type:"button",onClick:()=>downloadLocalFile(activeDriveFile),className:"w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-98 transition flex items-center justify-center gap-1.5",children:[
      (0,s.jsx)("span",{children:"⬇"}),
      "Tải tệp tin về máy trước"
    ]}),
    (0,s.jsxs)("button",{type:"button",onClick:()=>{
      window.open("https://drive.google.com/drive/u/0/my-drive","_blank");
      setDriveHelperModalOpen(!1);
    },className:"w-full rounded-xl bg-blue-700 py-3 text-xs font-bold text-white shadow-md hover:bg-blue-800 active:scale-98 transition flex items-center justify-center gap-2",children:[
      (0,s.jsx)("span",{className:"text-sm",children:"↗"}),
      "Mở Google Drive để tải lên thư mục 15GB"
    ]}),
    (0,s.jsx)("button",{type:"button",onClick:()=>setDriveHelperModalOpen(!1),className:"w-full rounded-lg py-1.5 text-xs text-slate-500 hover:text-slate-700 transition",children:"Đóng cửa sổ"})
  ]})
]})}),

// Image Preview Lightbox Modal
previewImageModal && (0,s.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-150",onClick:()=>setPreviewImageModal(null),children:(0,s.jsxs)("div",{className:"relative max-w-4xl max-h-[90vh] overflow-hidden",onClick:e=>e.stopPropagation(),children:[
  (0,s.jsx)("img",{src:previewImageModal,alt:"Ảnh xem trước",className:"max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl"}),
  (0,s.jsx)("button",{type:"button",onClick:()=>setPreviewImageModal(null),className:"absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition font-bold",children:"✕"})
]})})
`;

code = code.substring(0, insertPos) + chatModalsJsx + code.substring(insertPos);
console.log("[OK] Injected Task Assignment Modal, Google Drive 15GB Helper, and Image Lightbox Modal");

// ----------------------------------------------------
// SAVE UPDATED MASTER BUNDLE
// ----------------------------------------------------
fs.writeFileSync(masterFile, code, "utf8");
console.log(`[SUCCESS] Master bundle successfully upgraded: ${masterFile} (${Buffer.byteLength(code, "utf8")} bytes)`);
