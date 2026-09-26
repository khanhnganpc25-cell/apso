# APSO Android nội bộ

App phát hành dùng Capacitor trong `android/`, mã `vn.apso.app`, mở `https://apso-vn.web.app`. `android-app/` là dự án cũ, không dùng để tạo APK mới.

## Tạo bản phát hành

Yêu cầu Node 20+, Java 21, Android SDK 35. Các gói Capacitor được khóa cùng phiên bản 7.6.9 để build có thể lặp lại.

1. `npm ci`
2. `npm run build:bundle`
3. `npm run prepare-hosting`
4. `npx cap sync android`
5. `cd android` rồi `./gradlew assembleRelease` (Windows: `gradlew.bat assembleRelease`).

APK ở `android/app/build/outputs/apk/release/app-release.apk`. Phiên bản hiện tại: 2.1.2, versionCode 3. Mỗi lần phát hành APK phải tăng versionCode.

Bản 2.1.2 thêm Filesystem và Share để xuất XLSX vào cache riêng của app rồi mở hộp lưu/chia sẻ Android. Bản app cũ không có hai plugin sẽ báo cần cập nhật, không báo tải thành công giả. Kiểm tra hồi quy: `node tests/list-export.test.cjs` và `node tests/list-export-browser.cjs` (cần Edge). Dữ liệu kiểm thử là dữ liệu giả, không tải hồ sơ thật lên dịch vụ ngoài.

Bản 2.1.0 đang phát hành được ký bằng chứng chỉ Android Debug có SHA-256 `3d2cfdf7bfcbc72700c4e3908ed3555799ecf5e5421a0f79f423f00d709d2483`. Bản cập nhật nội bộ giữ đúng chứng chỉ này để cài đè, nhưng tắt debuggable. Đây chưa phải quy trình ký phát hành Google Play. Không thay khóa mà chưa có kế hoạch chuyển đổi các máy đang dùng.

Biến môi trường ký: `APSO_KEYSTORE_PATH`, `APSO_KEYSTORE_PASSWORD`, `APSO_KEY_ALIAS`, `APSO_KEY_PASSWORD`. Trên máy phát hành hiện tại, cấu hình mặc định dùng keystore hiện có ở `.android/debug.keystore`; không tạo lại khóa. Không đưa keystore vào Git.

## GitHub và trang tải

Quy trình Actions chuẩn nằm tại `.github/workflows/build-apk.yml`; tệp `build-apk.yml` ở gốc là cấu hình cũ không được Actions thực thi. Cần quyền workflow để đưa tệp chuẩn lên GitHub. Quy trình yêu cầu secret `APSO_KEYSTORE_BASE64` chứa đúng khóa hiện có, cùng các secret thông tin ký nêu trên; thiếu khóa thì dừng, không tạo khóa thay thế.

Chỉ sau khi xác minh chữ ký, phiên bản và mã nguồn trên main, chạy `node publish-android-release.js` với `GITHUB_TOKEN`. Script tạo draft, tải APK và SHA256SUMS, công bố và tải lại kiểm tra hash. Không ghi token vào mã nguồn.

Sau khi release GitHub sẵn sàng, cập nhật redirect trong `firebase.json` và thông tin `download/index.html`, chạy `npm run prepare-hosting` rồi deploy Firebase Hosting. Kiểm tra `/download/` và `/apso.apk` trả đúng phiên bản đã phát hành.

Nội dung web được cập nhật từ máy chủ. Thay đổi phần Android hoặc quyền native cần APK mới. Thông báo đẩy khi app đóng vẫn chưa được triển khai.
