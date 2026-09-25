# APSO Android

Đây là ứng dụng Android Trusted Web Activity cho `https://apso-vn.web.app/`.

- Package ID: `vn.apso.app`
- Target SDK: Android API 36
- Minimum SDK: Android API 21
- Nâng cấp nghiệp vụ: triển khai website; không cần phát hành lại APK/AAB.
- Nâng cấp nền tảng/chính sách Google Play: vẫn cần tăng phiên bản và phát hành AAB mới khi Google yêu cầu.

`android.keystore` và `signing-secrets.properties` là tài sản phát hành quan trọng, đã được loại khỏi Git. Phải sao lưu riêng cả hai tệp. Mất khóa có thể làm mất khả năng cập nhật ứng dụng ngoài quy trình Play App Signing.

Tệp `assetlinks.json` liên kết tên miền với chữ ký ứng dụng. Khi Google Play App Signing cấp chữ ký phát hành, cần bổ sung fingerprint của Play vào tệp này rồi triển khai lại website.

## Bản phát hành v1

- `release/APSO-Android-v1.apk`: bản cài trực tiếp để thử trên điện thoại.
- `release/APSO-Android-v1.aab`: bản nộp lên Google Play Console.

Cả APK và AAB đã được ký bằng `android.keystore`. APK đã xác minh hợp lệ với các lược đồ chữ ký Android v1, v2 và v3. Tệp `signing-secrets.properties` chỉ nằm trên máy này; không gửi tệp đó cùng APK/AAB.

Máy Windows này cần một thư mục tạm dài khi chạy Gradle để tránh lỗi AF_UNIX/loopback của Java. Cấu hình đã được ghi trong `gradle.properties`; khi chạy thủ công, đặt cả `TEMP` và `TMP` tới thư mục dài đã tạo dưới `.tools`.
