const fs = require("fs");
const path = require("path");

function patchUserEditing(rootDir) {
  const masterFile = path.join(
    rootDir,
    "_next",
    "static",
    "chunks",
    "app",
    "page-ef1198d6a6018514.js.unified-master"
  );
  if (!fs.existsSync(masterFile)) {
    console.error("Không tìm thấy master file:", masterFile);
    return;
  }

  let code = fs.readFileSync(masterFile, "utf8");

  // 1. Nâng cấp hàm zzUpdateUserAccess để hỗ trợ cả tài khoản có hoặc chưa có firebaseUid, và cập nhật tL nếu sửa chính mình
  const oldUpdateFn = 'async function zzUpdateUserAccess(e,t,n){if(!sP)return;let a=tO.find(t=>t.id===e);if(!(null==a?void 0:a.firebaseUid))return;let l={...a,[t]:n,password:""};await eD(l),tR(t=>t.map(t=>t.id===e?l:t)),sJ("UPDATE_USER_ACCESS",e,"Cập nhật ".concat(t))}';
  const newUpdateFn = 'async function zzUpdateUserAccess(e,t,n){if(!sP)return;let a=tO.find(t=>t.id===e);if(!a)return;let l={...a,[t]:n,password:""};if(a.firebaseUid){try{await eD(l)}catch(e){console.warn(e)}}tR(t=>t.map(t=>t.id===e?l:t));if((null==tL?void 0:tL.id)===e)tB(e=>e?{...e,[t]:n}:e);sJ("UPDATE_USER_ACCESS",e,"Đổi ".concat("name"===t?"họ tên":t," thành ").concat(n))}';

  if (code.includes(oldUpdateFn)) {
    code = code.replace(oldUpdateFn, newUpdateFn);
    console.log(`[OK] Đã nâng cấp hàm zzUpdateUserAccess tại: ${rootDir}`);
  } else if (code.includes(newUpdateFn)) {
    console.log(`[INFO] Hàm zzUpdateUserAccess đã được cập nhật trước đó tại: ${rootDir}`);
  } else {
    console.error(`[ERROR] Không tìm thấy oldUpdateFn tại: ${rootDir}`);
    return;
  }

  // 2. Chuyển thẻ hiển thị họ tên e.name thành thẻ input cho phép sửa trực tiếp
  const oldNameTag = '(0,s.jsx)("div",{className:"font-semibold text-slate-950",children:e.name})';
  const newNameInput = '(0,s.jsx)("input",{defaultValue:e.name,onBlur:t=>{let n=t.currentTarget.value.trim();n&&n!==e.name&&void zzUpdateUserAccess(e.id,"name",n)},onKeyDown:t=>{if("Enter"===t.key){let n=t.currentTarget.value.trim();n&&n!==e.name&&void zzUpdateUserAccess(e.id,"name",n),t.currentTarget.blur()}},className:"h-8 w-44 rounded-md border border-slate-200 px-2 text-sm font-semibold text-slate-950 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-sky-100",title:"Bấm để đổi tên người dùng","aria-label":"Đổi tên của ".concat(e.name)})';

  const count = code.split(oldNameTag).length - 1;
  if (count === 1) {
    code = code.replace(oldNameTag, newNameInput);
    console.log(`[OK] Đã thay thế thành công thẻ tên người dùng thành ô nhập liệu tại: ${rootDir}`);
  } else if (code.includes(newNameInput)) {
    console.log(`[INFO] Thẻ nhập họ tên đã tồn tại tại: ${rootDir}`);
  } else {
    console.error(`[ERROR] Tìm thấy ${count} vị trí oldNameTag (cần đúng 1) tại: ${rootDir}`);
    return;
  }

  // 3. Ghi vào master, root _next, và hosting-public
  const filesToSave = [
    masterFile,
    path.join(rootDir, "_next", "static", "chunks", "app", "page-ef1198d6a6018514.js"),
    path.join(rootDir, "hosting-public", "_next", "static", "chunks", "app", "page-ef1198d6a6018514.js")
  ];

  for (const f of filesToSave) {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, code, "utf8");
    console.log(`[SAVED] Đã lưu: ${f} (${Buffer.byteLength(code, "utf8")} bytes)`);
  }
}

// Thực hiện cho cả apso và apso-vn-noi-bo
patchUserEditing("D:\\Lập trình\\apso");
patchUserEditing("D:\\Lập trình\\apso-vn-noi-bo");
console.log("Hoàn tất thêm chức năng Admin đổi tên người dùng!");
