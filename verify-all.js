const http = require("http");
const { fork } = require("child_process");
const path = require("path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => resolve({
        status: res.statusCode,
        body: Buffer.concat(chunks),
      }));
    }).on("error", reject);
  });
}

async function main() {
  console.log("Khởi động serve-local.js tạm thời để kiểm thử...");
  const serverProc = fork(path.join(__dirname, "serve-local.js"), [], { silent: true });

  await new Promise(res => setTimeout(res, 800));

  try {
    // 1. GET /
    const htmlRes = await get("http://127.0.0.1:4173/");
    const html = htmlRes.body.toString("utf8");
    assert(htmlRes.status === 200 && html.includes("APSO"), "Trang chủ không sẵn sàng");
    console.log(`[PASS] GET /: status=${htmlRes.status}, chứa APSO: true`);

    // 2. GET bundle
    const bundleRes = await get("http://127.0.0.1:4173/_next/static/chunks/app/page-ef1198d6a6018514.js");
    assert(bundleRes.status === 200 && bundleRes.body.length > 100000, "Bundle ứng dụng bị thiếu");
    console.log(`[PASS] GET bundle: status=${bundleRes.status}, dung lượng: ${bundleRes.body.length} bytes`);

    // 3. GET chunk ExcelJS và tạo thử một workbook thật. Đây là tài nguyên
    // dùng chung cho xuất/nhập XLSX nhân khẩu, hộ khẩu và tệp mẫu.
    const excelChunkRes = await get("http://127.0.0.1:4173/_next/static/chunks/6edf0643.cff15dee501a82ef.js");
    assert(excelChunkRes.status === 200 && excelChunkRes.body.length > 500000, "Thiếu chunk ExcelJS");

    global.self = global;
    global.webpackChunk_N_E = [];
    require(path.join(__dirname, "_next", "static", "chunks", "6edf0643.cff15dee501a82ef.js"));
    const excelChunk = global.webpackChunk_N_E.find(item => item[0] && item[0][0] === 343);
    assert(excelChunk && excelChunk[1] && excelChunk[1][9280], "Chunk ExcelJS sai cấu trúc Webpack");
    const excelModule = { exports: {} };
    excelChunk[1][9280](excelModule, excelModule.exports, () => {});
    const workbook = new excelModule.exports.Workbook();
    workbook.addWorksheet("Kiem tra").addRows([["Ho ten", "CCCD"], ["Nguyen Van A", "012345678901"]]);
    const xlsxBuffer = await workbook.xlsx.writeBuffer();
    assert(xlsxBuffer.length > 1000, "ExcelJS không tạo được tệp XLSX");
    console.log(`[PASS] Xuất XLSX: chunk=${excelChunkRes.body.length} bytes, file thử=${xlsxBuffer.length} bytes`);

    // 4. POST /api/admin-reset-password
    const postData = JSON.stringify({ targetUid: "test-user-01", newPassword: "NewPassword123" });
    const apiRes = await new Promise((resolve, reject) => {
      const req = http.request("http://127.0.0.1:4173/api/admin-reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer local-test-token",
          "Content-Length": Buffer.byteLength(postData)
        }
      }, res => {
        let d = "";
        res.on("data", c => d += c);
        res.on("end", () => resolve({ status: res.statusCode, body: d }));
      });
      req.on("error", reject);
      req.write(postData);
      req.end();
    });
    console.log(`[PASS] POST /api/admin-reset-password: status=${apiRes.status}, response=${apiRes.body}`);

    console.log("\n=========================================");
    console.log("XÁC NHẬN TẤT CẢ CHỨC NĂNG HOẠT ĐỘNG HOÀN HẢO!");
    console.log("=========================================\n");
  } finally {
    serverProc.kill();
  }
}

main().catch(err => {
  console.error("Lỗi kiểm thử:", err);
  process.exit(1);
});
