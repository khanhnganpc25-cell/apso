const fs = require("fs");
const path = require("path");

function patchDir(rootDir) {
  console.log(`\n=== Đang xử lý thư mục: ${rootDir} ===`);
  const masterFile = path.join(
    rootDir,
    "_next",
    "static",
    "chunks",
    "app",
    "page-ef1198d6a6018514.js.unified-master"
  );
  if (!fs.existsSync(masterFile)) {
    console.error("Không tìm thấy master bundle tại:", masterFile);
    return;
  }

  let code = fs.readFileSync(masterFile, "utf8");

  // 1. Mở rộng truy vấn Firestore (ew): Không giới hạn theo phạm vi ấp/tổ ở mức truy vấn DB
  const oldEw = 'async function ew(e,t){let n=null==ep?void 0:ep.scope,s=[];"notifications"!==t&&(null==n?void 0:n.province)&&s.push((0,eo._M)("province","==",n.province)),"notifications"!==t&&(null==n?void 0:n.commune)&&s.push((0,eo._M)("commune","==",n.commune)),"notifications"!==t&&(null==n?void 0:n.hamlet)&&s.push((0,eo._M)("hamlet","==",n.hamlet)),"notifications"!==t&&(null==n?void 0:n.group)&&s.push((0,eo._M)("group","==",n.group));let a=s.length?(0,eo.P)((0,eo.rJ)(e,t),...s):(0,eo.rJ)(e,t),l=(await (0,eo.GG)(a)).docs.map(e=>ef(e.data()));return ex.set(t,new Map(l.map(e=>[e.id,eN(e)]))),l}';
  const newEw = 'async function ew(e,t){let a=(0,eo.rJ)(e,t),l=(await (0,eo.GG)(a)).docs.map(e=>ef(e.data()));return ex.set(t,new Map(l.map(e=>[e.id,eN(e)]))),l}';

  if (code.includes(oldEw)) {
    code = code.replace(oldEw, newEw);
    console.log("[OK] Đã gỡ bỏ giới hạn truy vấn Firestore theo ấp (ew)");
  } else {
    console.log("[SKIP] oldEw đã được cập nhật hoặc không tìm thấy");
  }

  // 2. Mở khóa bộ lọc nhân khẩu (s1): Tất cả tài khoản có thể chọn 'Tất cả ấp' hoặc chọn từng ấp
  const oldS1 = ',s="all"===ea||t.status===ea,userHamlet=("ADMIN"===(null==tL?void 0:tL.role)||"LEADERSHIP"===(null==tL?void 0:tL.role))?null:(null==tL||null==(kSc=tL.scope)?void 0:kSc.hamlet)||null,a=userHamlet?t.hamlet===userHamlet:("all"===ec||t.hamlet===ec),';
  const newS1 = ',s="all"===ea||t.status===ea,a="all"===ec||t.hamlet===ec,';

  if (code.includes(oldS1)) {
    code = code.replace(oldS1, newS1);
    console.log("[OK] Đã gỡ bỏ khóa userHamlet trong bộ lọc nhân khẩu (s1)");
  } else {
    console.log("[SKIP] oldS1 đã được cập nhật hoặc không tìm thấy");
  }

  // 3. Mở khóa bộ lọc hộ khẩu (s5): Tương tự
  const oldS5 = 'userHmlt=("ADMIN"===(null==tL?void 0:tL.role)||"LEADERSHIP"===(null==tL?void 0:tL.role))?null:(null==tL||null==(kSc2=tL.scope)?void 0:kSc2.hamlet)||null,s=userHmlt?t.hamlet===userHmlt:("all"===ec||t.hamlet===ec),a="all"===eu||t.group===eu';
  const newS5 = 's="all"===ec||t.hamlet===ec,a="all"===eu||t.group===eu';

  if (code.includes(oldS5)) {
    code = code.replace(oldS5, newS5);
    console.log("[OK] Đã gỡ bỏ khóa userHmlt trong bộ lọc hộ khẩu (s5)");
  } else {
    console.log("[SKIP] oldS5 đã được cập nhật hoặc không tìm thấy");
  }

  // Lưu master bundle
  fs.writeFileSync(masterFile, code, "utf8");
  console.log(`[SAVED] Đã ghi master bundle: ${masterFile}`);

  // Cập nhật upgrade-apso-complete.js trong thư mục nếu có
  const upgradeScript = path.join(rootDir, "upgrade-apso-complete.js");
  if (fs.existsSync(upgradeScript)) {
    let upCode = fs.readFileSync(upgradeScript, "utf8");
    upCode = upCode.replace(
      /const newS1 = 's="all"===ea\|\|t\.status===ea,userHamlet=[^']+';/,
      "const newS1 = 's=\"all\"===ea||t.status===ea,a=\"all\"===ec||t.hamlet===ec';"
    );
    upCode = upCode.replace(
      /const newS5 = 'userHmlt=[^']+';/,
      "const newS5 = 's=\"all\"===ec||t.hamlet===ec,a=\"all\"===eu||t.group===eu';"
    );
    fs.writeFileSync(upgradeScript, upCode, "utf8");
    console.log(`[OK] Đã cập nhật ${upgradeScript}`);
  }
}

// Chạy cho cả 2 workspace
patchDir("D:\\Lập trình\\apso");
patchDir("D:\\Lập trình\\apso-vn-noi-bo");

console.log("\nTiến hành build và phân phối bundle cho hệ thống...");
const { execSync } = require("child_process");
execSync("node build-unified-bundle.js", { cwd: "D:\\Lập trình\\apso", stdio: "inherit" });

if (fs.existsSync("D:\\Lập trình\\apso-vn-noi-bo\\build-unified-bundle.js")) {
  execSync("node build-unified-bundle.js", { cwd: "D:\\Lập trình\\apso-vn-noi-bo", stdio: "inherit" });
}

console.log("\nChuẩn bị hosting...");
execSync("node prepare-hosting.js", { cwd: "D:\\Lập trình\\apso", stdio: "inherit" });
if (fs.existsSync("D:\\Lập trình\\apso-vn-noi-bo\\prepare-hosting.js")) {
  execSync("node prepare-hosting.js", { cwd: "D:\\Lập trình\\apso-vn-noi-bo", stdio: "inherit" });
}

console.log("\nHOÀN TẤT MỞ KHÓA TOÀN BỘ ẤP CHO TẤT CẢ TÀI KHOẢN!");
