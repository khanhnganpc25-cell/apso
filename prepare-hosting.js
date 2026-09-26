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

fs.copyFileSync(path.join(root, "site-snapshot.html"), path.join(output, "index.html"));

const assetLinksSource = path.join(root, "android-app", "assetlinks.json");
if (fs.existsSync(assetLinksSource)) {
  const wellKnown = path.join(output, ".well-known");
  fs.mkdirSync(wellKnown, { recursive: true });
  fs.copyFileSync(assetLinksSource, path.join(wellKnown, "assetlinks.json"));
}

console.log(`Prepared Firebase Hosting assets in ${output}`);
