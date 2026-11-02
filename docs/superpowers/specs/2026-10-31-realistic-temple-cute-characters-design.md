# Cảnh chùa chân thực, nhân vật dễ thương

## Hướng người dùng đã chọn

Cảnh vật giống thật nhất có thể; nhân vật theo hướng dễ thương. Giữ bối cảnh chùa Việt Nam, hai nhân vật nam/nữ mặc đồ lam cố định và toàn bộ gameplay theo spec v1.2.

## Các hướng đã cân nhắc

1. **Bán hiện thực toàn bộ:** nâng geometry và vật liệu procedural, nhẹ và đồng nhất, nhưng chưa đáp ứng mức chân thực người dùng muốn cho cảnh.
2. **Cảnh chân thực + nhân vật dễ thương — hướng được chọn:** cảnh dùng vật liệu và hình khối chi tiết; nhân vật cách điệu có chủ đích, hòa vào cảnh bằng ánh sáng/bóng tiếp xúc. Cần thêm công việc asset và tối ưu.
3. **Chân thực cả cảnh và người:** cần model người/rig chất lượng cao và đi ngược yêu cầu nhân vật dễ thương.

## Thiết kế đề xuất để duyệt

### Cảnh vật

- Chùa Việt quy mô nhỏ, vẫn gồm cổng, sân, chánh điện, vườn và hồ sen. Giữ các khu dễ nhận biết, không thay bằng kiến trúc đền Nhật/Trung Quốc.
- Mái ngói có hàng lớp, độ dày, đường nóc và mép mái hợp lý. Cột gỗ, bậc đá, chân tường có chi tiết kết cấu thay cho các khối phẳng đơn giản.
- Vật liệu PBR có màu bề mặt, độ nhám và normal map: gạch nung, ngói, gỗ sẫm, đá và đất. Độ cũ nhẹ, khác biệt màu có kiểm soát; tránh phủ rêu/bụi quá mức lên mọi bề mặt.
- Cây có thân/cành, tán lá bất đối xứng, silhouette tự nhiên; loại bỏ tán cây đa diện lớn đang có. Bổ sung thảm cây thấp quanh vườn và mép hồ, không làm rối đường đi.
- Nước có độ sâu màu, gợn nhỏ và phản xạ môi trường vừa phải. Lá/hoa sen có hình dáng rõ, bố trí tự nhiên.
- Ánh sáng sáng sớm trung tính hơi ấm, giữ bóng râm có chiều sâu; giảm lớp ánh sáng vàng phẳng hiện tại. Không dùng bloom mạnh hoặc hiệu ứng làm mờ che chi tiết.

### Nhân vật

- Dễ thương kiểu nhân vật 3D cách điệu: đầu hơi lớn, mặt tròn, mắt rõ, má mềm; tỷ lệ vẫn phù hợp không gian chùa. Không dùng tỷ lệ đầu khổng lồ hoặc phong cách em bé.
- Vai và tay chân bo mềm, bàn tay/chân đơn giản nhưng có hình dáng; giảm cảm giác ghép từ ống trụ. Áo có cổ, nẹp, tay áo và vài nếp vải lớn dễ đọc.
- Giữ đồ lam xám xanh, áo dài tay, quần dài và dép. Nam tóc ngắn, nữ tóc gọn; không thêm lựa chọn trang phục/phụ kiện.
- Hai GLB dùng cùng quy ước animation idle, walk, wave, bow, sit, incense, sweep, water; preview và gameplay dùng cùng asset.
- Ánh sáng, hướng bóng và độ tiếp xúc mặt đất khớp cảnh thật để nhân vật không có cảm giác dán lên hình nền.

### Cách triển khai và phạm vi

- Giữ React Three Fiber/Three.js, Colyseus, dữ liệu và tính năng hiện tại. Thay đổi chủ yếu ở scene, model/asset, ánh sáng và camera nếu cần để giới thiệu cảnh.
- Ưu tiên asset có giấy phép phù hợp và nguồn ghi rõ. Tìm texture/PBR, cây và mô hình phù hợp trước khi quyết định phần nào tự dựng; không dùng ảnh AI làm bằng chứng về chất lượng cảnh 3D chơi được.
- Không mua asset hoặc phụ thuộc asset có phí khi chưa được cho phép. Nếu asset miễn phí phù hợp không đủ, ghi rõ phần còn giới hạn thay vì gọi cảnh primitive là photorealistic.
- Nguồn/license và dung lượng được ghi trong tài liệu asset. Ưu tiên tải local để game không phụ thuộc hotlink bên thứ ba.
- Kiến trúc và cây được gom/instance khi phù hợp; texture giới hạn kích thước, không thêm phản xạ realtime nặng cho mỗi vật thể. Giữ DPR có giới hạn và đường lui chất lượng thấp cho máy yếu.
- Nếu footprint công trình/cây thay đổi, cập nhật va chạm server/client cùng nhau. Không để geometry mới chặn đường tương tác hoặc che camera.

## Nghiệm thu

- So sánh ảnh trước/sau của toàn cảnh, cổng/chánh điện, hồ sen và cả hai nhân vật trong cùng điều kiện viewport.
- Cảnh phải cải thiện bằng hình khối và bề mặt thật, không chỉ đổi màu/ánh sáng; nhân vật phải có silhouette và khuôn mặt dễ thương rõ ràng.
- Preview hiển thị đúng model dùng trong game, đủ 8 clip animation, không có tay/chân rời hoặc chân trôi rõ rệt.
- Kiểm tra build, tải asset, lỗi console/WebGL, di chuyển/va chạm, camera và ba điểm tương tác. Chạy lại multiplayer smoke nếu thay đổi contract hoặc lifecycle nhân vật.
- Báo cáo kích thước tải và giới hạn đo hiệu năng; không suy FPS phần cứng thật từ Chromium software renderer.

## Trạng thái

Đã chốt hướng tổng thể qua yêu cầu người dùng. Tài liệu ngắn này chờ duyệt trước khi lập kế hoạch và sửa implementation, theo skill brainstorming. Chưa thay đổi code/asset của game trong bước thiết kế.
