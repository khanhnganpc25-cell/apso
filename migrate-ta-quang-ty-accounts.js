const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const projectId = "apso-vn";
const apiKey = "AIzaSyCwxLbQixXKeOnd2TlZV69PfwRZ91lSf0k";
const adminEmail = "khanhnganpc25@gmail.com";
const tempDir = path.join(__dirname, "tmp", "account-migration");
const privateFile = path.join(tempDir, "new-accounts-private.json");
const resultFile = path.join(tempDir, "migration-result.json");
const firebaseConfigFile = path.join(
  process.env.USERPROFILE,
  ".config",
  "configstore",
  "firebase-tools.json",
);

const P = {
  VIEW_RESIDENTS: "Xem nhân khẩu",
  CREATE_RESIDENTS: "Thêm nhân khẩu",
  EDIT_RESIDENTS: "Sửa nhân khẩu",
  VIEW_HOUSEHOLDS: "Xem hộ khẩu",
  CREATE_HOUSEHOLDS: "Thêm hộ khẩu",
  EDIT_HOUSEHOLDS: "Sửa hộ khẩu",
  VIEW_REPORTS: "Xem báo cáo",
  SUBMIT_REPORTS: "Gửi báo cáo",
  APPROVE_REPORTS: "Duyệt báo cáo",
  VIEW_TASKS: "Xem nhiệm vụ",
  ASSIGN_TASKS: "Phân công nhiệm vụ",
  UPDATE_ASSIGNED_TASKS: "Cập nhật việc được giao",
  APPROVE_TASKS: "Duyệt hoàn thành nhiệm vụ",
  EXPORT_DATA: "Xuất dữ liệu",
  VIEW_SENSITIVE_DATA: "Xem thông tin nhạy cảm",
  VIEW_MAP_PHOTOS: "Xem ảnh/tọa độ",
};

const securityMember = [
  "VIEW_RESIDENTS",
  "VIEW_HOUSEHOLDS",
  "VIEW_TASKS",
  "UPDATE_ASSIGNED_TASKS",
  "VIEW_MAP_PHOTOS",
];
const securityLeader = [
  ...securityMember,
  "EDIT_RESIDENTS",
  "EDIT_HOUSEHOLDS",
  "ASSIGN_TASKS",
  "VIEW_REPORTS",
];
const leadership = [
  "VIEW_RESIDENTS",
  "VIEW_HOUSEHOLDS",
  "VIEW_REPORTS",
  "VIEW_TASKS",
  "ASSIGN_TASKS",
  "APPROVE_TASKS",
  "APPROVE_REPORTS",
  "EXPORT_DATA",
  "VIEW_MAP_PHOTOS",
];
const deputyLeader = [
  "VIEW_RESIDENTS",
  "CREATE_RESIDENTS",
  "EDIT_RESIDENTS",
  "VIEW_HOUSEHOLDS",
  "CREATE_HOUSEHOLDS",
  "EDIT_HOUSEHOLDS",
  "VIEW_REPORTS",
  "SUBMIT_REPORTS",
  "VIEW_TASKS",
  "ASSIGN_TASKS",
  "UPDATE_ASSIGNED_TASKS",
  "APPROVE_TASKS",
  "EXPORT_DATA",
  "VIEW_MAP_PHOTOS",
];
const hamletLeader = [...deputyLeader, "APPROVE_REPORTS", "VIEW_SENSITIVE_DATA"];
const massOrganization = [
  "VIEW_RESIDENTS",
  "VIEW_HOUSEHOLDS",
  "VIEW_REPORTS",
  "SUBMIT_REPORTS",
  "VIEW_TASKS",
  "UPDATE_ASSIGNED_TASKS",
];
const militaryLeader = [
  "VIEW_RESIDENTS",
  "CREATE_RESIDENTS",
  "EDIT_RESIDENTS",
  "VIEW_HOUSEHOLDS",
  "VIEW_REPORTS",
  "SUBMIT_REPORTS",
  "VIEW_TASKS",
  "ASSIGN_TASKS",
  "UPDATE_ASSIGNED_TASKS",
  "VIEW_SENSITIVE_DATA",
  "VIEW_MAP_PHOTOS",
];

const accounts = [
  ["USR-TQT-001", "Tổ trưởng Bảo vệ ANTT", "Tổ trưởng Bảo vệ ANTT", "antt.to01@apso.vn", "SECURITY", securityLeader, "Điều phối 6 thành viên, tiếp nhận và phân công nhiệm vụ bảo đảm ANTT."],
  ["USR-TQT-002", "Tổ viên Bảo vệ ANTT 02", "Tổ viên Bảo vệ ANTT", "antt.to02@apso.vn", "SECURITY", securityMember, "Thực hiện nhiệm vụ bảo đảm ANTT được Tổ trưởng phân công."],
  ["USR-TQT-003", "Tổ viên Bảo vệ ANTT 03", "Tổ viên Bảo vệ ANTT", "antt.to03@apso.vn", "SECURITY", securityMember, "Thực hiện nhiệm vụ bảo đảm ANTT được Tổ trưởng phân công."],
  ["USR-TQT-004", "Tổ viên Bảo vệ ANTT 04", "Tổ viên Bảo vệ ANTT", "antt.to04@apso.vn", "SECURITY", securityMember, "Thực hiện nhiệm vụ bảo đảm ANTT được Tổ trưởng phân công."],
  ["USR-TQT-005", "Tổ viên Bảo vệ ANTT 05", "Tổ viên Bảo vệ ANTT", "antt.to05@apso.vn", "SECURITY", securityMember, "Thực hiện nhiệm vụ bảo đảm ANTT được Tổ trưởng phân công."],
  ["USR-TQT-006", "Tổ viên Bảo vệ ANTT 06", "Tổ viên Bảo vệ ANTT", "antt.to06@apso.vn", "SECURITY", securityMember, "Thực hiện nhiệm vụ bảo đảm ANTT được Tổ trưởng phân công."],
  ["USR-TQT-007", "Bí thư Chi bộ", "Bí thư Chi bộ", "bithu.chibo.tqt@apso.vn", "LEADERSHIP", leadership, "Theo dõi tổng hợp, giao nhiệm vụ và duyệt báo cáo thuộc phạm vi Chi bộ."],
  ["USR-TQT-008", "Trưởng ấp", "Trưởng ấp", "truongap.tqt@apso.vn", "HAMLET_LEADER", hamletLeader, "Điều hành công việc ấp, quản lý dân cư, giao việc và duyệt báo cáo."],
  ["USR-TQT-009", "Phó Trưởng ấp", "Phó Trưởng ấp", "photruongap.tqt@apso.vn", "LEADERSHIP", deputyLeader, "Hỗ trợ Trưởng ấp quản lý dân cư, hộ khẩu, nhiệm vụ và báo cáo."],
  ["USR-TQT-010", "Trưởng ban Công tác Mặt trận", "Mặt trận", "mattran.tqt@apso.vn", "OFFICER", massOrganization, "Theo dõi công tác Mặt trận, tổng hợp đối tượng và cập nhật nhiệm vụ được giao."],
  ["USR-TQT-011", "Chi hội trưởng Nông dân", "Nông dân", "nongdan.tqt@apso.vn", "OFFICER", massOrganization, "Theo dõi hội viên Nông dân và cập nhật nhiệm vụ, báo cáo chuyên trách."],
  ["USR-TQT-012", "Bí thư Chi đoàn", "Bí thư Chi đoàn", "bithu.chidoan.tqt@apso.vn", "OFFICER", massOrganization, "Theo dõi đoàn viên, thanh niên và cập nhật nhiệm vụ, báo cáo chuyên trách."],
  ["USR-TQT-013", "Chi hội trưởng Cựu chiến binh", "Cựu chiến binh", "cuuchienbinh.tqt@apso.vn", "OFFICER", massOrganization, "Theo dõi hội viên Cựu chiến binh và cập nhật nhiệm vụ, báo cáo chuyên trách."],
  ["USR-TQT-014", "Ấp đội trưởng", "Ấp đội trưởng", "apdoitruong.tqt@apso.vn", "SECURITY", militaryLeader, "Theo dõi nguồn nghĩa vụ quân sự, lực lượng dân quân và nhiệm vụ quốc phòng địa phương."],
  ["USR-TQT-015", "Phó Bí thư Chi bộ", "Phó Bí thư Chi bộ", "phobithu.chibo.tqt@apso.vn", "LEADERSHIP", leadership, "Hỗ trợ Bí thư Chi bộ theo dõi, giao nhiệm vụ và duyệt báo cáo."],
  ["USR-TQT-016", "Chi hội trưởng Phụ nữ", "Phụ nữ ấp", "phunu.tqt@apso.vn", "OFFICER", massOrganization, "Theo dõi hội viên Phụ nữ và cập nhật nhiệm vụ, báo cáo chuyên trách."],
].map(([id, name, title, email, role, permissions, assignedDuties]) => ({
  id,
  name,
  title,
  position: title,
  email,
  role,
  permissions,
  permissionLabels: permissions.map((item) => P[item]),
  assignedDuties,
  scope: {
    province: "An Giang",
    commune: "Xã Vĩnh Hòa Hưng",
    hamlet: "Ấp Tạ Quang Tỷ",
    group: "",
  },
  permissionStart: "",
  permissionEnd: "",
  canDelegate: false,
  active: true,
}));

function password() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let random = "";
  for (let index = 0; index < 7; index += 1) {
    random += alphabet[crypto.randomInt(alphabet.length)];
  }
  return `Apso@${random}7`;
}

function firestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return { integerValue: String(value) };
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, firestoreValue(item)]),
        ),
      },
    };
  }
  return { stringValue: String(value) };
}

function firestoreDocument(data) {
  return {
    fields: Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, firestoreValue(value)]),
    ),
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || body?.error || `HTTP ${response.status}`;
    const error = new Error(typeof message === "string" ? message : JSON.stringify(message));
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function batchDelete(accessToken, localIds) {
  if (!localIds.length) return;
  const result = await requestJson(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:batchDelete`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ localIds, force: true }),
    },
  );
  if (Array.isArray(result.errors) && result.errors.length) {
    throw new Error(`Không xóa được một số tài khoản: ${JSON.stringify(result.errors)}`);
  }
}

async function main() {
  fs.mkdirSync(tempDir, { recursive: true });
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigFile, "utf8"));
  const accessToken = firebaseConfig?.tokens?.access_token;
  if (!accessToken) throw new Error("Không tìm thấy phiên đăng nhập Firebase CLI.");

  const privateState = fs.existsSync(privateFile)
    ? JSON.parse(fs.readFileSync(privateFile, "utf8"))
    : { accounts: accounts.map((account) => ({ ...account, password: password() })) };
  const plannedByEmail = new Map(privateState.accounts.map((account) => [account.email, account]));

  const current = await requestJson(
    `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:batchGet?maxResults=1000`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const currentUsers = current.users || [];
  const admin = currentUsers.find((user) => user.email?.toLowerCase() === adminEmail);
  if (!admin) throw new Error(`Không tìm thấy Admin ${adminEmail}; dừng để tránh xóa nhầm.`);

  const oldUsers = currentUsers.filter(
    (user) => user.localId !== admin.localId && !plannedByEmail.has(user.email?.toLowerCase()),
  );
  const existingByEmail = new Map(
    currentUsers.map((user) => [String(user.email || "").toLowerCase(), user]),
  );
  const newlyCreated = [];

  try {
    for (const account of privateState.accounts) {
      let authUser = existingByEmail.get(account.email);
      if (!authUser) {
        authUser = await requestJson(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: account.email,
              password: account.password,
              displayName: account.name,
              emailVerified: false,
              disabled: false,
              returnSecureToken: false,
            }),
          },
        );
        newlyCreated.push(authUser.localId);
      } else {
        await requestJson(
          `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              localId: authUser.localId,
              password: account.password,
              displayName: account.name,
            }),
          },
        );
      }
      account.firebaseUid = authUser.localId;
      const userDocument = {
        id: account.id,
        firebaseUid: account.firebaseUid,
        name: account.name,
        email: account.email,
        password: "",
        role: account.role,
        title: account.title,
        position: account.position,
        scope: account.scope,
        permissions: account.permissions,
        assignedDuties: account.assignedDuties,
        permissionStart: "",
        permissionEnd: "",
        canDelegate: false,
        active: true,
        updatedAt: new Date().toISOString(),
      };
      await requestJson(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${account.firebaseUid}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "x-goog-user-project": projectId,
          },
          body: JSON.stringify(firestoreDocument(userDocument)),
        },
      );
    }
  } catch (error) {
    await batchDelete(accessToken, newlyCreated).catch(() => {});
    throw error;
  }

  await batchDelete(accessToken, oldUsers.map((user) => user.localId));
  const failedDocumentDeletes = [];
  for (const user of oldUsers) {
    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${user.localId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-goog-user-project": projectId,
          },
        },
      );
      if (!response.ok && response.status !== 404) failedDocumentDeletes.push(user.email);
    } catch {
      failedDocumentDeletes.push(user.email);
    }
  }

  fs.writeFileSync(privateFile, JSON.stringify(privateState, null, 2), "utf8");
  fs.writeFileSync(
    resultFile,
    JSON.stringify(
      {
        keptAdmin: { email: admin.email, localId: admin.localId },
        deletedOldAccounts: oldUsers.map((user) => user.email),
        createdAccounts: privateState.accounts.map(({ password: _password, ...account }) => account),
        failedDocumentDeletes,
        completedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(
    JSON.stringify({
      keptAdmin: admin.email,
      deletedOldAccounts: oldUsers.map((user) => user.email),
      createdCount: privateState.accounts.length,
      failedDocumentDeletes,
    }),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
