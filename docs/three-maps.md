# Ba khu chùa — Chính điện 100 người, Nhà ăn 50 người

Lư hương ngoài sân tại `(0, -5.5)`, dời 1,5 m về phía sân so với vị trí cũ. Lư trong Chính điện giữ `(0, -23)`. Cả hai dùng `IncenseBurner.tsx`: mẫu dựng 3D thân đồng có patina, miệng rỗng, tro, quai, ba chân, nhang và khói mềm; không phải bản quét hiện vật. Điểm tương tác và va chạm ngoài sân đồng bộ với vị trí mới.

Mặt tiền Nhà ăn tại `(-11, 4.8)` quay 90° về phía sân (hướng +X), cửa mở nhìn thấy bàn, ghế, bát và quầy phía trong. Điểm chuyển vào Nhà ăn đặt tại `(-7.8, 4.8)`; vùng va chạm xoay cùng tòa nhà. Nội thất ở sân là cảnh xem trước, phòng Nhà ăn 50 người vẫn là map riêng. Điểm quét sân `(-5, 3)` hiển thị lá rụng sát nền thay cây chổi dựng sẵn; chổi trong tay khi quét giữ nguyên.

**Cập nhật 01/11/2026:** khôi phục cảnh Sân chùa từ `Temple.tsx` (sân 36 × 36, hồ sen, cây và kiến trúc cũ). Cổng Chính điện ở (0, -9), cổng Nhà ăn ở (-11, 8). Khôi phục vị trí quét sân, tưới cây và thắp hương trong sân. Không còn nội thất Nhà ăn/đệm sinh hoạt trùng trong sân; chúng ở hai map riêng.

Lối chuyển khu hiện gắn vào kiến trúc: Chính điện có khung và cánh cửa gỗ mở; Nhà ăn bên trái sân là nhà mái ngói, tường, cột hiên, cửa sổ và cửa chính. Bỏ vòng tròn/biển chuyển map lơ lửng; tên khu nằm trên mặt tiền. Đến trước cửa rồi nhấn E hoặc nút cảm ứng để vào; không tự dịch chuyển khi đi ngang. Tường Nhà ăn có va chạm, ghế đá cũ được dời khỏi lối vào. Chính điện tối đa 100 người, Nhà ăn tối đa 50 người.

Hai cánh cửa mặt tiền mở hết 180 độ sang hai bên; bỏ tấm nền tối phía sau cửa để nhìn xuyên vào kiến trúc bên trong sân. Việc vào map nội thất vẫn dùng E/nút cảm ứng tại cửa.

Chính điện đã nâng lên **100 người/phòng**, với 10 hàng × 10 đệm nghe pháp. Nhà ăn giữ **50 người/phòng**, 10 bàn × 5 ghế; Sân chùa giữ 100. `ROOM_MAX_CLIENTS` có thể hạ giới hạn nhưng không nâng Nhà ăn vượt 50. Cần khởi động lại backend để phòng mới nhận cấu hình sức chứa này.

Kiểm thử mới cho Chính điện: 100 client cùng phòng, client thứ 101 sang phòng khác; 30 giây di chuyển, không rớt kết nối. Đây là kiểm tra mạng local, không phải kết quả FPS trên điện thoại thật. Chi tiết tại `backend/test-results/load-100-hall.json`.

Thay thế thiết kế gộp một map trong `temple-dining-design.md`. Người dùng đã chốt ba map riêng, mỗi phòng tối đa 100 người; không thay đổi nguyên tắc tự nguyện, không nhiệm vụ hoặc điểm thưởng.

| Map | Kích thước vùng đi bộ (đơn vị game) | Phòng Colyseus | Nội dung |
| --- | --- | --- | --- |
| Sân chùa | 96 × 96 | `public_temple` | Vườn, hồ, quét sân, tưới cây, cổng chuyển khu |
| Chính điện / Giảng đường | 52 × 72 | `main_hall` | 100 đệm nghe pháp (10 hàng × 10), lối đi giữa, 8 đệm tĩnh tâm, lễ Phật, lư hương |
| Nhà ăn | 68 × 76 | `dining_hall` | 20 bàn × 5 ghế, nhận cơm, ăn, trả khay |

Đến cổng có biển và nhấn E hoặc chạm nút để chuyển khu. Máy chủ kiểm tra khoảng cách. Phải trả khay trước khi rời Nhà ăn. Giữ cùng danh tính khách và bạn bè; chat/nhân vật chỉ đồng bộ trong phòng hiện tại. Phòng đầy thì ghép vào phòng khác cùng map. Lỗi chuyển khu sẽ thử quay về một phòng của map trước, nếu vẫn lỗi sẽ đưa về màn hình vào game. Theo bạn bè dùng đúng room ID nên hoạt động giữa các map.

## Đồng bộ và hiển thị

- Mỗi map là một loại phòng riêng, máy chủ cố định map của phòng; lựa chọn map từ client không ghi đè cấu hình va chạm.
- Mặc định `ROOM_MAX_CLIENTS=100`, trần 100. `NETWORK_TICK=10`. Có thể hạ sức chứa bằng biến môi trường để kiểm thử.
- Snapshot đầy đủ khi vào phòng/resync/reconnect; sau đó `state_patch` chỉ gồm người mới, người rời và các hàng trạng thái thay đổi. Vị trí làm tròn 0,001 để giảm thay đổi vô nghĩa.
- Không gửi lại danh sách người đứng yên mỗi tick. Lịch nghe pháp đồng bộ theo thời gian máy chủ; thông báo không chuyển người chơi tự động.
- Model đầy đủ cho tối đa 24 người gần trên desktop, 12 trên thiết bị cảm ứng, trong bán kính 18. Những người còn lại vẫn hiện bằng model đơn giản dùng instancing, không chạy skeleton riêng. Người ở xa không có bảng tên nổi; vẫn có tên trong danh sách phòng và có thể chọn nhân vật.
- Bàn, ghế và đệm dùng instancing. Camera mặc định lùi hơn và bớt nhìn xuống để quan sát giảng đường.
- Giữ xác thực một lần, chặn đăng nhập trùng, giới hạn gói tin, kiểm tra khoảng cách và độc quyền chỗ ngồi. Giới hạn mỗi IP: 120 kết nối và 240 lần matchmaking/phút, độc lập với giới hạn mỗi phòng.
- HTTP đã xác thực giới hạn 120 yêu cầu/phút theo người dùng, thao tác xã hội 30/phút theo người dùng; khách chưa xác thực 300 yêu cầu/phút/IP, tạo khách 120/phút/IP. Tránh việc nhóm 100 người chung Wi-Fi cùng chia một hạn mức đọc danh sách bạn bè.

## Kiểm thử và giới hạn bằng chứng

`backend/test/load-100.mjs` chạy backend và 101 client mạng trên máy local, tạo khách/lấy ticket/đọc danh sách bạn bè qua HTTP thật trên cùng IP, giữ 100 client di chuyển trong 30 giây, kiểm tra người thứ 101 sang phòng khác, trả chỗ và tham gia lại. Chạy riêng cho mỗi loại map; không phải kiểm thử 300 người trên một backend hay kiểm thử dài hạn ngoài internet.

```powershell
cd backend
npm.cmd run build
$env:LOAD_MAP='hall' # courtyard hoặc dining
$env:PORT='2581'
node test/load-100.mjs
```

Kết quả đo tại lần triển khai: cả ba map qua; khoảng 9,2 cập nhật/giây khi 100 client di chuyển, không rớt kết nối. Phòng đứng yên không phát patch thừa trong khoảng đo. Payload JSON ước tính khoảng 68 KiB/giây/client khi mọi người cùng di chuyển (không phải số byte WebSocket thực tế). Event-loop p95 khoảng 21–25 ms; RAM của cả server lẫn client test chung tiến trình khoảng 158–164 MiB. Log JSON nằm trong `backend/test-results/load-100-*.json`.

`frontend/scripts/maps-check.mjs`: đi bộ thật và chuyển đủ ba map, giữ danh tính, tĩnh tâm và chuỗi nhận/ăn/trả khay. `crowd-check.mjs`: cảnh 100 nhân vật trên Chromium desktop và giả lập điện thoại, kiểm tra không lỗi và giới hạn model chi tiết. `mobile-check.mjs`: hai ngón, di chuyển, camera, chat và rời phòng. Các script nhận `BASE_URL`.

Bộ kiểm tra backend hiện có 20 kiểm tra qua, bao gồm đủ 100 ghế nghe pháp được chiếm độc lập, từ chối tương tác sai map/cổng ở xa, đồng bộ patch, xác thực và reconnect. Kiểm tra trình duyệt hai người dùng xác nhận chat, hiện diện và kết bạn vẫn hoạt động sau khi đổi giao thức đồng bộ.

Chưa đo trên iPhone/Android thật hoặc máy chủ triển khai. Test render 100 nhân vật không tương đương 100 trình duyệt thực cùng kết nối; test 101 client mạng không chạy 3D. Cần đo thêm CPU/GPU, mạng và tải kéo dài trên hạ tầng đích trước khi khẳng định chất lượng vận hành cho 100 người thật.

Sau cập nhật: khởi động lại backend, tải lại frontend; nếu dùng Docker thì build lại. Kiểm tra `.env` triển khai không còn ghi `ROOM_MAX_CLIENTS=20`. Cấu hình map ở `backend/src/realtime/maps.ts`, bản sao frontend ở `frontend/src/game/maps.ts`; phải cập nhật đồng thời.
