const fs = require("fs");

const file = "_next/static/chunks/app/page-ef1198d6a6018514.js";
const backup = `${file}.before-age-filters`;
let source = fs.readFileSync(file, "utf8");

if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);

function replaceOnce(label, before, after) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`);
  source = source.replace(before, after);
}

function replaceCount(label, before, after, expected) {
  const count = source.split(before).length - 1;
  if (count !== expected) throw new Error(`${label}: expected ${expected} matches, found ${count}`);
  source = source.split(before).join(after);
}

replaceOnce(
  "age range state",
  '[ej,ew]=(0,a.useState)(""),[eC,eA]=(0,a.useState)(""),[eU,eK]=(0,a.useState)("all")',
  '[ej,ew]=(0,a.useState)(""),[eC,eA]=(0,a.useState)(""),[eAgeMin,eSetAgeMin]=(0,a.useState)(""),[eAgeMax,eSetAgeMax]=(0,a.useState)(""),[eU,eK]=(0,a.useState)("all")'
);

replaceOnce(
  "resident age filtering",
  'h=ta(t.dateOfBirth)?te(t.dateOfBirth):null,m="all"===eU||"male"===eU&&"Nam"===t.gender||"female"===eU&&"Nữ"===t.gender||"children"===eU&&null!==h&&h<16||"working-age"===eU&&null!==h&&h>=16&&h<60||"elderly"===eU&&null!==h&&h>=60||"missing-core"===eU',
  'h=ta(t.dateOfBirth)?te(t.dateOfBirth):null,u=(!eAgeMin||null!==h&&h>=Number(eAgeMin))&&(!eAgeMax||null!==h&&h<=Number(eAgeMax)),m="all"===eU||"male"===eU&&"Nam"===t.gender||"female"===eU&&"Nữ"===t.gender||"age-under-6"===eU&&null!==h&&h<6||"age-6-13"===eU&&null!==h&&h>=6&&h<14||"age-14-15"===eU&&null!==h&&h>=14&&h<16||"age-16-17"===eU&&null!==h&&h>=16&&h<18||"age-18-59"===eU&&null!==h&&h>=18&&h<60||"elderly"===eU&&null!==h&&h>=60||"missing-core"===eU'
);

replaceOnce(
  "apply and track age range",
  'return n&&s&&a&&l&&i&&r&&o&&c&&m})},[tD,W,ea,ec,eu,eg,ef,ev,ej,eC,eU])',
  'return n&&s&&a&&l&&i&&r&&o&&c&&u&&m})},[tD,W,ea,ec,eu,eg,ef,ev,ej,eC,eAgeMin,eAgeMax,eU])'
);

replaceOnce(
  "age analysis counters",
  'children:t.filter(e=>{let{age:t}=e;return null!==t&&t<16}).length,workingAge:t.filter(e=>{let{age:t}=e;return null!==t&&t>=16&&t<60}).length,elderly:t.filter(e=>{let{age:t}=e;return null!==t&&t>=60}).length',
  'ageUnder6:t.filter(e=>{let{age:t}=e;return null!==t&&t<6}).length,age6To13:t.filter(e=>{let{age:t}=e;return null!==t&&t>=6&&t<14}).length,age14To15:t.filter(e=>{let{age:t}=e;return null!==t&&t>=14&&t<16}).length,age16To17:t.filter(e=>{let{age:t}=e;return null!==t&&t>=16&&t<18}).length,age18To59:t.filter(e=>{let{age:t}=e;return null!==t&&t>=18&&t<60}).length,elderly:t.filter(e=>{let{age:t}=e;return null!==t&&t>=60}).length'
);

replaceOnce(
  "reset age filters when opening report group",
  'ew(""),eA(""),eK(e),tT("residents")',
  'ew(""),eA(""),eSetAgeMin(""),eSetAgeMax(""),eK(e),tT("residents")'
);

const ageInputs = '(0,s.jsxs)("label",{className:"flex h-11 min-w-[8rem] flex-1 basis-[8rem] items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600",children:[(0,s.jsx)("span",{className:"whitespace-nowrap text-xs font-medium",children:"Từ tuổi"}),(0,s.jsx)("input",{type:"number",min:0,max:130,value:eAgeMin,onChange:e=>eSetAgeMin(e.target.value.replace(/\\D/g,"").slice(0,3)),"aria-label":"Từ tuổi",placeholder:"0",className:"min-w-0 flex-1 bg-transparent text-sm outline-none"})]}),(0,s.jsxs)("label",{className:"flex h-11 min-w-[8rem] flex-1 basis-[8rem] items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600",children:[(0,s.jsx)("span",{className:"whitespace-nowrap text-xs font-medium",children:"Đến tuổi"}),(0,s.jsx)("input",{type:"number",min:eAgeMin||0,max:130,value:eAgeMax,onChange:e=>eSetAgeMax(e.target.value.replace(/\\D/g,"").slice(0,3)),"aria-label":"Đến tuổi",placeholder:"130",className:"min-w-0 flex-1 bg-transparent text-sm outline-none"})]}),';

replaceCount(
  "age inputs beside birth-date filters",
  '(0,s.jsxs)("select",{value:ev,onChange:e=>ey(e.target.value)',
  ageInputs + '(0,s.jsxs)("select",{value:ev,onChange:e=>ey(e.target.value)',
  2
);

replaceOnce(
  "analysis age cards",
  '["Dưới 16 tuổi",s7.children,"children","bg-violet-50 text-violet-700"],["Từ 16 đến 59 tuổi",s7.workingAge,"working-age","bg-emerald-50 text-emerald-700"],["Từ 60 tuổi trở l\\xean",s7.elderly,"elderly","bg-amber-50 text-amber-700"]',
  '["Dưới 6 tuổi",s7.ageUnder6,"age-under-6","bg-violet-50 text-violet-700"],["Từ 6 đến dưới 14 tuổi",s7.age6To13,"age-6-13","bg-indigo-50 text-indigo-700"],["Từ 14 đến dưới 16 tuổi",s7.age14To15,"age-14-15","bg-fuchsia-50 text-fuchsia-700"],["Từ 16 đến dưới 18 tuổi",s7.age16To17,"age-16-17","bg-cyan-50 text-cyan-700"],["Từ 18 đến dưới 60 tuổi",s7.age18To59,"age-18-59","bg-emerald-50 text-emerald-700"],["Từ 60 tuổi trở l\\xean",s7.elderly,"elderly","bg-amber-50 text-amber-700"]'
);

fs.writeFileSync(file, source, "utf8");
console.log("Patched age analysis and age-range filters successfully.");
