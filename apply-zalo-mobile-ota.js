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

let code = fs.readFileSync(masterFile, "utf8");
console.log("Original master length:", code.length);

// 1. Injects state variables in tv()
const stateAnchor = '[zzMapTarget,setZzMapTarget]=(0,a.useState)(null),';
const newStates = `[zzMapTarget,setZzMapTarget]=(0,a.useState)(null),[zaloHubOpen,setZaloHubOpen]=(0,a.useState)(!1),[quickAddOpen,setQuickAddOpen]=(0,a.useState)(!1),[otaConfig,setOtaConfig]=(0,a.useState)({version:"2.1.0",isCritical:!1,releaseNotes:"Nâng cấp giao diện chuẩn Zalo & Tối ưu hệ thống.",releasedAt:new Date().toISOString(),releasedBy:"Admin"}),[otaPendingUpdate,setOtaPendingUpdate]=(0,a.useState)(null),[otaDismissedVer,setOtaDismissedVer]=(0,a.useState)(""),`;

if (!code.includes(stateAnchor)) {
  console.error("FAIL: stateAnchor not found");
  process.exit(1);
}
code = code.replace(stateAnchor, newStates);
console.log("[OK] Injected Zalo & OTA states into tv()");

// 2. Injects OTA check and handler functions right before `async function zzUpdateUserAccess`
const helperAnchor = 'async function zzUpdateUserAccess';
const otaFunctions = `
const APSO_APP_VERSION = "2.1.0";
async function applyOtaUpdate() {
  try {
    if ("caches" in window) {
      let keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if (navigator.serviceWorker) {
      let regs = await navigator.serviceWorker.getRegistrations();
      for (let r of regs) await r.update();
    }
  } catch(e) {
    console.warn("Lỗi làm mới cache:", e);
  }
  let url = new URL(window.location.href);
  url.searchParams.set("ota", String(Date.now()));
  window.location.replace(url.toString());
}
async function checkOtaUpdate(manual) {
  try {
    let { firestore } = eh();
    let serverData = null;
    if (firestore) {
      let snap = await (0, eo.x7)((0, eo.H9)(firestore, "apsoConfig", "otaVersion"));
      if (snap.exists()) serverData = snap.data();
    }
    if (!serverData) {
      let localOta = window.localStorage.getItem("apso-ota-config");
      if (localOta) serverData = JSON.parse(localOta);
    }
    if (serverData && serverData.version) {
      setOtaConfig(serverData);
      if (serverData.version !== APSO_APP_VERSION) {
        setOtaPendingUpdate(serverData);
        return;
      }
    }
    if (manual) {
      alert("Ứng dụng đang hoạt động ở phiên bản mới nhất: v" + APSO_APP_VERSION);
    }
  } catch(err) {
    console.warn("Lỗi kiểm tra OTA:", err);
    if (manual) alert("Không thể kiểm tra bản cập nhật lúc này.");
  }
}
async function publishOtaVersion(e) {
  e.preventDefault();
  if (!sP) return;
  let fd = new FormData(e.currentTarget);
  let newVer = String(fd.get("version") || "").trim();
  let updateType = String(fd.get("updateType") || "minor");
  let notes = String(fd.get("releaseNotes") || "").trim();
  if (!newVer) return alert("Vui lòng nhập số phiên bản!");
  let isCritical = updateType === "major";
  let payload = {
    version: newVer,
    isCritical: isCritical,
    releaseNotes: notes || ("Cập nhật phiên bản " + newVer),
    releasedAt: new Date().toISOString(),
    releasedBy: (tL && tL.name) || "Admin"
  };
  try {
    let { firestore } = eh();
    if (firestore) {
      await (0, eo.BN)((0, eo.H9)(firestore, "apsoConfig", "otaVersion"), payload, { merge: true });
    }
    window.localStorage.setItem("apso-ota-config", JSON.stringify(payload));
    setOtaConfig(payload);
    sJ("OTA_PUBLISH", newVer, "Phát hành bản cập nhật OTA v" + newVer + " (" + (isCritical ? "Cập nhật lớn/bắt buộc" : "Cập nhật thường") + ")");
    alert("Đã phát hành bản cập nhật v" + newVer + " thành công qua máy chủ OTA!");
    if (newVer !== APSO_APP_VERSION) {
      setOtaPendingUpdate(payload);
    }
  } catch(err) {
    alert("Lỗi khi phát hành OTA: " + (err instanceof Error ? err.message : String(err)));
  }
}
`;

if (!code.includes(helperAnchor)) {
  console.error("FAIL: helperAnchor not found");
  process.exit(1);
}
code = code.replace(helperAnchor, otaFunctions + "\n" + helperAnchor);
console.log("[OK] Injected OTA helper functions");

// 3. Injects OTA check on mount
const mountAnchor = 'sh(!0);return}try{';
const otaMountCheck = 'sh(!0);return}try{checkOtaUpdate(!1);';
if (code.includes(mountAnchor)) {
  code = code.replace(mountAnchor, otaMountCheck);
  console.log("[OK] Injected OTA auto check on boot");
}

// 4. Injects OTA Admin Card in Admin Tab
const targetBackupStr = 'children:[(0,s.jsxs)("div",{className:"space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4",children:[(0,s.jsx)("h3",{className:"font-bold text-slate-950",children:"Sao lưu & Khôi phục dữ liệu"';
const otaAdminCardJsx = `children:[(0,s.jsxs)("div",{className:"space-y-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 p-5 shadow-sm",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between border-b border-indigo-100 pb-3",children:[(0,s.jsxs)("div",{className:"flex items-center gap-2.5",children:[(0,s.jsx)("span",{className:"text-2xl",children:"🚀"}),(0,s.jsxs)("div",{children:[(0,s.jsx)("h3",{className:"font-bold text-slate-950 text-base",children:"Quản lý phiên bản & Cập nhật Over-The-Air (OTA)"}),(0,s.jsx)("p",{className:"text-xs text-slate-500",children:"Phát hành cập nhật trực tiếp từ máy chủ riêng không cần qua Google Play / Ch Play."})]})]}),(0,s.jsxs)("div",{className:"rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800 border border-indigo-200",children:["Đang chạy: v",APSO_APP_VERSION]})]}),(0,s.jsxs)("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs",children:[(0,s.jsxs)("div",{className:"rounded-lg bg-white p-3 border border-indigo-100",children:[(0,s.jsx)("div",{className:"font-medium text-slate-400",children:"Phiên bản Cloud mới nhất"}),(0,s.jsxs)("div",{className:"mt-1 font-bold text-sm text-indigo-950",children:["v",otaConfig.version]}),(0,s.jsx)("div",{className:"mt-0.5 text-[11px] font-semibold "+(otaConfig.isCritical?"text-rose-600":"text-emerald-600"),children:otaConfig.isCritical?"Bắt buộc cập nhật":"Tùy chọn"})]}),(0,s.jsxs)("div",{className:"rounded-lg bg-white p-3 border border-indigo-100",children:[(0,s.jsx)("div",{className:"font-medium text-slate-400",children:"Thời điểm phát hành"}),(0,s.jsx)("div",{className:"mt-1 font-bold text-sm text-slate-800",children:otaConfig.releasedAt?new Date(otaConfig.releasedAt).toLocaleString("vi-VN"):"Chưa ghi nhận"}),(0,s.jsxs)("div",{className:"mt-0.5 text-[11px] text-slate-500 truncate",children:["Bởi: ",otaConfig.releasedBy||"Admin"]})]}),(0,s.jsxs)("div",{className:"rounded-lg bg-white p-3 border border-indigo-100",children:[(0,s.jsx)("div",{className:"font-medium text-slate-400",children:"Ghi chú phiên bản"}),(0,s.jsx)("div",{className:"mt-1 font-medium text-slate-700 line-clamp-2",children:otaConfig.releaseNotes||"Bản cập nhật tối ưu hệ thống"})]})]}),(0,s.jsxs)("form",{onSubmit:publishOtaVersion,className:"space-y-3 rounded-lg bg-white p-4 border border-indigo-100",children:[(0,s.jsx)("div",{className:"text-xs font-bold text-slate-800 uppercase tracking-wide",children:"Phát hành phiên bản OTA mới:"}),(0,s.jsxs)("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[(0,s.jsxs)("label",{className:"block space-y-1 text-xs font-semibold text-slate-700",children:["Số phiên bản mới (Semver):",(0,s.jsx)("input",{name:"version",required:!0,placeholder:"Ví dụ: 2.1.1 hoặc 2.2.0",defaultValue:"2.1.1",className:"h-9 w-full rounded-md border border-slate-200 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-100"})]}),(0,s.jsxs)("label",{className:"block space-y-1 text-xs font-semibold text-slate-700",children:["Loại cập nhật:",(0,s.jsxs)("select",{name:"updateType",defaultValue:"minor",className:"h-9 w-full rounded-md border border-slate-200 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-100",children:[(0,s.jsx)("option",{value:"minor",children:"Cập nhật thường (Hỏi người dùng có muốn cập nhật không)"}),(0,s.jsx)("option",{value:"major",children:"Cập nhật lớn (Bắt buộc cập nhật ngay, làm mới cache tránh xung đột)"})]})]})]}),(0,s.jsxs)("label",{className:"block space-y-1 text-xs font-semibold text-slate-700",children:["Nội dung bản cập nhật (Hiển thị cho người dùng):",(0,s.jsx)("textarea",{name:"releaseNotes",rows:2,required:!0,placeholder:"Mô tả tóm tắt tính năng mới hoặc tối ưu hóa...",defaultValue:"Nâng cấp giao diện chuẩn Zalo & Tối ưu hiệu năng.",className:"w-full rounded-md border border-slate-200 p-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100"})]}),(0,s.jsxs)("div",{className:"flex items-center justify-between gap-3 pt-1",children:[(0,s.jsx)("p",{className:"text-[11px] text-slate-500",children:"💡 Khi phát hành, máy chủ sẽ tự thông báo đến tất cả các máy cài app."}),(0,s.jsx)("button",{type:"submit",className:"rounded-lg bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-800 active:scale-95 transition",children:"🚀 Phát hành OTA ngay"})]})]})]}),(0,s.jsxs)("div",{className:"space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4",children:[(0,s.jsx)("h3",{className:"font-bold text-slate-950",children:"Sao lưu & Khôi phục dữ liệu"`;

if (code.includes(targetBackupStr)) {
  code = code.replace(targetBackupStr, otaAdminCardJsx);
  console.log("[OK] Injected OTA Admin management card into admin tab");
} else {
  console.error("FAIL: targetBackupStr not found");
  process.exit(1);
}

// 5. Replace Old Mobile Header & Tab bar with Zalo Top Bar and adjust layout
const oldHeaderOpening = '(0,s.jsx)("header",{className:"sticky top-0 z-30 border-b border-blue-100 bg-white/90 px-3 py-2 shadow-sm backdrop-blur md:px-8 md:py-3"';
const newDesktopHeaderOpening = '(0,s.jsx)("header",{className:"sticky top-0 z-30 hidden border-b border-blue-100 bg-white/90 px-3 py-2 shadow-sm backdrop-blur md:px-8 md:py-3 lg:block"';

if (!code.includes(oldHeaderOpening)) {
  console.error("FAIL: oldHeaderOpening not found");
  process.exit(1);
}
code = code.replace(oldHeaderOpening, newDesktopHeaderOpening);
console.log("[OK] Scoped desktop header to lg:block");

const oldTabBar = '(0,s.jsx)("div",{className:"flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 lg:hidden",children:a0.map(e=>("admin"!==e.id||sP)&&("notifications"!==e.id||sG)?(0,s.jsxs)("button",{type:"button",onClick:()=>tT(e.id),className:"flex min-w-max shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ".concat(tk===e.id?"bg-blue-700 text-white":"bg-blue-50 text-blue-700"),children:[(0,s.jsx)(e.icon,{className:"h-4 w-4"}),e.label]},e.id):null)}),';

const zaloMobileTopHeader = `(0,s.jsxs)("header",{className:"sticky top-0 z-30 border-b border-blue-600/30 bg-gradient-to-r from-[#0068ff] via-[#0052cc] to-[#004bb5] px-3 py-2 text-white shadow-md lg:hidden",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between gap-2",children:[(0,s.jsxs)("button",{type:"button",onClick:()=>setZaloHubOpen(!0),className:"relative shrink-0 flex items-center gap-1.5 focus:outline-none",title:"Hồ sơ cán bộ & Nghiệp vụ",children:[(0,s.jsx)("img",{src:"/cong-dan-so-logo.svg",alt:"APSO",className:"h-9 w-9 rounded-full bg-white/10 p-0.5 ring-2 ring-white/50 shadow-sm"}),(0,s.jsx)("span",{className:"absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white "+(sx?"bg-emerald-400":"bg-amber-400")})]}),(0,s.jsxs)("div",{className:"relative flex flex-1 items-center",children:[(0,s.jsx)(b.A,{className:"absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70"}),(0,s.jsx)("input",{type:"text",value:W,onChange:e=>G(e.target.value),placeholder:"Tìm dân cư, CCCD, hộ...",className:"h-9 w-full rounded-full border border-white/20 bg-white/20 pl-9 pr-8 text-xs text-white placeholder-white/70 outline-none transition focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 focus:ring-2 focus:ring-white/40"}),W&&(0,s.jsx)("button",{type:"button",onClick:()=>G(""),className:"absolute right-2.5 top-1/2 -translate-y-1/2 text-white/80 hover:text-white focus:outline-none text-xs",children:"✕"})]}),(0,s.jsxs)("div",{className:"flex items-center gap-1 shrink-0",children:[(0,s.jsx)("button",{type:"button",onClick:()=>{nq("");nX(null);nB(!0)},title:"Quét mã CCCD/QR",className:"flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white active:scale-95 transition",children:(0,s.jsx)("span",{className:"text-base leading-none",children:"📷"})}),(0,s.jsx)("button",{type:"button",onClick:()=>setQuickAddOpen(e=>!e),title:"Thêm mới",className:"flex h-9 w-9 items-center justify-center rounded-full bg-white text-blue-700 hover:bg-blue-50 active:scale-95 transition shadow-sm font-bold",children:(0,s.jsx)(j.A,{className:"h-4 w-4 stroke-[2.5]"})}),(0,s.jsxs)("button",{type:"button",onClick:()=>tT("notifications"),title:"Thông báo nhắc việc",className:"relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white active:scale-95 transition",children:[(0,s.jsx)(c.A,{className:"h-4 w-4"}),at.open>0&&(0,s.jsx)("span",{className:"absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-blue-700 shadow-sm animate-pulse",children:at.open>99?"99+":at.open})]})]})]})]}),`;

if (!code.includes(oldTabBar)) {
  console.error("FAIL: oldTabBar not found");
  process.exit(1);
}
code = code.replace(oldTabBar, zaloMobileTopHeader);
console.log("[OK] Injected Zalo Top Mobile Header");

// 6. Give main container bottom padding on mobile: pb-28 lg:pb-8
const oldMainPadding = '(0,s.jsxs)("div",{className:"mx-auto flex w-full max-w-[1480px] flex-1 flex-col space-y-6 p-4 md:p-6 xl:p-8"';
const newMainPadding = '(0,s.jsxs)("div",{className:"mx-auto flex w-full max-w-[1480px] flex-1 flex-col space-y-6 p-4 pb-28 md:p-6 lg:pb-8 xl:p-8"';
if (code.includes(oldMainPadding)) {
  code = code.replace(oldMainPadding, newMainPadding);
  console.log("[OK] Updated main content bottom clearance for mobile nav bar");
}

// 7. Inject Zalo Bottom Navigation Bar, Quick Add popover, Zalo Hub Action Sheet, and OTA Modals right after last modal
const lastModalEnd = 'Kh\\xf4ng c\\xf3 dữ liệu ph\\xf9 hợp điều kiện đ\\xe3 chọn."})]})]})})';
if (!code.includes(lastModalEnd)) {
  console.error("FAIL: lastModalEnd not found");
  process.exit(1);
}

const zaloBottomNavAndModals = `
,quickAddOpen && (0,s.jsx)("div",{className:"fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-end p-3 pt-14 lg:hidden",onClick:()=>setQuickAddOpen(!1),children:(0,s.jsxs)("div",{className:"w-64 rounded-2xl bg-white p-2 shadow-2xl border border-slate-100 animate-in fade-in duration-150",onClick:e=>e.stopPropagation(),children:[(0,s.jsx)("div",{className:"px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100",children:"Tạo nhanh hồ sơ"}),(0,s.jsxs)("button",{type:"button",onClick:()=>{setQuickAddOpen(!1);tX(!0)},disabled:!sq,className:"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition disabled:opacity-40",children:[(0,s.jsx)("span",{className:"flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700",children:(0,s.jsx)(d.A,{className:"h-4 w-4"})}),(0,s.jsxs)("div",{children:[(0,s.jsx)("div",{className:"font-bold",children:"Thêm nhân khẩu"}),(0,s.jsx)("div",{className:"text-[10px] text-slate-400",children:"Nhập vào hộ đang có"})]})]}),(0,s.jsxs)("button",{type:"button",onClick:()=>{setQuickAddOpen(!1);nh("");nH("");nJ(null);nE("");nM("");ny("");nR(!1);tG(!0)},disabled:!sX,className:"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition disabled:opacity-40",children:[(0,s.jsx)("span",{className:"flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700",children:(0,s.jsx)(o.A,{className:"h-4 w-4"})}),(0,s.jsxs)("div",{children:[(0,s.jsx)("div",{className:"font-bold",children:"Lập hộ khẩu mới"}),(0,s.jsx)("div",{className:"text-[10px] text-slate-400",children:"Tách hộ hoặc tạo hộ mới"})]})]}),(0,s.jsxs)("button",{type:"button",onClick:()=>{setQuickAddOpen(!1);tZ(!0)},disabled:!sW,className:"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition disabled:opacity-40",children:[(0,s.jsx)("span",{className:"flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700",children:(0,s.jsx)(c.A,{className:"h-4 w-4"})}),(0,s.jsxs)("div",{children:[(0,s.jsx)("div",{className:"font-bold",children:"Tạo việc / Nhắc việc"}),(0,s.jsx)("div",{className:"text-[10px] text-slate-400",children:"Giao việc cho cán bộ"})]})]})]})}),

(0,s.jsxs)("nav",{className:"fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-slate-200/90 bg-white/95 px-1 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden",style:{paddingBottom:"max(0.375rem, env(safe-area-inset-bottom))"},children:[
  (0,s.jsxs)("button",{type:"button",onClick:()=>{tT("households");setZaloHubOpen(!1)},className:"flex flex-1 flex-col items-center justify-center py-1 transition "+("households"===tk?"text-blue-700 font-bold":"text-slate-500 hover:text-slate-800 font-medium"),children:[(0,s.jsx)(o.A,{className:"h-5 w-5 mb-0.5 transition-transform "+("households"===tk?"scale-110 text-blue-700":"")}),(0,s.jsx)("span",{className:"text-[11px] leading-tight",children:"Hộ khẩu"})]}),
  (0,s.jsxs)("button",{type:"button",onClick:()=>{tT("residents");setZaloHubOpen(!1)},className:"flex flex-1 flex-col items-center justify-center py-1 transition "+("residents"===tk?"text-blue-700 font-bold":"text-slate-500 hover:text-slate-800 font-medium"),children:[(0,s.jsx)(d.A,{className:"h-5 w-5 mb-0.5 transition-transform "+("residents"===tk?"scale-110 text-blue-700":"")}),(0,s.jsx)("span",{className:"text-[11px] leading-tight",children:"Nhân khẩu"})]}),
  (0,s.jsxs)("button",{type:"button",onClick:()=>{tT("overview");setZaloHubOpen(!1)},className:"relative -top-3 flex flex-1 flex-col items-center justify-center transition active:scale-95",children:[(0,s.jsx)("div",{className:"flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-lg ring-4 ring-white transition "+("overview"===tk?"ring-blue-200 scale-105":""),children:(0,s.jsx)(u.A,{className:"h-6 w-6"})}),(0,s.jsx)("span",{className:"text-[10px] font-bold mt-0.5 "+("overview"===tk?"text-blue-700":"text-slate-600"),children:"Tổng quan"})]}),
  (0,s.jsxs)("button",{type:"button",onClick:()=>{tT("map");setZaloHubOpen(!1)},className:"flex flex-1 flex-col items-center justify-center py-1 transition "+("map"===tk?"text-blue-700 font-bold":"text-slate-500 hover:text-slate-800 font-medium"),children:[(0,s.jsx)(g.A,{className:"h-5 w-5 mb-0.5 transition-transform "+("map"===tk?"scale-110 text-blue-700":"")}),(0,s.jsx)("span",{className:"text-[11px] leading-tight",children:"Bản đồ"})]}),
  (0,s.jsxs)("button",{type:"button",onClick:()=>setZaloHubOpen(e=>!e),className:"flex flex-1 flex-col items-center justify-center py-1 transition "+(zaloHubOpen||["notifications","reports","admin"].includes(tk)?"text-blue-700 font-bold":"text-slate-500 hover:text-slate-800 font-medium"),children:[(0,s.jsx)(x.A,{className:"h-5 w-5 mb-0.5 transition-transform "+(zaloHubOpen||["notifications","reports","admin"].includes(tk)?"scale-110 text-blue-700":"")}),(0,s.jsx)("span",{className:"text-[11px] leading-tight",children:"Cá nhân & Việc"})]})
]}),

zaloHubOpen && (0,s.jsx)("div",{className:"fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end justify-center lg:hidden",onClick:()=>setZaloHubOpen(!1),children:(0,s.jsxs)("div",{className:"w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200",onClick:e=>e.stopPropagation(),children:[(0,s.jsx)("div",{className:"mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300"}),(0,s.jsxs)("div",{className:"flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-4 text-white shadow-md",children:[(0,s.jsx)("img",{src:"/cong-dan-so-logo.svg",alt:"APSO",className:"h-12 w-12 rounded-full bg-white/10 p-1 ring-2 ring-white/40"}),(0,s.jsxs)("div",{className:"min-w-0 flex-1",children:[(0,s.jsx)("div",{className:"font-bold text-base truncate",children:tL.name}),(0,s.jsx)("div",{className:"text-xs text-blue-200",children:S[tL.role]||tL.role}),(0,s.jsxs)("div",{className:"mt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-300",children:[(0,s.jsx)("span",{className:"h-2 w-2 rounded-full "+(sx?"bg-emerald-400":"bg-amber-400")}),sx?"Đã kết nối Firebase Cloud":"Chế độ ngoại tuyến (Local)"]})]})]}),(0,s.jsxs)("div",{className:"mt-4 grid grid-cols-2 gap-2.5",children:[(0,s.jsxs)("button",{type:"button",onClick:()=>{tT("reports");setZaloHubOpen(!1)},className:"flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-blue-50 hover:border-blue-300 transition",children:[(0,s.jsx)("div",{className:"flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-lg",children:"📊"}),(0,s.jsxs)("div",{children:[(0,s.jsx)("div",{className:"text-xs font-bold text-slate-800",children:"Báo cáo & Phân tích"}),(0,s.jsx)("div",{className:"text-[10px] text-slate-500",children:"Biểu mẫu A4, NVQS"})]})]}),(0,s.jsxs)("button",{type:"button",onClick:()=>{tT("notifications");setZaloHubOpen(!1)},className:"flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-blue-50 hover:border-blue-300 transition",children:[(0,s.jsx)("div",{className:"flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-lg",children:"🔔"}),(0,s.jsxs)("div",{children:[(0,s.jsx)("div",{className:"text-xs font-bold text-slate-800",children:"Thông báo nhắc việc"}),(0,s.jsxs)("div",{className:"text-[10px] text-slate-500",children:[at.open," việc cần làm"]})]})]}),sP&&(0,s.jsxs)("button",{type:"button",onClick:()=>{tT("admin");setZaloHubOpen(!1)},className:"flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-left hover:bg-blue-100 transition",children:[(0,s.jsx)("div",{className:"flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white text-lg",children:"🛡️"}),(0,s.jsxs)("div",{children:[(0,s.jsx)("div",{className:"text-xs font-bold text-blue-950",children:"Quản trị & Phân quyền"}),(0,s.jsx)("div",{className:"text-[10px] text-blue-700",children:"Tài khoản & Cập nhật OTA"})]})]}),(0,s.jsxs)("button",{type:"button",onClick:()=>{checkOtaUpdate(!0);setZaloHubOpen(!1)},className:"flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-left hover:bg-emerald-100 transition",children:[(0,s.jsx)("div",{className:"flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white text-lg",children:"🚀"}),(0,s.jsxs)("div",{children:[(0,s.jsx)("div",{className:"text-xs font-bold text-emerald-950",children:"Kiểm tra cập nhật OTA"}),(0,s.jsxs)("div",{className:"text-[10px] text-emerald-700",children:["Phiên bản v",APSO_APP_VERSION]})]})]}),(0,s.jsxs)("button",{type:"button",onClick:()=>{setPasswordError("");setPasswordDialog({mode:"self"});setZaloHubOpen(!1)},className:"flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-slate-100 transition",children:[(0,s.jsx)("div",{className:"flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-700 text-lg",children:"🔑"}),(0,s.jsxs)("div",{children:[(0,s.jsx)("div",{className:"text-xs font-bold text-slate-800",children:"Đổi mật khẩu"}),(0,s.jsx)("div",{className:"text-[10px] text-slate-500",children:"Bảo mật tài khoản"})]})]}),(0,s.jsxs)("button",{type:"button",onClick:()=>{setZaloHubOpen(!1);aB()},className:"flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-left hover:bg-rose-100 transition",children:[(0,s.jsx)("div",{className:"flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white text-lg",children:"🚪"}),(0,s.jsxs)("div",{children:[(0,s.jsx)("div",{className:"text-xs font-bold text-rose-950",children:"Đăng xuất"}),(0,s.jsx)("div",{className:"text-[10px] text-rose-700",children:"Thoát phiên làm việc"})]})]})]}),(0,s.jsx)("button",{type:"button",onClick:()=>setZaloHubOpen(!1),className:"mt-4 w-full rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-98 transition",children:"Đóng danh mục"})]})}),

otaPendingUpdate&&otaPendingUpdate.isCritical&&(0,s.jsx)("div",{className:"fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200",children:(0,s.jsxs)("div",{className:"w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center space-y-4",children:[(0,s.jsx)("div",{className:"mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-3xl shadow-lg",children:"⚡"}),(0,s.jsxs)("div",{children:[(0,s.jsxs)("h3",{className:"text-lg font-bold text-slate-900",children:["Bản cập nhật quan trọng (v",otaPendingUpdate.version,")"]}),(0,s.jsx)("p",{className:"mt-1 text-xs text-rose-600 font-semibold",children:"Bắt buộc cập nhật để tránh xung đột dữ liệu & lỗi ứng dụng"}),(0,s.jsx)("p",{className:"mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 text-left",children:otaPendingUpdate.releaseNotes||"Phiên bản mới với nhiều nâng cấp tính năng và giao diện."})]}),(0,s.jsx)("button",{type:"button",onClick:applyOtaUpdate,className:"w-full rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 py-3 text-sm font-bold text-white shadow-lg hover:from-blue-800 hover:to-indigo-800 active:scale-98 transition",children:"Cập nhật & Tối ưu ngay"})]})}),

otaPendingUpdate&&!otaPendingUpdate.isCritical&&otaDismissedVer!==otaPendingUpdate.version&&(0,s.jsx)("div",{className:"fixed bottom-20 left-4 right-4 z-40 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md animate-in slide-in-from-bottom duration-300",children:(0,s.jsxs)("div",{className:"rounded-2xl border border-blue-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md",children:[(0,s.jsxs)("div",{className:"flex items-start gap-3",children:[(0,s.jsx)("div",{className:"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-xl",children:"✨"}),(0,s.jsxs)("div",{className:"min-w-0 flex-1",children:[(0,s.jsxs)("h4",{className:"text-xs font-bold text-slate-900",children:["Đã có phiên bản mới: v",otaPendingUpdate.version]}),(0,s.jsx)("p",{className:"mt-0.5 text-[11px] text-slate-500 line-clamp-2",children:otaPendingUpdate.releaseNotes||"Nâng cấp tính năng mới và cải thiện độ ổn định."})]})]}),(0,s.jsxs)("div",{className:"mt-3 flex items-center justify-end gap-2",children:[(0,s.jsx)("button",{type:"button",onClick:()=>setOtaDismissedVer(otaPendingUpdate.version),className:"rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition",children:"Để sau"}),(0,s.jsx)("button",{type:"button",onClick:applyOtaUpdate,className:"rounded-lg bg-blue-700 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-800 active:scale-95 transition",children:"Cập nhật ngay"})]})]})})
`;

code = code.replace(lastModalEnd, lastModalEnd + zaloBottomNavAndModals);
console.log("[OK] Injected Zalo Bottom Navigation Bar, Action Sheet, and OTA Client dialogs");

// Save modified code back to master file
fs.writeFileSync(masterFile, code, "utf8");
console.log(`[SUCCESS] Saved updated master bundle: ${masterFile} (${Buffer.byteLength(code, "utf8")} bytes)`);
