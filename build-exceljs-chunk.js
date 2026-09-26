const fs = require("fs");
const path = require("path");

const root = __dirname;
const excelJsBundle = path.join(root, "node_modules", "exceljs", "dist", "exceljs.min.js");
const chunkName = "6edf0643.cff15dee501a82ef.js";

function buildExcelJsChunk() {
  if (!fs.existsSync(excelJsBundle)) {
    throw new Error("Thiếu exceljs. Hãy chạy npm install trước khi đóng gói.");
  }

  const vendorCode = fs.readFileSync(excelJsBundle, "utf8");
  const chunkCode =
    "(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[343],{" +
    "9280:function(module,exports,__webpack_require__){" +
    vendorCode +
    "\n}}]);\n";

  const targets = [
    path.join(root, "_next", "static", "chunks", chunkName),
    path.join(root, "hosting-public", "_next", "static", "chunks", chunkName),
  ];

  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, chunkCode, "utf8");
    console.log(`[OK] Đã tạo mô-đun xuất Excel: ${target}`);
  }

  return targets;
}

if (require.main === module) {
  buildExcelJsChunk();
}

module.exports = { buildExcelJsChunk };
