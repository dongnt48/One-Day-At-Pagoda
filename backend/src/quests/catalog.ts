export type Requirement={key:string;target:number;unit:string};
export type Quest={id:string;number:number;category:string;title:string;description:string;reward:number;requirements:Requirement[]};
export type FunTitle={id:string;name:string;merit:number};
export const funTitles:FunTitle[]=[
 ['sprout','Mầm Nhỏ',0],['cloud','Mây Ghé Chùa',50],['broom','Chổi Bé Siêng',150],['garden','Rau Xanh An Vui',350],
 ['dishes','Chén Sạch Tâm An',700],['rice','Cơm Chay Có Tâm',1200],['lotus','Sen Nhỏ Chăm Chỉ',2000],['bell','Chuông Ngân Bụng Đói',3500],
 ['busy-cloud','Mây Lười Mà Siêng',5500],['smile','Sen Cười Tít Mắt',8000],['turtle','Rùa Chậm Tâm An',12000],['happy-lotus','Sen Vui Khắp Chùa',20000],
].map(([id,name,merit])=>({id:String(id),name:String(name),merit:Number(merit)}));
const counts=[1,2,3,5,8,12,18,25,35,50,65,80,100,125,150,180,210,240,270,300];
const bows=[3,6,9,12,18,27,36,54,72,108,144,216,324,432,540,648,756,864,972,1080];
const minutes=[1,2,3,5,8,12,18,25,35,50,70,95,125,160,200,250,310,380,460,550];
const small=[1,2,3,4,5,6,8,10,12,15,18,21,25,30,35,40,45,50,60,75];
type Family={id:string;category:string;name:string;key:string;unit:string;verb:string;where:string;targets:number[]};
const families:Family[]=[
 {id:'explore',category:'Khám phá',name:'Khách quen của chùa',key:'visits',unit:'lượt ghé khu',verb:'Ghé các khu trong chùa',where:'Sân chùa · Chánh điện · Nhà ăn',targets:small},
 {id:'incense',category:'Thắp hương',name:'Nén hương bình an',key:'incense',unit:'lần',verb:'Thắp hương trọn vẹn',where:'Sân chùa hoặc Chánh điện',targets:counts},
 {id:'prayer',category:'Lễ Phật',name:'Một lòng thành kính',key:'prayers',unit:'buổi',verb:'Hoàn thành động tác lễ Phật ba lạy',where:'Một trong ba bàn Phật ở Chánh điện',targets:small},
 {id:'bows',category:'Lạy',name:'Từng lạy an yên',key:'bows',unit:'lạy',verb:'Hoàn thành các lần cúi lạy',where:'Chánh điện · Lễ Phật hoặc Lạy liên tục đều được tính',targets:bows},
 {id:'meditation',category:'Ngồi thiền',name:'Ngồi yên một chút',key:'meditationSeconds',unit:'giây',verb:'Tích lũy thời gian ngồi tĩnh tâm',where:'Các vị trí ngồi tĩnh tâm hai bên Chánh điện',targets:minutes.map(n=>n*60)},
 {id:'lecture',category:'Giảng đường',name:'Một chỗ ngồi an lành',key:'lectureSeconds',unit:'giây',verb:'Tích lũy thời gian ngồi tại giảng đường',where:'Các đệm nghe pháp ở Chánh điện · Không ràng buộc giờ',targets:minutes.map(n=>n*60)},
 {id:'sweep',category:'Quét sân',name:'Chổi bé chăm chỉ',key:'sweep',unit:'lượt',verb:'Hoàn thành các lượt quét sân',where:'Sân chùa · Chờ quét xong mới được tính',targets:counts},
 {id:'tree',category:'Tưới cây',name:'Cây đang khát nè',key:'tree',unit:'lượt',verb:'Hoàn thành các lượt tưới cây',where:'Điểm tưới cây ở Sân chùa',targets:counts},
 {id:'garden',category:'Tưới rau',name:'Người bạn của rau',key:'garden',unit:'lượt',verb:'Hoàn thành các lượt tưới rau',where:'Sân chùa · Vườn rau bên Nhà ăn',targets:counts},
 {id:'cook',category:'Nấu cơm',name:'Bếp chay ấm áp',key:'cook',unit:'lượt',verb:'Phụ bếp nấu cơm chay đến hết động tác',where:'Bếp trong Nhà ăn · Cần trả khay trước',targets:counts},
 {id:'meal',category:'Ăn cơm chay',name:'Bữa cơm trọn vẹn',key:'meals',unit:'bữa',verb:'Nhận cơm, ngồi ăn ít nhất 5 giây rồi trả khay',where:'Nhà ăn · Phải đủ cả ba bước',targets:small},
 {id:'wash',category:'Rửa chén',name:'Chén sạch bong',key:'wash',unit:'lượt',verb:'Hoàn thành các lượt rửa chén',where:'Bồn rửa trong Nhà ăn · Cần trả khay trước',targets:counts},
 {id:'bell',category:'Gác chuông',name:'Một tiếng chuông lành',key:'bell',unit:'lần',verb:'Hoàn thành động tác gõ chuông',where:'Gác chuông · Chờ chuông ngân trước khi gõ tiếp',targets:small},
 {id:'greet',category:'Gặp gỡ',name:'Chào nhau một chút',key:'greetings',unit:'lần',verb:'Vẫy tay hoặc cúi chào khi có người chơi ở gần',where:'Đứng cách người khác không quá 6 mét · Không bắt buộc chat',targets:small},
 {id:'journey',category:'Hành trình',name:'Vừa chăm vừa tĩnh',key:'work',unit:'việc',verb:'Kết hợp phụ việc với tu tập',where:'Các khu trong chùa · Hai loại hoạt động cùng tích lũy',targets:counts},
];
export const quests:Quest[]=Array.from({length:20},(_,tier)=>families.map((f,i)=>{
 const target=f.targets[tier],requirements:Requirement[]=[{key:f.key,target,unit:f.unit}];
 if(f.id==='journey')requirements.push({key:'practice',target,unit:'lượt tu tập'});
 if(f.id==='explore'&&tier>=2)requirements.push({key:'mapCount',target:3,unit:'khu khác nhau'});
 if(f.id==='garden'&&tier>=2)requirements.push({key:'plotCount',target:3,unit:'luống khác nhau'});
 if(f.id==='prayer'&&tier>=2)requirements.push({key:'altarCount',target:3,unit:'bàn Phật khác nhau'});
 const quantity=f.unit==='giây'?`${target/60} phút`:`${target} ${f.unit}`;
 return {id:`${f.id}-${tier+1}`,number:tier*15+i+1,category:f.category,title:`${f.name} · ${quantity}`,description:`${f.verb}. ${f.where}.`,reward:25+tier*5+(f.id==='journey'?15:0),requirements};
})).flat();
