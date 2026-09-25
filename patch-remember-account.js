const fs = require("fs");

const file = "_next/static/chunks/app/page-ef1198d6a6018514.js";
const backup = `${file}.before-remember-account`;
let source = fs.readFileSync(file, "utf8");

if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);

function replaceOnce(label, before, after) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`);
  source = source.replace(before, after);
}

replaceOnce(
  "remember-account state",
  '[t3,t4]=(0,a.useState)(""),[t7,t9]=(0,a.useState)("")',
  '[t3,t4]=(0,a.useState)(""),[loginEmail,setLoginEmail]=(0,a.useState)(""),[rememberAccount,setRememberAccount]=(0,a.useState)(!1),[t7,t9]=(0,a.useState)("")'
);

replaceOnce(
  "load remembered email",
  'if((0,a.useEffect)(()=>{tF&&nz&&',
  'if((0,a.useEffect)(()=>{let e=window.localStorage.getItem("apso-remember-email")||"";e&&(setLoginEmail(e),setRememberAccount(!0))},[]),(0,a.useEffect)(()=>{tF&&nz&&'
);

replaceOnce(
  "remember email on submit",
  'onSubmit:async e=>{e.preventDefault(),await aL(new FormData(e.currentTarget))}',
  'onSubmit:async e=>{e.preventDefault(),rememberAccount?window.localStorage.setItem("apso-remember-email",loginEmail.trim().toLowerCase()):window.localStorage.removeItem("apso-remember-email"),await aL(new FormData(e.currentTarget))}'
);

replaceOnce(
  "controlled login email",
  'name:"email",type:"email",required:!0,autoComplete:"username",className:',
  'name:"email",type:"email",required:!0,autoComplete:"username",value:loginEmail,onChange:e=>setLoginEmail(e.target.value),className:'
);

replaceOnce(
  "remember account checkbox",
  'className:"h-10 w-full rounded-md border border-slate-200 px-3 outline-none focus:ring-4 focus:ring-sky-100"})]}),t3&&',
  'className:"h-10 w-full rounded-md border border-slate-200 px-3 outline-none focus:ring-4 focus:ring-sky-100"})]}),(0,s.jsxs)("label",{className:"flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700",children:[(0,s.jsx)("input",{type:"checkbox",checked:rememberAccount,onChange:e=>setRememberAccount(e.target.checked),className:"h-4 w-4 rounded border-slate-300 text-blue-700"}),(0,s.jsx)("span",{children:"Ghi nhớ tài khoản trên thiết bị này"})]}),t3&&'
);

fs.writeFileSync(file, source, "utf8");
console.log("Patched safe remember-account control successfully.");
