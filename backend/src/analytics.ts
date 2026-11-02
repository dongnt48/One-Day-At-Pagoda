import {Router} from 'express';
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {db} from './db/store.js';
import {online} from './realtime/presence.js';
import {rateLimit} from 'express-rate-limit';

db.exec(`CREATE TABLE IF NOT EXISTS visit_days(day TEXT PRIMARY KEY, views INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS visit_browsers(id TEXT PRIMARY KEY, first_day TEXT NOT NULL, last_day TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS visit_daily_browsers(day TEXT NOT NULL, id TEXT NOT NULL, PRIMARY KEY(day,id));`);
const dayAt=(now:number)=>new Date(now+7*3600000).toISOString().slice(0,10);
export function recordVisit(id:string,now=Date.now()){
 const day=dayAt(now);
 db.exec('BEGIN');
 try{
  db.prepare('INSERT INTO visit_days VALUES(?,1) ON CONFLICT(day) DO UPDATE SET views=views+1').run(day);
  db.prepare('INSERT INTO visit_browsers VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET last_day=excluded.last_day').run(id,day,day);
  db.prepare('INSERT OR IGNORE INTO visit_daily_browsers VALUES(?,?)').run(day,id);
  db.exec('COMMIT');
 }catch(error){db.exec('ROLLBACK');throw error;}
}
export function visitStats(now=Date.now()){
 const today=dayAt(now);
 return {
  totalViews:Number(db.prepare('SELECT COALESCE(SUM(views),0) AS n FROM visit_days').get()!.n),
  totalBrowsers:Number(db.prepare('SELECT COUNT(*) AS n FROM visit_browsers').get()!.n),
  todayViews:Number(db.prepare('SELECT views AS n FROM visit_days WHERE day=?').get(today)?.n??0),
  todayBrowsers:Number(db.prepare('SELECT COUNT(*) AS n FROM visit_daily_browsers WHERE day=?').get(today)!.n),
  online:online.size,
  days:db.prepare('SELECT d.day,d.views,(SELECT COUNT(*) FROM visit_daily_browsers b WHERE b.day=d.day) AS browsers FROM visit_days d ORDER BY d.day DESC LIMIT 30').all(),
 };
}
export function analyticsRouter(){
 const router=Router();
 router.post('/visit',rateLimit({windowMs:60000,limit:30}), (req,res)=>{
  let id=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('pagoda_visit='))?.slice(13);
  if(!id||!/^[a-f0-9]{48}$/.test(id)){
   id=randomBytes(24).toString('hex');
   res.cookie('pagoda_visit',id,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',maxAge:365*86400000,path:'/'});
  }
  recordVisit(createHash('sha256').update(id).digest('hex'));
  res.setHeader('Cache-Control','no-store');res.status(204).end();
 });
 const slug=process.env.ANALYTICS_PATH,password=process.env.ANALYTICS_PASSWORD;
 if(!slug||!password||password.length<16||!/^[a-zA-Z0-9_-]{12,100}$/.test(slug))return router;
 const path=`/private/${slug}`;
 router.use(path,rateLimit({windowMs:60000,limit:30}), (req,res,next)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('Referrer-Policy','no-referrer');
  const header=req.headers.authorization??'';
  const actual=header.startsWith('Basic ')?Buffer.from(header.slice(6),'base64').toString():'';
  const digest=(value:string)=>createHash('sha256').update(value).digest();
  if(!timingSafeEqual(digest(actual),digest(`admin:${password}`))){
   res.setHeader('WWW-Authenticate','Basic realm="Pagoda statistics", charset="UTF-8"');res.status(401).send('Cần đăng nhập.');return;
  }
  next();
 });
 router.get(path,(_req,res)=>{
  const stats=visitStats();
  res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  res.type('html').send(`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thống kê truy cập</title><style>body{font:16px system-ui;background:#f4f0e6;color:#33452e;max-width:960px;margin:40px auto;padding:20px}section{display:flex;flex-wrap:wrap;gap:16px}article{background:white;padding:24px;border-radius:16px;flex:1;min-width:140px}strong{display:block;font-size:32px}table{width:100%;border-collapse:collapse;background:white;margin-top:24px}td,th{padding:14px;text-align:left;border-bottom:1px solid #ddd}p{line-height:1.6}</style><h1>Thống kê truy cập</h1><p>Ngày Việt Nam (UTC+7). Tải lại trang để cập nhật.</p><section><article>Tổng lượt mở<strong>${stats.totalViews}</strong></article><article>Tổng trình duyệt<strong>${stats.totalBrowsers}</strong></article><article>Lượt mở hôm nay<strong>${stats.todayViews}</strong></article><article>Trình duyệt hôm nay<strong>${stats.todayBrowsers}</strong></article><article>Người đang chơi<strong>${stats.online}</strong></article></section><h2>30 ngày có truy cập gần nhất</h2><table><thead><tr><th>Ngày</th><th>Lượt mở</th><th>Trình duyệt</th></tr></thead><tbody>${stats.days.map(d=>`<tr><td>${d.day}</td><td>${d.views}</td><td>${d.browsers}</td></tr>`).join('')}</tbody></table><p>Mỗi lần mở hoặc tải lại game được tính một lượt. Trình duyệt được nhận diện bằng cookie ẩn danh; xóa cookie hoặc đổi thiết bị sẽ được tính riêng. Không lưu địa chỉ IP hay nội dung chat. Bot trong game không tạo lượt truy cập.</p></html>`);
 });
 return router;
}
