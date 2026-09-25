const fs = require("fs");
const path = require("path");
const https = require("https");

const token = process.env.GITHUB_TOKEN || "";
const repo = "khanhnganpc25-cell/apso";
const tag = "v2.1.0";
const apkPath = path.join(__dirname, "APSO-Quan-Ly-Dan-Cu-So.apk");

if (!fs.existsSync(apkPath)) {
  console.error("APK not found at:", apkPath);
  process.exit(1);
}

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body || "{}") });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  if (!token) {
    console.log("GITHUB_TOKEN not provided, skipping upload.");
    return;
  }
  console.log("Checking / Creating GitHub Release for", tag);
  
  let releaseRes = await request({
    hostname: "api.github.com",
    path: `/repos/${repo}/releases`,
    method: "POST",
    headers: {
      "User-Agent": "Node-Uploader",
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    }
  }, JSON.stringify({
    tag_name: tag,
    target_commitish: "main",
    name: `APSO v2.1.0 - Bản cài đặt Android (Nội bộ)`,
    body: "Bản phát hành ứng dụng APSO Quản lý Dân cư số (Android APK nội bộ) giao diện chuẩn Zalo và cập nhật OTA.",
    draft: false,
    prerelease: false
  }));

  let releaseData = releaseRes.data;
  if (releaseRes.status !== 201) {
    const listRes = await request({
      hostname: "api.github.com",
      path: `/repos/${repo}/releases/tags/${tag}`,
      method: "GET",
      headers: {
        "User-Agent": "Node-Uploader",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });
    releaseData = listRes.data;
  }

  if (!releaseData.upload_url) {
    throw new Error("No upload_url in release response");
  }

  const uploadUrl = new URL(releaseData.upload_url.replace(/\{.*\}/, ""));
  uploadUrl.searchParams.set("name", "APSO-Quan-Ly-Dan-Cu-So.apk");

  const apkStats = fs.statSync(apkPath);
  console.log(`Uploading APK asset (${(apkStats.size / 1024 / 1024).toFixed(2)} MB)...`);

  const fileStream = fs.createReadStream(apkPath);
  
  await new Promise((resolve, reject) => {
    const uploadReq = https.request({
      hostname: uploadUrl.hostname,
      path: uploadUrl.pathname + uploadUrl.search,
      method: "POST",
      headers: {
        "User-Agent": "Node-Uploader",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Length": apkStats.size
      }
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          const resObj = JSON.parse(body || "{}");
          console.log("Asset download URL:", resObj.browser_download_url);
          resolve(resObj);
        } catch(e) {
          resolve(body);
        }
      });
    });
    uploadReq.on("error", reject);
    fileStream.pipe(uploadReq);
  });

  console.log("Successfully uploaded APK to GitHub Release!");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
