const fs = require("fs");
const path = require("path");

const root = __dirname;
const masterBundle = path.join(
  root,
  "_next",
  "static",
  "chunks",
  "app",
  "page-ef1198d6a6018514.js.unified-master"
);
const currentBundle = path.join(
  root,
  "_next",
  "static",
  "chunks",
  "app",
  "page-ef1198d6a6018514.js"
);

const sourceFile = fs.existsSync(masterBundle) ? masterBundle : currentBundle;
if (!fs.existsSync(sourceFile)) {
  console.error("Không tìm thấy bundle chuẩn:", sourceFile);
  process.exit(1);
}

let code = fs.readFileSync(sourceFile, "utf8");

// 1. Kiểm tra tính toàn vẹn của tất cả các tính năng
const checks = [
  { name: "Phân quyền quản trị (assignedDuties)", pattern: "assignedDuties" },
  { name: "Phân tích nhóm tuổi (eAgeMin)", pattern: "eAgeMin" },
  { name: "Chất lượng hộ khẩu (hasHouseholdPhoto)", pattern: "hasHouseholdPhoto" },
  { name: "Thương hiệu APSO", pattern: "APSO" },
  { name: "Ghi nhớ tài khoản (rememberAccount)", pattern: "rememberAccount" },
  { name: "Quản lý mật khẩu (passwordDialog)", pattern: "passwordDialog" },
  { name: "Admin cấp lại mật khẩu (ADMIN_RESET_PASSWORD)", pattern: "ADMIN_RESET_PASSWORD" },
  { name: "Quyền quản trị chỉ dành cho ADMIN", pattern: 'sP=(null==tL?void 0:tL.role)==="ADMIN"' },
  { name: "Từ điển nhãn quyền (zzP)", pattern: "var zzP=k;" },
  { name: "Admin đổi tên người dùng", pattern: "Bấm để đổi tên người dùng" },
  { name: "In biểu mẫu hành chính A4 chuẩn", pattern: "In biểu mẫu hành chính A4 chuẩn Quốc gia" },
  { name: "Sao lưu & Khôi phục JSON", pattern: "Sao lưu & Khôi phục dữ liệu" },
  { name: "Nhật ký kiểm toán hệ thống (Audit Logs)", pattern: "Nhật ký kiểm toán hệ thống" },
  { name: "Biến động dân cư (Khai tử / Đã mất)", pattern: "Khai tử / Đã mất" },
  { name: "Chat cố định kiểu Zalo", pattern: "Nhắn tin… Dùng @ để gọi cán bộ, # để gắn nhân khẩu" },
  { name: "Gọi cán bộ bằng @", pattern: "selectChatReference" },
  { name: "Liên kết nhân khẩu bằng #", pattern: "openResidentFromChat" },
  { name: "Gửi vị trí trong chat", pattern: "handleSendChatLocation" },
  { name: "Bật/tắt thông báo", pattern: "toggleChatNotifications" },
  { name: "Đồng bộ chat giữa các thiết bị", pattern: "APSO_CHAT_CLOUD_SYNC_ON_OPEN_V1" }
];

let allPassed = true;
for (const check of checks) {
  if (code.includes(check.pattern)) {
    console.log(`[PASS] ${check.name}`);
  } else {
    console.error(`[FAIL] Thiếu tính năng: ${check.name}`);
    allPassed = false;
  }
}

if (!allPassed) {
  console.error("Bundle chưa đạt đầy đủ tính năng.");
  process.exit(1);
}

// 2. Đồng bộ vào cả _next và hosting-public
const targetPaths = [
  path.join(root, "_next", "static", "chunks", "app", "page-ef1198d6a6018514.js"),
  path.join(root, "hosting-public", "_next", "static", "chunks", "app", "page-ef1198d6a6018514.js")
];

for (const p of targetPaths) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, code, "utf8");
  console.log(`[OK] Đã ghi bundle: ${p} (${Buffer.byteLength(code, "utf8")} bytes)`);
}

console.log("Hoàn tất xác thực và đồng bộ bundle đầy đủ tính năng!");
