// Publish the signed Capacitor APK from android/, not the legacy android-app/.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const repo = 'khanhnganpc25-cell/apso';
const tag = process.env.APSO_RELEASE_TAG || 'v2.1.2';
const apkPath = path.join(__dirname, 'android/app/build/outputs/apk/release/app-release.apk');
const token = process.env.GITHUB_TOKEN;
const headers = { Authorization: `Bearer ${token}`, 'User-Agent': 'APSO-release', Accept: 'application/vnd.github+json' };
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function api(route, method='GET', body) {
  const response = await fetch(`https://api.github.com/repos/${repo}${route}`, {
    method, headers: {...headers, 'Content-Type':'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw Error(`GitHub ${method} ${route}: ${response.status} ${data.message || ''}`);
  return data;
}
async function main() {
  if (!token) throw Error('GITHUB_TOKEN is required');
  if (!/^v\d+\.\d+\.\d+$/.test(tag)) throw Error('Invalid release tag');
  const apk = fs.readFileSync(apkPath);
  const digest = sha256(apk);
  const commit = cp.execFileSync('git',['rev-parse','HEAD'],{cwd:__dirname,encoding:'utf8'}).trim();
  const remote = await api('/commits/main');
  if (remote.sha !== commit) throw Error('Push the validated source commit to main before publishing');
  const name = 'APSO-Quan-Ly-Dan-Cu-So.apk';
  const release = await api('/releases','POST',{
    tag_name:tag,target_commitish:commit,name:`APSO ${tag} – Android nội bộ`,draft:true,
    body:`Bản Capacitor từ thư mục android/.\n\nXuất danh sách sau lọc hoặc toàn bộ dữ liệu trong quyền truy cập. Chọn nhiều nhóm, từng dòng, số lượng; gộp một sheet hoặc chia nhiều sheet trong một file XLSX. Bổ sung lưu/chia sẻ Excel trên Android qua Filesystem và Share. Nội dung web tải từ https://apso-vn.web.app. Giữ chứng chỉ của bản cũ để hỗ trợ cài đè; APK tắt chế độ gỡ lỗi. Chưa kiểm tra cài trên điện thoại thật. Thông báo đẩy khi đóng app chưa được triển khai.\n\nSHA-256: ${digest}\nMã nguồn: ${commit}`
  });
  const base = release.upload_url.replace(/\{.*$/, '');
  for (const [fileName, bytes, contentType] of [
    [name,apk,'application/vnd.android.package-archive'],
    ['SHA256SUMS.txt',Buffer.from(`${digest}  ${name}\n`),'text/plain']
  ]) {
    const response = await fetch(`${base}?name=${encodeURIComponent(fileName)}`,{
      method:'POST',headers:{...headers,'Content-Type':contentType},body:bytes
    });
    const asset = await response.json();
    if (!response.ok || asset.size !== bytes.length) throw Error(`Asset upload failed (${response.status}); release remains draft`);
  }
  await api(`/releases/${release.id}`,'PATCH',{draft:false});
  const url = `https://github.com/${repo}/releases/download/${tag}/${name}`;
  const response = await fetch(url);
  if (!response.ok) throw Error(`Published APK download failed: ${response.status}`);
  if (sha256(Buffer.from(await response.arrayBuffer())) !== digest) throw Error('Published APK checksum mismatch');
  console.log(JSON.stringify({release:release.html_url,apk:url,bytes:apk.length,sha256:digest,commit},null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1});
