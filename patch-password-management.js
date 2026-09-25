const fs = require("fs");
const path = require("path");

const appDir = path.join(__dirname, "hosting-public", "_next", "static", "chunks", "app");
const bundle = fs
  .readdirSync(appDir)
  .find((name) => /^page-.*\.js$/.test(name) && !name.includes(".before-"));

if (!bundle) throw new Error("Không tìm thấy bundle trang chính.");

const bundlePath = path.join(appDir, bundle);
const backupPath = `${bundlePath}.before-password-management`;
let source = fs.readFileSync(bundlePath, "utf8");

if (source.includes("ADMIN_RESET_PASSWORD") && source.includes("Đổi mật khẩu")) {
  console.log("Password management patch already applied.");
  process.exit(0);
}

if (!fs.existsSync(backupPath)) fs.copyFileSync(bundlePath, backupPath);

function replaceOnce(search, replacement, label) {
  const count = source.split(search).length - 1;
  if (count !== 1) throw new Error(`${label}: cần đúng 1 vị trí, tìm thấy ${count}.`);
  source = source.replace(search, replacement);
}

replaceOnce(
  '[rememberAccount,setRememberAccount]=(0,a.useState)(!1),',
  '[rememberAccount,setRememberAccount]=(0,a.useState)(!1),[passwordDialog,setPasswordDialog]=(0,a.useState)(null),[passwordBusy,setPasswordBusy]=(0,a.useState)(!1),[passwordError,setPasswordError]=(0,a.useState)(""),',
  "password dialog state",
);

replaceOnce(
  'async function aB(){let{auth:e}=eh();e&&await (0,i.CI)(e).catch(()=>void 0),sS(null),tB(null),t4(""),tT("overview")}',
  `async function aB(){let{auth:e}=eh();e&&await (0,i.CI)(e).catch(()=>void 0),sS(null),tB(null),t4(""),tT("overview")}function validateNewPassword(e,t){if(e!==t)throw Error("Hai lần nhập mật khẩu mới chưa giống nhau.");if(e.length<8||e.length>128||!/[A-Za-zÀ-ỹ]/u.test(e)||!/\\d/.test(e))throw Error("Mật khẩu mới phải từ 8 ký tự, có chữ và có số.")}async function changeOwnPassword(e){let t=String(e.get("currentPassword")||""),n=String(e.get("newPassword")||""),s=String(e.get("confirmPassword")||"");validateNewPassword(n,s);let{auth:a}=eh(),l=null==a?void 0:a.currentUser;if(!l||!l.email)throw Error("Không tìm thấy phiên đăng nhập hiện tại.");let o=(0,r.Wp)(ed,"apso-change-password-".concat(Date.now()));try{let e=(0,i.xI)(o);await(0,i.oM)(e,i.F0);let s=await(0,i.x9)(e,l.email,t),a=await s.user.getIdToken(),r=await fetch("https://identitytoolkit.googleapis.com/v1/accounts:update?key=".concat(encodeURIComponent(ed.options.apiKey)),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idToken:a,password:n,returnSecureToken:!0})}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error("INVALID_PASSWORD"===(null==d||null==d.error?void 0:d.error.message)?"Mật khẩu hiện tại không đúng.":"WEAK_PASSWORD"===(null==d||null==d.error?void 0:d.error.message)?"Mật khẩu mới chưa đủ mạnh.":"Không thể đổi mật khẩu. Hãy đăng nhập lại rồi thử lại.");sJ("CHANGE_OWN_PASSWORD",tL.id,"Chủ tài khoản tự đổi mật khẩu"),alert("Đổi mật khẩu thành công. Hãy đăng nhập lại bằng mật khẩu mới."),await aB();return!0}finally{let{auth:e}={auth:(0,i.xI)(o)};await(0,i.CI)(e).catch(()=>void 0),await(0,r.NM)(o).catch(()=>void 0)}}async function adminResetPassword(e,t){if(!sP||"ADMIN"!==(null==tL?void 0:tL.role))throw Error("Chỉ Admin được cấp lại mật khẩu.");if(!(null==e?void 0:e.firebaseUid))throw Error("Tài khoản chưa có Firebase UID.");let n=String(t.get("newPassword")||""),s=String(t.get("confirmPassword")||"");validateNewPassword(n,s);let{auth:a}=eh(),l=null==a?void 0:a.currentUser;if(!l)throw Error("Phiên đăng nhập đã hết hạn.");let i=await l.getIdToken(),r=await fetch("/api/admin-reset-password",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer ".concat(i)},body:JSON.stringify({targetUid:e.firebaseUid,newPassword:n})}),o=await r.json().catch(()=>({}));if(!r.ok)throw Error(o.error||"Không thể cấp lại mật khẩu.");return sJ("ADMIN_RESET_PASSWORD",e.id,"Admin cấp lại mật khẩu cho ".concat(e.email)),alert("Đã cấp lại mật khẩu cho ".concat(e.name,". Tài khoản này phải đăng nhập lại bằng mật khẩu mới.")),!0}`,
  "password functions",
);

replaceOnce(
  '(0,s.jsx)("button",{type:"button",onClick:aB,className:"rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50",children:"Đăng xuất"})',
  '(0,s.jsx)("button",{type:"button",onClick:()=>{setPasswordError(""),setPasswordDialog({mode:"self"})},className:"rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100",children:"Đổi mật khẩu"}),(0,s.jsx)("button",{type:"button",onClick:aB,className:"rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50",children:"Đăng xuất"})',
  "own password button",
);

replaceOnce(
  '(0,s.jsx)("td",{className:"px-4 py-3",children:(0,s.jsx)("button",{type:"button",onClick:()=>void aP(e.id),className:"rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50",children:e.active?"Kh\\xf3a":"Mở kh\\xf3a"})})',
  '(0,s.jsx)("td",{className:"px-4 py-3",children:(0,s.jsxs)("div",{className:"flex flex-wrap gap-2",children:["ADMIN"===(null==tL?void 0:tL.role)&&e.firebaseUid!==tL.firebaseUid&&(0,s.jsx)("button",{type:"button",onClick:()=>{setPasswordError(""),setPasswordDialog({mode:"admin",user:e})},className:"rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100",children:"Cấp lại mật khẩu"}),(0,s.jsx)("button",{type:"button",onClick:()=>void aP(e.id),className:"rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50",children:e.active?"Kh\\xf3a":"Mở kh\\xf3a"})]})})',
  "admin reset button",
);

replaceOnce(
  '}),t2&&(0,s.jsx)("div",{className:"fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4"',
  '}),passwordDialog&&(0,s.jsx)("div",{className:"fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 p-4",onClick:()=>{passwordBusy||(setPasswordDialog(null),setPasswordError(""))},children:(0,s.jsxs)("section",{role:"dialog","aria-modal":"true","aria-label":"self"===passwordDialog.mode?"Đổi mật khẩu":"Cấp lại mật khẩu",className:"w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl",onClick:e=>e.stopPropagation(),children:[(0,s.jsxs)("header",{className:"border-b border-slate-200 px-5 py-4",children:[(0,s.jsx)("h2",{className:"text-lg font-bold text-slate-950",children:"self"===passwordDialog.mode?"Đổi mật khẩu của tôi":"Cấp lại mật khẩu"}),(0,s.jsx)("p",{className:"mt-1 text-sm text-slate-500",children:"self"===passwordDialog.mode?"Chỉ chủ tài khoản có mật khẩu hiện tại mới đổi được.":"Tài khoản: ".concat(passwordDialog.user.name," · ",passwordDialog.user.email)})]}),(0,s.jsxs)("form",{className:"space-y-4 p-5",onSubmit:async e=>{e.preventDefault(),setPasswordBusy(!0),setPasswordError("");try{let t="self"===passwordDialog.mode?await changeOwnPassword(new FormData(e.currentTarget)):await adminResetPassword(passwordDialog.user,new FormData(e.currentTarget));t&&(setPasswordDialog(null),setPasswordError(""))}catch(e){setPasswordError(e instanceof Error?e.message:"Không thể cập nhật mật khẩu.")}finally{setPasswordBusy(!1)}},children:["self"===passwordDialog.mode&&(0,s.jsxs)("label",{className:"block space-y-1 text-sm font-semibold text-slate-700",children:["Mật khẩu hiện tại",(0,s.jsx)("input",{name:"currentPassword",type:"password",required:!0,autoComplete:"current-password",className:"h-11 w-full rounded-md border border-slate-200 px-3 font-normal outline-none focus:ring-4 focus:ring-sky-100"})]}),(0,s.jsxs)("label",{className:"block space-y-1 text-sm font-semibold text-slate-700",children:["Mật khẩu mới",(0,s.jsx)("input",{name:"newPassword",type:"password",required:!0,minLength:8,autoComplete:"new-password",className:"h-11 w-full rounded-md border border-slate-200 px-3 font-normal outline-none focus:ring-4 focus:ring-sky-100"})]}),(0,s.jsxs)("label",{className:"block space-y-1 text-sm font-semibold text-slate-700",children:["Nhập lại mật khẩu mới",(0,s.jsx)("input",{name:"confirmPassword",type:"password",required:!0,minLength:8,autoComplete:"new-password",className:"h-11 w-full rounded-md border border-slate-200 px-3 font-normal outline-none focus:ring-4 focus:ring-sky-100"})]}),(0,s.jsx)("p",{className:"text-xs text-slate-500",children:"Mật khẩu cần ít nhất 8 ký tự, có chữ và có số. Hệ thống không lưu mật khẩu trong hồ sơ."}),passwordError&&(0,s.jsx)("div",{role:"alert",className:"rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700",children:passwordError}),(0,s.jsxs)("div",{className:"flex justify-end gap-2 pt-1",children:[(0,s.jsx)("button",{type:"button",disabled:passwordBusy,onClick:()=>{setPasswordDialog(null),setPasswordError("")},className:"rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50",children:"Hủy"}),(0,s.jsx)("button",{type:"submit",disabled:passwordBusy,className:"rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50",children:passwordBusy?"Đang cập nhật...":"self"===passwordDialog.mode?"Đổi mật khẩu":"Cấp lại mật khẩu"})]})]})]})}),t2&&(0,s.jsx)("div",{className:"fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4"',
  "password modal",
);

fs.writeFileSync(bundlePath, source, "utf8");
console.log(`Patched ${bundlePath}`);
