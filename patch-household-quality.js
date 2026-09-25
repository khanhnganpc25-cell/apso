const fs = require("fs");

const file = "_next/static/chunks/app/page-ef1198d6a6018514.js";
const backup = `${file}.before-household-quality`;
let source = fs.readFileSync(file, "utf8");

if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);

function replaceOnce(label, before, after) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`);
  source = source.replace(before, after);
}

replaceOnce(
  "household filters for completed photo and coordinates",
  'l="all"===td||"non-standard"===td&&"Hộ thường"!==t.type||"missing-location"===td&&(!t.latitude||!t.longitude)||"missing-photo"===td&&!t.photoUrl;return n&&s&&a&&l',
  'l="all"===td||"non-standard"===td&&"Hộ thường"!==t.type||"missing-location"===td&&(!t.latitude||!t.longitude)||"has-location"===td&&!!t.latitude&&!!t.longitude||"missing-photo"===td&&!t.photoUrl||"has-photo"===td&&!!t.photoUrl;return n&&s&&a&&l'
);

replaceOnce(
  "household quality completed counters",
  'missingLocation:tA.filter(e=>!e.latitude||!e.longitude).length,missingHouseholdPhoto:tA.filter(e=>!e.photoUrl).length,hamletRows:n',
  'missingLocation:tA.filter(e=>!e.latitude||!e.longitude).length,hasLocation:tA.filter(e=>!!e.latitude&&!!e.longitude).length,missingHouseholdPhoto:tA.filter(e=>!e.photoUrl).length,hasHouseholdPhoto:tA.filter(e=>!!e.photoUrl).length,hamletRows:n'
);

replaceOnce(
  "household quality cards",
  '[["Tổng hộ",tA.length,"all"],["Hộ ch\\xednh s\\xe1ch/kh\\xe1c",s7.nonStandardHouseholds,"non-standard"],["Thiếu tọa độ",s7.missingLocation,"missing-location"],["Chưa c\\xf3 ảnh hộ",s7.missingHouseholdPhoto,"missing-photo"]]',
  '[["Tổng hộ",tA.length,"all"],["Hộ ch\\xednh s\\xe1ch/kh\\xe1c",s7.nonStandardHouseholds,"non-standard"],["Thiếu tọa độ",s7.missingLocation,"missing-location"],["Hộ đã c\\xf3 tọa độ",s7.hasLocation,"has-location"],["Chưa c\\xf3 ảnh hộ",s7.missingHouseholdPhoto,"missing-photo"],["Hộ đã đăng ảnh",s7.hasHouseholdPhoto,"has-photo"]]'
);

fs.writeFileSync(file, source, "utf8");
console.log("Patched household quality completion cards successfully.");
