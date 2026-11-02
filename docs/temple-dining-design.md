# Chính điện và Nhà ăn

**Thiết kế cũ đã được thay thế:** xem [ba map, tối đa 100 người/phòng](three-maps.md). Phần dưới giữ lại mô tả lần triển khai gộp map trước đây.

Đã triển khai: tương tác chung phòng, lịch tự động, nội dung chữ mẫu, khay cơm và chỗ ngồi độc quyền. Giữ `sit` là quỳ; `meditate` là tư thế ngồi tĩnh tâm mới. Đứng lên bằng E, nút giao diện hoặc di chuyển; nút rời chỗ không bị chặn bởi thời gian chờ hành động.

Kiểm tra: build frontend/backend; 17 kiểm tra backend (gồm lịch, khay/ghế và multiplayer); kiểm tra 12 clip trên mỗi model; kiểm tra ba lần lạy và nhang không chạm đầu; browser đi bộ vào hai khu và E; Chromium giả lập điện thoại cho cảm ứng và tham gia/đọc/rời nghe pháp. Chưa thử trên điện thoại thật. Hình học nội thất và animation là bản procedural, chưa có mô phỏng vải hay ăn hết thức ăn.

Script `frontend/scripts/dining-check.mjs` kiểm tra luồng E với server đang chạy (`BASE_URL`, mặc định cổng 5173). `frontend/scripts/listening-check.mjs` kiểm tra nghe pháp trên điện thoại và cần buổi đang mở. Khi cần tái hiện tự động, `backend/test/run-activity-server.mjs` mở backend test ở phút đầu của buổi bằng đồng hồ riêng; chỉ dùng với database/cổng kiểm thử, không dùng làm lệnh chạy game thông thường.

## Phạm vi

Hai khu trong bản đồ chùa hiện tại, cùng phòng multiplayer. Không tạo server riêng, không dịch chuyển sang bản đồ khác, không nhiệm vụ, điểm hay thưởng. Có phím E trên máy tính và nút tương tác trên điện thoại.

## Phương án

Giữ cơ chế tương tác theo vị trí hiện có, bổ sung vị trí, động tác và trạng thái do máy chủ xác nhận. Đây là phương án đề xuất vì người chơi vẫn nhìn thấy nhau giữa các khu. Không dùng màn hình hoạt động riêng vì sẽ tách trải nghiệm khỏi cảnh chùa chung.

Chính điện hiện chưa đi vào được: mở lối, chỉnh va chạm nền/tường/cột và camera để người chơi vào trong. Nhà ăn là gian mở bên trái sân, tránh vườn và các lối đi hiện có; có quầy cơm, bàn ghế và khu trả khay có biển tên.

## Chính điện

- Lễ Phật: E ở vị trí trước bàn thờ, quay về bàn thờ, chắp tay và cúi lễ rồi trở lại đứng.
- Thắp hương: giữ vị trí lư hương được phép; giữ động tác nâng nhang, lạy ba lần trong sáu giây.
- Ngồi tĩnh tâm: E tại đệm ngồi, ngồi xếp bằng; có nút Đứng lên và E để rời chỗ. Khác với cử chỉ quỳ hiện tại.
- Nghe pháp: E tại chỗ ngồi khi buổi sinh hoạt đang diễn ra. Ngồi và xem các đoạn nội dung chữ mẫu; có thể đứng dậy/rời buổi bất cứ lúc nào.

## Lịch sinh hoạt — đề xuất mặc định

Theo lựa chọn của người dùng, lịch tự động và nội dung chữ mẫu để duyệt. Đề xuất mỗi 15 phút có một buổi dài 5 phút, báo trước 1 phút. Mốc giờ do máy chủ tính; người vào muộn thấy đúng đoạn đang diễn ra. Thông báo không mở hộp thoại hay tự đưa người chơi vào buổi.

Nội dung mẫu về sự chú tâm, lắng nghe và lòng biết ơn; ghi rõ là bản mẫu, không trích dẫn hay gán lời cho một vị thầy. Chưa có âm thanh. Nội dung/lịch tập trung trong cấu hình để thay sau.

Kết thúc buổi, đóng phần nội dung và cho phép người chơi tiếp tục ngồi tĩnh tâm hoặc đứng dậy. Người không tham gia vẫn đi lại, chat và sinh hoạt bình thường.

## Nhà ăn

- Nhận cơm chay: E ở quầy để nhận một khay, hiển thị khay trên tay; không nhận thêm khi đang có khay.
- Ngồi ăn: có khay mới ngồi ăn được; E tại ghế trống, nhân vật ngồi và làm động tác đưa thức ăn lên miệng. Có thể dừng ăn/đứng lên bất cứ lúc nào.
- Trả khay: E tại khu trả khay, bỏ khay đang cầm. Không bắt buộc ăn hết hay chờ đếm ngược.
- Khay chỉ là trạng thái sinh hoạt trong phiên chơi, không phải vật phẩm tích lũy. Người khác nhìn thấy trạng thái cầm khay/ngồi ăn.

## Đồng bộ và điều khiển

Máy chủ kiểm tra khoảng cách, ghế trống và điều kiện có khay. Không cho hai người chiếm cùng một ghế; giải phóng chỗ khi đứng dậy hoặc mất kết nối. Tương tác chọn vị trí gần nhất, tránh việc vị trí đầu danh sách che mất vị trí khác. Các điểm đang không khả dụng có lời giải thích ngắn.

Giữ chuột trái mới xoay camera; giữ điều khiển cảm ứng hiện có. Nút rời chỗ luôn dùng được trên điện thoại. Không tự khóa người chơi trong buổi sinh hoạt.

## Kiểm tra trước khi hoàn thành

- Build frontend/backend; kiểm tra animation mới của cả hai nhân vật.
- Kiểm tra E và nút cảm ứng, lối đi và camera của hai khu.
- Kiểm tra hai người dùng cùng ghế, điều kiện nhận/trả khay, giải phóng ghế khi rời phòng.
- Kiểm tra lịch trước/trong/sau buổi, vào muộn và tự do rời buổi.
- Kiểm tra thắp hương vẫn đủ ba lạy và nhang không chạm đầu.
# Cập nhật hiện tại

Xem [Vườn rau và Nhà ăn gọn hơn](garden-dining-update.md): Vườn rau chỉ có cảnh và động tác tự nguyện, không có quản lý cây trồng. Nhà ăn 32 × 28, giữ 50 chỗ.

