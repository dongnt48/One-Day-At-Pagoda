# Vườn rau và Nhà ăn gọn hơn

**Bố trí mới thay thế mô tả map Vườn rau bên dưới:** Sân chùa rộng 56 × 52, vườn được đưa thẳng vào sân, không đăng ký phòng `vegetable_garden` nữa. Hai cụm, mỗi cụm ba luống, ở `(-18, 13)` và `(-18, 20)`; nhấn E phía trước mỗi cụm để tưới, không có quản lý cây. Hồ sen chuyển tâm đến `(16, 2)`. Nhà ăn ngoài sân chuyển đến `(-18, 3)`, dài thêm 50%, sâu thêm 15%, cửa quay vào sân; điểm vào ở `(-14, 3)`. Cổng chính dời ra z = 25,5; cây và tường bao dời theo sân. Nội thất Nhà ăn vẫn 50 chỗ như trước.

Nhà ăn đã bỏ hai bảng lớn “NHÀ ĂN” và “10 BÀN · 50 CHỖ”. Khu bếp ở giữa quầy có hai bếp, nồi, bàn sơ chế, kệ bát và chụp hút khói. Đây là nội thất; chưa có nút hay animation nấu ăn. Quầy nhận cơm, trả khay và 50 ghế giữ nguyên.

- Vườn rau là map riêng `garden` / `vegetable_garden`, tối đa 50 người. Cổng từ sân tại `(-11, -7.5)`, phía sau các chậu rau. Cổng trở về tại `(0, 14)` trong vườn.
- Rau là cảnh tĩnh. Đến biển luống và nhấn E hoặc nút tương tác trên điện thoại để thực hiện động tác tưới rau trong 4 giây. Có thể lặp lại; không có trạng thái cây, chờ cây lớn, thu hoạch, tài nguyên, nhiệm vụ hay điểm thưởng. Mỗi người thực hiện động tác độc lập, không khóa luống.
- Nhà ăn thu từ 68 × 76 xuống 32 × 28, vẫn 10 bàn × 5 ghế và giới hạn 50 người. Hai dãy bàn có lối đi giữa; quầy cơm ở `(-8, -11)`, trả khay `(8, -11)`, cổng về sân `(0, 13)`. Bổ sung đèn treo và ánh sáng ấm.
- Bản đồ và va chạm đồng bộ ở frontend/backend; cần khởi động lại backend khi cập nhật. Các phòng đang chạy dùng cấu hình cũ cho đến khi khởi động lại.
- `backend/test/garden.test.ts` kiểm tra điểm tiếp cận, spawn và động tác không có trạng thái cây. `frontend/scripts/new-maps-check.mjs` chụp desktop/mobile giả lập; `maps-check.mjs` đi qua bốn map và thử ăn cơm/tưới rau.
