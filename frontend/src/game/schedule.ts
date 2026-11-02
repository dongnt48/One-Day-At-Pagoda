export type ScheduledActivity={id:string;start:number;end:number;title:string;location:string;description:string};
export const dailySchedule:readonly ScheduledActivity[]=[
 {id:'bell',start:270,end:300,title:'Chuông sáng',location:'Sân chùa · Gác chuông',description:'Đón ngày mới, lắng nghe tiếng chuông và chuẩn bị lễ Phật.'},
 {id:'morning-prayer',start:300,end:360,title:'Lễ Phật buổi sáng',location:'Chánh điện',description:'Lễ Phật, lạy hoặc ngồi thiền để bắt đầu ngày mới bình an.'},
 {id:'morning-cleaning',start:360,end:420,title:'Quét sân – Tưới cây',location:'Sân chùa · Vườn rau',description:'Cùng quét lá, tưới cây và chăm sóc những luống rau.'},
 {id:'breakfast',start:420,end:450,title:'Ăn sáng',location:'Nhà ăn',description:'Nhận phần cơm chay, ngồi dùng bữa và trả khay sau khi ăn.'},
 {id:'practice',start:450,end:540,title:'Tự do lễ Phật – Ngồi thiền',location:'Chánh điện',description:'Bạn có thể thắp hương, lễ Phật hoặc chọn một chỗ ngồi tĩnh tâm.'},
 {id:'dharma',start:540,end:630,title:'Nghe pháp – Học Phật pháp',location:'Chánh điện · Giảng đường',description:'Mời bạn đến giảng đường, chọn chỗ ngồi và giữ không gian yên tĩnh.'},
 {id:'cooking',start:630,end:660,title:'Phụ bếp nấu cơm chay',location:'Nhà ăn',description:'Cùng vào bếp chuẩn bị bữa cơm chay buổi trưa.'},
 {id:'lunch',start:660,end:720,title:'Ăn cơm chay buổi trưa',location:'Nhà ăn',description:'Dùng bữa nhẹ nhàng, trả khay và phụ rửa chén sau bữa ăn.'},
 {id:'noon-rest',start:720,end:810,title:'Nghỉ trưa – Giữ yên tĩnh',location:'Sân chùa · Chánh điện',description:'Nghỉ ngơi hoặc ngồi tĩnh tâm, cùng giữ không gian yên tĩnh.'},
 {id:'meditation',start:810,end:870,title:'Ngồi thiền',location:'Chánh điện',description:'Chọn một chỗ ngồi, thả lỏng và nhẹ nhàng theo dõi hơi thở.'},
 {id:'help',start:870,end:960,title:'Phụ việc trong chùa',location:'Sân chùa · Vườn rau · Nhà ăn',description:'Tự chọn quét sân, tưới rau, nấu cơm hoặc rửa chén.'},
 {id:'walking',start:960,end:1020,title:'Đi bộ trong chánh niệm',location:'Sân chùa',description:'Đi dạo quanh sân, chú ý hơi thở và từng bước chân.'},
 {id:'dinner',start:1020,end:1080,title:'Dùng bữa chiều – Nghỉ ngơi',location:'Nhà ăn · Sân chùa',description:'Dùng cơm chay hoặc thư giãn trước giờ lễ Phật buổi tối.'},
 {id:'evening-prayer',start:1080,end:1170,title:'Lễ Phật buổi tối',location:'Chánh điện',description:'Thắp hương, lễ Phật, lạy hoặc ngồi tĩnh tâm vào cuối ngày.'},
 {id:'evening-practice',start:1170,end:1230,title:'Tĩnh tâm – Sinh hoạt nhẹ',location:'Chánh điện · Sân chùa',description:'Tự do tu tập, ngồi yên hoặc trò chuyện nhẹ nhàng cùng mọi người.'},
 {id:'rest',start:1230,end:270,title:'Giờ nghỉ ngơi',location:'Toàn chùa',description:'Cùng giữ yên tĩnh. Bạn vẫn có thể tự do lễ Phật và ngồi thiền.'},
];
export function scheduledActivityAt(date:Date):ScheduledActivity {
 const minute=((Math.floor(date.getTime()/60000)+420)%1440+1440)%1440;
 return dailySchedule.find(s=>s.start<s.end?minute>=s.start&&minute<s.end:minute>=s.start||minute<s.end)!;
}
export function activityTimeRange(activity:ScheduledActivity):string {
 const clock=(minute:number)=>`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
 return `${clock(activity.start)}–${clock(activity.end)}`;
}
