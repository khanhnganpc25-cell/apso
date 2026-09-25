const fs = require("fs");

const file = "_next/static/chunks/app/page-ef1198d6a6018514.js";
const backup = `${file}.before-permission-editor`;
let source = fs.readFileSync(file, "utf8");

if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);

function replaceOnce(label, before, after) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected 1 match, found ${count}`);
  }
  source = source.replace(before, after);
}

replaceOnce(
  "normalize user access fields",
  'permissions:(null==(t=e.permissions)?void 0:t.length)?e.permissions:D[a],canDelegate:null!=(n=e.canDelegate)?n:"ADMIN"===a||"HAMLET_LEADER"===a,active:null==(s=e.active)||s',
  'permissions:Array.isArray(e.permissions)?e.permissions:D[a],assignedDuties:e.assignedDuties||"",permissionStart:e.permissionStart||"",permissionEnd:e.permissionEnd||"",canDelegate:null!=(n=e.canDelegate)?n:"ADMIN"===a||"HAMLET_LEADER"===a,active:null==(s=e.active)||s'
);

replaceOnce(
  "preserve custom permissions and add access updater",
  'async function aV(e,t){if(!sP)return;let n=tO.find(t=>t.id===e);if(!(null==n?void 0:n.firebaseUid))return;let s={...n,role:t,permissions:D[t],password:""};await eD(s),tR(t=>t.map(t=>t.id===e?s:t)),sJ("CHANGE_USER_ROLE",e,"Doi vai tro thanh ".concat(t))}async function aP(e)',
  'async function aV(e,t){if(!sP)return;let n=tO.find(t=>t.id===e);if(!(null==n?void 0:n.firebaseUid))return;let s={...n,role:t,password:""};await eD(s),tR(t=>t.map(t=>t.id===e?s:t)),sJ("CHANGE_USER_ROLE",e,"Đổi vai trò thành ".concat(t))}async function zzUpdateUserAccess(e,t,n){if(!sP)return;let a=tO.find(t=>t.id===e);if(!(null==a?void 0:a.firebaseUid))return;let l={...a,[t]:n,password:""};await eD(l),tR(t=>t.map(t=>t.id===e?l:t)),sJ("UPDATE_USER_ACCESS",e,"Cập nhật ".concat(t))}async function zzTogglePermission(e,t){if(!sP)return;let n=tO.find(t=>t.id===e);if(!(null==n?void 0:n.firebaseUid))return;let a=Array.isArray(n.permissions)?n.permissions:[],l={...n,permissions:a.includes(t)?a.filter(e=>e!==t):[...a,t],password:""};await eD(l),tR(t=>t.map(t=>t.id===e?l:t)),sJ("UPDATE_USER_PERMISSIONS",e,"Cập nhật quyền ".concat(t))}async function aP(e)'
);

replaceOnce(
  "respect permission validity dates for cloud operations",
  'function ey(e){var t;return(null==ep?void 0:ep.role)==="ADMIN"||!!(null==ep||null==(t=ep.permissions)?void 0:t.includes(e))}',
  'function ey(e){var t;let n=new Date().toISOString().slice(0,10),s=!(null!=ep&&ep.permissionStart)||n>=ep.permissionStart,a=!(null!=ep&&ep.permissionEnd)||n<=ep.permissionEnd;return(null==ep?void 0:ep.role)==="ADMIN"||s&&a&&!!(null==ep||null==(t=ep.permissions)?void 0:t.includes(e))}'
);

replaceOnce(
  "respect permission validity dates in UI",
  'let sV=e=>{var t;return(null==tL?void 0:tL.role)==="ADMIN"||!!(null==tL||null==(t=tL.permissions)?void 0:t.includes(e))},sP=',
  'let sV=e=>{var t;let n=new Date().toISOString().slice(0,10),s=!(null!=tL&&tL.permissionStart)||n>=tL.permissionStart,a=!(null!=tL&&tL.permissionEnd)||n<=tL.permissionEnd;return(null==tL?void 0:tL.role)==="ADMIN"||s&&a&&!!(null==tL||null==(t=tL.permissions)?void 0:t.includes(e))},sP='
);

replaceOnce(
  "admin table width",
  'className:"w-full min-w-[760px] text-left"',
  'className:"w-full min-w-[1180px] text-left"'
);

replaceOnce(
  "admin table access header",
  '(0,s.jsx)("th",{className:"px-4 py-3",children:"Vai tr\\xf2"}),(0,s.jsx)("th",{className:"px-4 py-3",children:"Trạng th\\xe1i"})',
  '(0,s.jsx)("th",{className:"px-4 py-3",children:"Vai tr\\xf2"}),(0,s.jsx)("th",{className:"px-4 py-3",children:"Quyền, nhiệm vụ và thời hạn"}),(0,s.jsx)("th",{className:"px-4 py-3",children:"Trạng th\\xe1i"})'
);

replaceOnce(
  "editable title",
  '(0,s.jsx)("td",{className:"px-4 py-3 text-sm text-slate-600",children:e.title})',
  '(0,s.jsx)("td",{className:"px-4 py-3",children:(0,s.jsx)("input",{defaultValue:e.title,onBlur:t=>{let n=t.currentTarget.value.trim();n&&n!==e.title&&void zzUpdateUserAccess(e.id,"title",n)},list:"apso-title-options",className:"h-9 w-48 rounded-md border border-slate-200 px-2 text-sm outline-none focus:ring-4 focus:ring-sky-100","aria-label":"Chỉnh sửa chức danh của ".concat(e.name)})})'
);

replaceOnce(
  "role selector and permission editor",
  '(0,s.jsx)("td",{className:"px-4 py-3",children:(0,s.jsxs)("select",{value:e.role,onChange:t=>void aV(e.id,t.target.value),className:"h-9 rounded-md border border-slate-200 px-2 text-sm outline-none focus:ring-4 focus:ring-sky-100",children:[(0,s.jsx)("option",{value:"ADMIN",children:"Admin"}),(0,s.jsx)("option",{value:"LEADERSHIP",children:"L\\xe3nh đạo"}),(0,s.jsx)("option",{value:"SECURITY",children:"C\\xf4ng an/Bảo vệ"}),(0,s.jsx)("option",{value:"OFFICER",children:"C\\xe1n bộ"})]})}),(0,s.jsx)("td",{className:"px-4 py-3",children:(0,s.jsx)("span"',
  '(0,s.jsx)("td",{className:"px-4 py-3",children:(0,s.jsxs)("select",{value:e.role,onChange:t=>void aV(e.id,t.target.value),className:"h-9 rounded-md border border-slate-200 px-2 text-sm outline-none focus:ring-4 focus:ring-sky-100",children:[(0,s.jsx)("option",{value:"ADMIN",children:"Admin"}),(0,s.jsx)("option",{value:"HAMLET_LEADER",children:"Trưởng ấp"}),(0,s.jsx)("option",{value:"LEADERSHIP",children:"L\\xe3nh đạo"}),(0,s.jsx)("option",{value:"SECURITY",children:"C\\xf4ng an/Bảo vệ"}),(0,s.jsx)("option",{value:"OFFICER",children:"C\\xe1n bộ"}),(0,s.jsx)("option",{value:"VIEWER",children:"Chỉ xem báo cáo"})]})}),(0,s.jsx)("td",{className:"px-4 py-3 align-top",children:(0,s.jsxs)("details",{className:"w-[22rem] rounded-md border border-slate-200 bg-slate-50 p-2",children:[(0,s.jsxs)("summary",{className:"cursor-pointer text-sm font-semibold text-blue-800",children:[Array.isArray(e.permissions)?e.permissions.length:0," quyền · Chỉnh sửa"]}),(0,s.jsxs)("div",{className:"mt-3 space-y-3",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between",children:[(0,s.jsx)("span",{className:"text-xs font-bold uppercase text-slate-500",children:"Quyền được cấp"}),(0,s.jsx)("button",{type:"button",onClick:()=>void zzUpdateUserAccess(e.id,"permissions",[]),className:"text-xs font-semibold text-rose-700 hover:underline",children:"Bỏ tất cả"})]}),(0,s.jsx)("div",{className:"grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1",children:T.map(t=>(0,s.jsxs)("label",{className:"flex items-start gap-2 rounded border border-slate-200 bg-white p-2 text-xs text-slate-700",children:[(0,s.jsx)("input",{type:"checkbox",checked:Array.isArray(e.permissions)&&e.permissions.includes(t),onChange:()=>void zzTogglePermission(e.id,t),className:"mt-0.5"}),(0,s.jsx)("span",{children:k[t]})]},t))}),(0,s.jsxs)("label",{className:"block text-xs font-semibold text-slate-600",children:["Nhiệm vụ được giao",(0,s.jsx)("textarea",{defaultValue:e.assignedDuties||"",onBlur:t=>void zzUpdateUserAccess(e.id,"assignedDuties",t.currentTarget.value.trim()),rows:3,placeholder:"Ghi nhiệm vụ cụ thể...",className:"mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm font-normal outline-none focus:ring-4 focus:ring-sky-100"})]}),(0,s.jsxs)("div",{className:"grid grid-cols-2 gap-2",children:[(0,s.jsxs)("label",{className:"text-xs font-semibold text-slate-600",children:["Hiệu lực từ",(0,s.jsx)("input",{type:"date",value:e.permissionStart||"",onChange:t=>void zzUpdateUserAccess(e.id,"permissionStart",t.target.value),className:"mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 font-normal"})]}),(0,s.jsxs)("label",{className:"text-xs font-semibold text-slate-600",children:["Đến ngày",(0,s.jsx)("input",{type:"date",value:e.permissionEnd||"",min:e.permissionStart||void 0,onChange:t=>void zzUpdateUserAccess(e.id,"permissionEnd",t.target.value),className:"mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 font-normal"})]})]})]})]})}),(0,s.jsx)("td",{className:"px-4 py-3",children:(0,s.jsx)("span"'
);

replaceOnce(
  "create-user title choices",
  'children:[(0,s.jsx)("option",{value:"C\\xe1n bộ địa b\\xe0n",children:"C\\xe1n bộ địa b\\xe0n"}),af.map(e=>(0,s.jsx)("option",{value:e.title,children:e.title},e.title))]',
  'children:Array.from(new Set(["Cán bộ địa bàn","Trưởng ấp","Phó ấp","Bí thư Chi bộ","Phó Bí thư Chi bộ",...af.map(e=>e.title)])).map(e=>(0,s.jsx)("option",{value:e,children:e},e))'
);

replaceOnce(
  "create-user role choices",
  'children:[(0,s.jsx)("option",{value:"OFFICER",children:"C\\xe1n bộ"}),(0,s.jsx)("option",{value:"SECURITY",children:"C\\xf4ng an/Bảo vệ"}),(0,s.jsx)("option",{value:"LEADERSHIP",children:"L\\xe3nh đạo"}),(0,s.jsx)("option",{value:"ADMIN",children:"Admin"})]',
  'children:[(0,s.jsx)("option",{value:"OFFICER",children:"C\\xe1n bộ"}),(0,s.jsx)("option",{value:"SECURITY",children:"C\\xf4ng an/Bảo vệ"}),(0,s.jsx)("option",{value:"LEADERSHIP",children:"L\\xe3nh đạo"}),(0,s.jsx)("option",{value:"HAMLET_LEADER",children:"Trưởng ấp"}),(0,s.jsx)("option",{value:"VIEWER",children:"Chỉ xem báo cáo"}),(0,s.jsx)("option",{value:"ADMIN",children:"Admin"})]'
);

replaceOnce(
  "title suggestions datalist",
  '(0,s.jsx)("button",{type:"submit",className:"h-10 w-full rounded-md bg-blue-700 text-sm font-semibold text-white hover:bg-blue-800",children:"Tạo t\\xe0i khoản"})]})]}),',
  '(0,s.jsx)("button",{type:"submit",className:"h-10 w-full rounded-md bg-blue-700 text-sm font-semibold text-white hover:bg-blue-800",children:"Tạo t\\xe0i khoản"}),(0,s.jsx)("datalist",{id:"apso-title-options",children:Array.from(new Set(["Cán bộ địa bàn","Trưởng ấp","Phó ấp","Bí thư Chi bộ","Phó Bí thư Chi bộ",...af.map(e=>e.title)])).map(e=>(0,s.jsx)("option",{value:e},e))})]})]}),'
);

fs.writeFileSync(file, source, "utf8");
console.log("Patched admin title and permission editor successfully.");
