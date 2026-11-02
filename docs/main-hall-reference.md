# Chính điện theo ảnh tham chiếu

Chính điện hiện có 100 chỗ nghe pháp (10 hàng × 10) và tối đa 100 người/phòng. Nhà ăn giữ 50 người, Sân chùa giữ 100. Lối đi giữa thông thoáng; các hàng đệm nằm từ z = -14 đến 22. Ba bệ tượng có va chạm, không đi xuyên bệ.

Hai tượng bên ở x = ±18, dùng chung asset với tượng giữa. Đây là ba bản đặt của mẫu thị giác hiện có, chưa phải bộ Tam Tôn có danh tính tôn giáo được xác thực. Xà ngang thấp chỉ nằm ở hai bên, khoảng giữa thoáng trước tranh và tượng.

Áo nam/nữ được dựng lại thân kín và tay áo phủ vai, tránh kéo mesh thân áo theo cánh tay khi chắp tay/thắp hương. Giữ khuôn mặt, tỷ lệ nhân vật và các clip hành động hiện có.

Kiến trúc: sàn gỗ sẫm, cột gỗ trên chân đá, xà và trần dốc, cửa lưới phía trên các khoảng mở nhìn ra cây/đồi, đèn lồng giấy. Tranh lớn sau bàn thờ, một tượng giữa và hai tượng bên, hai chân nến, lư hương phía trước. Đệm ngồi dùng hai lớp instancing để giảm draw call. Hai nguồn sáng bổ sung không đổ bóng động; không tạo một đèn động cho mỗi đèn lồng.

## Asset

- `frontend/public/textures/altar-mural.jpg`: tranh mới tạo bằng công cụ imagegen tích hợp. Bản gốc PNG giữ trong thư mục art; không phải tranh phục chế của ngôi chùa cụ thể.
- Prompt: “Flat front-facing rectangular Buddhist temple altar mural, wide 2:1. Traditional East Asian mineral pigment painting on aged cloth; dark charcoal olive ground, antique gold linework, vermilion and malachite clouds and lotus foliage. Two standing bodhisattvas at the outer thirds; central lotus mandala and empty lower centre for a 3D statue. No text, frame, room, perspective or UI.”
- `frontend/public/models/hall-statue.glb`: mẫu quét CC0 của Minneapolis Institute of Art, đã giảm mesh và chỉnh vật liệu vàng. Nguồn và nhận dạng tại `hall-statue-LICENSE.txt`. Đây là mẫu thị giác tạm; nguồn xác định là Amoghasiddhi, không phải tượng Thích Ca đã được xác thực. Cần thay nếu yêu cầu danh tính Thích Ca chính xác vẫn áp dụng.
- Mặt tiền Chính điện nhìn từ sân cũng dùng cùng `HallStatue` và tranh nền. `HallFacade.tsx` thay ba tượng nhỏ cũ, sàn đá và tường bên kín bằng sàn gỗ, tường chân thấp/cửa lưới, hai đèn treo và cửa gấp ra hai gian ngoài. Giữ mái ngói, vị trí lư hương và điểm chuyển map `(0, -9)`.

## Kiểm tra

Điều chỉnh mặt tiền theo khung đỏ mới: đóng kín hai gian bên bằng vách/cửa gỗ, đóng tường hông, chỉ mở gian giữa hai cột `x = ±2.3`. Điểm chuyển map và va chạm hiện có giữ nguyên; các vách nằm phía sau biên không đi được của tòa nhà.

`npm.cmd run build` trong frontend. Chạy Vite cổng 5175 rồi `node scripts/altar-check.mjs` để kiểm tra tải cảnh và chụp desktop/mobile. Fixture tại `/fixtures/hall.html`; ảnh xuất trong `frontend/test-results`. Đây là kiểm tra hiển thị qua trình duyệt, không phải kết quả FPS trên điện thoại thật.
