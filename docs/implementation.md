# Trạng thái triển khai MVP v1.2

## Đã triển khai

| Phần        | Cách triển khai                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Vào chùa    | Trang chủ, tên 2–20 ký tự, chọn nam/nữ, phiên khách cookie HttpOnly; token hash trong SQLite                                    |
| Bản đồ      | Một chùa procedural PBR: cổng, sân gạch, chánh điện, vườn, hồ sen, cây, ghế, lư hương                                      |
| Nhân vật    | Hai GLB đồ lam cố định, cùng hierarchy khớp, 8 animation clip; preview dùng chính model game                                    |
| Điều khiển  | WASD, camera giữ chuột trái và kéo, zoom giới hạn, raycast tránh camera đi qua công trình; chat/modal ngừng điều khiển             |
| Va chạm     | Server kiểm tra biên, chánh điện, cây, hồ sen, lư hương và cột cổng; server tích phân ý định di chuyển                          |
| Multiplayer | Colyseus 0.17; ghép phòng đông trước, 20 người mặc định, tự tạo phòng mới; snapshot 15 Hz, nội suy phía client                  |
| Chat        | Theo phòng, 120 ký tự, cooldown 1,5 giây, text không render HTML, bubble 6 giây, không lưu lịch sử                              |
| Hoạt động   | Vẫy tay/cúi chào/quỳ; E thắp hương/quét sân/tưới cây, server xác nhận khoảng cách, đồng bộ action                              |
| Kết bạn     | Gửi, chấp nhận, từ chối; online, tham gia phòng bạn; kiểm tra phòng đầy trước khi rời phòng hiện tại                            |
| An toàn     | Chặn hai chiều ở server với chat/lời mời, ẩn chat đã nhận của người bị chặn, báo cáo lưu SQLite, rate limit API/message/kết nối |
| Âm thanh    | Web Audio tổng hợp gió, chim, chuông, bước chân; bật sau thao tác người dùng, có volume/mute                                    |
| Mất kết nối | Giữ chỗ 15 giây, SDK tự reconnect, hiển thị trạng thái và quay về màn vào nếu thất bại                                          |
| Đóng gói    | Hai Dockerfile, Compose, Caddy HTTPS và WSS cùng origin, SQLite volume                                                          |

## Kiểm thử

- Bản nâng cấp Blender/PBR: build frontend, 15 test backend, kiểm tra GLB và pose đều qua. Browser smoke Chromium đầy đủ kiểm tra hai phiên khách, chat/kết bạn, ngồi/đứng, rời phòng, điều hướng bị hủy và viewport điện thoại; không có page error hoặc response lỗi cho model/texture trong context chính.
- Mỗi model khoảng 0,9–1 MiB; bộ texture/HDR khoảng 13,4 MiB. Đã loại ngói/lá trang trí khỏi raycast camera và chuyển thông báo tải cảnh ra ngoài Suspense để tránh lỗi dọn DOM khi tải nhiều asset. Kiểm thử này không phải benchmark FPS.

- `backend`: build TypeScript và 15 kiểm thử tự động gồm validation Unicode, identity, phòng đầy, tốc độ, proximity/action, chat, social, chặn/báo cáo, reconnect, leave, contract animation GLB, từ chối cấp phòng khi chưa xác thực và tái xác thực trong cùng request matchmaking.
- `frontend`: build TypeScript/Vite; browser smoke bằng Chromium + WebGL software kiểm tra trang chủ, vào game, chat, social, rời game, viewport điện thoại.
- Script browser có chế độ hai context độc lập để xác minh presence/chat/kết bạn, và `TEST_RESTART=1` để kiểm tra cookie/SQLite sau `docker compose restart backend`.
- Docker build và khởi chạy đã qua trên Docker Desktop. Browser smoke hai context đã qua trên `https://localhost:18447`, dùng WSS qua Caddy, cookie Secure, và xác nhận danh tính/quan hệ bạn bè giữ nguyên sau restart backend. Chromium bỏ qua kiểm tra CA cho chứng chỉ local của Caddy; không thay đổi cấu hình tin cậy của hệ điều hành.
- `node scripts/navigation-check.mjs`: làm chậm request matchmaking, bấm Trở lại rồi trả response; xác nhận ứng dụng ở trang chủ và bỏ room vừa nhận nếu thao tác đã bị hủy. Test đã tái hiện lỗi trước bản sửa và qua sau bản sửa.
- Review độc lập đã dẫn tới bổ sung xác thực trước khi tạo phòng, giới hạn matchmaking, ghi đè `X-Real-IP` tại Caddy và loại bỏ kết quả vào phòng đến muộn sau khi rời màn hình.

## Giới hạn cần biết

- Nhân vật Blender có mesh skinning và skeleton riêng. Khớp còn đơn giản, chưa có IK, ngón tay hay mô phỏng vải. Cảnh dùng vật liệu PBR nhưng kiến trúc vẫn procedural, chưa đạt độ chân thực như ảnh chụp. Xem [asset](assets.md).
- Âm thanh tổng hợp nhẹ, chưa phải bản thu ambient chùa thực tế. VFX nước/khói đơn giản.
- Chưa đo FPS trên máy cấu hình thấp và chưa soak/load test 20–30 người trên server thật. Headless software renderer dùng để kiểm tra chức năng, không đại diện FPS người chơi.
- Bundle 3D khoảng 1,40 MB trước gzip (~402 KB gzip); Vite cảnh báo chunk lớn. Chưa tối ưu chia bundle và streaming asset cho mạng chậm.
- Chưa phát hành domain public, chưa xác minh chứng chỉ CA công cộng; cấu hình Caddy hỗ trợ tự cấp khi domain/DNS được cấu hình.
- Một process backend. Không scale ngang SQLite và presence in-memory. Không lưu chat/tọa độ, không có tài khoản khôi phục danh tính khách.
- Lọc từ ngữ ở mức cơ bản và chống spam; báo cáo cần người vận hành xem xét thủ công. Không có dashboard theo phạm vi spec.
- Có joystick cảm ứng, vùng xoay camera, nút zoom và thao tác HUD trên điện thoại. Script `frontend/scripts/mobile-check.mjs` kiểm tra đồng thời hai ngón, gói di chuyển/xoay gửi đi, dừng khi nhả cần, chat, modal, ngồi và bố cục dọc/ngang trong Chromium giả lập. Chưa kiểm chứng Safari iOS, bàn phím ảo và hiệu năng trên thiết bị thật.
- Không có voice chat, hệ thống điểm/thưởng hay tính năng ngoài MVP.

## Tham khảo kỹ thuật

- [Colyseus 0.17 lifecycle](https://docs.colyseus.io/room/lifecycle): `onDrop` giữ chỗ và `onLeave` dọn dữ liệu khi người chơi rời hẳn.
- [Colyseus reconnection](https://docs.colyseus.io/room/reconnection): dùng automatic reconnect, giữ listener trên cùng room instance.

Không sửa checklist trong bản spec gốc để giữ tài liệu yêu cầu nguyên vẹn; đối chiếu các giới hạn ở trên khi nghiệm thu art, hiệu năng và vận hành public.
