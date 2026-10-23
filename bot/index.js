require('dotenv').config();
const express=require('express');
const fetch=require('node-fetch');
const cron=require('node-cron');
const admin=require('firebase-admin');

admin.initializeApp({
  credential:admin.credential.cert({
    projectId:process.env.FIREBASE_PROJECT_ID,
    privateKeyId:process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey:(process.env.FIREBASE_PRIVATE_KEY||'').replace(/\\n/g,'\n').replace(/^"|"$/g,''),
    clientEmail:process.env.FIREBASE_CLIENT_EMAIL,
    clientId:process.env.FIREBASE_CLIENT_ID,
  }),
});
const db=admin.firestore();
const BOT_TOKEN=process.env.TELEGRAM_BOT_TOKEN;
const SERVER_URL=process.env.SERVER_URL;
const PORT=process.env.PORT||3000;
const app=express();
app.use(express.json());

const userStates={};

const tg=m=>`https://api.telegram.org/bot${BOT_TOKEN}/${m}`;

async function send(chatId,text,extra={}){
  const res=await fetch(tg('sendMessage'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text,parse_mode:'HTML',...extra})});
  return res.json();
}
async function edit(chatId,msgId,text,extra={}){
  await fetch(tg('editMessageText'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,message_id:msgId,text,parse_mode:'HTML',...extra})});
}
async function answer(id,text,alert=false){
  await fetch(tg('answerCallbackQuery'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({callback_query_id:id,text,show_alert:alert})});
}

function normPhone(raw){
  let d=String(raw).replace(/\D/g,'');
  if(d.length===11&&d.startsWith('8'))d='7'+d.slice(1);
  if(d.length===10)d='7'+d;
  return d;
}
function fmtDate(iso){
  if(!iso)return'';
  const d=new Date(iso);
  const mo=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const dn=['воскресенье','понедельник','вторник','среду','четверг','пятницу','субботу'];
  return `${d.getDate()} ${mo[d.getMonth()]} (${dn[d.getDay()]}) в ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function fmtDateNoTime(iso){
  if(!iso)return'';
  const d=new Date(iso);
  const mo=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `${d.getDate()} ${mo[d.getMonth()]}`;
}
function fmtWeekday(iso){
  if(!iso)return'';
  const d=new Date(iso);
  const days=['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
  return days[d.getDay()];
}
function pluralPeople(n){
  const mod10=n%10,mod100=n%100;
  if(mod10===1&&mod100!==11)return 'человек';
  if([2,3,4].includes(mod10)&&![12,13,14].includes(mod100))return 'человека';
  return 'человек';
}

/* Дни по группе расписания — совпадает с GROUP_DAYS в app.js (сайт) */
const GROUP_DAY_LABEL={mwf:'Пн, Ср, Пт',tts:'Вт, Чт, Сб'};
const DAY_ABBR=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

function startOfToday(d){
  const x=new Date(d);
  x.setHours(0,0,0,0);
  return x;
}
function endOfToday(d){
  return new Date(startOfToday(d).getTime()+86400000);
}

/* Расписание тренера читаем из коллекции schedule (а не из trainer.schedule,
   которого там может не быть — см. структуру в admin.html) */
async function getTrainerSchedule(trainer){
  const snap=await db.collection('schedule').where('trainer','==',trainer.name).get();
  return snap.docs
    .map(d=>({id:d.id,...d.data()}))
    .map(s=>({...s,days:GROUP_DAY_LABEL[s.group]||''}))
    .sort((a,b)=>String(a.time).localeCompare(String(b.time)));
}

/* ═══════════════════════════════════════════════════════════
   ПОСТОЯННЫЕ КЛИЕНТЫ (recurringAssignments)
   ═══════════════════════════════════════════════════════════ */

/*
   МОДЕЛЬ: постоянному клиенту при прикреплении (делается в admin.html) сразу
   генерируется РОВНО sessionsLeft обычных документов в bookings (status: 'upcoming',
   source: 'recurring', recurringId: <id прикрепления>) — по одному на каждое оставшееся
   занятие абонемента. Здесь, в боте, мы эти записи только читаем и отмечаем посещение —
   списание sessionsLeft происходит за ЛЮБУЮ отметку (attended ИЛИ missed — слот уже
   зарезервирован под абонемент при прикреплении). Никакой "доливки" здесь больше нет:
   прикрепление одноразовое, при новом абонементе админ прикрепляет клиента заново.

   ВАЖНО: каждый booking — это НЕЗАВИСИМЫЙ документ-снимок. Если админ потом меняет
   время/название/тренера слота в расписании, уже сгенерированные документы САМИ ПО
   СЕБЕ не обновляются (это и была причина бага "в напоминании 15:00, а в расписании
   19:00" — время было зафиксировано в момент генерации записи и больше не менялось).
   Синхронизация уже существующих записей с текущим расписанием делается в
   admin.html → Настройки → Обслуживание базы → "Синхронизировать время записей
   с расписанием", а при любом будущем редактировании слота в админке время у ещё не
   прошедших записей обновляется автоматически (см. propagateSlotChangeToBookings
   в admin.html).
*/

async function getRecurringForTrainer(trainerName){
  const snap=await db.collection('recurringAssignments').where('trainerName','==',trainerName).get();
  return snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.active!==false);
}

/* Отмечает посещение (разовой ИЛИ постоянной записи — технически одинаковые документы).
   ФИКС (та же логика, что и в кабинете тренера на сайте, script.js):
   - это ПЕРЕКЛЮЧАТЕЛЬ: повторное нажатие на уже стоящую отметку снимает её, возвращая
     статус "upcoming" (на случай ошибки тренера);
   - переключение между "пришла"/"не пришла" не списывает занятие повторно — оно уже
     было списано при первой отметке;
   - нельзя отметить посещение у тренировки, которая ещё не наступила (проверяется
     только при ПЕРВИЧНОЙ отметке — снятие/переключение статуса всегда разрешено).
   Списание sessionsLeft — только для постоянных клиентов (source: 'recurring') и
   только при первичной отметке; возврат — при снятии отметки. Для обычных записей
   sessionsLeft уже списан в момент записи на сайте, здесь не трогаем. */
async function markAttendanceWithSessionCharge(bookingId,status){
  const bookRef=db.collection('bookings').doc(bookingId);
  let resultStatus=status;
  await db.runTransaction(async(tx)=>{
    // ВАЖНО: Firestore требует, чтобы ВСЕ чтения (tx.get) шли раньше ВСЕХ записей
    // (tx.update) — иначе ошибка "transactions require all reads to be executed
    // before all writes". Поэтому читаем booking И (если нужно) user ДО любого update.
    const bookSnap=await tx.get(bookRef);
    if(!bookSnap.exists)throw new Error('booking_not_found');
    const booking=bookSnap.data();
    const prevStatus=booking.status;

    const isUnmarking=prevStatus===status;
    const newStatus=isUnmarking?'upcoming':status;

    if(!isUnmarking&&prevStatus==='upcoming'&&booking.trainingDate){
      const sessionStart=new Date(booking.trainingDate);
      if(sessionStart>new Date())throw new Error('future_session');
    }

    const isRecurring=booking.source==='recurring'&&!!booking.phone;
    const userRef=isRecurring?db.collection('users').doc(booking.phone):null;
    const userSnap=userRef?await tx.get(userRef):null;

    tx.update(bookRef,{status:newStatus});

    if(isRecurring&&userSnap&&userSnap.exists){
      const currentLeft=userSnap.data().sessionsLeft;
      if(currentLeft!==null&&currentLeft!==undefined){
        if(prevStatus==='upcoming'&&newStatus!=='upcoming'){
          tx.update(userRef,{sessionsLeft:Math.max(0,currentLeft-1)});
        }else if(prevStatus!=='upcoming'&&newStatus==='upcoming'){
          tx.update(userRef,{sessionsLeft:currentLeft+1});
        }
        // attended <-> missed: занятие уже было списано один раз, второй раз не трогаем.
      }
    }
    resultStatus=newStatus;
  });
  return resultStatus;
}

/* Уведомляет тренера об отмене клиентом тренировки (и ставит trainerNotified: true,
   чтобы периодический cron ниже не прислал то же самое уведомление повторно).
   Работает для отмен, сделанных как через бота, так и через сайт (кнопка "Не смогу
   прийти" в ЛК клиента) — сайт создаёт тот же статус cancelled_by_client в том же
   документе, а раз в 15 минут cron ниже подбирает все ещё не отправленные уведомления. */
async function notifyTrainerOfCancellation(booking,bookingId){
  try{
    if(!booking.trainer)return;
    const tSnap=await db.collection('trainers').where('name','==',booking.trainer).limit(1).get();
    if(tSnap.empty)return;
    const trainer=tSnap.docs[0].data();
    if(!trainer.telegramChatId)return;
    const dateStr=booking.trainingDate?fmtDate(booking.trainingDate):(booking.days||'');
    await send(trainer.telegramChatId,
      `⚠️ <b>Клиент отменил тренировку</b>\n\n👤 ${booking.userName||booking.phone||'—'}\n🏋️‍♀️ ${booking.name}\n📆 ${dateStr}\n\nСтоит иметь это в виду при планировании группы.`
    );
    if(bookingId){
      await db.collection('bookings').doc(bookingId).set({trainerNotified:true},{merge:true});
    }
  }catch(e){
    console.error('Не удалось уведомить тренера об отмене:',e.message);
  }
}

/* ═══════════════════════════════════════════════════════════
   КЛИЕНТ — меню и тексты
   ═══════════════════════════════════════════════════════════ */

const mainMenu={inline_keyboard:[
  [{text:'📅 Мои тренировки',callback_data:'my_bookings'}],
  [{text:'💳 Мой абонемент',callback_data:'my_abonement'}],
  [{text:'📞 Контакты студии',callback_data:'contacts'}],
  [{text:'🚪 Выйти из аккаунта',callback_data:'logout'}],
]};
const backBtn={inline_keyboard:[[{text:'← Главное меню',callback_data:'main_menu'}]]};

const AB_L={single:'🎟 Разовое (700 ₽)',ab8:'📦 8 тренировок (4 300 ₽)',ab12:'📦 12 тренировок (4 800 ₽)',ab16:'📦 16 тренировок (6 000 ₽)'};
const AB_T={single:1,ab8:8,ab12:12,ab16:16};

async function showMenu(chatId,user,msgId=null){
  const name=(user.name||'').split(' ')[0]||'подруга';
  const ab=user.abonement?AB_L[user.abonement]:'не выбран';
  const text=`🏋️‍♀️ <b>Личный кабинет</b>\n\nПривет, <b>${name}</b>! 🤍\n\n📱 Телефон: <code>+${user.phone}</code>\n💳 Абонемент: ${ab}\n\nЧто хочешь узнать?`;
  if(msgId)await edit(chatId,msgId,text,{reply_markup:mainMenu});
  else await send(chatId,text,{reply_markup:mainMenu});
}

/* ═══════════════════════════════════════════════════════════
   ТРЕНЕР — меню и тексты
   ═══════════════════════════════════════════════════════════ */

const trainerMenu={inline_keyboard:[
  [{text:'📅 Мои тренировки',callback_data:'t_schedule'}],
  [{text:'🚪 Выйти из аккаунта',callback_data:'logout'}],
]};
const backTrainerBtn={inline_keyboard:[[{text:'← Главное меню',callback_data:'t_menu'}]]};

async function showTrainerMenu(chatId,trainer,msgId=null){
  const name=(trainer.name||'').split(' ')[0]||'тренер';
  const text=`🏋️‍♀️ <b>Кабинет тренера</b>\n\nПривет, <b>${name}</b>! 🤍\n\n📱 Телефон: <code>+${trainer.phone}</code>\n🎯 Специализация: ${trainer.spec||'—'}\n\nЧто хочешь посмотреть?`;
  if(msgId)await edit(chatId,msgId,text,{reply_markup:trainerMenu});
  else await send(chatId,text,{reply_markup:trainerMenu});
}

async function showTrainerSchedule(chatId,trainer,msgId){
  const schedule=await getTrainerSchedule(trainer);
  if(!schedule.length){
    return await edit(chatId,msgId,'📅 <b>Мои тренировки</b>\n\nРасписание пока не добавлено администратором.',{reply_markup:backTrainerBtn});
  }
  // Сохраняем расписание в память процесса, чтобы t_slot:<index> мог его найти
  userStates[chatId+'_schedule']=schedule;

  const buttons=schedule.map((s,i)=>[{text:`${s.time} · ${s.name}`,callback_data:`t_slot:${i}`}]);
  buttons.push([{text:'← Главное меню',callback_data:'t_menu'}]);
  await edit(chatId,msgId,'📅 <b>Мои тренировки</b>\n\nВыбери занятие, чтобы увидеть, кто записан сегодня:',{reply_markup:{inline_keyboard:buttons}});
}

/* ФИКС: раньше здесь бралась "ближайшая общая дата" среди ВСЕХ клиентов слота —
   если у части клиентов эта дата была отменена, список "съезжал" на следующую дату
   сразу у всех, и часть клиентов с другой датой пропадала из вида (та же проблема,
   что чинили в кабинете тренера на сайте). Теперь — как и на сайте — берём РОВНО
   СЕГОДНЯШНИЙ день: все записи этого слота с trainingDate = сегодня, независимо от
   статуса (включая отменённые — их тренер должен видеть как предупреждение). */
async function getSlotClients(trainer,s){
  const snap=await db.collection('bookings')
    .where('trainer','==',trainer.name)
    .where('name','==',s.name)
    .get();

  const st=startOfToday(new Date());
  const en=endOfToday(new Date());

  return snap.docs
    .map(d=>({id:d.id,...d.data()}))
    .filter(c=>c.time===s.time)
    .filter(c=>c.trainingDate&&new Date(c.trainingDate)>=st&&new Date(c.trainingDate)<en)
    .sort((a,b)=>(a.userName||'').localeCompare(b.userName||'','ru'));
}

/* Остатки абонемента для клиентов-подписчиков (чтобы показать "абонемент закончился"
   только у постоянных клиентов — у разовых это не считаем, т.к. списание у них уже
   произошло в момент записи на сайте). */
async function withSessionsLeft(clients){
  return Promise.all(clients.map(async(c)=>{
    if(c.source!=='recurring')return c;
    try{
      const uSnap=await db.collection('users').doc(c.phone).get();
      const left=uSnap.exists?uSnap.data().sessionsLeft:undefined;
      return {...c,sessionsLeft:left};
    }catch(e){return c;}
  }));
}

async function showTrainerSlotClients(chatId,trainer,slotIndex,msgId){
  let schedule=userStates[chatId+'_schedule'];
  if(!schedule){
    schedule=await getTrainerSchedule(trainer);
    userStates[chatId+'_schedule']=schedule;
  }
  const s=schedule[slotIndex];
  if(!s)return await edit(chatId,msgId,'Занятие не найдено. Открой список тренировок заново.',{reply_markup:backTrainerBtn});

  const clientsRaw=await getSlotClients(trainer,s);
  const clients=await withSessionsLeft(clientsRaw);

  const active=clients.filter(c=>c.status!=='cancelled_by_client');
  const cancelled=clients.filter(c=>c.status==='cancelled_by_client');

  let text=`🏋️‍♀️ <b>${s.name}</b>\n⏰ ${s.time} · сегодня\n\n`;
  const rows=[];

  if(!active.length&&!cancelled.length){
    text+='👥 Записалось: <b>0 человек</b>\n\nПока никто не записан на это занятие.';
  }else{
    text+=`👥 Записалось: <b>${active.length} ${pluralPeople(active.length)}</b>\n`;
    if(cancelled.length)text+=`⚠️ Отменили сегодня: <b>${cancelled.length}</b>\n`;

    if(active.length){
      text+='\nОтметь посещаемость:\n';
      active.forEach((c,i)=>{
        const isRecurring=c.source==='recurring';
        const noSessions=isRecurring&&c.sessionsLeft!==null&&c.sessionsLeft!==undefined&&c.sessionsLeft<=0;
        const mark=c.status==='attended'?' ✅ пришла':c.status==='missed'?' ❌ не пришла':'';
        text+=`\n${i+1}. <b>${c.userName||'—'}</b>${isRecurring?' · <i>постоянный</i>':''}${noSessions?' · <i>абонемент закончился</i>':''}${mark}\n   📱 +${c.phone||''}`;
        rows.push([
          {text:`${c.status==='attended'?'✅':'⬜️'} ${(c.userName||'—').split(' ')[0]} пришла`,callback_data:`t_mark:${c.id}:attended:${slotIndex}`},
          {text:`${c.status==='missed'?'❌':'⬜️'} не пришла`,callback_data:`t_mark:${c.id}:missed:${slotIndex}`},
        ]);
      });
    }

    if(cancelled.length){
      text+='\n\n⚠️ <b>Отменили сегодня:</b>';
      cancelled.forEach(c=>{text+=`\n• ${c.userName||'—'} · +${c.phone||''}`;});
    }
  }

  rows.push([{text:'← К тренировкам',callback_data:'t_schedule'}]);
  await edit(chatId,msgId,text,{reply_markup:{inline_keyboard:rows}});
}
/* ═══════════════════════════════════════════════════════════
   ОПРЕДЕЛЕНИЕ ПОЛЬЗОВАТЕЛЯ (клиент или тренер) ПО chatId
   ═══════════════════════════════════════════════════════════ */

async function getUser(chatId){
  const uSnap=await db.collection('users').where('telegramChatId','==',chatId).limit(1).get();
  if(!uSnap.empty)return {phone:uSnap.docs[0].id,...uSnap.docs[0].data(),role:'client'};
  const tSnap=await db.collection('trainers').where('telegramChatId','==',chatId).limit(1).get();
  if(!tSnap.empty)return {phone:tSnap.docs[0].id,...tSnap.docs[0].data(),role:'trainer'};
  return null;
}

/* ═══════════════════════════════════════════════════════════
   СООБЩЕНИЯ
   ═══════════════════════════════════════════════════════════ */

async function handleMsg(message){
  const chatId=String(message.chat.id);
  const text=(message.text||'').trim();
  const state=userStates[chatId];

  if(text==='/start'||text.startsWith('/start ')){
    const arg=text.split(' ')[1];
    const user=await getUser(chatId);
    if(user)return user.role==='trainer'?await showTrainerMenu(chatId,user):await showMenu(chatId,user);
    if(arg)return await tryLogin(chatId,arg);
    userStates[chatId]='waiting_phone';
    return await send(chatId,'👋 Привет! Я бот студии <b>КУЛЬТ</b> 🤍\n\nНапиши свой номер телефона (тот, что указывала при регистрации):\n\n<code>+7XXXXXXXXXX</code>');
  }
  if(text==='/menu'){
    const user=await getUser(chatId);
    if(!user){userStates[chatId]='waiting_phone';return await send(chatId,'Сначала войди! Напиши номер телефона 📱');}
    return user.role==='trainer'?await showTrainerMenu(chatId,user):await showMenu(chatId,user);
  }
  if(text==='/logout')return await handleLogout(chatId);

  if(state==='waiting_phone'){
    const digits=text.replace(/\D/g,'');
    if(digits.length>=10)return await tryLogin(chatId,text);
    return await send(chatId,'Хм, это не номер 🤔 Попробуй: <code>+7XXXXXXXXXX</code>');
  }

  const user=await getUser(chatId);
  if(user)return user.role==='trainer'?await showTrainerMenu(chatId,user):await showMenu(chatId,user);
  userStates[chatId]='waiting_phone';
  await send(chatId,'Напиши номер телефона чтобы войти 📱');
}

async function tryLogin(chatId,phoneRaw){
  const phone=normPhone(phoneRaw);
  if(phone.length!==11)return await send(chatId,'Номер выглядит некорректно 🤨\n\nФормат: <code>+7XXXXXXXXXX</code>');

  // 1. Клиенты — ID документа равен телефону
  const userRef=db.collection('users').doc(phone);
  const userSnap=await userRef.get();

  if(userSnap.exists){
    const ex=await db.collection('users').where('telegramChatId','==',chatId).limit(1).get();
    if(!ex.empty&&ex.docs[0].id!==phone)return await send(chatId,'Ты уже вошла под другим номером!\n\nСначала выйди: /logout');
    await userRef.set({telegramChatId:chatId},{merge:true});
    delete userStates[chatId];
    const data=userSnap.data();
    const name=(data.name||'').split(' ')[0]||'красотка';
    await send(chatId,`🎉 Нашла тебя!\n\nДобро пожаловать, <b>${name}</b>! 🤍\n\nТеперь буду напоминать о тренировках за 10 часов 😄`);
    return await showMenu(chatId,{phone,...data,role:'client'});
  }

  // 2. Тренеры — ищем по полю phone внутри документа, НЕ по ID документа
  //    (у части тренеров ID документа сгенерирован из имени, а не из телефона)
  const tSnap=await db.collection('trainers').where('phone','==',phone).limit(1).get();

  if(!tSnap.empty){
    const trainerDoc=tSnap.docs[0];
    await trainerDoc.ref.set({telegramChatId:chatId},{merge:true});
    delete userStates[chatId];
    const data=trainerDoc.data();
    const name=(data.name||'').split(' ')[0]||'тренер';
    await send(chatId,`🎉 Нашла тебя!\n\nДобро пожаловать, <b>${name}</b>! 🤍\n\nЯ пришлю список твоих тренировок и клиентов, и буду присылать утреннюю сводку в дни занятий.`);
    return await showTrainerMenu(chatId,{phone:trainerDoc.id,...data,role:'trainer'});
  }

  return await send(chatId,'Не нашла такой номер 🔍\n\nТы точно регистрировалась на нашем сайте? Если нет — скорее туда! 🏋️‍♀️');
}

async function handleLogout(chatId){
  const uSnap=await db.collection('users').where('telegramChatId','==',chatId).limit(1).get();
  if(!uSnap.empty){
    await uSnap.docs[0].ref.set({telegramChatId:null},{merge:true});
    delete userStates[chatId];
    return await send(chatId,'Вышла из аккаунта 👋\n\nВозвращайся скорее 🤍\n\nВойти снова: /start');
  }
  const tSnap=await db.collection('trainers').where('telegramChatId','==',chatId).limit(1).get();
  if(!tSnap.empty){
    await tSnap.docs[0].ref.set({telegramChatId:null},{merge:true});
    delete userStates[chatId];
    return await send(chatId,'Вышла из аккаунта 👋\n\nВозвращайся скорее 🤍\n\nВойти снова: /start');
  }
  return await send(chatId,'Ты и так не вошла 🤷‍♀️\n\nНапиши /start чтобы войти!');
}

/* ═══════════════════════════════════════════════════════════
   CALLBACK-КНОПКИ
   ═══════════════════════════════════════════════════════════ */

async function handleCb(cb){
  const chatId=String(cb.message.chat.id);
  const msgId=cb.message.message_id;
  const data=cb.data;
  await answer(cb.id,'');
  const user=await getUser(chatId);
  if(!user&&data!=='main_menu'&&data!=='t_menu')return await edit(chatId,msgId,'Кажется вышла из аккаунта 🤔\n\nНапиши /start');

  /* ── Ветка ТРЕНЕРА ───────────────────────────── */
  if(user&&user.role==='trainer'){
    if(data==='t_menu')return await showTrainerMenu(chatId,user,msgId);
    if(data==='t_schedule')return await showTrainerSchedule(chatId,user,msgId);
    if(data.startsWith('t_slot:')){
      const idx=parseInt(data.split(':')[1],10);
      return await showTrainerSlotClients(chatId,user,idx,msgId);
    }
    if(data.startsWith('t_mark:')){
      const[,bookingId,status,slotIndex]=data.split(':');
      try{
        const resultStatus=await markAttendanceWithSessionCharge(bookingId,status);
        const msgMap={attended:'Отмечено: пришла ✅',missed:'Отмечено: не пришла ❌',upcoming:'Отметка снята'};
        await answer(cb.id,msgMap[resultStatus]||'Сохранено');
      }catch(e){
        console.error('Ошибка отметки посещения:',e.message);
        await answer(cb.id,e.message==='future_session'?'Эта тренировка ещё не началась':'Не удалось сохранить отметку',true);
      }
      return await showTrainerSlotClients(chatId,user,parseInt(slotIndex,10),msgId);
    }
    if(data==='logout'){
      return await edit(chatId,msgId,'Ты точно хочешь выйти? 😢\n\nЯ буду скучать...',{reply_markup:{inline_keyboard:[[{text:'✅ Да, выйти',callback_data:'confirm_logout_trainer'},{text:'❌ Отмена',callback_data:'t_menu'}]]}});
    }
    if(data==='confirm_logout_trainer'){
      await db.collection('trainers').doc(user.phone).set({telegramChatId:null},{merge:true});
      delete userStates[chatId+'_schedule'];
      return await edit(chatId,msgId,'Пока-пока! 👋\n\nВозвращайся — твои клиентки ждут 😄');
    }
    return; // остальные callback_data тренеру не нужны
  }

  /* ── Ветка КЛИЕНТА ───────────────────────────── */
  if(data==='main_menu')return await showMenu(chatId,user,msgId);

  if(data==='my_bookings'){
    try{
      const snap=await db.collection('bookings').where('phone','==',user.phone).get();
      const bks=snap.docs.map(d=>({id:d.id,...d.data()})).filter(b=>b.status==='upcoming').sort((a,b)=>new Date(a.trainingDate||0)-new Date(b.trainingDate||0));
      if(!bks.length){return await edit(chatId,msgId,'📅 <b>Мои тренировки</b>\n\nЗдесь пусто! 🦗\n\nЗапишись на сайте — мы ждём 🤍',{reply_markup:backBtn});}
      let text='📅 <b>Твои ближайшие тренировки</b>\n\n';
      bks.slice(0,5).forEach((b,i)=>{
        text+=`${['🔥','💪','✨','🌟','🎯'][i%5]} <b>${b.name}</b>\n   👤 ${b.trainer}\n   📆 ${b.trainingDate?fmtDate(b.trainingDate):b.days||''}\n   ${b.confirmed?'✅ Подтверждено':'⏳ Ожидает'}\n\n`;
      });
      if(bks.length>5)text+=`<i>...и ещё ${bks.length-5}</i>\n\n`;
      text+='Так держать! 🔥';

      const cancelRows=bks.slice(0,5).map((b)=>[{
        text:`❌ Отменить: ${b.name} (${b.time||''})`,
        callback_data:`cancel:${b.id}`,
      }]);
      cancelRows.push([{text:'← Главное меню',callback_data:'main_menu'}]);

      return await edit(chatId,msgId,text,{reply_markup:{inline_keyboard:cancelRows}});
    }catch(e){return await edit(chatId,msgId,'😅 Не смогла загрузить, попробуй позже',{reply_markup:backBtn});}
  }

  if(data.startsWith('cancel:')){
    const bookingId=data.split(':')[1];
    const ref=db.collection('bookings').doc(bookingId);
    const snap=await ref.get();
    if(!snap.exists){
      await answer(cb.id,'Запись уже не найдена',true);
      return await handleCbReplay(cb,'my_bookings');
    }
    const booking=snap.data();
    if(booking.phone!==user.phone){
      await answer(cb.id,'Это не твоя запись',true);
      return;
    }

    // ФИКС: раньше ЛЮБАЯ запись при отмене тут же удалялась и занятие возвращалось
    // на счётчик. Для постоянных (source: 'recurring') это ОШИБКА — у них занятие
    // ещё НЕ списано на этапе бронирования (списание происходит только при отметке
    // посещения тренером), поэтому "возврат" через эту кнопку фактически начислял
    // клиенту лишнее занятие. Теперь ветвим: постоянную запись мягко отменяем (как на
    // сайте — кнопка "Не смогу прийти"), без возврата; обычную — удаляем с возвратом,
    // как и раньше.
    const isRecurring=booking.source==='recurring';

    try{
      if(isRecurring){
        await ref.set({status:'cancelled_by_client'},{merge:true});
      }else{
        await db.runTransaction(async(tx)=>{
          const userRef=db.collection('users').doc(user.phone);
          const uSnap=await tx.get(userRef);
          tx.delete(ref);
          const currentLeft=uSnap.exists?uSnap.data().sessionsLeft:null;
          if(currentLeft!==null&&currentLeft!==undefined){
            tx.update(userRef,{sessionsLeft:currentLeft+1});
          }
        });
      }
      await answer(cb.id,isRecurring?'Эта тренировка отменена ✅':'Запись отменена, занятие возвращено ✅');
      await notifyTrainerOfCancellation(booking,isRecurring?bookingId:null);
    }catch(e){
      console.error('Ошибка отмены записи:',e.message);
      await answer(cb.id,'Не удалось отменить запись',true);
      return;
    }

    return await handleCbReplay(cb,'my_bookings');
  }

  if(data==='my_abonement'){
    const ab=user.abonement;
    if(!ab){return await edit(chatId,msgId,'💳 <b>Мой абонемент</b>\n\nУ тебя пока нет абонемента 😮\n\nЗайди на сайт и выбери!\n\n🎟 Разовое — 700 ₽\n📦 8 тр. — 4 300 ₽\n📦 12 тр. — 4 800 ₽\n📦 16 тр. — 6 000 ₽',{reply_markup:backBtn});}
    const total=AB_T[ab]||0;

    let used,left;
    if(user.sessionsLeft!==null&&user.sessionsLeft!==undefined){
      left=user.sessionsLeft;
      used=Math.max(0,total-left);
    }else{
      const snap=await db.collection('bookings').where('phone','==',user.phone).where('status','in',['attended','missed']).get();
      used=snap.size;left=Math.max(0,total-used);
    }

    const bar='█'.repeat(Math.round((used/total)*10))+'░'.repeat(10-Math.round((used/total)*10));
    let mood='';
    if(left===0)mood='\n\n🆘 Абонемент закончился! Пора продлевать 😄';
    else if(left<=2)mood='\n\n⚠️ Осталось совсем мало! Продли скорее 🙏';
    else if(left>=total*0.8)mood='\n\n🎉 Почти не пользовалась! Пора исправить 💪';
    return await edit(chatId,msgId,`💳 <b>Мой абонемент</b>\n\n${AB_L[ab]}\n\n[${bar}]\nИспользовано: <b>${used}</b> из <b>${total}</b>\nОсталось: <b>${left}</b>${mood}`,{reply_markup:backBtn});
  }

  if(data==='contacts'){
    return await edit(chatId,msgId,'📞 <b>Контакты КУЛЬТ</b>\n\n📍 ул. Кремлёвская, 1, ЖК Кремлёвский, Астрахань\n📱 +7 (989) 794-94-11\n🕐 Пн–Сб: 9:00–20:00\n🚫 Воскресенье: выходной\n\nЖдём тебя! 🤍',{reply_markup:backBtn});
  }

  if(data==='logout'){
    return await edit(chatId,msgId,'Ты точно хочешь выйти? 😢\n\nЯ буду скучать...',{reply_markup:{inline_keyboard:[[{text:'✅ Да, выйти',callback_data:'confirm_logout'},{text:'❌ Отмена',callback_data:'main_menu'}]]}});
  }
  if(data==='confirm_logout'){
    const snap=await db.collection('users').where('telegramChatId','==',chatId).limit(1).get();
    if(!snap.empty)await snap.docs[0].ref.set({telegramChatId:null},{merge:true});
    return await edit(chatId,msgId,'Пока-пока! 👋\n\nВозвращайся — тренировки сами себя не сделают 😄');
  }

  if(data.startsWith('confirm:')||data.startsWith('decline:')){
    const[action,bookingId]=data.split(':');
    const ref=db.collection('bookings').doc(bookingId);
    const snap=await ref.get();
    if(!snap.exists)return;
    const booking=snap.data();
    if(action==='confirm'){
      await ref.set({confirmed:true},{merge:true});
      await edit(chatId,msgId,cb.message.text+'\n\n✅ <b>Подтверждено! Молодец 💪</b>');
    }else{
      // ФИКС: та же развилка recurring/обычная, что и в "cancel:" выше — постоянным
      // клиентам занятие не возвращаем (оно ещё не было списано), обычным — возвращаем.
      const isRecurring=booking.source==='recurring';
      try{
        if(isRecurring){
          await ref.set({status:'cancelled_by_client',confirmed:false},{merge:true});
        }else{
          await db.runTransaction(async(tx)=>{
            const userRef=db.collection('users').doc(booking.phone);
            const uSnap=await tx.get(userRef);
            tx.update(ref,{status:'cancelled_by_client',confirmed:false});
            const currentLeft=uSnap.exists?uSnap.data().sessionsLeft:null;
            if(currentLeft!==null&&currentLeft!==undefined){
              tx.update(userRef,{sessionsLeft:currentLeft+1});
            }
          });
        }
        await notifyTrainerOfCancellation(booking,bookingId);
      }catch(e){console.error('Ошибка отмены из напоминания:',e.message);}
      await edit(chatId,msgId,cb.message.text+'\n\n❌ <b>Отменила. Бывает 🤷‍♀️</b>');
    }
  }
}

/* Перерисовывает экран заново (используется после отмены записи) */
async function handleCbReplay(cb,targetData){
  const fakeCb={...cb,data:targetData};
  return await handleCb(fakeCb);
}

/* ═══════════════════════════════════════════════════════════
   WEBHOOK
   ═══════════════════════════════════════════════════════════ */

app.post('/webhook',async(req,res)=>{
  res.status(200).send('OK');
  const u=req.body;
  console.log('[webhook] update:', u.message ? 'message' : u.callback_query ? 'callback' : 'other', JSON.stringify(u).slice(0,300));
  try{
    if(u.message)await handleMsg(u.message);
    else if(u.callback_query)await handleCb(u.callback_query);
  }catch(e){
    console.error('[webhook] ERROR:', e.message);
    console.error(e.stack);
  }
});
app.get('/',(req,res)=>res.send('КУЛЬТ bot 🤍'));

/* ═══════════════════════════════════════════════════════════
   CRON 1 — напоминания клиентам о тренировках (каждый час)
   ═══════════════════════════════════════════════════════════ */
const REMINDERS=[
  '🔔 Эй, подруга! Ты не забыла? Завтра тренировка и она сама себя не проведёт 😄',
  '⏰ Стоп! У тебя скоро тренировка. Тренер уже греется 😁',
  '🏋️‍♀️ Твои мышцы уже в предвкушении! Тренировка совсем скоро ✨',
  '💪 Алёрт! Тренировка на горизонте. Не забудь подтвердить 🎯',
  '🌟 Привет-привет! Напоминаю про тренировку — она ждёт тебя! 🤍',
];
cron.schedule('0 * * * *',async()=>{
  console.log('[cron] Проверяем напоминания клиентам...');
  try{
    const now=new Date();
    const ws=new Date(now.getTime()+9.5*3600000);
    const we=new Date(now.getTime()+10.5*3600000);
    const snap=await db.collection('bookings').where('status','==','upcoming').get();
    for(const doc of snap.docs){
      const b=doc.data();
      if(!b.trainingDate||b.reminderSent)continue;
      const td=new Date(b.trainingDate);
      if(td<ws||td>we)continue;
      const uSnap=await db.collection('users').doc(b.phone).get();
      if(!uSnap.exists)continue;
      const chatId=uSnap.data().telegramChatId;
      if(!chatId)continue;
      const phrase=REMINDERS[Math.floor(Math.random()*REMINDERS.length)];
      await send(chatId,`${phrase}\n\n📋 <b>${b.name}</b>\n👤 Тренер: ${b.trainer}\n📆 ${fmtDate(b.trainingDate)}\n\nПодтверди что придёшь!`,{
        reply_markup:{inline_keyboard:[[{text:'✅ Приду, уже бегу!',callback_data:`confirm:${doc.id}`},{text:'😢 Не смогу',callback_data:`decline:${doc.id}`}]]}
      });
      await doc.ref.set({reminderSent:true},{merge:true});
    }
  }catch(e){console.error('[cron] Ошибка напоминаний:',e.message);}
},{timezone:'Europe/Astrakhan'});

/* ═══════════════════════════════════════════════════════════
   CRON 1b — утренняя сводка ТРЕНЕРУ о сегодняшних группах (ежедневно в 8:00)
   ═══════════════════════════════════════════════════════════ */
cron.schedule('0 8 * * *',async()=>{
  console.log('[cron] Утренняя сводка тренерам...');
  try{
    const now=new Date();
    const dayAbbr=DAY_ABBR[now.getDay()];

    const trainersSnap=await db.collection('trainers').get();

    for(const tDoc of trainersSnap.docs){
      const trainer={phone:tDoc.id,...tDoc.data()};
      if(!trainer.telegramChatId)continue;

      const schedule=await getTrainerSchedule(trainer);
      if(!schedule.length)continue;

      const todaySlots=schedule.filter(s=>
        typeof s.days==='string'&&s.days.split(',').map(x=>x.trim()).includes(dayAbbr)
      );

      if(!todaySlots.length)continue;

      let text=`☀️ <b>Доброе утро, ${(trainer.name||'').split(' ')[0]||'тренер'}!</b>\n\nВот твои тренировки на сегодня:\n\n`;

      for(const s of todaySlots){
        const clients=await getSlotClients(trainer,s);
        const active=clients.filter(c=>c.status!=='cancelled_by_client');
        const cancelled=clients.filter(c=>c.status==='cancelled_by_client');
        const recurringCount=active.filter(c=>c.source==='recurring').length;
        text+=`🏋️‍♀️ <b>${s.time} · ${s.name}</b>\n`;
        text+=active.length
          ?`   👥 Записалось: <b>${active.length} ${pluralPeople(active.length)}</b>${recurringCount?` (из них постоянных: ${recurringCount})`:''}\n`
          :`   👥 Записалось: <b>0 человек</b>\n`;
        if(cancelled.length)text+=`   ⚠️ Отменили: <b>${cancelled.length}</b>\n`;
      }

      text+='\nХорошего дня и продуктивных тренировок! 💪';

      await send(trainer.telegramChatId,text,{reply_markup:trainerMenu});
    }
  }catch(e){console.error('[cron] Ошибка утренней сводки тренерам:',e.message);}
},{timezone:'Europe/Astrakhan'});

/* ═══════════════════════════════════════════════════════════
   CRON 1c — уведомление тренеру об отменах, сделанных НЕ через бота (каждые 15 минут)
   ═══════════════════════════════════════════════════════════ */
/* Клиент может отменить тренировку на САЙТЕ (кнопка "Не смогу прийти" / "Отменить"
   в личном кабинете) — это напрямую пишет в Firestore, минуя бота, поэтому бот не
   узнаёт об этом в реальном времени. Этот cron раз в 15 минут подбирает все отменённые
   записи, которые ещё не были показаны тренеру (trainerNotified не стоит), и шлёт
   предупреждение. Отмены, сделанные прямо из бота (cancel:/decline:), уже уведомляют
   тренера сразу и помечаются trainerNotified сами — cron их повторно не трогает. */
cron.schedule('*/15 * * * *',async()=>{
  console.log('[cron] Проверяем новые отмены клиентов...');
  try{
    const snap=await db.collection('bookings').where('status','==','cancelled_by_client').get();
    for(const doc of snap.docs){
      const b=doc.data();
      if(b.trainerNotified)continue;
      await notifyTrainerOfCancellation(b,doc.id);
    }
  }catch(e){console.error('[cron] Ошибка уведомлений об отменах:',e.message);}
},{timezone:'Europe/Astrakhan'});

/* ═══════════════════════════════════════════════════════════
   CRON 2 — абонемент заканчивается (ежедневно в 10:00)
   ═══════════════════════════════════════════════════════════ */
cron.schedule('0 10 * * *',async()=>{
  console.log('[cron] Проверяем абонементы...');
  try{
    const usSnap=await db.collection('users').where('abonement','!=',null).get();
    const MSGS=['⏳ Подруга, твой абонемент почти закончился! Осталось {left} занятия 😱 Продли скорее!','🚨 {left} занятия осталось по абонементу. Не бросай нас! 🥺','💳 Эй! Осталось всего {left} тренировки. Продлевай! 🤍'];
    for(const uDoc of usSnap.docs){
      const u=uDoc.data();
      if(!u.telegramChatId||!u.abonement)continue;
      const total=AB_T[u.abonement];
      if(!total)continue;

      let left;
      if(u.sessionsLeft!==null&&u.sessionsLeft!==undefined){
        left=u.sessionsLeft;
      }else{
        const bSnap=await db.collection('bookings').where('phone','==',uDoc.id).where('status','in',['attended','missed']).get();
        left=total-bSnap.size;
      }

      if(left===2&&!u.expiryWarningsSent){
        await send(u.telegramChatId,MSGS[Math.floor(Math.random()*MSGS.length)].replace('{left}',left),{reply_markup:{inline_keyboard:[[{text:'💳 Мой абонемент',callback_data:'my_abonement'}]]}});
        await uDoc.ref.set({expiryWarningsSent:true},{merge:true});
      }
      if(left>2&&u.expiryWarningsSent)await uDoc.ref.set({expiryWarningsSent:false},{merge:true});
    }
  }catch(e){console.error('[cron] Ошибка абонементов:',e.message);}
},{timezone:'Europe/Astrakhan'});

/* ═══════════════════════════════════════════════════════════
   CRON 3 — давно не покупал абонемент (раз в неделю по понедельникам)
   ═══════════════════════════════════════════════════════════ */
cron.schedule('0 11 * * 1',async()=>{
  console.log('[cron] Проверяем неактивных клиентов...');
  try{
    const snap=await db.collection('users').get();
    const now=new Date();
    for(const uDoc of snap.docs){
      const u=uDoc.data();
      if(!u.telegramChatId||u.abonement)continue;
      const bSnap=await db.collection('bookings').where('phone','==',uDoc.id).get();
      if(bSnap.empty)continue;
      const lastBook=bSnap.docs
        .map(d=>new Date(d.data().createdAt||0))
        .sort((a,b)=>b-a)[0];
      const daysSince=Math.floor((now-lastBook)/(1000*60*60*24));
      if(daysSince>=30&&!u.noAbWarningThisWeek){
        await send(u.telegramChatId,`👋 Привет! Давно тебя не видели в студии...\n\nПрошло уже <b>${daysSince} дней</b> с последней тренировки 😢\n\nМы скучаем! Возвращайся — первая тренировка ждёт тебя 💪\n\nКупи абонемент на сайте и запишись!`);
        await uDoc.ref.set({noAbWarningThisWeek:true},{merge:true});
      }
    }
  }catch(e){console.error('[cron] Ошибка неактивных:',e.message);}
},{timezone:'Europe/Astrakhan'});

/* ═══════════════════════════════════════════════════════════
   CRON 4 — много пропусков (еженедельно по пятницам)
   ═══════════════════════════════════════════════════════════ */
cron.schedule('0 17 * * 5',async()=>{
  console.log('[cron] Проверяем пропуски...');
  try{
    const snap=await db.collection('users').get();
    for(const uDoc of snap.docs){
      const u=uDoc.data();
      if(!u.telegramChatId)continue;
      const since=new Date(Date.now()-30*24*3600000).toISOString();
      const bSnap=await db.collection('bookings')
        .where('phone','==',uDoc.id)
        .where('status','==','missed')
        .get();
      const recentMissed=bSnap.docs.filter(d=>d.data().createdAt>since).length;
      if(recentMissed>=3&&!u.missedWarningThisWeek){
        await send(u.telegramChatId,`😬 Эй, <b>${(u.name||'').split(' ')[0]||'подруга'}</b>!\n\nЗа последний месяц ты пропустила уже <b>${recentMissed} тренировки</b>...\n\nЯ всё понимаю, жизнь — штука непредсказуемая 😅\n\nНо твои мышцы скучают! Приходи — мы рады тебе каждый раз 🤍💪`);
        await uDoc.ref.set({missedWarningThisWeek:true},{merge:true});
      }
    }
  }catch(e){console.error('[cron] Ошибка пропусков:',e.message);}
},{timezone:'Europe/Astrakhan'});

/* ═══════════════════════════════════════════════════════════
   CRON 5 — сброс еженедельных флагов (каждое воскресенье в полночь)
   ═══════════════════════════════════════════════════════════ */
cron.schedule('0 0 * * 0',async()=>{
  try{
    const snap=await db.collection('users').get();
    for(const uDoc of snap.docs){
      const u=uDoc.data();
      if(u.noAbWarningThisWeek||u.missedWarningThisWeek){
        await uDoc.ref.set({noAbWarningThisWeek:false,missedWarningThisWeek:false},{merge:true});
      }
    }
    console.log('[cron] Флаги сброшены');
  }catch(e){console.error('[cron] Ошибка сброса:',e.message);}
},{timezone:'Europe/Astrakhan'});

/* ═══════════════════════════════════════════════════════════
   SELF-PING
   ═══════════════════════════════════════════════════════════ */
if(SERVER_URL){
  cron.schedule('*/10 * * * *',async()=>{
    try{await fetch(SERVER_URL);console.log('[ping] OK');}
    catch(e){console.error('[ping] error:',e.message);}
  });
}

/* ═══════════════════════════════════════════════════════════
   ЗАПУСК
   ═══════════════════════════════════════════════════════════ */
app.listen(PORT,async()=>{
  console.log(`✅ Сервер на порту ${PORT}`);
  await fetch(tg('setMyCommands'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({commands:[{command:'start',description:'🚀 Войти / Главное меню'},{command:'menu',description:'📋 Личный кабинет'},{command:'logout',description:'🚪 Выйти из аккаунта'}]})});
  await fetch(tg('setMyDescription'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({description:'Официальный бот студии КУЛЬТ 🤍\n\n📅 Смотри свои тренировки\n💳 Следи за абонементом\n🔔 Напоминания за 10 часов\n\nНажми СТАРТ! 💪'})});
  await fetch(tg('setMyShortDescription'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({short_description:'Твой помощник в студии КУЛЬТ 🤍'})});
  if(SERVER_URL){
    const r=await fetch(tg('setWebhook'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:`${SERVER_URL}/webhook`})});
    const d=await r.json();
    console.log(d.ok?`✅ Webhook: ${SERVER_URL}/webhook`:`❌ ${d.description}`);
  }
});
