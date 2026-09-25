# APSO recovery snapshot

Ngày tạo: 2026-09-12

## Đã thu hồi được

- Bản HTML đang triển khai tại `https://apso-vn.web.app/`.
- Toàn bộ JavaScript/CSS chunk mà trình duyệt tải ở trang đăng nhập.
- Logo, favicon, manifest và biểu tượng PWA.
- Cấu hình Firebase được nhúng trong bản build:
  - `projectId`: `apso-vn`
  - `authDomain`: `apso-vn.firebaseapp.com`
  - `storageBucket`: `apso-vn.firebasestorage.app`
  - `appId`: `1:335355398211:web:df6a99617d341fef51acf6`
  - Các collection được bản build tham chiếu: `users`, `households`, `residents`, `notifications`, `locations`, `schema`.

## Dấu vết dự án trên Chrome

Chrome trên máy từng mở các địa chỉ sau:

- Firebase Studio: `https://idx.google.com/apso-30922825`
- Firebase Console, dự án cũ/đang dùng: `https://console.firebase.google.com/project/apso-b1feb/authentication/providers`
- Firebase Console, dự án liên quan: `https://console.firebase.google.com/project/congdanso-466d7/authentication/users`

Các địa chỉ này cần mở bằng Chrome đã đăng nhập đúng tài khoản Google để lấy lại workspace/mã nguồn gốc. Gói này không chứa cookie, token, mật khẩu hoặc dữ liệu đăng nhập.

## Giới hạn

Đây là bản build đã triển khai, không phải mã nguồn gốc từ Firebase Studio. Có thể dùng nó để đối chiếu, phục hồi giao diện và xác định cấu hình/collection; để tiếp tục phát triển đầy đủ cần mở lại workspace Firebase Studio hoặc lấy bản sao mã nguồn từ Google Drive/Git.

## Bảo mật

Lịch sử Chrome có dấu vết một liên kết đăng nhập chứa thông tin nhạy cảm. Không nên chia sẻ lịch sử đó; hãy đổi mật khẩu tài khoản ứng dụng và xóa liên kết nhạy cảm khỏi lịch sử trình duyệt sau khi xác nhận tài khoản vẫn hoạt động.
