# APSO chạy nội bộ

Thư mục này là bản phục hồi và hoàn thiện đầy đủ từ bản build đang triển khai trên Firebase Hosting, tích hợp đầy đủ các bản vá tính năng và cấu hình Firebase backend.

## Khởi động máy chủ nội bộ

Chạy bằng lệnh NPM:

```powershell
Set-Location 'D:\Lập trình\apso'
npm start
# hoặc: node .\serve-local.js
```

Trang ứng dụng nội bộ mở tại:

`http://127.0.0.1:4173/`

## Lệnh quản lý dự án

- **`npm start`**: Chạy máy chủ kiểm thử cục bộ hỗ trợ đầy đủ web và API giả lập cấp lại mật khẩu.
- **`npm run prepare-hosting`**: Tự động dọn dẹp và đóng gói lại thư mục `hosting-public` sẵn sàng triển khai.
- **`npm run verify`**: Khởi động tự động máy chủ và kiểm thử toàn diện trạng thái trang chủ, bundle JS và API.
- **`npm run build:bundle`**: Xác thực và đồng bộ bundle Next.js đầy đủ tính năng vào cả `_next` và `hosting-public`.

## Tính năng đã hoàn thiện và kiểm thử đạt chuẩn

1. **Quản lý mật khẩu**:
   - Chủ tài khoản có thể tự đổi mật khẩu cá nhân.
   - Admin có thể cấp lại mật khẩu cho các tài khoản thành viên trong hệ thống.
2. **Bảo mật và phân quyền Admin**:
   - Chức năng quản trị và cấp lại mật khẩu chỉ hiển thị và cho phép thực thi đối với tài khoản vai trò `ADMIN`.
   - Chức năng sửa chức danh, gán quyền và thời hạn hiệu lực theo ngày.
3. **Phân tích dân cư và bộ lọc tuổi**:
   - Chia nhóm tuổi chi tiết: dưới 6, 6–13, 14–15, 16–17, 18–59 và từ 60 tuổi.
   - Lọc nhanh theo khoảng tuổi tối thiểu và tối đa.
4. **Chất lượng hộ khẩu**:
   - Thống kê và lọc nhanh số hộ đã có tọa độ / thiếu tọa độ, hộ đã có ảnh / chưa có ảnh.
5. **Giao diện và đăng nhập**:
   - Đồng bộ tên thương hiệu toàn diện thành `APSO`.
   - Hỗ trợ tùy chọn "Ghi nhớ tài khoản trên thiết bị này".
6. **Backend Cloud Functions & Firebase Hosting**:
   - `firebase.json` đã cấu hình định tuyến rewrite `/api/admin-reset-password` trỏ chuẩn xác về hàm Cloud Function `adminResetPassword`.
   - `functions/index.js` đã hỗ trợ CORS cho cả tên miền Hosting và môi trường thử nghiệm cục bộ.

## Chuẩn bị triển khai Firebase

```powershell
npm run prepare-hosting
# Triển khai lên Firebase:
firebase deploy --only hosting,functions
```
