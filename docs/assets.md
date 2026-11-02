# Asset hình ảnh

## Nhân vật Blender

Bổ sung 4 clip cho sinh hoạt Chính điện/Nhà ăn: `meditate` (ngồi tĩnh tâm), `eat` (ngồi ăn, tay đưa thìa lên), `carry` và `carry_walk` (cầm khay đứng/đi). Tổng 12 clip; trạng thái multiplayer `listen` dùng clip `meditate`. Khay đi theo hai bàn tay khi di chuyển, đặt lên bàn khi ngồi ăn; thìa theo tay phải. Model và nguồn Blender đều đã cập nhật. Đây là animation khớp đơn giản, chưa có mô phỏng vải/đồ ăn.

Hành động `sit` giữ nguyên tên trong giao thức nhưng hiện biểu diễn **quỳ xuống**, có khớp gối và cổ chân riêng, gập cẳng chân về sau. Nút giao diện đổi thành Quỳ xuống/Đứng lên. Chổi, nhang và bình tưới lấy vị trí từ xương `RightHand` của từng model mỗi khung hình; điểm cầm nằm ở tâm bàn tay, không còn tọa độ cố định cạnh người. Chổi hướng từ điểm cầm xuống sân, nhang dựng lên từ bàn tay. Đây là attachment theo xương, chưa mô phỏng ngón tay hoặc vật lý đạo cụ.

### Bộ chibi mắt cười, tay thả lỏng — bản hiện tại

Hai lựa chọn Nam/Nữ dùng dáng chibi đầu lớn, thân ngắn, mắt nhắm cười hướng ra trước, áo lam dài và dép đen; không có túi hoặc chuỗi hạt. Nét mắt đặt gần đường giữa đầu (cao 1,27–1,303), miệng cao 1,16–1,17; tai và má được nâng theo để khuôn mặt không dồn sát cằm. Bàn tay/bàn chân là khối tròn, không tách ngón. Áo cổ tròn đơn giản, bỏ vạt chéo và đai ngang ngực. Nữ có nét mi ngoài. Tay thả lỏng khi đứng yên; chắp tay chỉ trong động tác chào/thắp hương. Giữ đủ tám tên animation để tương thích gameplay.

Đã chỉnh tỷ lệ nhìn nghiêng: bán kính đầu trước–sau 0,42 thay vì 0,32; thân và tay áo tăng chiều sâu 1,45 lần, đồng bộ vị trí xương và chi tiết áo. Mắt/miệng theo mặt cong mới. Generator xuất thêm `chibi_male-side.png`, `chibi_female-side.png` và ảnh `*-front.png` để kiểm tra cả hai góc, tránh chỉ nghiệm thu chính diện.

Áo đã được kéo dài gần gối, mở nhẹ phần gấu và ống tay; bỏ panel nổi trước bụng, nút/thắt nơ và hai dải đai thừa. Thêm nếp dọc mảnh trên thân áo. Dáng ngồi giảm độ hạ thân để tà áo dài không chìm sâu dưới sàn. Đây vẫn là vải có skinning đơn giản, chưa có mô phỏng vải rủ theo trọng lực.

- Nguồn: `art/characters/chibi_male.blend`, `chibi_female.blend`.
- Ảnh tư thế chào: `chibi_male-greeting.png`, `chibi_female-greeting.png` trong cùng thư mục.
- Runtime: `frontend/public/models/male_lam.glb`, `female_lam.glb`, khoảng 1,4 MiB/model. Có thêm bản xuất riêng `chibi_male.glb`, `chibi_female.glb`.
- Khôi phục bộ trước: `art/characters/before-chibi-male_lam.glb`, `before-chibi-female_lam.glb`.

Tạo lại **bộ đang dùng** từ thư mục gốc:

```powershell
& 'D:\Blender\blender.exe' --background --python frontend/scripts/blender/create_chibi.py
```

Mắt nhắm cười là thiết kế cố định; chưa có blendshape đổi biểu cảm hoặc mô phỏng vải. Các mục bên dưới ghi lại những phiên bản trước; chạy generator cũ sẽ thay model runtime tương ứng.

### Chú tiểu theo ảnh tham chiếu

Nhân vật nam hiện dùng bản chú tiểu dựng theo ảnh người dùng cung cấp: đầu trọc, mắt nâu lớn, áo lam xám tím vạt chéo, quần rộng, dép, chuỗi hạt và túi đeo. Đây là model dựng lại bằng hình học Blender theo mẫu, không phải chuyển đổi ảnh tự động hoặc bản sao chính xác.

- Nguồn chỉnh sửa: `art/characters/novice.blend`.
- GLB độc lập: `frontend/public/models/novice.glb`; bản dùng trong lựa chọn **Nam**: `male_lam.glb`.
- Ảnh kiểm tra: `art/characters/novice-preview.png`, `novice-front.png`, `novice-side.png`, `novice-back.png`.
- Bản nam cũ được giữ tại `art/characters/previous-male_lam.glb` và `male_lam.blend`; nhân vật nữ giữ nguyên.

Tái tạo chú tiểu và ảnh các góc từ thư mục gốc:

```powershell
& 'D:\Blender\blender.exe' --background --python frontend/scripts/blender/create_novice.py
& 'D:\Blender\blender.exe' --background --python frontend/scripts/blender/render_novice_views.py
cd frontend
node scripts/validate-assets.mjs
node scripts/check-character-poses.mjs
```

GLB chú tiểu khoảng 2,79 MiB, có một skin và đủ tám clip dùng trong game. Vật liệu linen procedural có chi tiết bump trong Blender; bản GLB hiện dùng màu/roughness, chưa bake vân vải. Mắt và nét mặt là hình học tĩnh, chưa có blendshape biểu cảm như ảnh mẫu. Rig tay/chân còn đơn giản; túi và chuỗi hạt gắn vào thân, chưa mô phỏng vật lý.

### Bộ nhân vật ban đầu

Chuỗi hạt của chú tiểu đã được sửa từ vòng oval phẳng trước ngực thành đường vòng 3D kín qua hai bên cổ và sau gáy. Hạt được chia đều theo chiều dài dây, phần trước rủ theo bề mặt áo; dây và hạt vẫn gắn với xương Body, chưa có mô phỏng vật lý. GLB hiện khoảng 2,78 MiB (2.915.884 byte), dưới giới hạn 3 MB.

Chỉnh sửa vai/tay của chú tiểu: thân áo, hai vai và tay áo được hàn thành một bề mặt liên thông; trọng số Body/Arm chuyển dần qua vai để cử động không tách khối. Tay áo và bàn tay hạ thêm 0,10 đơn vị. Generator kiểm tra topology liên thông trước khi xuất; ảnh `novice-wave.png` và `novice-incense.png` dùng để kiểm tra biến dạng vai khi cử động.

`art/characters/male_lam.blend` và `female_lam.blend` là nguồn chỉnh sửa, kèm ảnh portrait `*-preview.png`. Model được tạo riêng bằng `frontend/scripts/blender/create_characters.py`, không dùng model tải ngoài. Script chạy bằng Blender 5.2.3 LTS, xuất glTF Y-up, mặt hướng +Z, cao khoảng 2 đơn vị.

Từ thư mục gốc:

```powershell
& 'D:\Blender\blender.exe' --background --python frontend/scripts/blender/create_characters.py
cd frontend
node scripts/validate-assets.mjs
node scripts/check-character-poses.mjs
```

Script `create_characters.py` tái tạo bộ ban đầu và ghi đè hai nguồn `.blend`, portrait và GLB; chạy lại `create_novice.py` sau đó nếu muốn dùng chú tiểu. Lưu chỉnh sửa thủ công sang tên khác trước khi chạy. Các file `.blend` có studio camera/đèn để xem, GLB chỉ chứa nhân vật/rig. Animation nằm trong NLA, các track được mute trong file nguồn để mở ở tư thế nghỉ. Chỉ bật track muốn xem, tắt các track còn lại.

Contract: `idle`, `walk`, `wave`, `bow`, `sit`, `incense`, `sweep`, `water`. Runtime dùng SkeletonUtils.clone để mỗi người có bộ xương độc lập. Bộ kiểm tra xác nhận 8 clip, skin, bounds và thân hạ khi ngồi. Rig hiện dùng khớp tay/chân đơn giản, không có IK hoặc mô phỏng vải.

## Vật liệu cảnh

Động tác `incense` dài 6 giây: nâng nhang, cúi lạy 3 lần, hạ tay. Clip chạy một lần; máy chủ giữ trạng thái đủ 6 giây. Nhang nghiêng ra phía trước để tránh mặt khi cúi. Chạy `node scripts/check-incense-clearance.mjs` trong frontend để kiểm tra số lần lạy và khoảng cách nhang với đầu trên cả hai nhân vật.

Ảnh từ Poly Haven theo [CC0](https://polyhaven.com/license), lưu cục bộ, không phụ thuộc CDN lúc chơi:

| Asset | Công dụng |
| --- | --- |
| [Red Brick Pavers](https://polyhaven.com/a/red_brick_pavers) | Sân gạch |
| [Brown Planks 03](https://polyhaven.com/a/brown_planks_03) | Gỗ kiến trúc |
| [Bark Brown 01](https://polyhaven.com/a/bark_brown_01) | Thân cây |
| [Rock Boulder Dry](https://polyhaven.com/a/rock_boulder_dry) | Đá và bờ hồ |
| [Forest Ground 04](https://polyhaven.com/a/forest_ground_04) | Nền đất |
| [Clay Roof Tiles](https://polyhaven.com/a/clay_roof_tiles) | Ngói |
| [Kloofendal Partly Cloudy Pure Sky](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky) | Ánh sáng môi trường HDR |

Mỗi bề mặt dùng diffuse, normal OpenGL, roughness JPG 1K; HDRI 1K. Tổng texture/HDR và manifest khoảng 13,4 MiB. URL tải từng file trong `frontend/public/textures/sources.json`. Tải lại từ thư mục frontend: `node scripts/download-scene-assets.mjs` (bỏ qua file đã tồn tại).

Ngói instancing theo từng mái; 11.000 lá và 130 cành dùng hai instanced mesh. DPR giới hạn 1,5, shadow map 2048. Đây là giới hạn cấu hình, chưa phải số FPS đã đo trên máy cấu hình thấp. Hình học kiến trúc, sen, cây được tạo trong source; cảnh còn cần art thủ công nếu muốn chất lượng giống ảnh chụp.
# Sửa trang phục khi hành lễ

## Hồ sen và rau

`LotusPond.tsx`: bờ đá dùng texture hiện có với kích thước/cao độ biến thiên; mặt nước có normal map gợn sóng tạo bằng mã và chuyển động nhẹ. 42 lá sen có gân màu, mép cong, kích thước khác nhau; 6 hoa, mỗi hoa 24 cánh cong có chuyển màu và gương sen. Lá và cánh dùng instancing (hai draw call).

`VegetableGarden.tsx`: ba luống đất, 18 cây dưới luống và ba chậu rau ở vị trí chậu cũ. Mỗi cây có 14 lá cong, gân giữa và lá non bên trong; toàn bộ lá rau dùng một instanced mesh. Tái sử dụng texture đất/đá, không tải thêm ảnh lớn. Đây là mô hình dựng bằng mã, không phải quét hiện vật. Giữ điểm tưới và vùng va chạm hồ. Kiểm tra hình bằng `node scripts/nature-check.mjs` với Vite cổng 5175.

`create_chibi.py` dựng thân áo dài kín trước khi gắn xương; tay áo phủ vai và chuyển động độc lập, tránh kéo rách nách khi giơ tay. Phần quần ẩn dưới áo được rút gọn để không xuyên ra thân áo lúc cúi lễ. Bỏ các đường nếp rời không còn khớp bề mặt áo. Cả `male_lam.glb` và `female_lam.glb` được xuất lại, giữ mặt cười và 12 clip hành động. Preview thắp hương trong trình duyệt: `/fixtures/robe.html`.

