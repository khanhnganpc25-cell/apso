// APSO_SCOPED_LOGIN_FIX_V1 — embedded into the application bundle by the build.
// eo.P = Firestore query; eo._M = where. Keep server authorization unchanged.
let apsoCloudReady = false;
function apsoResetCloudRead() { apsoCloudReady = false; ex.clear(); }
function apsoAreaFilters() {
  const scope = ep && ep.scope;
  if (!scope || typeof scope !== "object" || Array.isArray(scope)) return [];
  return ["province", "commune", "hamlet", "group"]
    .filter(field => typeof scope[field] === "string" && scope[field] !== "")
    .map(field => (0,eo._M)(field, "==", scope[field]));
}
async function ew(database, collectionName) {
  const collection = (0,eo.rJ)(database, collectionName);
  const admin = ep && ep.role === "ADMIN";
  let queries;
  if (admin) queries = [collection];
  else if (collectionName === "notifications") {
    const {auth} = eh();
    const uid = auth && auth.currentUser && auth.currentUser.uid;
    if (!uid) throw Error("Không tìm thấy phiên đăng nhập.");
    queries = [
      (0,eo.P)(collection, (0,eo._M)("assigneeUid", "==", uid)),
      (0,eo.P)(collection, (0,eo._M)("creatorUid", "==", uid))
    ];
    if (ej(["VIEW_TASKS", "ASSIGN_TASKS", "APPROVE_TASKS"])) {
      queries.push((0,eo.P)(collection, ...apsoAreaFilters()));
    }
  } else {
    queries = [(0,eo.P)(collection, ...apsoAreaFilters())];
  }
  const snapshots = await Promise.all(queries.map(query => (0,eo.GG)(query)));
  const documents = new Map();
  snapshots.forEach(snapshot => snapshot.docs.forEach(doc => documents.set(doc.id, ef(doc.data()))));
  const records = Array.from(documents.values());
  ex.set(collectionName, new Map(records.map(record => [record.id, eN(record)])));
  return records;
}
