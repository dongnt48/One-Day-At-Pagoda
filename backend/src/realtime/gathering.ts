export const gatheringParagraphs = [
  'Dành một chút thời gian để cảm nhận hơi thở tự nhiên. Không cần cố gắng thay đổi nó. Nếu thấy không thoải mái, bạn có thể nghỉ hoặc rời chỗ ngồi.',
  'Khi tâm trí đi nơi khác, hãy nhẹ nhàng nhận ra rồi trở về với hiện tại. Không cần trách mình vì xao nhãng.',
  'Lắng nghe cũng là một cách quan tâm. Hãy để người bên cạnh nói hết điều họ muốn chia sẻ trước khi đáp lời.',
  'Một bữa cơm nhắc ta nhớ đến công sức của nhiều người. Có thể dành một khoảnh khắc biết ơn trước khi ăn.',
  'Mang sự chú tâm vào việc nhỏ: bước chân, quét sân, chăm cây. Cảm ơn bạn đã cùng ngồi lại. Bạn có thể tiếp tục tĩnh tâm hoặc tự do đi dạo.',
];
export function gatheringAt(now: number) {
  const period=15*60_000, duration=5*60_000;
  const start=Math.floor(now/period)*period, elapsed=now-start;
  const active=elapsed<duration;
  return {active, upcoming:elapsed>=period-60_000, startsAt:active?start:start+period,
    endsAt:start+duration, title:'Chú tâm trong sinh hoạt hằng ngày',
    paragraph:active?gatheringParagraphs[Math.min(4,Math.floor(elapsed/60_000))]:'',
    sample:true};
}
