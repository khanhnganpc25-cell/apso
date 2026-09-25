const fs = require("fs");
const path = require("path");

const appDir = path.join(__dirname, "hosting-public", "_next", "static", "chunks", "app");
const bundle = fs
  .readdirSync(appDir)
  .find((name) => /^page-.*\.js$/.test(name) && !name.includes(".before-"));
if (!bundle) throw new Error("Không tìm thấy bundle trang chính.");

const bundlePath = path.join(appDir, bundle);
const backupPath = `${bundlePath}.before-admin-only-visibility`;
let source = fs.readFileSync(bundlePath, "utf8");
const oldCode = 'sP=sV("MANAGE_USERS")';
const newCode = 'sP=(null==tL?void 0:tL.role)==="ADMIN"';

if (source.includes(newCode)) {
  console.log("Admin-only visibility patch already applied.");
  process.exit(0);
}
const count = source.split(oldCode).length - 1;
if (count !== 1) throw new Error(`Cần đúng 1 vị trí MANAGE_USERS, tìm thấy ${count}.`);
if (!fs.existsSync(backupPath)) fs.copyFileSync(bundlePath, backupPath);
source = source.replace(oldCode, newCode);
fs.writeFileSync(bundlePath, source, "utf8");
console.log(`Patched ${bundlePath}`);
