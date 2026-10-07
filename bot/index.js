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

async function getUser(chatId){
  const uSnap=await db.collection('users').where('telegramChatId','==',chatId).limit(1).get();
  if(!uSnap.empty)return {phone:uSnap.docs[0].id,...uSnap.docs[0].data(),role:'client'};
  const tSnap=await db.collection('trainers').where('telegramChatId','==',chatId).limit(1).get();
  if(!tSnap.empty)return {phone:tSnap.docs[0].id,...tSnap.docs[0].data(),role:'trainer'};
  return null;
}

async function handleMsg(message){
  const chatId=String(message.chat.id);
  const text=(message.text||'').trim();
  const state=userStates[chatId];

  if(text==='/start'||text.startsWith('/start ')){
    const arg=text.split(' ')[1];
    const user=await getUser(chatId);
    if(user)return await showMenu(chatId,user);
    if(arg)return await tryLogin(chatId,arg);
    userStates[chatId]='waiting_phone';
    return await send(chatId,'👋 Привет! Я бот студии <b>КУЛЬТ</b> 🤍\n\nНапиши свой номер телефона (тот, что указывала при регистрации):\n\n<code>+7XXXXXXXXXX</code>');
  }
  if(text==='/menu'){
    const user=await getUser(chatId);
    if(!user){userStates[chatId]='waiting_phone';return await send(chatId,'Сначала войди! Напиши номер телефона 📱');}
    return await showMenu(chatId,user);
  }
  if(text==='/logout')return await handleLogout(chatId);

  if(state==='waiting_phone'){
    const digits=text.replace(/\D/g,'');
    if(digits.length>=10)return await tryLogin(chatId,text);
    return await send(chatId,'Хм, это не номер 🤔 Попробуй: <code>+7XXXXXXXXXX</code>');
  }

  const user=await getUser(chatId);
  if(user)return await showMenu(chatId,user);
  userStates[chatId]='waiting_phone';
  await send(chatId,'Напиши номер телефона чтобы войти 📱');
}

async function tryLogin(chatId,phoneRaw){
  const phone=normPhone(phoneRaw);
  if(phone.length!==11)return await send(chatId,'Номер выглядит некорректно 🤨\n\nФормат: <code>+7XXXXXXXXXX</code>');

  // Сначала ищем среди клиентов
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
    return await showMenu(chatId,{phone,...data});
  }

  // Не клиент — ищем среди тренеров (ID документа = телефон)
  const trainerRef=db.collection('trainers').doc(phone);
  const trainerSnap=await trainerRef.get();

  if(trainerSnap.exists){
    await trainerRef.set({telegramChatId:chatId},{merge:true});
    delete userStates[chatId];
    const data=trainerSnap.data();
    const name=(data.name||'').split(' ')[0]||'тренер';
    await send(chatId,`🎉 Нашла тебя!\n\nДобро пожаловать, <b>${name}</b>! 🤍\n\nЯ пришлю список твоих клиентов на тренировках.`);
    return await showTrainerMenu(chatId,{phone,...data});
  }

  return await send(chatId,'Не нашла такой номер 🔍\n\nТы точно регистрировалась на нашем сайте? Если нет — скорее туда! 🏋️‍♀️');
}

async function handleLogout(chatId){
  const snap=await db.collection('users').where('telegramChatId','==',chatId).limit(1).get();
  if(snap.empty)return await send(chatId,'Ты и так не вошла 🤷‍♀️\n\nНапиши /start чтобы войти!');
  await snap.docs[0].ref.set({telegramChatId:null},{merge:true});
  delete userStates[chatId];
  await send(chatId,'Вышла из аккаунта 👋\n\nВозвращайся скорее 🤍\n\nВойти снова: /start');
}

async function handleCb(cb){
  const chatId=String(cb.message.chat.id);
  const msgId=cb.message.message_id;
  const data=cb.data;
  await answer(cb.id,'');
  const user=await getUser(chatId);
  if(!user&&data!=='main_menu')return await edit(chatId,msgId,'Кажется вышла из аккаунта 🤔\n\nНапиши /start');

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
      return await edit(chatId,msgId,text,{reply_markup:backBtn});
    }catch(e){return await edit(chatId,msgId,'😅 Не смогла загрузить, попробуй позже',{reply_markup:backBtn});}
  }

  if(data==='my_abonement'){
    const ab=user.abonement;
    if(!ab){return await edit(chatId,msgId,'💳 <b>Мой абонемент</b>\n\nУ тебя пока нет абонемента 😮\n\nЗайди на сайт и выбери!\n\n🎟 Разовое — 700 ₽\n📦 8 тр. — 4 300 ₽\n📦 12 тр. — 4 800 ₽\n📦 16 тр. — 6 000 ₽',{reply_markup:backBtn});}
    const total=AB_T[ab]||0;
    const snap=await db.collection('bookings').where('phone','==',user.phone).where('status','in',['attended','missed']).get();
    const used=snap.size,left=Math.max(0,total-used);
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
    if(action==='confirm'){
      await ref.set({confirmed:true},{merge:true});
      await edit(chatId,msgId,cb.message.text+'\n\n✅ <b>Подтверждено! Молодец 💪</b>');
    }else{
      await ref.set({status:'cancelled_by_client',confirmed:false},{merge:true});
      await edit(chatId,msgId,cb.message.text+'\n\n❌ <b>Отменила. Бывает 🤷‍♀️</b>');
    }
  }
}

// WEBHOOK
app.post('/webhook',async(req,res)=>{
  res.status(200).send('OK');
  const u=req.body;
  try{
    if(u.message)await handleMsg(u.message);
    else if(u.callback_query)await handleCb(u.callback_query);
  }catch(e){console.error('Webhook error:',e.message);}
});
app.get('/',(req,res)=>res.send('КУЛЬТ bot 🤍'));

// CRON 1 — напоминания о тренировках (каждый час)
const REMINDERS=[
  '🔔 Эй, подруга! Ты не забыла? Завтра тренировка и она сама себя не проведёт 😄',
  '⏰ Стоп! У тебя скоро тренировка. Тренер уже греется 😁',
  '🏋️‍♀️ Твои мышцы уже в предвкушении! Тренировка совсем скоро ✨',
  '💪 Алёрт! Тренировка на горизонте. Не забудь подтвердить 🎯',
  '🌟 Привет-привет! Напоминаю про тренировку — она ждёт тебя! 🤍',
];
cron.schedule('0 * * * *',async()=>{
  console.log('[cron] Проверяем напоминания...');
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

// CRON 2 — абонемент заканчивается (ежедневно в 10:00)
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
      const bSnap=await db.collection('bookings').where('phone','==',uDoc.id).where('status','in',['attended','missed']).get();
      const left=total-bSnap.size;
      if(left===2&&!u.expiryWarningsSent){
        await send(u.telegramChatId,MSGS[Math.floor(Math.random()*MSGS.length)].replace('{left}',left),{reply_markup:{inline_keyboard:[[{text:'💳 Мой абонемент',callback_data:'my_abonement'}]]}});
        await uDoc.ref.set({expiryWarningsSent:true},{merge:true});
      }
      if(left>2&&u.expiryWarningsSent)await uDoc.ref.set({expiryWarningsSent:false},{merge:true});
    }
  }catch(e){console.error('[cron] Ошибка абонементов:',e.message);}
},{timezone:'Europe/Astrakhan'});

// CRON 3 — давно не покупал абонемент (раз в неделю по понедельникам)
cron.schedule('0 11 * * 1',async()=>{
  console.log('[cron] Проверяем неактивных клиентов...');
  try{
    const snap=await db.collection('users').get();
    const now=new Date();
    for(const uDoc of snap.docs){
      const u=uDoc.data();
      if(!u.telegramChatId||u.abonement)continue; // у кого есть аб — пропускаем
      // Проверяем последнюю запись
      const bSnap=await db.collection('bookings').where('phone','==',uDoc.id).get();
      if(bSnap.empty){
        // Никогда не записывался — пропускаем
        continue;
      }
      // Берём дату последней записи
      const lastBook=bSnap.docs
        .map(d=>new Date(d.data().createdAt||0))
        .sort((a,b)=>b-a)[0];
      const daysSince=Math.floor((now-lastBook)/(1000*60*60*24));
      // Если прошло больше 30 дней без абонемента — напоминаем
      if(daysSince>=30&&!u.noAbWarningThisWeek){
        await send(u.telegramChatId,`👋 Привет! Давно тебя не видели в студии...\n\nПрошло уже <b>${daysSince} дней</b> с последней тренировки 😢\n\nМы скучаем! Возвращайся — первая тренировка ждёт тебя 💪\n\nКупи абонемент на сайте и запишись!`);
        await uDoc.ref.set({noAbWarningThisWeek:true},{merge:true});
      }
    }
    // Сбрасываем флаг раз в неделю (в воскресенье)
  }catch(e){console.error('[cron] Ошибка неактивных:',e.message);}
},{timezone:'Europe/Astrakhan'});

// CRON 4 — много пропусков (еженедельно по пятницам)
cron.schedule('0 17 * * 5',async()=>{
  console.log('[cron] Проверяем пропуски...');
  try{
    const snap=await db.collection('users').get();
    for(const uDoc of snap.docs){
      const u=uDoc.data();
      if(!u.telegramChatId)continue;
      // Считаем missed за последние 30 дней
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

// CRON 5 — сброс еженедельных флагов (каждое воскресенье в полночь)
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

// SELF-PING
if(SERVER_URL){
  cron.schedule('*/10 * * * *',async()=>{
    try{await fetch(SERVER_URL);console.log('[ping] OK');}
    catch(e){console.error('[ping] error:',e.message);}
  });
}

// ЗАПУСК
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
