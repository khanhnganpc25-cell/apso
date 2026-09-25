const fs = require("fs");
const path = require("path");

function fixBundle(rootDir) {
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

  // 1. Thêm biến zzP cấp module lưu trữ từ điển quyền
  const searchDef = 'VIEW_MAP_PHOTOS:"Xem ảnh/tọa độ"},T=Object.keys(k),';
  const replaceDef = 'VIEW_MAP_PHOTOS:"Xem ảnh/tọa độ"};var zzP=k;let T=Object.keys(k),';
  if (code.includes(searchDef)) {
    code = code.replace(searchDef, replaceDef);
    console.log(`[OK] Đã gắn biến zzP lưu từ điển quyền tại: ${rootDir}`);
  } else if (code.includes('var zzP=k;')) {
    console.log(`[INFO] Biến zzP đã tồn tại tại: ${rootDir}`);
  } else {
    console.error(`[ERROR] Không tìm thấy vị trí định nghĩa k tại: ${rootDir}`);
    return;
  }

  // 2. Thay children:k[t] bằng children:(zzP[t]||t)
  const searchUsage = 'children:k[t]';
  const replaceUsage = 'children:(zzP[t]||t)';
  if (code.includes(searchUsage)) {
    code = code.replace(searchUsage, replaceUsage);
    console.log(`[OK] Đã sửa children:k[t] thành children:(zzP[t]||t) tại: ${rootDir}`);
  } else if (code.includes(replaceUsage)) {
    console.log(`[INFO] children:(zzP[t]||t) đã được áp dụng tại: ${rootDir}`);
  } else {
    console.error(`[ERROR] Không tìm thấy children:k[t] tại: ${rootDir}`);
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

// Áp dụng cho cả apso và apso-vn-noi-bo
fixBundle("D:\\Lập trình\\apso");
fixBundle("D:\\Lập trình\\apso-vn-noi-bo");
console.log("Hoàn tất sửa lỗi hiển thị tên nhãn quyền!");
