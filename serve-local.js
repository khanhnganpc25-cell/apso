const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname);
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  // Hỗ trợ endpoint API cấp lại mật khẩu trên máy chủ thử nghiệm cục bộ
  if (pathname === "/api/admin-reset-password") {
    if (request.method !== "POST") {
      response.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "Chỉ chấp nhận yêu cầu POST." }));
      return;
    }
    let body = "";
    request.on("data", chunk => { body += chunk; });
    request.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const auth = request.headers["authorization"] || "";
        if (!auth.startsWith("Bearer ")) {
          response.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ error: "Phiên đăng nhập không hợp lệ trên môi trường cục bộ." }));
          return;
        }
        console.log(`[LOCAL DEV] Mô phỏng cấp lại mật khẩu thành công cho UID: ${payload.targetUid}`);
        response.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        });
        response.end(JSON.stringify({
          ok: true,
          mode: "local_mock",
          targetUid: payload.targetUid,
          message: "Đã cấp lại mật khẩu trong môi trường nội bộ."
        }));
      } catch {
        response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "Dữ liệu yêu cầu không hợp lệ." }));
      }
    });
    return;
  }

  if (pathname === "/" || pathname === "/index.html") pathname = "/site-snapshot.html";
  const filePath = path.resolve(root, `.${pathname}`);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) {
      // Thử tìm trong hosting-public nếu ở root không có
      const hostingPath = path.resolve(root, "hosting-public", `.${pathname}`);
      if (fs.existsSync(hostingPath) && fs.statSync(hostingPath).isFile()) {
        response.writeHead(200, {
          "Content-Type": contentTypes[path.extname(hostingPath)] || "application/octet-stream",
          "Cache-Control": "no-store",
        });
        fs.createReadStream(hostingPath).pipe(response);
        return;
      }

      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filePath).pipe(response);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`APSO local recovery server: http://127.0.0.1:${port}`);
});
