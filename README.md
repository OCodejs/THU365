<div align="center">

<img src="./artifacts/mockup-sandbox/public/thu365/app-icon.svg" alt="THU365 app logo" width="160" />

# THU365 — AnhThu Beauty Camera

**Camera làm đẹp · AI hỗ trợ · Chỉnh sửa ảnh/video · Riêng tư trên thiết bị**

[Web app / PWA](#cài-đặt-trên-iphone) · [Native iOS](./ios/README.md) · [Android](#android) · [Kiến trúc](#cấu-trúc-repository)

</div>

---

## Giới thiệu

**THU365 (AnhThu Beauty Camera)** là ứng dụng camera và sáng tạo nội dung ưu tiên thiết bị di động. Repository hiện chứa hai hướng triển khai độc lập:

- **Web/PWA:** ứng dụng camera chạy trong Safari và có thể thêm vào Màn hình chính iPhone.
- **Native mobile:** ứng dụng React Native + Expo dành cho iOS và Android, có luồng xin quyền camera, microphone và thư viện ảnh theo nhu cầu.

PWA và native app dùng chung thương hiệu nhưng không có cùng mức tính năng. Bản native hiện là camera/permission prototype; các hiệu ứng AI nâng cao của bản web chưa được tích hợp đầy đủ vào native app.

## Tính năng

### Web / PWA
- Camera trước/sau và xem trước trực tiếp trên trình duyệt tương thích.
- Chụp ảnh, quay video; microphone chỉ được hỏi khi người dùng chọn quay video có âm thanh.
- Bộ lọc màu và điều chỉnh hình ảnh.
- Các module trải nghiệm làm đẹp, preset, AI model center và Beauty Skills.
- Nếu AI model hoặc CDN lỗi, camera cơ bản, bộ lọc màu và chụp ảnh vẫn hoạt động; Face Tracking cần Face Landmarker; Skin Segmentation là model riêng. Nếu model AI lỗi, camera cơ bản vẫn hoạt động.
- Cài đặt dạng PWA từ Safari, mở độc lập từ biểu tượng Màn hình chính.
- Cache app shell để hỗ trợ tải lại; lần truy cập đầu cần kết nối mạng.

### Native iOS / Android
- Camera native qua Expo Camera.
- Luồng giải thích và xin quyền camera.
- Microphone là quyền tùy chọn cho video có âm thanh.
- Quyền thư viện ảnh chỉ được yêu cầu khi người dùng mở gallery.
- Làm mới trạng thái quyền khi quay lại ứng dụng và hướng dẫn mở Settings khi quyền bị từ chối.

### AI và hiệu ứng
Bản web có Face Landmarker, Skin Segmentation và các trải nghiệm làm đẹp thử nghiệm. Model runtime/WASM có thể cần tải từ CDN. Hiệu năng, camera WebKit, face tracking và hiệu ứng realtime phải được kiểm tra trên thiết bị thật; CI build không thay thế kiểm thử iPhone.

## Cài đặt trên iPhone

### Cách 1 — Safari PWA (không cần Apple Developer)

1. Mở địa chỉ HTTPS của bản web bằng **Safari**.
2. Chạm **Chia sẻ** → **Thêm vào Màn hình chính**.
3. Nếu có tùy chọn **Mở dưới dạng ứng dụng web**, bật tùy chọn đó.
4. Chạm **Thêm**, sau đó mở THU365 từ biểu tượng mới.
5. Cấp quyền Camera khi iOS hỏi. Camera mở trước; AI models tải ở nền. Microphone chỉ được hỏi khi bạn bắt đầu quay video có âm thanh.

PWA không cài hồ sơ nhà phát triển, vì vậy **không cần** xác minh nhà phát triển trong **Cài đặt → Cài đặt chung → VPN & Quản lý thiết bị**.

### Cách 2 — Native iOS IPA

Dự án native nằm tại **apps/thu365-mobile** và sử dụng Expo / React Native.

- Bundle ID: **app.thu365.beautycamera**.
- Có thể tạo bản iOS Simulator không cần chứng chỉ phân phối.
- IPA cài lên iPhone cần Apple signing certificate và provisioning profile hợp lệ.
- Phân phối khuyến nghị: TestFlight qua App Store Connect.
- Ad Hoc cần provisioning profile chứa UDID của thiết bị.
- Enterprise chỉ dành cho tổ chức đủ điều kiện và ứng dụng nội bộ của chính tổ chức đó.

Không cài chứng chỉ chia sẻ, không rõ nguồn gốc hoặc đã bị thu hồi. THU365 không thể tự bật Trust hoặc bỏ qua xác nhận của iOS. Xem [hướng dẫn iOS chi tiết](./ios/README.md).

### Build iOS qua GitHub Actions

1. Mở tab **Actions** của repository.
2. Chạy workflow **THU365 iOS Build**.
3. Chọn **simulator** để tạo ứng dụng mô phỏng, **app-store** để tạo IPA cho TestFlight hoặc **ad-hoc** để tạo IPA cho các iPhone đã đăng ký UDID.
4. Với **app-store** hoặc **ad-hoc**, quản trị viên repository phải cấu hình các GitHub Actions secrets sau. Provisioning profile phải khớp với kiểu phân phối đã chọn:
   - IOS_CERTIFICATE_BASE64
   - IOS_CERTIFICATE_PASSWORD
   - IOS_PROVISIONING_PROFILE_BASE64
   - APPLE_TEAM_ID
5. Tải artifact sau khi workflow thành công. IPA App Store cần được tải lên App Store Connect để phát hành qua TestFlight. IPA Ad Hoc chỉ cài được trên các thiết bị có UDID nằm trong provisioning profile.

**Không đưa certificate, private key, provisioning profile hoặc mật khẩu vào source code.** Nếu chưa có signing secrets, workflow chỉ có thể tạo bản Simulator; không có IPA cài trực tiếp được lên iPhone.

## Android

Workflow **THU365 Android test APK** tạo APK debug để thử nghiệm:

1. Mở **Actions** → **THU365 Android test APK**.
2. Chạy workflow hoặc mở artifact từ một lần chạy thành công.
3. Tải artifact, giải nén và cài app-debug.apk trên Android.

Đây là APK debug/test, không phải bản phát hành Google Play.

## Chạy dự án web ở local

Yêu cầu: Node.js 22+, pnpm 10.11.1.

    pnpm install --frozen-lockfile
    pnpm run typecheck
    pnpm --filter @workspace/mockup-sandbox run build

## Chạy native app ở local

Yêu cầu: Node.js, npm; Xcode trên macOS để build iOS; Android Studio để build Android.

    cd apps/thu365-mobile
    npm install
    npm install --no-save sharp
    mkdir -p assets
    node -e "require('sharp')('../../artifacts/mockup-sandbox/public/thu365/app-icon.svg').resize(1024,1024).png().toFile('assets/icon.png')"
    npx expo install --check
    npx tsc --noEmit
    npx expo-doctor
    npx expo start

Để build iOS, cần tạo native project bằng Expo Prebuild và mở workspace được sinh ra trong thư mục ios. Xem [ios/README.md](./ios/README.md).

## Quyền riêng tư và dữ liệu

- Camera, microphone và thư viện ảnh chỉ được yêu cầu theo hành động tương ứng.
- Từ chối microphone không ngăn sử dụng chế độ chụp ảnh.
- Media trong PWA được giữ trong phiên trình duyệt; native camera prototype trả về URI trong cache ứng dụng.
- Repository hiện không tuyên bố có đồng bộ cloud hoặc sao lưu cloud cho ảnh/video.
- Không tải ảnh/video riêng tư lên dịch vụ bên ngoài nếu chưa có thông báo và sự đồng ý rõ ràng của người dùng.

## Cấu trúc repository

| Đường dẫn | Nội dung |
| --- | --- |
| artifacts/mockup-sandbox | Web app, PWA, camera UI và các module làm đẹp |
| artifacts/mockup-sandbox/public/thu365 | Web app manifest, service worker và logo PWA |
| apps/thu365-mobile | Native app React Native + Expo |
| .github/workflows | Kiểm tra code, build Android và build iOS |
| docs/thu365-pwa.md | Hướng dẫn và giới hạn PWA |
| ios/README.md | Cài đặt, ký và phân phối native iOS |

## Agent Skills

Repository có skill hướng dẫn agent tải trực tiếp asset nhị phân lên GitHub bằng Git Data API, bao gồm PNG và WebP:

- [GitHub Binary Image Upload](./.agents/skills/github-binary-image-upload/SKILL.md) — kiểm tra file, mã hóa base64 nội bộ, tạo Git blob/tree/commit, xác minh asset và mở pull request. Không ghi base64 vào chat hoặc source code.

## Trạng thái phát triển

| Hạng mục | Trạng thái |
| --- | --- |
| Web/PWA source | Có trong repository |
| Native Expo source | Có trong repository |
| Android debug APK workflow | Đã cấu hình |
| iOS Simulator workflow | Đã cấu hình; cần CI chạy thành công để xác nhận |
| iOS signed IPA | Phụ thuộc Apple signing secrets và provisioning profile |
| Camera / permission trên iPhone thật | Cần kiểm thử thiết bị |
| AI face tracking và beauty effects trên iPhone thật | Cần kiểm thử thiết bị; không được suy ra từ kết quả build |

## Đóng góp

Mọi thay đổi nên đi qua branch và pull request. Chạy typecheck/build phù hợp trước khi gửi PR. Không commit signing credentials, dữ liệu cá nhân hoặc media của người dùng.

## Giấy phép

Repository hiện khai báo MIT ở workspace root. Hãy kiểm tra các asset và thư viện bên thứ ba riêng trước khi tái phân phối.
