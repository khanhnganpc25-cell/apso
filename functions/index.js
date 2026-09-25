"use strict";

const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");

initializeApp();

function json(response, status, payload) {
  response.status(status).set("Cache-Control", "no-store").json(payload);
}

exports.adminResetPassword = onRequest(
  {
    region: "us-central1",
    cors: [
      "https://apso-vn.web.app",
      "https://apso-vn.firebaseapp.com",
      "http://127.0.0.1:4173",
      "http://localhost:4173"
    ],
    invoker: "public",
  },
  async (request, response) => {
    if (request.method !== "POST") {
      return json(response, 405, { error: "Chỉ chấp nhận yêu cầu POST." });
    }

    const authorization = String(request.get("Authorization") || "");
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) {
      return json(response, 401, { error: "Phiên đăng nhập không hợp lệ." });
    }

    try {
      const decoded = await getAuth().verifyIdToken(match[1], true);
      const db = getFirestore();
      const adminDocument = await db.doc(`users/${decoded.uid}`).get();
      const adminProfile = adminDocument.data();

      if (!adminDocument.exists || adminProfile?.role !== "ADMIN" || adminProfile?.active !== true) {
        return json(response, 403, { error: "Chỉ Admin đang hoạt động mới được cấp lại mật khẩu." });
      }

      const targetUid = String(request.body?.targetUid || "").trim();
      const newPassword = String(request.body?.newPassword || "");
      if (!targetUid) {
        return json(response, 400, { error: "Tài khoản cần cấp lại mật khẩu không hợp lệ." });
      }
      if (targetUid === decoded.uid) {
        return json(response, 400, { error: "Admin hãy dùng chức năng Đổi mật khẩu cho chính mình." });
      }
      if (newPassword.length < 8 || newPassword.length > 128 || !/[A-Za-zÀ-ỹ]/u.test(newPassword) || !/\d/.test(newPassword)) {
        return json(response, 400, { error: "Mật khẩu mới phải từ 8 ký tự, có chữ và có số." });
      }

      const targetDocument = await db.doc(`users/${targetUid}`).get();
      if (!targetDocument.exists || targetDocument.data()?.active !== true) {
        return json(response, 404, { error: "Không tìm thấy tài khoản đang hoạt động." });
      }

      await getAuth().updateUser(targetUid, { password: newPassword });
      await getAuth().revokeRefreshTokens(targetUid);
      await db.collection("securityAuditLogs").add({
        action: "ADMIN_RESET_PASSWORD",
        actorUid: decoded.uid,
        actorEmail: decoded.email || "",
        targetUid,
        targetEmail: targetDocument.data()?.email || "",
        createdAt: FieldValue.serverTimestamp(),
      });
      await db.doc(`users/${targetUid}`).set(
        {
          passwordResetAt: FieldValue.serverTimestamp(),
          passwordResetBy: decoded.uid,
        },
        { merge: true },
      );

      return json(response, 200, { ok: true });
    } catch (error) {
      console.error("adminResetPassword failed", error);
      if (error?.code === "auth/id-token-revoked" || error?.code === "auth/id-token-expired") {
        return json(response, 401, { error: "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại." });
      }
      return json(response, 500, { error: "Không thể cấp lại mật khẩu lúc này." });
    }
  },
);
