# Một Ngày Đi Chùa

Lần đầu vào game trên mỗi trình duyệt sẽ hiện hướng dẫn di chuyển, camera, zoom và tương tác phù hợp máy tính/điện thoại. Khi đóng hướng dẫn, trình duyệt lưu lựa chọn; có thể xem lại tại Cài đặt → Xem hướng dẫn. Xóa dữ liệu trình duyệt sẽ làm hướng dẫn xuất hiện lại.

## Thống kê truy cập riêng

Game ghi nhận lượt mở trang từ khi triển khai tính năng này, lưu cùng SQLite/volume `pagoda-data`. Mỗi lần tải trang tính một lượt; cookie ẩn danh giúp đếm trình duyệt (không phải số người tuyệt đối). Ngày thống kê theo UTC+7; bot trong game và trang quản lý không được tính. Không thu thập IP, referrer hoặc nội dung chat vào dữ liệu thống kê. Trình duyệt chặn request/cookie có thể làm số liệu thấp hơn thực tế; đây không phải số liệu kiểm toán.

Trên VPS, tự đặt hai giá trị riêng trong `.env` (không commit): `ANALYTICS_PATH` gồm 12–100 chữ/số/gạch ngang/gạch dưới, `ANALYTICS_PASSWORD` ít nhất 16 ký tự. Có thể tạo mỗi giá trị bằng `openssl rand -hex 24`. Không dùng giá trị ví dụ làm mật khẩu thật. Để trống thì trang quản lý bị tắt; bộ đếm vẫn ghi nhận.

Chạy `docker compose -p pagoda -f compose.yaml -f compose.bots.yaml -f compose.analytics.yaml up --build -d`. Giữ nguyên cấu hình cổng `13030` và Nginx của VPS. Mở `https://1ngaydichua.modoha.io.vn/api/private/<ANALYTICS_PATH>` rồi nhập tài khoản `admin` và mật khẩu đã đặt. Đường dẫn không xuất hiện trong frontend hoặc menu; mật khẩu vẫn bắt buộc, chỉ dùng qua HTTPS. Trình duyệt có thể lưu đăng nhập Basic Auth đến khi đóng phiên; dùng cửa sổ riêng nếu dùng máy chung. Đổi mật khẩu và tạo lại backend để thu hồi thông tin đăng nhập cũ.

Local: truyền `ANALYTICS_PATH` và `ANALYTICS_PASSWORD` qua biến môi trường PowerShell trước khi chạy backend; xem trang tại cổng Vite `/api/private/<ANALYTICS_PATH>`. Các giá trị bí mật không được đưa vào bundle frontend.

## Khách viếng chùa tự động (NPC)

Sân chùa giới hạn 5–6 khách tự động; chính điện và nhà ăn vẫn giữ số lượng theo `BOT_COUNT`. Tên và danh hiệu không hiển thị chữ NPC; bộ đếm tách người chơi và khách viếng.

Production bật mặc định 20 NPC: mỗi phòng đang hoạt động có khoảng 15–25 NPC, số lượng thay đổi từng người theo thời gian. NPC đi lại tránh vật cản, quét sân/tưới cây, lễ Phật/tĩnh tâm/nghe pháp hoặc nhận cơm–ăn–trả khay tùy bản đồ. Mọi người trong cùng phòng nhìn thấy cùng NPC. Số người online và danh sách kết bạn chỉ tính người thật; NPC có nhãn riêng và nhường ghế cho người chơi.

Nhịp sinh hoạt chậm: tối đa khoảng 20% NPC đi cùng lúc, tốc độ 0,8 m/s. Sân chùa có khách đứng nghỉ, quét lá, tưới cây và một người thỉnh chuông thưa (nghỉ ít nhất 90 giây giữa hai lượt). Chính điện có khoảng 80% ngồi sẵn nghe pháp/tĩnh tâm; nhà ăn có khoảng 80% ngồi ăn sẵn. Khách ngồi yên ở chỗ và tiếp tục sinh hoạt lâu, chỉ nhường ghế khi người thật cần. Các khách còn lại có thể đi dạo ngắn hoặc làm hoạt động vài phút, không chạy liên tục quanh map.

Để điều chỉnh hoặc tắt, đặt `BOT_COUNT=20` hoặc `BOT_COUNT=0` trong `.env` và thêm override `-f compose.bots.yaml` vào lệnh Compose. Khi phòng gần đầy người thật, NPC giảm để nhường chỗ. Phòng vẫn tự đóng theo vòng đời Colyseus khi không còn kết nối thật; không duy trì bot client hay ghi tiến trình nhiệm vụ cho NPC. Khi chạy Node trực tiếp ở môi trường development, cần truyền `BOT_COUNT=20` qua môi trường process (Node không tự đọc `.env`).

Cập nhật trên VPS có Nginx: giữ `SITE_ADDRESS=http://:80`, `PUBLIC_ORIGIN=https://1ngaydichua.modoha.io.vn` và ánh xạ `127.0.0.1:13030:80`. Chạy `git pull --ff-only` rồi `docker compose -p pagoda -f compose.yaml -f compose.bots.yaml up --build -d`. Bản cập nhật này không sửa `compose.yaml`, nên giữ được cấu hình cổng đã chỉnh riêng trên VPS. Giữ nguyên volume `pagoda-data` và cấu hình HTTPS của Nginx. Dùng cùng hai file Compose trong các lệnh cập nhật tiếp theo để giữ cấu hình NPC tùy chỉnh.

Web game 3D multiplayer theo [spec v1.2](docs/one-day-at-pagoda-spec-v1.2.md). Một ngôi chùa Việt, hai nhân vật đồ lam cố định, không tài khoản, không cấp độ hay tiền thưởng.

Hiện có **3 map riêng**. **Sân chùa giữ cảnh cũ** với sân gạch, hồ sen và kiến trúc chùa; Chính điện/Giảng đường và Nhà ăn giới hạn **50 người mỗi phòng**. Giảng đường có 50 đệm, Nhà ăn có 10 bàn × 5 ghế. Đến biển chuyển khu trước Chính điện hoặc bên trái sân và nhấn E/chạm nút. Giới hạn Sân chùa vẫn 100 như cấu hình trước. Xem [chi tiết](docs/three-maps.md).

## Chạy local

Cần **Node.js 24+** và npm. Mở hai terminal tại thư mục dự án:

```powershell
cd backend
npm ci
npm run dev
```

```powershell
cd frontend
npm ci
npm run dev
```

Mở **http://localhost:5173**. Backend chạy ở cổng 2567; Vite proxy HTTP/WebSocket về backend. Dùng hai trình duyệt hoặc một cửa sổ ẩn danh để thử multiplayer. Hai tab dùng chung cookie được coi là cùng một người và không được vào đồng thời.

## Điều khiển

| Phím                  | Thao tác                                   |
| --------------------- | ------------------------------------------ |
| WASD                  | Di chuyển                                  |
| Giữ chuột trái + kéo | Xoay camera; thả chuột giữ nguyên góc       |
| Con lăn               | Zoom có giới hạn                           |
| E                     | Tương tác vị trí gần nhất / đứng lên khi đang ngồi |
| 1 / 2 / 3             | Vẫy tay / cúi chào / quỳ, đứng             |
| Enter                 | Mở ô chat / gửi                            |
| Tab                   | Danh sách người chơi và bạn bè             |
| Esc                   | Đóng bảng / mở cài đặt                     |

Trên điện thoại: kéo cần trái để di chuyển, kéo vùng bên phải để xoay camera, dùng +/− để zoom. Chạm nút hoạt động khi ở gần điểm tương tác; thanh dưới có vẫy tay, chào, quỳ, bạn bè và cài đặt. Mở chat bằng nút góc trên trái; khi nhập tin hoặc mở bảng, nhân vật ngừng nhận điều khiển.

Thử bằng điện thoại cùng Wi-Fi: chạy hai server như trên, mở địa chỉ **Network** mà Vite in ra (ví dụ `http://192.168.1.9:5173`) trên điện thoại. `localhost` trên điện thoại không trỏ về máy tính. Máy tính cần cho phép kết nối vào cổng Vite trên mạng riêng. Khi phát hành cho người khác, dùng domain HTTPS theo phần Docker bên dưới.

Điều khiển cảm ứng đã được kiểm tra bằng Chromium giả lập điện thoại, gồm hai ngón và xoay màn hình; chưa đo FPS hoặc kiểm tra trực tiếp trên iPhone/Android thật. Thiết bị cảm ứng dùng DPR 1 và bóng 1024 để giảm tải.

## Cấu trúc

Chính điện có lễ Phật trước bàn thờ, thắp hương ở lư hương, đệm tĩnh tâm và 100 đệm nghe pháp. Nhà ăn là map riêng có quầy nhận cơm, 100 ghế và khu trả khay. Nhận một khay rồi chọn ghế trống để ăn; có thể đứng lên bất cứ lúc nào. Khay chỉ tồn tại trong phiên chơi và phải trả trước khi chuyển khu.

Nghe pháp tự mở ở phút **00, 15, 30, 45**, mỗi buổi 5 phút, thông báo trước 1 phút. Nội dung hiện là chữ mẫu, chưa có âm thanh. Tự đến đệm nghe pháp và nhấn E/chạm nút để tham gia; E, nút Đứng lên hoặc di chuyển để rời chỗ. Người khác tiếp tục sinh hoạt tự do. Hết buổi, người tham gia tiếp tục ngồi tĩnh tâm. Lịch và nội dung nằm tại `backend/src/realtime/gathering.ts`; không có điểm hay nhiệm vụ.

Sau cập nhật này cần khởi động lại backend (hoặc build lại khi chạy `npm start`) và tải lại trang để nhận model mới. Chi tiết: [thiết kế Chính điện và Nhà ăn](docs/temple-dining-design.md).

- `frontend/`: React 19, TypeScript, Vite, Three.js, React Three Fiber; scene PBR, Blender GLB, animation và HUD tiếng Việt.
- `backend/`: Node 24, Colyseus 0.17, Express, SQLite tích hợp trong Node.
- `docs/`: đặc tả, thiết kế và ghi chú nghiệm thu.

Hai app có `package.json` và build riêng. `frontend/src/game/maps.ts` là bản sao thông số bản đồ/va chạm của `backend/src/realtime/maps.ts`; khi sửa bản đồ cần cập nhật cả hai. Server là nguồn quyết định vị trí. Mặc định `ROOM_MAX_CLIENTS=100`, `NETWORK_TICK=10`.

## Build và kiểm thử

```powershell
cd backend
npm run build
npm test
cd ../frontend
npm run build
# Cần FE và BE đang chạy; dùng Chromium của Playwright:
npx playwright install chromium
node scripts/browser-check.mjs
node scripts/mobile-check.mjs
node scripts/action-check.mjs
node scripts/maps-check.mjs
node scripts/crowd-check.mjs
node scripts/check-incense-clearance.mjs
node scripts/validate-assets.mjs
node scripts/navigation-check.mjs
```

Test backend tự mở server cổng 2569 và SQLite tạm: phòng đầy, phiên khách, giới hạn tốc độ, chat, animation, bạn bè, chặn/báo cáo, reconnect. Không dùng database phát triển. Browser check kiểm tra luồng vào game/chat/bạn bè/rời game và ghi ảnh vào `frontend/test-results/` (không commit).

Các script trình duyệt nhận `BASE_URL` để thử trên Docker hoặc một local server khác. `navigation-check.mjs` mặc định dùng HTTPS local cổng 18447; khi chạy Vite, đặt `$env:BASE_URL='http://localhost:5173'`. Đặt `TEST_RESTART=1` cho browser check chỉ khi đang kiểm tra Docker của dự án: script sẽ restart service backend để xác minh dữ liệu bền vững.

## Asset

File Blender và ảnh render nằm trong `art/characters/`; model dùng trong game nằm trong `frontend/public/models/`. Hai lựa chọn Nam/Nữ hiện dùng bộ chibi mắt nhắm cười, tay thả lỏng, áo cổ tròn theo chỉnh sửa mới, nguồn `chibi_male.blend` và `chibi_female.blend`. Hai nhân vật có mesh skinning, bộ xương độc lập và 12 animation. Người ở xa dùng model đơn giản bằng instancing để giảm tải khi phòng đông.

Tạo lại từ thư mục gốc (đổi đường dẫn Blender nếu cần):

```powershell
& 'D:\Blender\blender.exe' --background --python frontend/scripts/blender/create_chibi.py
cd frontend
node scripts/validate-assets.mjs
node scripts/check-character-poses.mjs
```

Cảnh dùng vật liệu PBR 1K lưu cục bộ, ánh sáng HDR, ngói và lá cây instancing, hồ sen và kết cấu gỗ. Xem [nguồn asset và cách tái tạo](docs/assets.md). Bộ tạo primitive cũ chỉ chạy khi truyền `--legacy` và sẽ ghi đè model Blender.

Âm thanh tổng hợp bằng Web Audio. Font Lora và Be Vietnam Pro tải từ Google Fonts, có font hệ thống dự phòng.

## Docker / HTTPS / WSS

Trỏ DNS của domain về server, mở cổng 80/443, sao chép `.env.example` thành `.env` và điền `SITE_ADDRESS`, `PUBLIC_ORIGIN` đúng domain. Sau đó:

```powershell
docker compose up --build -d
docker compose logs -f
```

Caddy cấp HTTPS tự động; WebSocket dùng WSS cùng domain dưới `/realtime`. Cookie production có HttpOnly, Secure và SameSite=Strict. SQLite nằm trong volume `pagoda-data`; giữ volume khi cập nhật và sao lưu trước khi thay đổi schema. Không chạy nhiều replica backend với SQLite/presence hiện tại.

Local Docker mặc định dùng `https://localhost` với CA nội bộ Caddy; cần tin cậy CA đó trong trình duyệt. Để thử HTTP local trên cổng 8080, đặt biến môi trường `SITE_ADDRESS=:80`, `PUBLIC_ORIGIN=http://localhost:8080`, `HTTP_PORT=8080`, `NODE_ENV=development` trước khi chạy compose. Không dùng cấu hình HTTP này cho public.

Backend đọc biến môi trường từ process (xem `backend/.env.example`), không tự đọc `.env` khi chạy npm. Docker Compose đọc `.env` gốc.

## Dữ liệu và vận hành

Guest session tồn tại 90 ngày, token 32 byte ngẫu nhiên chỉ lưu hash trong DB. Vé vào phòng dùng một lần và hết hạn sau 30 giây. Xóa cookie hoặc đổi trình duyệt có thể mất quyền truy cập danh tính cũ. Tọa độ và chat không lưu lâu dài; quan hệ bạn bè, chặn, báo cáo được lưu SQLite.

Kiểm tra báo cáo bằng SQLite với câu lệnh `SELECT * FROM reports ORDER BY created_at DESC;` trên bản sao database. MVP không có dashboard quản trị. Bộ lọc từ ngữ cơ bản không thay thế việc xem xét báo cáo của người vận hành. Xem [ghi chú triển khai](docs/implementation.md) về phạm vi kiểm thử và những việc cần kiểm tra trên môi trường thật.
