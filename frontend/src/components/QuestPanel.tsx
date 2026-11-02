import {useMemo,useState} from 'react';
import {Check,Flower2,LockKeyhole,ScrollText} from 'lucide-react';
import {Dialog} from './Dialog';
import type {QuestData,QuestRequirement} from '../game/quests/types';

const number=(value:number)=>Math.floor(value).toLocaleString('vi-VN');
function requirementText(r:QuestRequirement,value:number){
 const current=Math.min(r.target,value);
 if(r.unit==='giây')return `${number(current)} / ${number(r.target)} giây (${number(r.target/60)} phút)`;
 return `${number(current)} / ${number(r.target)} ${r.unit}`;
}
export function QuestPanel({data,onClose,onEquip,onRetry}:{data:QuestData|null;onClose:()=>void;onEquip:(id:string|null)=>void;onRetry:()=>void}){
 const [tab,setTab]=useState<'quests'|'titles'>('quests'),[category,setCategory]=useState('all'),[status,setStatus]=useState('unfinished'),[search,setSearch]=useState(''),[limit,setLimit]=useState(24);
 const completed=useMemo(()=>new Set(data?.profile.completed??[]),[data?.profile.completed]);
 const filtered=useMemo(()=>data?.catalog.filter(q=>(category==='all'||q.category===category)&&(status==='all'||completed.has(q.id)===(status==='finished'))&&`${q.title} ${q.description}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')))??[],[data,category,status,search,completed]);
 const nextTitle=data?.titles.find(t=>t.merit>data.profile.merit);
 const equipped=data?.titles.find(t=>t.id===data.profile.titleId);
 return <Dialog title="Việc nhỏ, lòng vui" onClose={onClose} wide>
  <div className="quest-panel">
   {!data?<div className="quest-loading" role="status"><p>Đang tải hành trình của bạn…</p><button className="pill" onClick={onRetry}>Tải lại</button></div>:<>
    <div className="merit-summary">
     <div className="merit-symbol"><Flower2 size={30} strokeWidth={1.4}/></div>
     <div><span className="quest-eyebrow">CÔNG ĐỨC TÍCH LŨY</span><strong className="merit-total">{number(data.profile.merit)}</strong><span className="merit-title">{equipped?.name??'Chưa đeo pháp danh'}</span></div>
     <div className="quest-completion"><strong>{completed.size}<small> / 300</small></strong><span>nhiệm vụ đã xong</span></div>
    </div>
    <p className="quest-intro">300 nhiệm vụ mở sẵn, tiến độ cộng dồn và lưu lại. Làm lúc nào cũng được, không chia ngày, không đặt lại.</p>
    {nextTitle?<div className="title-next"><span>Còn <b>{number(nextTitle.merit-data.profile.merit)}</b> công đức để mở <b>{nextTitle.name}</b></span><progress aria-label="Tiến độ mở pháp danh tiếp theo" value={data.profile.merit} max={nextTitle.merit}/></div>:<p className="title-next">Bạn đã mở tất cả pháp danh vui!</p>}
    <div className="quest-tabs" role="group" aria-label="Nội dung hành trình">
     <button aria-pressed={tab==='quests'} onClick={()=>setTab('quests')}><ScrollText size={17}/>Nhiệm vụ</button>
     <button aria-pressed={tab==='titles'} onClick={()=>setTab('titles')}><Flower2 size={17}/>Pháp danh vui</button>
    </div>
    {tab==='quests'?<>
     <div className="quest-filters">
      <label>Nhóm hoạt động<select value={category} onChange={e=>{setCategory(e.target.value);setLimit(24);}}><option value="all">Tất cả nhóm</option>{[...new Set(data.catalog.map(q=>q.category))].map(c=><option key={c}>{c}</option>)}</select></label>
      <label>Tìm nhiệm vụ<input type="search" placeholder="Lạy, tưới rau, rửa chén…" value={search} onChange={e=>{setSearch(e.target.value);setLimit(24);}}/></label>
     </div>
     <div className="quest-status-filter" role="group" aria-label="Trạng thái nhiệm vụ">{[['unfinished','Chưa xong'],['finished','Đã xong'],['all','Tất cả']].map(([id,label])=><button key={id} aria-pressed={status===id} onClick={()=>{setStatus(id);setLimit(24);}}>{label}</button>)}<span>{filtered.length} nhiệm vụ</span></div>
     <div className="quest-list">
      {filtered.slice(0,limit).map(q=>{
       const done=completed.has(q.id),percent=done?100:Math.floor(q.requirements.reduce((n,r)=>n+Math.min(1,(data.profile.counts[r.key]||0)/r.target),0)/q.requirements.length*100);
       return <article className={`quest-card${done?' complete':''}`} key={q.id}>
        <div className="quest-card-heading"><span className="quest-number">#{String(q.number).padStart(3,'0')}</span><h3>{q.title}</h3><span className="quest-reward">{done?<Check size={14}/>:null}+{q.reward}</span></div>
        <p>{q.description}</p>
        {q.requirements.map(r=><div className="quest-requirement" key={r.key}>{requirementText(r,data.profile.counts[r.key]||0)}</div>)}
        <progress aria-label={`Tiến độ ${q.title}`} value={percent} max={100}/>
        {done&&<span className="quest-received">Đã nhận công đức</span>}
       </article>;
      })}
      {!filtered.length&&<p className="quest-empty">{status==='unfinished'&&completed.size===300?'Bạn đã hoàn thành trọn vẹn 300 nhiệm vụ. Cảm ơn bạn đã ghé chùa!':'Chưa có nhiệm vụ phù hợp với bộ lọc này.'}</p>}
     </div>
     {filtered.length>limit&&<button className="quest-more pill" onClick={()=>setLimit(n=>n+24)}>Xem thêm {Math.min(24,filtered.length-limit)} nhiệm vụ</button>}
    </>:<>
     <p className="quest-intro">Pháp danh vui là danh hiệu trong game. Chọn để đeo dưới tên; công đức vẫn giữ nguyên.</p>
     <button className="pill quest-unequip" disabled={!data.profile.titleId} onClick={()=>onEquip(null)}>Ẩn pháp danh đang đeo</button>
     <div className="quest-title-grid">{data.titles.map(t=>{
      const unlocked=data.profile.merit>=t.merit,selected=t.id===data.profile.titleId;
      return <button className={`quest-title-card${selected?' selected':''}`} key={t.id} disabled={!unlocked} aria-pressed={selected} onClick={()=>onEquip(t.id)}>
       {unlocked?<Flower2 size={22}/>:<LockKeyhole size={20}/>}<span><strong>{t.name}</strong><small>{number(t.merit)} công đức · {selected?'Đang đeo':unlocked?'Đã mở':'Chưa mở'}</small></span>{selected&&<Check size={17}/>}
      </button>;
     })}</div>
    </>}
   </>}
  </div>
 </Dialog>;
}
