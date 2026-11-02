# MỘT NGÀY ĐI CHÙA

**Tài liệu thiết kế & triển khai MVP — Web Game 3D Multiplayer**  
**Phiên bản:** 1.2 — trang phục đồ lam và cấu trúc thư mục `one-day-at-pagoda`  
**Trạng thái:** Đã chốt ý tưởng, sẵn sàng chia việc triển khai  
**Tên thư mục gốc / repository:** `one-day-at-pagoda`

---

## 1. Tổng quan

**Một Ngày Đi Chùa** là game web 3D góc nhìn thứ ba, lấy bối cảnh một ngôi chùa Việt Nam yên bình. Người chơi không phải cày cấp hay làm nhiệm vụ để thắng; họ vào chùa, đi dạo, gặp người chơi ngẫu nhiên, trò chuyện, kết bạn và thực hiện một vài tương tác đơn giản.

**Trải nghiệm cốt lõi:** `Mở website → Nhập tên → Chọn Nam/Nữ → Vào chùa công cộng → Đi dạo, gặp người khác, chat và tương tác`.

### Nguyên tắc thiết kế

1. **Đơn giản trước:** chỉ một bản đồ chùa, một luồng vào game, ít nút bấm.
2. **Không khí bình yên:** màu sắc dịu, tiếng chim, gió, tiếng chuông, không có cạnh tranh.
3. **Multiplayer thật:** nhân vật người khác di chuyển và tương tác theo thời gian thực.
4. **Chơi ngay:** không bắt buộc đăng ký tài khoản.
5. **Tôn trọng không gian chùa:** trang phục lịch sự, hoạt động và lời thoại phù hợp.
6. **Hiệu năng trên trình duyệt:** dùng mô hình tối ưu thay vì chạy theo đồ họa siêu thực.

## 2. Phạm vi tính năng

### 2.1. Bắt buộc cho MVP (P0)

| Nhóm | Chức năng | Chi tiết |
|---|---|---|
| Vào game | Nhập tên | Tên hiển thị, có kiểm tra độ dài/nội dung |
| Vào game | Chọn giới tính nhân vật | **Hai mẫu cố định: Nam và Nữ, đều mặc đồ lam đi chùa**; không tùy chỉnh ngoại hình |
| Bản đồ | Một ngôi chùa 3D | Cổng, sân, chánh điện, vườn nhỏ, hồ sen |
| Di chuyển | Góc nhìn thứ ba | WASD, chuột xoay camera, camera bám sau nhân vật |
| Multiplayer | Thế giới công cộng | Tự động ghép vào một phòng công cộng còn chỗ |
| Multiplayer | Đồng bộ người chơi | Tên, mẫu nhân vật, vị trí, hướng nhìn, animation đang phát |
| Chat | Chat chữ | Chat chung trong phòng; bong bóng chat trên đầu nhân vật |
| Tương tác xã hội | 3 cử chỉ | Vẫy tay, cúi chào, ngồi xuống/đứng lên |
| Hoạt động | Tương tác đơn giản | Thắp hương, quét sân, tưới cây; không có điểm thưởng |
| Kết bạn | Kết bạn cơ bản | Gửi lời mời, chấp nhận/từ chối, xem danh sách bạn |
| An toàn | Công cụ tối thiểu | Tắt chat, chặn người chơi, giới hạn spam chat, báo cáo |
| Âm thanh | Ambient | Gió, chim, chuông nhẹ, tiếng bước chân; có nút tắt tiếng |

### 2.2. Không làm trong MVP

- Không tạo hình nhân vật tùy ý, không skin/quần áo/phụ kiện; trang phục đồ lam cố định, không có chức năng đổi đồ.
- Không nhiệm vụ, cấp độ, điểm kinh nghiệm, tiền tệ, cửa hàng.
- Không mini-game phức tạp, không leaderboard, không PvP.
- Không thế giới mở nhiều bản đồ, không dịch chuyển giữa các chùa.
- Không hệ thống ngày–đêm, thời tiết động, mùa lễ hội.
- Không voice chat, không CMS, không thanh toán.
- Không hệ thống tài khoản email/mật khẩu ở bản đầu.

> **Lưu ý:** Chức năng kết bạn cần lưu dữ liệu tối thiểu ở phía server, dù người chơi không phải đăng ký. Không nên chỉ lưu danh sách bạn trong bộ nhớ phòng chơi.

## 3. Gameplay và luồng người chơi

### 3.1. Bắt đầu

1. Truy cập website và thấy cảnh chùa nhẹ nhàng, nút **Vào chùa**.
2. Nhập tên hiển thị (ví dụ 2–20 ký tự), chọn **Nam** hoặc **Nữ**. Hình xem trước của cả hai nhân vật đều mặc **đồ lam đi chùa**.
3. Bấm **Bắt đầu**. Server cấp định danh khách và ghi nhớ lựa chọn của người chơi trên thiết bị.
4. Client tự tìm phòng công cộng còn chỗ; ưu tiên phòng đã có người để tránh cảm giác vắng vẻ.
5. Nhân vật xuất hiện ở cổng chùa, camera đặt sau lưng.
6. Người chơi có thể đi dạo, chat và tương tác ngay.

### 3.2. Phím điều khiển desktop

| Phím/thao tác | Hành động |
|---|---|
| `W A S D` | Di chuyển |
| Di chuột | Xoay camera khi đang điều khiển game |
| `E` | Tương tác với vật thể ở gần |
| `Enter` | Mở ô chat / gửi chat |
| `1` | Vẫy tay |
| `2` | Cúi chào |
| `3` | Ngồi / đứng |
| `Tab` hoặc nút UI | Mở danh sách người chơi và bạn bè |
| `Esc` | Đóng bảng đang mở / mở menu tùy chọn |

Có thể click vào game để khóa con trỏ (Pointer Lock). Khi nhập chat, tạm ngừng nhận WASD để không vô tình di chuyển.

**Thiết bị mục tiêu MVP:** desktop/laptop. Mobile có giao diện đáp ứng nhưng điều khiển cảm ứng hoàn chỉnh để ở giai đoạn sau.

### 3.3. Ba hoạt động tại chùa

| Hoạt động | Vị trí | Tương tác |
|---|---|---|
| Thắp hương | Khu vực đặt lư hương | Đến gần → nhấn `E` → animation thắp hương, khói nhẹ |
| Quét sân | Sân chùa | Đến gần chổi → nhấn `E` → nhân vật quét vài giây |
| Tưới cây | Vườn nhỏ | Đến gần bình tưới → nhấn `E` → animation tưới cây |

**Không** có thanh tiến trình, vật phẩm, giới hạn lượt, tiền thưởng hay điểm công đức. Người chơi khác trong cùng phòng nhìn thấy animation đang thực hiện. Việc tương tác không cần lưu tiến độ vào database.

### 3.4. Xã hội và kết bạn

- Đến gần một nhân vật, click/tương tác để mở thẻ nhỏ: **Tên**, **Kết bạn**, **Chặn**, **Báo cáo**.
- Lời mời kết bạn có 2 trạng thái: **Đang chờ** và **Đã chấp nhận** (có thể từ chối).
- Danh sách bạn hiển thị trạng thái online khi dữ liệu có sẵn.
- Nút **Tham gia cùng** đưa người chơi vào phòng công cộng của bạn bè **nếu còn chỗ**; nếu đầy, hiển thị thông báo, không tự động đẩy người khác ra.
- Khi bị chặn, không nhận lời mời hoặc tin nhắn từ người đó; client không hiển thị chat của họ.

## 4. Multiplayer công cộng

### 4.1. Nguyên tắc

- Một **bản đồ chùa** dùng lại cho nhiều **phòng công cộng (room/instance)**.
- MVP đặt giới hạn **20 người/phòng**; giữ cấu hình để tăng lên 30 khi đã đo hiệu năng.
- Nếu phòng đầy, tự chọn phòng khác hoặc tạo phòng mới.
- Không có màn hình tạo phòng riêng, không password phòng.
- Người dùng ra khỏi phòng sẽ biến mất khỏi bản đồ những người còn lại.
- Phòng rỗng được giải phóng theo timeout hợp lý.

### 4.2. Dữ liệu cần đồng bộ

**PlayerState (trạng thái trong phòng):**

```ts
type PlayerState = {
  id: string;           // ID định danh trong phiên
  displayName: string;
  avatar: 'male' | 'female';
  x: number;
  y: number;
  z: number;
  rotationY: number;
  action: 'idle' | 'walk' | 'wave' | 'bow' | 'sit' | 'incense' | 'sweep' | 'water';
};
```

**Thông điệp realtime dự kiến:**

| Hướng | Event | Tác dụng |
|---|---|---|
| Client → Server | `move` | Gửi ý định/vị trí cập nhật được kiểm tra |
| Client → Server | `action` | Vẫy tay, cúi chào, ngồi, tương tác |
| Client → Server | `chat` | Gửi tin nhắn |
| Server → Client | `state` | Đồng bộ player state qua hệ thống room |
| Server → Client | `chat_message` | Hiển thị chat chung và bong bóng chat |
| Server → Client | `notice` | Thông báo phòng đầy, lỗi, người chơi rời phòng... |

Các tên trên là **hợp đồng nghiệp vụ**, map sang cách gửi message/schema cụ thể của thư viện khi code.

**Tối ưu:** phát cập nhật chuyển động khoảng 10–15 lần/giây ở MVP, dùng interpolation ở client để nhìn mượt hơn. Server kiểm tra tốc độ, biên bản đồ và dữ liệu bất thường; không tin tuyệt đối tọa độ do client gửi. Chỉ đồng bộ dữ liệu cần thiết, không truyền model 3D qua realtime.

### 4.3. Chat

- Chat chung theo phòng, không chat toàn server.
- Tin nhắn hiển thị trong panel nhỏ và bong bóng trên đầu trong vài giây.
- Mỗi tin nhắn tối đa **120 ký tự**; server lọc/escape nội dung, có rate limit và cooldown.
- Không lưu lịch sử chat lâu dài trong MVP; người vừa tham gia không đọc lại lịch sử cũ.
- Có nút ẩn chat, chặn người chơi, báo cáo nội dung không phù hợp.

## 5. Bản đồ và thiết kế hình ảnh

### 5.1. Một bản đồ duy nhất

```text
               [CHÁNH ĐIỆN]
                     |
   [VƯỜN NHỎ] -- [SÂN CHÙA] -- [HỒ SEN]
                     |
                 [CỔNG CHÙA]
                 Spawn point
```

**Mô tả khu vực:**

- **Cổng chùa:** điểm spawn, bảng tên game tinh tế.
- **Sân chùa:** không gian gặp gỡ chính, có cây, ghế, lối đi, chổi để tương tác.
- **Chánh điện:** kiến trúc chùa Việt Nam, khu thắp hương, không gian trang nghiêm. MVP có thể chỉ cho tương tác ở phần tiền sảnh để giảm khối lượng xây nội thất.
- **Vườn nhỏ:** cây xanh, bình tưới; ambient tiếng chim.
- **Hồ sen:** cảnh ngắm, ghế ngồi; nước và lá sen chuyển động nhẹ.

Không cần bản đồ khổng lồ. Ưu tiên quy mô nhỏ, các khu gần nhau, đủ rộng để 20 nhân vật không chồng vào nhau.

### 5.2. Art direction

- **Phong cách:** stylized 3D / low-poly tinh tế, không quá trẻ con.
- **Bảng màu:** mái ngói nâu đỏ, gỗ trầm, sân gạch ấm, cây xanh dịu, ánh sáng sáng sớm.
- **Bối cảnh:** gợi không gian chùa Việt Nam, tránh trộn kiến trúc không phù hợp.
- **Nhân vật:** đúng **2 model** nam và nữ, **cả hai đều mặc bộ đồ lam đi chùa**. Kiểu dáng kín đáo, rộng rãi, phù hợp không gian chùa; chiều cao và tốc độ di chuyển tương đương.
- **Thiết kế trang phục:** tông **lam xám / xanh lam nhạt trầm**, áo tay dài cổ kín hoặc cổ đứng đơn giản, quần dài đồng màu, dép giản dị; vải lì, nếp gấp nhẹ, **không logo, không họa tiết rực rỡ, không phụ kiện thời trang**.
- **Mẫu Nam:** áo lam form suông và quần dài, tóc ngắn gọn gàng. **Mẫu Nữ:** áo lam form suông kín đáo và quần dài, tóc gọn gàng. Chỉ khác biệt vừa đủ để nhận biết, cùng một phong cách mỹ thuật.
- **Asset/rigging:** xuất `male_lam.glb` và `female_lam.glb`; sử dụng skeleton/bộ animation tương thích cho idle, walk, wave, bow, sit, incense, sweep, water; vạt áo/quần không xuyên cơ thể quá rõ khi chuyển động.
- **Phạm vi:** mỗi giới tính chỉ có **một bộ đồ lam cố định**; không có bảng màu lựa chọn, thay trang phục hoặc hệ thống trang sức.
- **Camera:** sau lưng và hơi cao; tránh camera xuyên tường/mái, có giới hạn zoom.
- **UI:** ít chữ, màu trung tính, không dùng HUD dày đặc.

### 5.3. Animation / VFX tối thiểu

| Đối tượng | Hiệu ứng | Khi nào |
|---|---|---|
| Nhân vật | Idle / Walk | Tự chuyển theo trạng thái di chuyển |
| Nhân vật | Wave / Bow / Sit | Khi người chơi bấm phím tương ứng |
| Nhân vật | Incense / Sweep / Water | Khi nhấn `E` ở đối tượng hợp lệ |
| Cây lá | Lay động rất nhẹ | Luôn chạy, tần suất thấp |
| Lư hương | Khói mỏng | Loop nhẹ hoặc khi thắp hương |
| Hồ sen | Gợn nước rất nhẹ | Loop, shader đơn giản hoặc texture animation |
| Giao diện | Fade vào game / hiện tooltip | Khi đổi trạng thái UI |

Không sử dụng particle nặng, bloom quá mạnh, camera shake hoặc animation scroll dài trong gameplay.

## 6. Giao diện (UI)

### Màn hình A — Trang chủ

- Background: ảnh/scene tĩnh ngôi chùa, có thể có chuyển động lá nhẹ.
- Logo/chữ **Một Ngày Đi Chùa**.
- Nút chính: **Vào chùa**.
- Góc nhỏ: bật/tắt âm thanh.

### Màn hình B — Vào game

- Ô **Tên của bạn**.
- Hai lựa chọn lớn: **Nam** / **Nữ**, hiển thị đúng model game **đang mặc đồ lam** ở tư thế đứng tự nhiên.
- Nút **Bắt đầu**.
- Validation tên và trạng thái kết nối.

### Màn hình C — Gameplay

- Toàn màn hình là scene 3D.
- Góc trái trên: tên chùa, số người trong phòng (ví dụ `12/20`).
- Góc trái dưới: chat thu gọn.
- Góc phải dưới: nút cử chỉ, bạn bè, cài đặt âm thanh.
- Giữa màn hình dưới: nhắc `E – Thắp hương` khi ở gần vật thể.
- Bong bóng chat xuất hiện phía trên nhân vật.

### Màn hình D — Bạn bè/người chơi

- Tab **Trong chùa** và **Bạn bè**.
- Danh sách tên ngắn, trạng thái, nút kết bạn / tham gia cùng.
- Popup đơn giản để chấp nhận hoặc từ chối lời mời.

### Màn hình E — Cài đặt nhỏ

- Âm thanh: Bật/Tắt, mức âm lượng.
- Chat: Hiển thị/Ẩn.
- Nút **Rời chùa** về trang chủ.

## 7. Công nghệ đề xuất

| Lớp | Công nghệ | Lý do |
|---|---|---|
| Frontend | **React + TypeScript + Vite** | Game web đơn trang, build gọn; không cần SEO nhiều trang |
| 3D engine | **Three.js + React Three Fiber** | Render scene và điều khiển thế giới 3D |
| 3D helpers | **@react-three/drei** | Camera/helper/asset loader khi phù hợp |
| Physics/collision | **@react-three/rapier** (nếu cần) | Va chạm với công trình/cây; có thể dùng collider đơn giản trước |
| Multiplayer | **Colyseus + Node.js + TypeScript** | Room, kết nối thời gian thực và sync state |
| Dữ liệu tối thiểu | **SQLite** | Lưu guest, lời mời và quan hệ bạn bè trên một server |
| Định dạng mô hình | **GLB/GLTF** | Mô hình và animation 3D nhẹ cho web |
| Deploy | **Docker + Caddy / reverse proxy** | HTTPS và WebSocket Secure (WSS) khi đưa lên mạng |

**Không bắt buộc Next.js, NestJS, Redis hay PostgreSQL cho MVP nhỏ.** Nếu muốn chuẩn hóa theo hệ sinh thái quen thuộc thì có thể thay frontend bằng Next.js và backend HTTP bằng NestJS, nhưng sẽ tăng một ít cấu hình. Giữ 2 project frontend/backend riêng để dễ chạy và triển khai.

### 7.1. Tên dự án và cấu trúc thư mục

**Tên thư mục gốc / repository:** `one-day-at-pagoda`  
**Cấu trúc bắt buộc ở cấp gốc:**

```text
one-day-at-pagoda/
├── frontend/
├── backend/
├── docs/
└── README.md
```

**Gợi ý cấu trúc bên trong từng thư mục:**

```text
one-day-at-pagoda/
├── frontend/                 # React + Vite + TypeScript + React Three Fiber
│   ├── public/
│   ├── src/
│   │   ├── app/              # Trang vào game, layout, state UI
│   │   ├── game/
│   │   │   ├── scene/        # Bản đồ, ánh sáng, môi trường
│   │   │   ├── characters/   # 2 model đồ lam, animation controller
│   │   │   ├── controls/     # WASD, camera, tương tác E
│   │   │   ├── multiplayer/  # Kết nối room, nội suy trạng thái
│   │   │   └── interactions/ # Thắp hương, quét sân, tưới cây
│   │   ├── components/      # Chat, HUD, friends, modals
│   │   └── assets/          # GLB, textures, audio
│   └── package.json
├── backend/                  # Node.js + TypeScript + Colyseus
│   ├── src/
│   │   ├── rooms/           # PublicTempleRoom
│   │   ├── realtime/        # Messages, validation, state
│   │   ├── guests/          # Guest identity/session
│   │   ├── friends/         # Request, accept, list, block
│   │   ├── moderation/      # Chat limits, reports
│   │   ├── db/              # SQLite schema/migrations
│   │   └── server.ts
│   └── package.json
├── docs/                     # Đặc tả game, thiết kế và hướng dẫn triển khai
│   └── game-spec.md          # Có thể đặt nội dung tài liệu này tại đây
└── README.md                 # Giới thiệu, yêu cầu môi trường, cách chạy FE/BE
```

- `frontend/` và `backend/` là **hai ứng dụng độc lập**, mỗi ứng dụng có `package.json` và lệnh chạy riêng; không cần dùng monorepo tooling.
- `docs/` chứa tài liệu Markdown và ghi chú triển khai.
- `README.md` hướng dẫn cài đặt, chạy local và các biến môi trường cần cấu hình.
- Không tạo thêm thư mục gốc `mot-ngay-di-chua-frontend` hoặc `mot-ngay-di-chua-backend`; sử dụng đúng tên và cấu trúc trên.

### 7.2. Dữ liệu lưu tối thiểu

| Bảng | Trường chính | Mục đích |
|---|---|---|
| `guests` | `id`, `display_name`, `avatar`, `created_at`, `last_seen_at` | Ghi nhớ người chơi khách |
| `guest_sessions` | `id`, `guest_id`, `token_hash`, `expires_at` | Xác minh phiên chơi không cần password |
| `friend_requests` | `id`, `sender_id`, `receiver_id`, `status`, `created_at` | Lời mời kết bạn |
| `friendships` | `user_a_id`, `user_b_id`, `created_at` | Quan hệ bạn bè đã chấp nhận |
| `blocks` | `blocker_id`, `blocked_id`, `created_at` | Chặn người chơi |
| `reports` | `id`, `reporter_id`, `target_id`, `reason`, `created_at` | Ghi nhận báo cáo để quản trị thủ công |

Không lưu tọa độ di chuyển hoặc chat vào DB trong MVP. Session khách nên dùng token ngẫu nhiên đủ mạnh, được server xác thực; ưu tiên cookie `HttpOnly`, `Secure` trong production. Xóa dữ liệu trình duyệt hoặc đổi máy có thể khiến người chơi mất khả năng truy cập danh tính khách cũ.

## 8. Quy tắc kỹ thuật và an toàn

1. Server kiểm tra kích thước và nội dung mọi message; không tin dữ liệu client.
2. Giới hạn tốc độ di chuyển, tần suất cập nhật, tần suất chat và số kết nối từ một nguồn.
3. Sanitize/escape tin nhắn và tên hiển thị; không render HTML từ người chơi.
4. Có timeout, reconnect và xử lý trường hợp người chơi mất mạng.
5. Không cho 2 client dùng cùng một phiên khách để điều khiển 2 nhân vật đồng thời nếu gây xung đột.
6. Chỉ công bố thông tin tối thiểu của người chơi; không hiển thị token, IP hay dữ liệu riêng tư.
7. Frontend phải giới hạn DPR, số particle, shadow map và model/texture size; xử lý bối cảnh mất WebGL/thiết bị yếu.
8. Cấu hình room max clients và network tick bằng biến môi trường, dễ điều chỉnh.
9. Chặn spam/báo cáo và quy tắc ứng xử cần hoạt động trước khi mở game công cộng cho người lạ.
10. Âm thanh mặc định phù hợp chính sách autoplay trình duyệt: chỉ bắt đầu sau một thao tác của người chơi.

## 9. Triển khai theo giai đoạn

### Giai đoạn 1 — Single-player prototype

- Dựng một bản đồ chùa nhỏ bằng GLB/primitive phù hợp.
- Nạp 2 mẫu nhân vật nam/nữ **mặc đồ lam cố định** (`male_lam.glb`, `female_lam.glb`) và hệ thống animation cơ bản.
- Điều khiển WASD, camera phía sau, va chạm tường/cây.
- Tạo 3 điểm tương tác bằng `E`.

**Hoàn thành khi:** một người có thể đi hết bản đồ và tương tác mượt, không xuyên công trình.

### Giai đoạn 2 — Multiplayer công cộng

- Tạo Colyseus room và tự ghép phòng.
- Đồng bộ xuất hiện/biến mất, vị trí, hướng và animation nhân vật.
- Chat chung trong phòng, bong bóng chat.
- Có reconnect, giới hạn 20 người/phòng và test nhiều tab trình duyệt.

**Hoàn thành khi:** mở nhiều trình duyệt khác nhau có thể thấy nhau, đi lại và chat realtime.

### Giai đoạn 3 — Social & hoàn thiện

- Tạo khách không cần đăng ký, lưu phiên.
- Kết bạn cơ bản, xem danh sách, tham gia phòng bạn nếu còn chỗ.
- Tắt chat, chặn, báo cáo, chống spam.
- Âm thanh, UI tối giản, loading và xử lý lỗi.
- Đóng gói Docker, HTTPS/WSS và kiểm thử public.

**Hoàn thành khi:** người chơi mới có thể vào game, gặp người lạ, kết bạn và quay lại bằng cùng thiết bị.

## 10. Tiêu chí nghiệm thu MVP

- [ ] Mở link website và vào game mà **không phải đăng ký**.
- [ ] Nhập tên, chọn **Nam** hoặc **Nữ**; **cả hai nhân vật đều mặc đồ lam**, không có màn chỉnh ngoại hình/trang phục.
- [ ] Điều khiển WASD, xoay camera; không xuyên vật thể chính.
- [ ] Chỉ có **một bản đồ chùa Việt Nam** hoàn chỉnh.
- [ ] Hai người ở hai thiết bị/trình duyệt thấy nhau, vị trí/animation được đồng bộ.
- [ ] Server tự ghép phòng công cộng và tách phòng khi đầy.
- [ ] Chat hiện trong panel và bong bóng, có giới hạn spam.
- [ ] Vẫy tay, cúi chào, ngồi và 3 tương tác chùa hoạt động.
- [ ] Gửi/chấp nhận kết bạn và thấy lại bạn trên cùng thiết bị sau khi vào lại.
- [ ] Có tắt tiếng, ẩn chat, chặn và báo cáo người chơi.
- [ ] Giao diện rõ ràng, tải scene có trạng thái loading, mất mạng có thông báo.
- [ ] Chạy được bằng Docker trên server có HTTPS/WSS.

## 11. Hướng dẫn ngắn cho AI coding agent

> Xây dựng web game **Một Ngày Đi Chùa** theo spec này. **Ưu tiên MVP tối giản, không tự ý thêm hệ thống** level, currency, quest, skin, inventory, voice chat, admin dashboard hay nhiều map. Dùng React + Vite + TypeScript, Three.js/React Three Fiber và backend Node.js + Colyseus. Chỉ có 2 model nhân vật nam/nữ, **bắt buộc cả hai mặc đồ lam đi chùa cố định** (không đổi quần áo), public matchmaking, WASD third-person, chat, gestures, 3 tương tác với chùa và kết bạn cơ bản. Tách frontend/backend thành hai project. Triển khai từng giai đoạn, hoàn thành và kiểm tra từng phần trước khi mở rộng.

---

**Định hướng cuối:** Là một nơi ảo bình yên để mọi người ghé chùa, đi dạo và gặp gỡ — không phải một game cày cuốc.
