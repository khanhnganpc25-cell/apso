# Kiểm tra Firebase của APSO

Ngày kiểm tra: 2026-09-12

## Firebase Hosting

- Website đang hoạt động tại `https://apso-vn.web.app/`.
- Tên miền Firebase tương đương: `https://apso-vn.firebaseapp.com/`.
- `__/firebase/init.json` xác nhận project Firebase là `apso-vn`.
- Bản web hiện tại là bản build Next.js gồm HTML, JavaScript, CSS và tài sản tĩnh. Firebase Hosting chỉ giữ bản đã triển khai; không tự giữ mã nguồn gốc của Firebase Studio.
- API quản trị Hosting yêu cầu đăng nhập Google, nên chưa thể xem lịch sử version/deployment từ bên ngoài.

## Firestore

Bản JavaScript triển khai tham chiếu các collection:

- `users`
- `households`
- `residents`
- `notifications`
- `locations`
- `schema`

Đây là nơi dữ liệu quản lý cư dân/hộ khẩu và cấu hình ứng dụng có thể đang nằm. Truy vấn REST công khai bị Firebase từ chối vì cần quyền đăng nhập.

## Firebase Storage

Cấu hình ứng dụng khai báo bucket `apso-vn.firebasestorage.app`. Việc liệt kê tệp Storage công khai không được phép; phản hồi hiện tại không cho biết nội dung bucket. Nếu ứng dụng có ảnh hồ sơ/ảnh giấy tờ, chúng có thể nằm ở đây và cần xem trong Firebase Console sau khi đăng nhập.

## Kết luận

- Có thể phục hồi bản web từ Hosting, và gói snapshot trong thư mục này đã chứa phần đó.
- Muốn lấy lại mã nguồn gốc hoặc lịch sử deploy cần mở Firebase Studio/Console bằng tài khoản Google của bạn.
- Muốn lấy lại dữ liệu cần kiểm tra Firestore và Storage; không nên thử đoán hoặc dùng mật khẩu trong lịch sử trình duyệt.
