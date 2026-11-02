import {Dialog} from './Dialog';
import {useTouchDevice} from '../game/controls/TouchControls';

export function MovementGuide({onClose}:{onClose:()=>void}){
 const touch=useTouchDevice();
 return <Dialog title="Một chút hướng dẫn trước khi đi dạo" onClose={onClose}>
  <div className="movement-guide">
   <p>Cứ thong thả khám phá, không cần vội nhé.</p>
   {touch?<>
    <p><b>Di chuyển:</b> chạm và kéo ở nửa trái màn hình.</p>
    <p><b>Nhìn quanh:</b> kéo ở nửa phải màn hình.</p>
    <p><b>Phóng to / thu nhỏ:</b> chụm hoặc mở hai ngón tay.</p>
    <p><b>Tương tác:</b> đến gần một vị trí rồi chạm nút hoạt động hiện trên màn hình.</p>
   </>:<>
    <p><b>Di chuyển:</b> giữ <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>.</p>
    <p><b>Nhìn quanh:</b> giữ chuột trái và kéo.</p>
    <p><b>Phóng to / thu nhỏ:</b> lăn bánh xe chuột.</p>
    <p><b>Tương tác:</b> đến gần một vị trí rồi nhấn <kbd>E</kbd> hoặc bấm nút hoạt động.</p>
   </>}
   <p>Đến gần biển chuyển khu để vào Chính điện hoặc Nhà ăn. Bạn có thể mở lại hướng dẫn trong <b>Cài đặt</b>.</p>
   <button className="primary" onClick={onClose}>Mình hiểu rồi, đi dạo thôi</button>
  </div>
 </Dialog>;
}
