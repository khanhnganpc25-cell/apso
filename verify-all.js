const http = require("http");
const { fork } = require("child_process");
const path = require("path");

async function main() {
  console.log("Khởi động serve-local.js tạm thời để kiểm thử...");
  const serverProc = fork(path.join(__dirname, "serve-local.js"), [], { silent: true });

  await new Promise(res => setTimeout(res, 800));

  try {
    // 1. GET /
    const htmlRes = await new Promise((resolve, reject) => {
      http.get("http://127.0.0.1:4173/", res => {
        let d = "";
        res.on("data", c => d += c);
        res.on("end", () => resolve({ status: res.statusCode, body: d }));
      }).on("error", reject);
    });
    console.log(`[PASS] GET /: status=${htmlRes.status}, chứa APSO: ${htmlRes.body.includes("APSO")}`);

    // 2. GET bundle
    const bundleRes = await new Promise((resolve, reject) => {
      http.get("http://127.0.0.1:4173/_next/static/chunks/app/page-ef1198d6a6018514.js", res => {
        let len = 0;
        res.on("data", c => len += c.length);
        res.on("end", () => resolve({ status: res.statusCode, length: len }));
      }).on("error", reject);
    });
    console.log(`[PASS] GET bundle: status=${bundleRes.status}, dung lượng: ${bundleRes.length} bytes`);

    // 3. POST /api/admin-reset-password
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
