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

// Reproducible hotfix: use the readable, regression-tested scoped query loader.
const scopedReader = fs.readFileSync(path.join(root, "scoped-cloud-read.js"), "utf8");
const readerStart = code.includes("// APSO_SCOPED_LOGIN_FIX_V1")
  ? code.indexOf("// APSO_SCOPED_LOGIN_FIX_V1") : code.indexOf("async function ew(");
const readerEnd = code.indexOf("async function eC(", readerStart);
if (readerStart < 0 || readerEnd < 0) throw new Error("Scoped reader insertion point missing");
code = code.slice(0, readerStart) + scopedReader + "\n" + code.slice(readerEnd);

function hotfixOnce(before, after) {
  if (code.includes(after)) return;
  if (code.split(before).length !== 2) throw new Error("Login hotfix insertion point missing");
  code = code.replace(before, after);
}
hotfixOnce('async function eT(e){', 'async function eT(e){if(!apsoCloudReady)throw Error("Chưa tải xong dữ liệu; đồng bộ đã tạm dừng để bảo vệ hồ sơ.");');
hotfixOnce('if(sh(!1),sS(t),!t){', 'if(apsoResetCloudRead(),sh(!1),sS(t),!t){');
// Preserve authentication after a data-loading failure, but never display stale
// records from another user or auto-save empty/partially loaded lists.
hotfixOnce('tB(s);let a=await eS(),', 'tB(s);let a;try{a=await eS()}catch(loadError){console.error("APSO cloud load:",loadError);tE([]);tM([]);tH([]);tR([s]);tK([]);sT([]);tV(null);sg(!1);su("Đăng nhập thành công nhưng chưa tải được dữ liệu. Hãy tải lại trang; nếu vẫn lỗi, báo quản trị viên. "+(loadError.code||""));return}let ');
hotfixOnce('sg(!0),su(a?', 'apsoCloudReady=!0,sg(!0),su(a?');

const exportModule = fs.readFileSync(path.join(root, 'list-export.js'), 'utf8').replace(/\nif\(typeof module[^\n]+\n?$/, '\n');
const exportIntegration = fs.readFileSync(path.join(root, 'list-export-integration.js'), 'utf8');
hotfixOnce('function tv(){var e,t,l,k,I,K,L,B,V,P,q,F,X;', exportModule + '\nfunction tv(){var e,t,l,k,I,K,L,B,V,P,q,F,X;');
hotfixOnce('function aq(){return s1.map(', 'function aq(records=s1){return records.map(');
hotfixOnce('function aX(){e3("cong-dan-so-nhan-khau.xlsx","Nhan khau",eJ,aq())}', exportIntegration + '\nfunction aX(){apsoOpenListExport("residents")}');
hotfixOnce('e3("cong-dan-so-ho-khau.xlsx","Ho khau",e$,tA.map(e=>[e.id,e.headName,e.type,e.province,e.commune,e.hamlet,e.group,e.detailAddress,e.address,e.latitude,e.longitude,e.photoUrl,e.memberCount,e.createdAt]))', 'apsoOpenListExport("households")');

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
new (require('vm').Script)(code, { filename: 'apso-generated-bundle.js' });
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
