const fs = require("fs");
const path = require("path");

const root = __dirname;
const output = path.join(root, "hosting-public");

// Bundle gốc tải ExcelJS theo chunk 343. Bản phục hồi phải tái tạo chunk này
// trước khi sao chép tài nguyên, nếu không mọi nút xuất/nhập XLSX đều im lặng.
require("./build-exceljs-chunk").buildExcelJsChunk();

if (path.dirname(output) !== root || path.basename(output) !== "hosting-public") {
  throw new Error(`Unsafe hosting output path: ${output}`);
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const directory of ["_next", "icons", "vendor", "download"]) {
  const dirPath = path.join(root, directory);
  if (fs.existsSync(dirPath)) {
    fs.cpSync(dirPath, path.join(output, directory), { recursive: true });
  }
}

// Không phát hành các bản sao lưu/bundle nguồn phục hồi ra Hosting công khai.
const publicAppChunks = path.join(output, "_next", "static", "chunks", "app");
if (fs.existsSync(publicAppChunks)) {
  for (const entry of fs.readdirSync(publicAppChunks)) {
    if (entry.includes(".unified-master") || entry.includes(".bak-") || entry.includes(".before-")) {
      fs.rmSync(path.join(publicAppChunks, entry), { force: true });
    }
  }
}

for (const file of ["cong-dan-so-logo.svg", "favicon.ico", "manifest.webmanifest"]) {
  const filePath = path.join(root, file);
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, path.join(output, file));
  }
}

// The recovered app uses a stable chunk filename even when its contents change.
// Version both script and RSC references so existing web/app caches get hotfixes.
const appChunkName = "page-ef1198d6a6018514.js";
const appChunk = fs.readFileSync(path.join(root, "_next/static/chunks/app", appChunkName));
const appRevision = require("crypto").createHash("sha256").update(appChunk).digest("hex").slice(0, 12);
const snapshot = fs.readFileSync(path.join(root, "site-snapshot.html"), "utf8");
fs.writeFileSync(path.join(output, "index.html"), snapshot.replaceAll(appChunkName, `${appChunkName}?v=${appRevision}`));

const assetLinksSource = path.join(root, "android-app", "assetlinks.json");
if (fs.existsSync(assetLinksSource)) {
  const wellKnown = path.join(output, ".well-known");
  fs.mkdirSync(wellKnown, { recursive: true });
  fs.copyFileSync(assetLinksSource, path.join(wellKnown, "assetlinks.json"));
}

console.log(`Prepared Firebase Hosting assets in ${output}`);
