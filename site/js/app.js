const TRAINERS={
  zosya:{name:'Зося',spec:'TRX',bio:'Сертифицированный инструктор по TRX с опытом более 4 лет. Специализируется на функциональных тренировках с подвесными петлями — помогает укрепить мышцы-стабилизаторы, улучшить осанку и развить координацию.',schedule:[{time:'09:00',name:'TRX',days:'Пн, Ср, Пт'},{time:'11:00',name:'TRX',days:'Пн, Ср, Пт'}],reviews:[{author:'Алина М.',text:'Зося — лучший тренер! После месяца занятий почувствовала реальный прогресс.'},{author:'Катя Р.',text:'Тренировки с Зосей — это всегда качественно и интересно!'}]},
  ksenia:{name:'Ксения',spec:'ОФП · Силовая · TRX · Crossfit',bio:'Суслова Ксения Вячеславовна — тренер по ОФП, силовым и функциональным тренировкам.\\n\\nОпыт — 11 лет. Высшее физкультурное образование. Спецкурс «Тренер по ОФП: развитие взрывной силы и мощности». Сертификация: TRX STC, TRX GTC, TRX FTC, CrossFit, силовой тренинг, работа с противопоказаниями.\\n\\nРаботаю как с профессиональными спортсменами, так и с атлетами-любителями.\\n\\nМоя миссия — помочь девушкам влюбиться в фитнес и бережно прийти к фигуре мечты. Использую накопленные знания, чтобы эффективно работать с телом, уменьшать объёмы и укреплять мышцы, сохраняя здоровье суставов и спины.',schedule:[{time:'17:00',name:'Силовая',days:'Пн, Ср, Пт'},{time:'18:00',name:'TRX',days:'Пн, Ср, Пт'},{time:'19:00',name:'Crossfit',days:'Пн, Ср, Пт'}],reviews:[{author:'Ольга С.',text:'Ксения — это драйв, энергия и результат. За 2 месяца кроссфита я стала другим человеком!'}]},
  salma:{name:'Сальма',spec:'Женское здоровье · Силовая PRO · Здоровая спина',bio:'Эксперт в области женского здоровья и функционального движения. Образование — физическая реабилитация и спортивная медицина.',schedule:[{time:'11:00',name:'Женское здоровье + мобильность',days:'Вт, Чт, Сб'},{time:'18:00',name:'Силовая PRO',days:'Вт, Чт, Сб'},{time:'19:00',name:'Здоровая спина + Растяжка',days:'Вт, Чт, Сб'}],reviews:[{author:'Наташа Д.',text:'Сальма изменила моё отношение к своему телу. Её занятия — просто открытие.'}]},
  farida:{name:'Фарида',spec:'Мама+Малыш · Здоровая спина',bio:'Специалист по послеродовому восстановлению. Мама двоих детей. Ведёт уникальное направление "Мама + Малыш" — тренировки, куда можно прийти вместе с ребёнком.',schedule:[{time:'16:00',name:'Мама + Малыш',days:'Вт, Чт, Сб'},{time:'17:00',name:'Здоровая спина',days:'Вт, Чт, Сб'}],reviews:[{author:'Маша К.',text:'Фарида — настоящая находка! Хожу с малышом, и это просто спасение.'}]},
  viktoria:{name:'Виктория',spec:'Силовая · Шпагат / Растяжка',bio:'Бывшая профессиональная гимнастка, тренирует 3 года. Специализируется на развитии гибкости и силы. Её занятия по шпагату — самые популярные в студии.',schedule:[{time:'09:00',name:'Силовая',days:'Вт, Чт, Сб'},{time:'10:00',name:'Шпагат / Растяжка',days:'Вт, Чт, Сб'}],reviews:[{author:'Юля В.',text:'Сделала поперечный шпагат за 3 месяца! Казалось, это невозможно.'}]}
};

const SCHEDULE={
  mon:[{time:'09:00',name:'TRX',trainer:'Зося',key:'trx'},{time:'11:00',name:'TRX',trainer:'Зося',key:'trx'},{time:'17:00',name:'Силовая',trainer:'Ксения',key:'silovaya'},{time:'18:00',name:'TRX',trainer:'Ксения',key:'trx'},{time:'19:00',name:'Crossfit',trainer:'Ксения',key:'crossfit'}],
  tue:[{time:'09:00',name:'Силовая',trainer:'Виктория',key:'silovaya'},{time:'10:00',name:'Шпагат / Растяжка',trainer:'Виктория',key:'shpagat'},{time:'11:00',name:'Женское здоровье + мобильность',trainer:'Сальма',key:'zdorovye'},{time:'16:00',name:'Мама + Малыш',trainer:'Фарида',key:'mama'},{time:'17:00',name:'Здоровая спина',trainer:'Фарида',key:'spina'},{time:'18:00',name:'Силовая PRO',trainer:'Сальма',key:'silovayapro'},{time:'19:00',name:'Здоровая спина + Растяжка',trainer:'Сальма',key:'osanka'}]
};
SCHEDULE.wed=[...SCHEDULE.mon];SCHEDULE.thu=[...SCHEDULE.tue];SCHEDULE.fri=[...SCHEDULE.mon];SCHEDULE.sat=[...SCHEDULE.tue];

const TRAININGS={
  trx:{name:'TRX',tags:['Функциональная','Все уровни','55 мин'],what:'Тренировка с подвесными петлями TRX. Вес собственного тела — для проработки всех мышечных групп.',includes:'Разминка, основной блок на пресс, спину, ноги и руки, заминка и растяжка.',who:'Подходит для всех уровней — нагрузка регулируется углом наклона тела.'},
  silovaya:{name:'Силовая',tags:['Силовая','Начинающим','55 мин'],what:'Классическая силовая тренировка со штангой, гантелями и тренажёрами.',includes:'Разминка, базовые упражнения: приседания, тяги, жимы, заминка.',who:'Для всех, кто хочет стать сильнее и улучшить тонус мышц.'},
  crossfit:{name:'Crossfit',tags:['Высокая интенсивность','Продвинутый','55 мин'],what:'Функциональные круговые тренировки высокой интенсивности.',includes:'Разминка, WOD: гимнастика, тяжёлая атлетика, кардио, растяжка.',who:'Рекомендуется при наличии базовой физической подготовки.'},
  shpagat:{name:'Шпагат / Растяжка',tags:['Растяжка','Гибкость','55 мин'],what:'Специализированная тренировка для развития гибкости и освоения шпагата.',includes:'Разогрев суставов, пассивная и активная растяжка, работа с тренером, релаксация.',who:'Для всех — от новичков до тех, кто хочет улучшить растяжку.'},
  zdorovye:{name:'Женское здоровье + мобильность',tags:['Здоровье','Мягкие практики','55 мин'],what:'Тренировки с учётом женской физиологии: тазовое дно, глубокие мышцы, гормональный баланс, подвижность суставов.',includes:'Дыхательные практики, упражнения для тазового дна, мягкие силовые блоки, работа на мобильность, растяжка.',who:'Для женщин любого возраста, особенно после родов.'},
  mama:{name:'Мама + Малыш',tags:['Для мам','С детьми','55 мин'],what:'Тренировка для мамы, пока малыш рядом. Восстановление после родов.',includes:'Упражнения с весом малыша, восстановительные упражнения, игры для ребёнка.',who:'Для мам с детьми от 3 месяцев до 2 лет.'},
  spina:{name:'Здоровая спина',tags:['Реабилитация','Спина','55 мин'],what:'Укрепление мышечного корсета и снятие напряжения со спины.',includes:'Упражнения для глубоких мышц спины, растяжка, релаксация.',who:'При болях в спине, сидячей работе, после беременности.'},
  silovayapro:{name:'Силовая PRO',tags:['Продвинутый','Силовая','55 мин'],what:'Продвинутая силовая программа с прогрессивной нагрузкой.',includes:'Тяжёлые базовые движения, суперсеты, работа на гипертрофию.',who:'Для женщин с опытом силовых тренировок от 6 месяцев.'},
  osanka:{name:'Здоровая спина + Растяжка',tags:['Спина','Гибкость','55 мин'],what:'Комплексная тренировка для здоровья спины и развития гибкости.',includes:'Укрепление спины и плечевого пояса, растяжка передней поверхности тела.',who:'Для всех, кто хочет красиво держать спину и стать гибче.'}
};

const TRAINER_PHONES={'79001110001':'zosya','79001110002':'ksenia','79001110003':'salma','79001110004':'farida','79001110005':'viktoria'};
const TELEGRAM_BOT_USERNAME='kult_astrakhan_bot'; // TODO: заменить на реальный username бота

const ABONEMENTS=[
  {id:'single',label:'Разовое посещение',count:'1 занятие',price:'700 ₽',total:1},
  {id:'ab8',label:'8 тренировок',count:'в месяц',price:'4 300 ₽',total:8},
  {id:'ab12',label:'12 тренировок',count:'в месяц',price:'4 800 ₽',total:12},
  {id:'ab16',label:'16 тренировок',count:'в месяц',price:'6 000 ₽',total:16}
];

/* STATE */
let user=JSON.parse(localStorage.getItem('xk_user')||'null');
let bookings=[];
let reviews={};
let pendingBook=null,activeTrainer=null,currentPage='home';

/* ── FIRESTORE HELPERS ── */
async function db(){
  return new Promise(resolve=>{
    if(window._firebaseReady)resolve(window._db);
    else document.addEventListener('firebase-ready',()=>resolve(window._db),{once:true});
  });
}
const fb=()=>window._fb;

/* Пользователи */
async function dbGetUser(phone){
  const d=await db();
  const snap=await fb().getDoc(fb().doc(d,'users',phone));
  return snap.exists()?{id:snap.id,...snap.data()}:null;
}
async function dbSaveUser(phone,data){
  const d=await db();
  await fb().setDoc(fb().doc(d,'users',phone),data,{merge:true});
}

/* Записи */
async function dbGetBookings(phone){
  const d=await db();
  const q=fb().query(fb().collection(d,'bookings'),fb().where('phone','==',phone));
  const snap=await fb().getDocs(q);
  return snap.docs.map(doc=>({id:doc.id,...doc.data()}));
}
async function dbAddBooking(data){
  const d=await db();
  const ref=await fb().addDoc(fb().collection(d,'bookings'),{...data,createdAt:fb().serverTimestamp()});
  return ref.id;
}
async function dbDeleteBooking(id){
  const d=await db();
  await fb().deleteDoc(fb().doc(d,'bookings',id));
}
async function dbUpdateBookingStatus(id,status){
  const d=await db();
  await fb().updateDoc(fb().doc(d,'bookings',id),{status});
}

/* Записи тренировки (для тренера) */
async function dbGetTrainingBookings(trainerName,trainingName){
  const d=await db();
  const q=fb().query(fb().collection(d,'bookings'),fb().where('trainer','==',trainerName),fb().where('name','==',trainingName));
  const snap=await fb().getDocs(q);
  return snap.docs.map(doc=>({id:doc.id,...doc.data()}));
}

/* Отзывы */
async function dbGetReviews(trainerKey){
  const d=await db();
  const q=fb().query(fb().collection(d,'reviews'),fb().where('trainerKey','==',trainerKey));
  const snap=await fb().getDocs(q);
  return snap.docs.map(doc=>({id:doc.id,...doc.data()}));
}
async function dbAddReview(data){
  const d=await db();
  await fb().addDoc(fb().collection(d,'reviews'),{...data,createdAt:fb().serverTimestamp()});
}

/* INIT */
window.addEventListener('load',async()=>{
  renderNav();renderSchedule();renderTrainers();initSiteImages();
  window.addEventListener('scroll',()=>{
    document.getElementById('nav').classList.toggle('scrolled',window.scrollY>10);
  });
  document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open')}));
  // Если пользователь уже залогинен — подгружаем его записи из Firebase
  if(user&&!user.isTrainer){
    try{bookings=await dbGetBookings(user.phone);}catch(e){bookings=[];}
  }
});

/* IMAGES */
function initSiteImages(){
  const imgs=window.SITE_IMAGES||{};
  const navLogo=document.getElementById('nav-logo-img');
  if(navLogo&&imgs.logoDark)navLogo.src=imgs.logoDark;
  const heroBg=document.getElementById('hero-bg-photo');
  const isMobile=window.innerWidth<=680;
  if(heroBg){
    const src=(isMobile&&imgs.heroTrxMobile)?imgs.heroTrxMobile:imgs.heroTrx;
    if(src){
      heroBg.style.backgroundImage=`url('${src}')`;
      if(isMobile)heroBg.classList.add('mobile-contain');
      requestAnimationFrame(()=>heroBg.classList.add('loaded'));
    }
  }
  const lkBg=document.getElementById('lk-bg-photo');
  if(lkBg&&imgs.equipment){
    lkBg.style.backgroundImage=`url('${imgs.equipment}')`;
    requestAnimationFrame(()=>lkBg.classList.add('loaded'));
  }
  const tcBg=document.getElementById('tc-bg-photo');
  if(tcBg&&imgs.equipment){
    tcBg.style.backgroundImage=`url('${imgs.equipment}')`;
    requestAnimationFrame(()=>tcBg.classList.add('loaded'));
  }
}

/* NAV */
function renderNav(){
  const el=document.getElementById('nav-auth');
  const mm=document.getElementById('mm-auth-section');
  if(user){
    const first=user.name.split(' ')[0];
    const pg=user.isTrainer?'tc':'lk';
    el.innerHTML=`<button class="btn-outline" onclick="showPage('${pg}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${first}</button><button class="btn-primary" onclick="doLogout()">Выйти</button>`;
    mm.innerHTML=`
      <div class="mm-section-label">Личный кабинет</div>
      <button onclick="showPage('${pg}');closeMenu()">
        <svg class="mm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Мой профиль
      </button>
      <button onclick="showPage('${pg}');closeMenu()">
        <svg class="mm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        Мои тренировки
      </button>
      <button onclick="doLogout();closeMenu()">
        <svg class="mm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        Выйти
      </button>`;
  } else {
    el.innerHTML=`<button class="btn-outline" onclick="openAuth('login')">Войти</button><button class="btn-primary" onclick="openAuth('register')">Записаться</button>`;
    mm.innerHTML=`
      <button onclick="openAuth('login');closeMenu()">
        <svg class="mm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
        Войти
      </button>
      <button onclick="openAuth('register');closeMenu()">
        <svg class="mm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        Записаться
      </button>`;
  }
}

function navTo(id){
  if(currentPage!=='home'){showPage('home');setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'}),80);}
  else document.getElementById(id)?.scrollIntoView({behavior:'smooth'});
}
function toggleMenu(){document.getElementById('mobile-menu').classList.toggle('open')}
function closeMenu(){document.getElementById('mobile-menu').classList.remove('open')}

/* PAGES */
async function showPage(p){
  ['home-page','trainer-page','lk-page','tc-page'].forEach(id=>document.getElementById(id).style.display='none');
  currentPage=p;
  const map={'home':'home-page','trainer':'trainer-page','lk':'lk-page','tc':'tc-page'};
  document.getElementById(map[p]).style.display='block';
  if(p==='lk'){
    // Обновляем данные пользователя и записи из Firebase перед рендером
    if(user&&!user.isTrainer){
      try{
        const fresh=await dbGetUser(user.phone);
        if(fresh)user={...user,...fresh};
        bookings=await dbGetBookings(user.phone);
      }catch(e){}
    }
    renderLK();
  }
  if(p==='tc')renderTC();
  window.scrollTo(0,0);
}

/* PHONE FORMAT */
function formatPhone(input){
  let v=input.value.replace(/\D/g,'');
  if(v.startsWith('7'))v=v.slice(1);
  if(v.startsWith('8'))v=v.slice(1);
  v=v.slice(0,10);
  let out='';
  if(v.length>0)out='('+v.slice(0,3);
  if(v.length>=4)out+=') '+v.slice(3,6);
  if(v.length>=7)out+='-'+v.slice(6,8);
  if(v.length>=9)out+='-'+v.slice(8,10);
  input.value=out;
}
function getRawPhone(val){return '7'+val.replace(/\D/g,'')}

/* SCHEDULE */
function renderSchedule(){
  Object.entries(SCHEDULE).forEach(([day,items])=>{
    document.getElementById('sched-'+day).innerHTML=items.map(s=>`
      <div class="sched-card" onclick="openTraining('${s.key}','${s.trainer}','${s.time}')">
        <span class="sched-time">${s.time}</span>
        <div><div class="sched-info-name">${s.name}</div><div class="sched-info-trainer">${s.trainer}</div></div>
        <button class="sched-book-btn">Записаться</button>
      </div>`).join('');
  });
}
function switchDay(day,btn){
  document.querySelectorAll('.day-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.sched-grid').forEach(g=>g.classList.remove('active'));
  document.getElementById('sched-'+day).classList.add('active');
}

/* TRAINERS */
function renderTrainers(){
  document.getElementById('trainers-grid').innerHTML=Object.entries(TRAINERS).map(([k,t])=>`
    <div class="trainer-card" onclick="openTrainerPage('${k}')">
      <div class="trainer-photo-wrap">
        <div class="trainer-photo-placeholder">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
      </div>
      <div class="trainer-card-info">
        <div class="trainer-card-name">${t.name}</div>
        <div class="trainer-card-spec">${t.spec}</div>
      </div>
    </div>`).join('');
}

/* TRAINER PAGE */
async function openTrainerPage(key){
  activeTrainer=key;const t=TRAINERS[key];
  document.getElementById('tp-name').textContent=t.name;
  document.getElementById('tp-spec').textContent=t.spec;
  document.getElementById('tp-avatar').innerHTML=`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width=".8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`;
  document.getElementById('tp-bio').innerHTML=t.bio.split('\\n\\n').map(p=>`<p style="margin-bottom:16px">${p}</p>`).join('');
  document.getElementById('tp-sched').innerHTML=t.schedule.map(s=>`
    <div class="tsched-item">
      <span class="tsched-time">${s.time}</span>
      <span class="tsched-name">${s.name}</span>
      <span class="tsched-days">${s.days}</span>
      <button class="tsched-btn" onclick="openBookingModal('${s.name}','${t.name}','${s.time}','${s.days}')">Записаться</button>
    </div>`).join('');
  document.getElementById('tp-reviews').innerHTML='<div class="lk-empty-state" style="padding:20px">Загружаем отзывы...</div>';
  showPage('trainer');
  // Загружаем отзывы из Firestore
  try{
    const fbReviews=await dbGetReviews(key);
    reviews[key]=fbReviews;
    const allR=[...t.reviews,...fbReviews];
    document.getElementById('tp-reviews').innerHTML=allR.length
      ?allR.map(r=>`<div class="review-card"><div class="review-author">${r.author}</div><div class="review-body">${r.text}</div></div>`).join('')
      :'<div class="lk-empty-state">Пока нет отзывов. Будьте первыми!</div>';
  }catch(e){
    const allR=[...t.reviews,...(reviews[key]||[])];
    document.getElementById('tp-reviews').innerHTML=allR.length
      ?allR.map(r=>`<div class="review-card"><div class="review-author">${r.author}</div><div class="review-body">${r.text}</div></div>`).join('')
      :'<div class="lk-empty-state">Пока нет отзывов. Будьте первыми!</div>';
  }
}

/* TRAINING MODAL */
function openTraining(key,trainer,time){
  const t=TRAININGS[key];if(!t)return;
  // находим дни этой тренировки у этого тренера из расписания
  const trainerObj=Object.values(TRAINERS).find(tr=>tr.name===trainer);
  const schedEntry=trainerObj?trainerObj.schedule.find(s=>s.time===time):null;
  const days=schedEntry?schedEntry.days:'';
  const displayName=schedEntry?schedEntry.name:t.name;
  document.getElementById('training-content').innerHTML=`
    <h2 class="modal-title">${t.name}</h2>
    <div class="training-tags">${t.tags.map(tg=>`<span class="t-tag">${tg}</span>`).join('')}</div>
    <div class="t-block"><h4>Что это</h4><p>${t.what}</p></div>
    <div class="t-block"><h4>Что входит</h4><p>${t.includes}</p></div>
    <div class="t-block"><h4>Для кого</h4><p>${t.who}</p></div>
    <div class="t-block"><h4>Тренер</h4><p>${trainer}</p></div>
    <button class="form-submit" style="margin-top:20px" onclick="closeOv('ov-training');openBookingModal('${displayName.replace(/'/g,"\\'")}','${trainer}','${time}','${days}')">Записаться</button>`;
  document.getElementById('ov-training').classList.add('open');
}

/* Вычисляем ближайшую дату тренировки по дню недели */
const DAY_MAP={'Пн':1,'Вт':2,'Ср':3,'Чт':4,'Пт':5,'Сб':6,'Вс':0};
function nextDateForDays(daysStr,timeStr){
  if(!daysStr)return null;
  const dayAbbrs=daysStr.split(',').map(s=>s.trim());
  const targetDows=dayAbbrs.map(d=>DAY_MAP[d]).filter(d=>d!==undefined);
  if(!targetDows.length)return null;
  const now=new Date();
  const [hh,mm]=(timeStr||'00:00').split(':').map(Number);
  for(let i=0;i<14;i++){
    const cand=new Date(now);
    cand.setDate(now.getDate()+i);
    cand.setHours(hh,mm,0,0);
    if(targetDows.includes(cand.getDay())&&cand>now){
      return cand.toISOString();
    }
  }
  return null;
}
function formatDateShort(iso){
  if(!iso)return '';
  const d=new Date(iso);
  const months=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/* BOOKING */
function openBookingModal(name,trainer,time,days){
  if(!user){openAuth('login');return;}
  pendingBook={name,trainer,time,days};
  const tName=TRAININGS[name]?TRAININGS[name].name:name;
  const nextDate=nextDateForDays(days,time);
  document.getElementById('bk-title').textContent=tName;
  document.getElementById('bk-sub').textContent=`Тренер: ${trainer}${time?' · '+time:''}${nextDate?' · Ближайшая: '+formatDateShort(nextDate):(days?' · '+days:'')}`;
  document.getElementById('ov-booking').classList.add('open');
}
async function confirmBook(){
  if(!pendingBook)return;
  const btn=document.querySelector('#ov-booking .form-submit');
  if(btn){btn.disabled=true;btn.textContent='Записываем...';}
  try{
    const nextDate=nextDateForDays(pendingBook.days,pendingBook.time);
    const bookingData={...pendingBook,phone:user.phone,userName:user.name,status:'upcoming',trainingDate:nextDate,createdAt:new Date().toISOString()};
    const id=await dbAddBooking(bookingData);
    bookings.push({...bookingData,id});
    closeOv('ov-booking');
    toast('Вы записаны! Напоминание придёт в Telegram за 10 часов');
  }catch(e){
    console.error(e);
    // Fallback
    const nextDate=nextDateForDays(pendingBook.days,pendingBook.time);
    const b={...pendingBook,id:Date.now(),phone:user.phone,userName:user.name,status:'upcoming',trainingDate:nextDate};
    bookings.push(b);
    const key='xk_bookings_'+user.phone;
    localStorage.setItem(key,JSON.stringify(bookings));
    closeOv('ov-booking');
    toast('Вы записаны!');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='Подтвердить запись';}
    pendingBook=null;
  }
}

/* REVIEWS */
function openReviewModal(){
  if(!user){openAuth('login');return;}
  document.getElementById('rv-sub').textContent=`Отзыв о тренере ${TRAINERS[activeTrainer].name}`;
  document.getElementById('rv-text').value='';
  document.getElementById('ov-review').classList.add('open');
}
async function submitReview(){
  const text=document.getElementById('rv-text').value.trim();
  if(!text){toast('Напишите отзыв');return;}
  const btn=document.querySelector('#ov-review .form-submit');
  if(btn){btn.disabled=true;btn.textContent='Отправляем...';}
  try{
    await dbAddReview({trainerKey:activeTrainer,author:user.name.split(' ').slice(0,2).join(' '),text,phone:user.phone});
    if(!reviews[activeTrainer])reviews[activeTrainer]=[];
    reviews[activeTrainer].push({author:user.name.split(' ').slice(0,2).join(' '),text});
  }catch(e){
    console.error(e);
    if(!reviews[activeTrainer])reviews[activeTrainer]=[];
    reviews[activeTrainer].push({author:user.name.split(' ').slice(0,2).join(' '),text});
  }finally{if(btn){btn.disabled=false;btn.textContent='Отправить';}}
  closeOv('ov-review');toast('Спасибо за отзыв!');openTrainerPage(activeTrainer);
}

/* AUTH */
function openAuth(view){switchAuth(view);document.getElementById('ov-auth').classList.add('open')}
function switchAuth(v){
  document.getElementById('auth-login').style.display=v==='login'?'block':'none';
  document.getElementById('auth-register').style.display=v==='register'?'block':'none';
}
async function doLogin(){
  const raw=getRawPhone(document.getElementById('li-phone').value);
  if(raw.length<11){toast('Введите номер телефона');return;}
  // Проверяем тренерский аккаунт
  const trKey=TRAINER_PHONES[raw];
  if(trKey){
    user={name:TRAINERS[trKey].name,phone:raw,isTrainer:true,trainerKey:trKey};
    save();closeOv('ov-auth');renderNav();showPage('tc');return;
  }
  // Ищем в Firestore
  try{
    showLoading(true);
    const found=await dbGetUser(raw);
    if(!found){toast('Пользователь не найден. Зарегистрируйтесь.');showLoading(false);return;}
    user={...found,phone:raw};
    bookings=await dbGetBookings(raw);
    save();closeOv('ov-auth');renderNav();showPage('lk');
  }catch(e){
    console.error(e);
    // Fallback на localStorage если Firebase недоступен
    const users=JSON.parse(localStorage.getItem('xk_users')||'[]');
    const found=users.find(u=>u.phone===raw);
    if(!found){toast('Пользователь не найден');showLoading(false);return;}
    user=found;bookings=JSON.parse(localStorage.getItem('xk_bookings_'+raw)||'[]');
    save();closeOv('ov-auth');renderNav();showPage('lk');
  }finally{showLoading(false);}
}

async function doRegister(){
  const name=document.getElementById('rg-name').value.trim();
  const raw=getRawPhone(document.getElementById('rg-phone').value);
  if(!name||raw.length<11){toast('Заполните все поля');return;}
  try{
    showLoading(true);
    // Проверяем есть ли уже такой пользователь
    const existing=await dbGetUser(raw);
    if(existing){toast('Этот номер уже зарегистрирован');showLoading(false);return;}
    const userData={name,phone:raw,isTrainer:false,abonement:null,createdAt:new Date().toISOString()};
    await dbSaveUser(raw,userData);
    user={...userData};
    // Backup в localStorage
    const users=JSON.parse(localStorage.getItem('xk_users')||'[]');
    users.push(userData);localStorage.setItem('xk_users',JSON.stringify(users));
    save();closeOv('ov-auth');renderNav();toast('Добро пожаловать в КУЛЬТ!');showPage('lk');
  }catch(e){
    console.error(e);
    // Fallback
    const users=JSON.parse(localStorage.getItem('xk_users')||'[]');
    if(users.find(u=>u.phone===raw)){toast('Этот номер уже зарегистрирован');showLoading(false);return;}
    user={name,phone:raw,isTrainer:false,abonement:null};
    users.push(user);localStorage.setItem('xk_users',JSON.stringify(users));
    save();closeOv('ov-auth');renderNav();toast('Добро пожаловать в КУЛЬТ!');showPage('lk');
  }finally{showLoading(false);}
}

function doLogout(){user=null;bookings=[];localStorage.removeItem('xk_user');renderNav();showPage('home')}
function save(){localStorage.setItem('xk_user',JSON.stringify(user))}
function showLoading(on){
  const btn=document.querySelector('#ov-auth .form-submit');
  if(btn){btn.disabled=on;btn.textContent=on?'Загрузка...':btn.dataset.text||(btn.textContent||'Войти');}
}

/* LK */
function renderLK(){
  if(!user)return;
  document.getElementById('lk-greeting').textContent=`Привет, ${user.name.split(' ')[0]}!`;
  document.getElementById('lk-phone').textContent='+'+user.phone;

  // header badge
  const abEl=document.getElementById('lk-header-ab');
  if(user.abonement){
    const ab=ABONEMENTS.find(a=>a.id===user.abonement);
    abEl.innerHTML=ab?`<div class="lk-ab-badge"><div class="lk-ab-badge-dot"></div><span class="lk-ab-badge-text">${ab.label}</span></div>`:'';
  } else abEl.innerHTML='';

  // sidebar
  const sb=document.getElementById('lk-sidebar');
  if(user.abonement){
    const ab=ABONEMENTS.find(a=>a.id===user.abonement);
    const used=bookings.filter(b=>b.status==='attended'||b.status==='missed').length;
    const total=ab?ab.total:1;
    sb.innerHTML=`
      <div class="lk-ab-active">
        <div class="lk-ab-tag">Активный абонемент</div>
        <div class="lk-ab-title">${ab?ab.label:'—'}</div>
        <div class="lk-ab-track"><div class="lk-ab-fill" style="width:${Math.min(100,Math.round(used/total*100))}%"></div></div>
        <div class="lk-ab-meta">Использовано ${used} из ${total} занятий</div>
        <button class="lk-ab-change" onclick="renderAbSelect()">Сменить абонемент</button>
      </div>`;
  } else {
    sb.innerHTML=renderAbSelectHTML();
  }

  // Telegram connection banner
  const tgBanner=document.getElementById('lk-telegram-banner');
  if(!user.telegramChatId){
    tgBanner.innerHTML=`
      <div class="tg-banner">
        <div class="tg-banner-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#29b6f6" stroke-width="1.8"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </div>
        <div style="flex:1">
          <div class="tg-banner-title">Подключи уведомления в Telegram</div>
          <div class="tg-banner-text">Напоминания о тренировках за 10 часов и подтверждение записи — прямо в мессенджере</div>
        </div>
        <a href="https://t.me/${TELEGRAM_BOT_USERNAME}?start=${user.phone}" target="_blank" class="tg-banner-btn">Подключить</a>
      </div>`;
  } else {
    tgBanner.innerHTML='';
  }

  // bookings — сортируем: сначала предстоящие, потом прошедшие
  const list=document.getElementById('lk-list');
  const sorted=[...bookings].sort((a,b)=>new Date(a.trainingDate||0)-new Date(b.trainingDate||0));
  list.innerHTML=sorted.length
    ?sorted.map((b)=>{
      const idx=bookings.indexOf(b);
      const status=b.status||'upcoming';
      const statusBadge=status==='attended'
        ?'<span class="lk-status-badge lk-status-attended">Посещено</span>'
        :status==='missed'
        ?'<span class="lk-status-badge lk-status-missed">Сгорела</span>'
        :'<span class="lk-status-badge lk-status-upcoming">Предстоит</span>';
      return `
      <div class="lk-booking-row">
        <div class="lk-booking-time">${b.time||'—'}${b.trainingDate?'<div class=\"lk-booking-date\">'+formatDateShort(b.trainingDate)+'</div>':''}</div>
        <div><div class="lk-booking-name">${TRAININGS[b.name]?TRAININGS[b.name].name:b.name}</div><div class="lk-booking-trainer">${b.trainer}${b.days?' · '+b.days:''}</div></div>
        <div style="display:flex;align-items:center;gap:10px">
          ${statusBadge}
          ${status==='upcoming'?`<button class="lk-cancel-btn" onclick="cancelBook(${idx})">Отменить</button>`:''}
        </div>
      </div>`;}).join('')
    :'<div class="lk-empty-state">Вы ещё не записаны ни на одну тренировку.<br>Перейдите в расписание и выберите занятие.</div>';
}

function renderAbSelectHTML(selectedId){
  return `<div class="ab-select-card">
    <div class="ab-select-title">Выбери абонемент</div>
    <div class="ab-select-sub">Выбери подходящий формат занятий</div>
    <div class="ab-options">
      ${ABONEMENTS.map(a=>`
        <div class="ab-option${selectedId===a.id?' selected':''}" onclick="selectAb('${a.id}',this)">
          <div class="ab-option-left">
            <div class="ab-radio"><div class="ab-radio-dot"></div></div>
            <div><div class="ab-option-name">${a.label}</div><div class="ab-option-count">${a.count}</div></div>
          </div>
          <div class="ab-option-price">${a.price}</div>
        </div>`).join('')}
    </div>
    <button class="ab-save-btn" onclick="saveAb()">Выбрать абонемент</button>
  </div>`;
}

let pendingAbId=null;
function renderAbSelect(){document.getElementById('lk-sidebar').innerHTML=renderAbSelectHTML(user.abonement);pendingAbId=user.abonement}
function selectAb(id,el){
  pendingAbId=id;
  document.querySelectorAll('.ab-option').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
}
async function saveAb(){
  if(!pendingAbId){toast('Выберите абонемент');return;}
  user.abonement=pendingAbId;
  save();
  try{
    await dbSaveUser(user.phone,{abonement:pendingAbId});
  }catch(e){console.error(e);}
  // Backup localStorage
  const users=JSON.parse(localStorage.getItem('xk_users')||'[]');
  const idx=users.findIndex(u=>u.phone===user.phone);
  if(idx>=0)users[idx]=user;
  localStorage.setItem('xk_users',JSON.stringify(users));
  renderLK();toast('Абонемент выбран!');
}
async function cancelBook(i){
  const b=bookings[i];
  try{
    if(b.id&&typeof b.id==='string')await dbDeleteBooking(b.id);
  }catch(e){console.error(e);}
  bookings.splice(i,1);
  renderLK();toast('Запись отменена');
}

/* TC */
async function renderTC(){
  if(!user||!user.isTrainer)return;
  const t=TRAINERS[user.trainerKey];
  document.getElementById('tc-greeting').textContent=t.name;
  document.getElementById('tc-role').textContent=t.spec;
  const list=document.getElementById('tc-list');
  list.innerHTML='<div class="lk-empty-state">Загружаем данные...</div>';
  // запоминаем какие группы были раскрыты, чтобы не сбрасывать при перерисовке
  const openGroups=new Set();
  document.querySelectorAll('.tc-clients-list.open').forEach(el=>openGroups.add(el.id));
  // Загружаем реальных клиентов из Firestore, группируем по (тренировка+дата)
  const scheduleWithClients=await Promise.all(t.schedule.map(async(s)=>{
    try{
      const clients=await dbGetTrainingBookings(t.name,s.name);
      // сортируем по дате тренировки, ближайшие сверху
      clients.sort((a,b)=>new Date(a.trainingDate||0)-new Date(b.trainingDate||0));
      return{...s,clients};
    }catch(e){return{...s,clients:[]};}
  }));
  list.innerHTML=scheduleWithClients.map((s,i)=>`
    <div class="tc-group">
      <div class="tc-group-header" onclick="toggleTC(${i})">
        <span class="tc-group-time">${s.time}</span>
        <div><div class="tc-group-name">${s.name}</div><div class="tc-group-days">${s.days}</div></div>
        <span class="tc-group-count">${s.clients.length} клиентов</span>
      </div>
      <div class="tc-clients-list${openGroups.has('tc-cl-'+i)?' open':''}" id="tc-cl-${i}">
        ${s.clients.length
          ?s.clients.map(c=>`
            <div class="tc-client-row-full" data-booking-id="${c.id}">
              <div class="tc-client-info">
                <div class="tc-client-name">${c.userName||'—'}</div>
                <div class="tc-client-meta">+${c.phone||''}${c.trainingDate?' · '+formatDateShort(c.trainingDate):''}</div>
              </div>
              <div class="tc-attend-buttons">
                <button class="tc-attend-btn tc-attend-yes${c.status==='attended'?' active':''}" onclick="markAttendance('${c.id}','attended',this)" title="Пришла">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <button class="tc-attend-btn tc-attend-no${c.status==='missed'?' active':''}" onclick="markAttendance('${c.id}','missed',this)" title="Не пришла">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>`).join('')
          :'<div style="padding:16px 24px;font-size:14px;color:var(--ink-muted)">Записей пока нет</div>'
        }
      </div>
    </div>`).join('');
}
function toggleTC(i){document.getElementById('tc-cl-'+i).classList.toggle('open')}

async function markAttendance(bookingId,status,btnEl){
  // Оптимистично обновляем именно эту карточку клиента — без полной перерисовки списка
  const row=btnEl?btnEl.closest('.tc-client-row-full'):null;
  if(row){
    row.querySelector('.tc-attend-yes').classList.toggle('active',status==='attended');
    row.querySelector('.tc-attend-no').classList.toggle('active',status==='missed');
  }
  try{
    await dbUpdateBookingStatus(bookingId,status);
    toast(status==='attended'?'Отмечено: пришла':'Отмечено: не пришла — занятие списано');
  }catch(e){
    console.error(e);
    toast('Не удалось сохранить отметку');
    renderTC();
  }
}

/* UTILS */
function closeOv(id){document.getElementById(id).classList.remove('open')}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3200)}