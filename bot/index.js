/**
 * КУЛЬТ — Telegram-бот
 * Умный, весёлый, с личным кабинетом прямо в боте
 */

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cron = require('node-cron');
const admin = require('firebase-admin');

// ═══ ИНИЦИАЛИЗАЦИЯ ═══════════════════════════════════

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '')
      .replace(/\\n/g, '\n')
      .replace(/^"|"$/g, ''),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
  }),
});

const db = admin.firestore();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SERVER_URL = process.env.SERVER_URL;
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// ═══ СОСТОЯНИЯ ДИАЛОГА ═══════════════════════════════
// waiting_phone — ждём номер телефона
const userStates = {};

// ═══ TELEGRAM ХЕЛПЕРЫ ════════════════════════════════

const tg = (method) => `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;

async function sendMessage(chatId, text, extra = {}) {
  const body = { chat_id: chatId, text, parse_mode: 'HTML', ...extra };
  const res = await fetch(tg('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function editMessage(chatId, messageId, text, extra = {}) {
  const body = { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', ...extra };
  await fetch(tg('editMessageText'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function answerCallback(callbackQueryId, text, alert = false) {
  await fetch(tg('answerCallbackQuery'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: alert }),
  });
}

async function deleteMessage(chatId, messageId) {
  await fetch(tg('deleteMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
  });
}

// ═══ УТИЛИТЫ ═════════════════════════════════════════

function normalizePhone(raw) {
  let d = String(raw).replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('8')) d = '7' + d.slice(1);
  if (d.length === 10) d = '7' + d;
  return d;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const months = ['января','февраля','марта','апреля','мая','июня',
                  'июля','августа','сентября','октября','ноября','декабря'];
  const days = ['воскресенье','понедельник','вторник','среду','четверг','пятницу','субботу'];
  return `${d.getDate()} ${months[d.getMonth()]} (${days[d.getDay()]}) в ${
    String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// ═══ КНОПКИ ══════════════════════════════════════════

const mainMenuKeyboard = {
  inline_keyboard: [
    [{ text: '📅 Мои тренировки', callback_data: 'my_bookings' }],
    [{ text: '💳 Мой абонемент', callback_data: 'my_abonement' }],
    [{ text: '📞 Контакты студии', callback_data: 'contacts' }],
    [{ text: '🚪 Выйти из аккаунта', callback_data: 'logout' }],
  ],
};

const backToMenuKeyboard = {
  inline_keyboard: [[{ text: '← Главное меню', callback_data: 'main_menu' }]],
};

// ═══ ЛИЧНЫЙ КАБИНЕТ ══════════════════════════════════

async function showMainMenu(chatId, user, messageId = null) {
  const name = user.name ? user.name.split(' ')[0] : 'подруга';
  const ab = user.abonement ? getAbLabel(user.abonement) : 'не выбран';

  const text =
    `🏋️‍♀️ <b>Личный кабинет</b>\n\n` +
    `Привет, <b>${name}</b>! Рада тебя видеть 🤍\n\n` +
    `📱 Телефон: <code>+${user.phone}</code>\n` +
    `💳 Абонемент: ${ab}\n\n` +
    `Что хочешь узнать?`;

  if (messageId) {
    await editMessage(chatId, messageId, text, { reply_markup: mainMenuKeyboard });
  } else {
    await sendMessage(chatId, text, { reply_markup: mainMenuKeyboard });
  }
}

function getAbLabel(id) {
  const labels = {
    single: '🎟 Разовое посещение (700 ₽)',
    ab8: '📦 8 тренировок (4 300 ₽/мес)',
    ab12: '📦 12 тренировок (4 800 ₽/мес)',
    ab16: '📦 16 тренировок (6 000 ₽/мес)',
  };
  return labels[id] || id;
}

async function showMyBookings(chatId, phone, messageId) {
  try {
    const snap = await db.collection('bookings')
      .where('phone', '==', phone)
      .get();

    const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(b => b.status === 'upcoming')
      .sort((a, b) => new Date(a.trainingDate || 0) - new Date(b.trainingDate || 0));

    if (!bookings.length) {
      const text =
        `📅 <b>Мои тренировки</b>\n\n` +
        `Ой, здесь пусто! 🦗\n\n` +
        `Ты ещё не записана ни на одну тренировку.\n` +
        `Зайди на сайт и выбери удобное время — мы ждём! 🤍`;
      return await editMessage(chatId, messageId, text, { reply_markup: backToMenuKeyboard });
    }

    const funPhrases = ['🔥', '💪', '✨', '🌟', '🎯'];
    let text = `📅 <b>Твои ближайшие тренировки</b>\n\n`;

    bookings.slice(0, 5).forEach((b, i) => {
      const emoji = funPhrases[i % funPhrases.length];
      const dateStr = b.trainingDate ? formatDate(b.trainingDate) : b.days || '';
      text += `${emoji} <b>${b.name}</b>\n`;
      text += `   👤 Тренер: ${b.trainer}\n`;
      if (dateStr) text += `   📆 ${dateStr}\n`;
      text += `   Статус: ${b.confirmed ? '✅ Подтверждено' : '⏳ Ожидает'}\n\n`;
    });

    if (bookings.length > 5) {
      text += `<i>...и ещё ${bookings.length - 5} тренировок</i>\n\n`;
    }

    text += `Так держать, ты — огонь! 🔥`;

    await editMessage(chatId, messageId, text, { reply_markup: backToMenuKeyboard });
  } catch (e) {
    console.error('showMyBookings error:', e.message);
    await editMessage(chatId, messageId, '😅 Что-то пошло не так, попробуй позже', { reply_markup: backToMenuKeyboard });
  }
}

async function showMyAbonement(chatId, phone, user, messageId) {
  try {
    const ab = user.abonement;
    const totals = { single: 1, ab8: 8, ab12: 12, ab16: 16 };

    if (!ab) {
      const text =
        `💳 <b>Мой абонемент</b>\n\n` +
        `У тебя пока нет абонемента 😮\n\n` +
        `Зайди на сайт → Личный кабинет → выбери подходящий!\n\n` +
        `Цены:\n` +
        `🎟 Разовое — 700 ₽\n` +
        `📦 8 тренировок — 4 300 ₽/мес\n` +
        `📦 12 тренировок — 4 800 ₽/мес\n` +
        `📦 16 тренировок — 6 000 ₽/мес`;
      return await editMessage(chatId, messageId, text, { reply_markup: backToMenuKeyboard });
    }

    const total = totals[ab] || 0;
    const snap = await db.collection('bookings')
      .where('phone', '==', phone)
      .where('status', 'in', ['attended', 'missed'])
      .get();
    const used = snap.size;
    const left = Math.max(0, total - used);

    const bar = '█'.repeat(Math.round((used / total) * 10)) +
                '░'.repeat(10 - Math.round((used / total) * 10));

    let mood = '';
    if (left === 0) mood = '\n\n🆘 Абонемент закончился! Пора продлевать, красотка 😄';
    else if (left <= 2) mood = '\n\n⚠️ Осталось совсем мало! Не забудь продлить 🙏';
    else if (left >= total * 0.8) mood = '\n\n🎉 Ого, почти не пользовалась! Пора исправить это 💪';

    const text =
      `💳 <b>Мой абонемент</b>\n\n` +
      `${getAbLabel(ab)}\n\n` +
      `Прогресс: [${bar}]\n` +
      `Использовано: <b>${used}</b> из <b>${total}</b> занятий\n` +
      `Осталось: <b>${left}</b> занятий` +
      mood;

    await editMessage(chatId, messageId, text, { reply_markup: backToMenuKeyboard });
  } catch (e) {
    console.error('showMyAbonement error:', e.message);
    await editMessage(chatId, messageId, '😅 Не смогла загрузить данные, попробуй позже', { reply_markup: backToMenuKeyboard });
  }
}

// ═══ ОБРАБОТКА СООБЩЕНИЙ ═════════════════════════════

async function handleMessage(message) {
  const chatId = String(message.chat.id);
  const text = (message.text || '').trim();
  const state = userStates[chatId];

  // Команда /start
  if (text === '/start' || text.startsWith('/start ')) {
    const phoneArg = text.split(' ')[1];

    // Если уже авторизован
    const userSnap = await db.collection('users')
      .where('telegramChatId', '==', chatId).limit(1).get();

    if (!userSnap.empty) {
      const user = { phone: userSnap.docs[0].id, ...userSnap.docs[0].data() };
      return await showMainMenu(chatId, user);
    }

    // Если пришёл с параметром (с кнопки на сайте)
    if (phoneArg) {
      return await tryLogin(chatId, phoneArg);
    }

    // Просим телефон
    userStates[chatId] = 'waiting_phone';
    return await sendMessage(chatId,
      `👋 Привет! Я бот студии <b>КУЛЬТ</b> 🤍\n\n` +
      `Слушай, мне нужен твой номер телефона — тот, что ты указывала при регистрации на сайте.\n\n` +
      `Я обещаю использовать его только в мирных целях 🙈\n\n` +
      `Напиши в формате: <code>+7XXXXXXXXXX</code>`
    );
  }

  // Команда /menu — главное меню
  if (text === '/menu') {
    const snap = await db.collection('users')
      .where('telegramChatId', '==', chatId).limit(1).get();
    if (snap.empty) {
      userStates[chatId] = 'waiting_phone';
      return await sendMessage(chatId, `Сначала войди в аккаунт! Напиши свой номер телефона 📱`);
    }
    const user = { phone: snap.docs[0].id, ...snap.docs[0].data() };
    return await showMainMenu(chatId, user);
  }

  // Команда /logout
  if (text === '/logout') {
    return await handleLogout(chatId);
  }

  // Ждём номер телефона
  if (state === 'waiting_phone') {
    const digits = text.replace(/\D/g, '');
    if (digits.length >= 10) {
      return await tryLogin(chatId, text);
    }
    return await sendMessage(chatId,
      `Хм, это не похоже на номер телефона 🤔\n\n` +
      `Давай попробуем ещё раз: <code>+7XXXXXXXXXX</code>`
    );
  }

  // Если уже авторизован — показываем меню
  const snap = await db.collection('users')
    .where('telegramChatId', '==', chatId).limit(1).get();
  if (!snap.empty) {
    const user = { phone: snap.docs[0].id, ...snap.docs[0].data() };
    return await showMainMenu(chatId, user);
  }

  // Не авторизован и непонятное сообщение
  userStates[chatId] = 'waiting_phone';
  await sendMessage(chatId,
    `Эй, я тебя не знаю! 👀\n\n` +
    `Напиши свой номер телефона, чтобы войти в аккаунт 📱`
  );
}

async function tryLogin(chatId, phoneRaw) {
  const phone = normalizePhone(phoneRaw);

  if (phone.length !== 11) {
    return await sendMessage(chatId,
      `Это точно номер телефона? 🤨\n\n` +
      `Попробуй так: <code>+7XXXXXXXXXX</code>`
    );
  }

  const userRef = db.collection('users').doc(phone);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return await sendMessage(chatId,
      `Упс! Такой номер не нашла в базе 🔍\n\n` +
      `Ты точно регистрировалась на нашем сайте?\n` +
      `Если нет — скорее туда! Там уже ждут твои первые тренировки 🏋️‍♀️`
    );
  }

  // Проверяем, не занят ли chatId другим пользователем
  const existing = await db.collection('users')
    .where('telegramChatId', '==', chatId).limit(1).get();
  if (!existing.empty && existing.docs[0].id !== phone) {
    return await sendMessage(chatId,
      `Эй, ты уже вошла под другим номером! 😅\n\n` +
      `Сначала выйди из текущего аккаунта — напиши /logout`
    );
  }

  await userRef.set({ telegramChatId: chatId }, { merge: true });
  delete userStates[chatId];

  const userData = userSnap.data();
  const name = userData.name ? userData.name.split(' ')[0] : 'красотка';

  await sendMessage(chatId,
    `Ура! Нашла тебя! 🎉\n\n` +
    `Добро пожаловать, <b>${name}</b>! 🤍\n\n` +
    `Теперь я буду напоминать о тренировках за 10 часов до начала — ` +
    `чтобы ты точно не забыла и не проспала 😄`
  );

  const user = { phone, ...userData };
  await showMainMenu(chatId, user);
}

async function handleLogout(chatId) {
  const snap = await db.collection('users')
    .where('telegramChatId', '==', chatId).limit(1).get();

  if (snap.empty) {
    return await sendMessage(chatId,
      `Ты и так не вошла в аккаунт 🤷‍♀️\n\n` +
      `Напиши /start чтобы войти!`
    );
  }

  await snap.docs[0].ref.set({ telegramChatId: null }, { merge: true });
  delete userStates[chatId];

  await sendMessage(chatId,
    `Вышла из аккаунта! 👋\n\n` +
    `Скучать буду... Возвращайся скорее 🤍\n\n` +
    `Чтобы войти снова — напиши /start`
  );
}

// ═══ ОБРАБОТКА КНОПОК ════════════════════════════════

async function handleCallback(callback) {
  const chatId = String(callback.message.chat.id);
  const messageId = callback.message.message_id;
  const data = callback.data;

  await answerCallback(callback.id, '');

  // Проверяем авторизацию
  const snap = await db.collection('users')
    .where('telegramChatId', '==', chatId).limit(1).get();

  if (snap.empty && data !== 'main_menu') {
    return await editMessage(chatId, messageId,
      `Кажется, ты вышла из аккаунта 🤔\n\nНапиши /start чтобы войти снова!`
    );
  }

  const user = snap.empty ? null : { phone: snap.docs[0].id, ...snap.docs[0].data() };

  if (data === 'main_menu') {
    if (!user) return;
    return await showMainMenu(chatId, user, messageId);
  }

  if (data === 'my_bookings') {
    return await showMyBookings(chatId, user.phone, messageId);
  }

  if (data === 'my_abonement') {
    return await showMyAbonement(chatId, user.phone, user, messageId);
  }

  if (data === 'contacts') {
    const text =
      `📞 <b>Контакты студии КУЛЬТ</b>\n\n` +
      `📍 ул. Кремлёвская, 1, ЖК Кремлёвский, Астрахань\n\n` +
      `📱 +7 (989) 794-94-11\n` +
      `💬 WhatsApp / Telegram\n\n` +
      `🕐 Пн–Сб: 9:00 – 20:00\n` +
      `🚫 Воскресенье: выходной\n\n` +
      `Ждём тебя! 🤍`;
    return await editMessage(chatId, messageId, text, { reply_markup: backToMenuKeyboard });
  }

  if (data === 'logout') {
    const confirmKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ Да, выйти', callback_data: 'confirm_logout' },
          { text: '❌ Отмена', callback_data: 'main_menu' },
        ],
      ],
    };
    return await editMessage(chatId, messageId,
      `Ты точно хочешь выйти? 😢\n\nЯ буду скучать...`,
      { reply_markup: confirmKeyboard }
    );
  }

  if (data === 'confirm_logout') {
    await snap.docs[0].ref.set({ telegramChatId: null }, { merge: true });
    await editMessage(chatId, messageId,
      `Пока-пока! 👋\n\nВозвращайся скорее — тренировки сами себя не сделают 😄`
    );
    return;
  }

  // Кнопки подтверждения/отмены тренировки из напоминания
  if (data.startsWith('confirm:') || data.startsWith('decline:')) {
    const [action, bookingId] = data.split(':');
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) return;

    if (action === 'confirm') {
      await bookingRef.set({ confirmed: true }, { merge: true });
      await editMessage(chatId, messageId,
        callback.message.text + '\n\n✅ <b>Подтверждено! Молодец, так держать 💪</b>'
      );
    } else {
      await bookingRef.set({ status: 'cancelled_by_client', confirmed: false }, { merge: true });
      await editMessage(chatId, messageId,
        callback.message.text + '\n\n❌ <b>Отменила. Ну ладно, бывает 🤷‍♀️</b>'
      );
    }
  }
}

// ═══ WEBHOOK ═════════════════════════════════════════

app.post('/webhook', async (req, res) => {
  res.status(200).send('OK');
  const update = req.body;
  try {
    if (update.message) await handleMessage(update.message);
    else if (update.callback_query) await handleCallback(update.callback_query);
  } catch (e) {
    console.error('Webhook error:', e.message);
  }
});

app.get('/', (req, res) => res.send('КУЛЬТ bot 🤍 is running'));

// ═══ CRON — напоминания о тренировках ════════════════

const funReminders = [
  '🔔 Эй, подруга! Ты не забыла? Завтра тренировка и она сама себя не проведёт 😄',
  '⏰ Напоминалка от твоей любимой студии! Тренировка уже близко 👀',
  '🏋️‍♀️ Стоп, стоп, стоп! Ты помнишь что у тебя скоро тренировка? Мы уже скучаем!',
  '💪 Твои мышцы уже в предвкушении! Тренировка совсем скоро ✨',
  '🎯 Алёрт! Не забудь про тренировку — тренер уже греется 😁',
];

cron.schedule('0 * * * *', async () => {
  console.log('[cron] Проверяем напоминания...');
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 9.5 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 10.5 * 60 * 60 * 1000);

    const snap = await db.collection('bookings')
      .where('status', '==', 'upcoming').get();

    for (const doc of snap.docs) {
      const b = doc.data();
      if (!b.trainingDate || b.reminderSent) continue;

      const td = new Date(b.trainingDate);
      if (td < windowStart || td > windowEnd) continue;

      const userSnap = await db.collection('users').doc(b.phone).get();
      if (!userSnap.exists) continue;
      const chatId = userSnap.data().telegramChatId;
      if (!chatId) continue;

      const userName = (b.userName || '').split(' ')[0] || 'подруга';
      const randomPhrase = funReminders[Math.floor(Math.random() * funReminders.length)];

      const text =
        `${randomPhrase}\n\n` +
        `📋 <b>${b.name}</b>\n` +
        `👤 Тренер: ${b.trainer}\n` +
        `📆 ${formatDate(b.trainingDate)}\n\n` +
        `Подтверди что придёшь! Если нет — занятие спишется с абонемента 👇`;

      await sendMessage(chatId, text, {
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Приду, уже бегу!', callback_data: `confirm:${doc.id}` },
            { text: '😢 Не смогу', callback_data: `decline:${doc.id}` },
          ]],
        },
      });

      await doc.ref.set({ reminderSent: true }, { merge: true });
      console.log(`[cron] Напоминание → ${b.userName}, ${b.name}`);
    }
  } catch (e) {
    console.error('[cron] Ошибка:', e.message);
  }
}, { timezone: 'Europe/Astrakhan' });

// ═══ CRON — проверка абонементов ═════════════════════

const funAbMessages = [
  '⏳ Подруга, твой абонемент почти закончился! Осталось {left} занятия 😱 Надо продлить, пока не поздно!',
  '🚨 Внимание-внимание! Осталось всего {left} тренировки по абонементу. Продлевай скорее! 🤍',
  '💳 Эй! Твой абонемент на исходе — {left} занятия осталось. Не бросай нас! 🥺',
];

cron.schedule('0 10 * * *', async () => {
  console.log('[cron] Проверяем абонементы...');
  try {
    const TOTALS = { single: 1, ab8: 8, ab12: 12, ab16: 16 };
    const usersSnap = await db.collection('users').where('abonement', '!=', null).get();

    for (const uDoc of usersSnap.docs) {
      const u = uDoc.data();
      if (!u.telegramChatId || !u.abonement) continue;

      const total = TOTALS[u.abonement];
      if (!total) continue;

      const bSnap = await db.collection('bookings')
        .where('phone', '==', uDoc.id)
        .where('status', 'in', ['attended', 'missed']).get();

      const used = bSnap.size;
      const left = total - used;

      if (left === 2 && !u.expiryWarningsSent) {
        const msg = funAbMessages[Math.floor(Math.random() * funAbMessages.length)]
          .replace('{left}', left);
        await sendMessage(u.telegramChatId, msg, {
          reply_markup: {
            inline_keyboard: [[{ text: '💳 Посмотреть абонемент', callback_data: 'my_abonement' }]],
          },
        });
        await uDoc.ref.set({ expiryWarningsSent: true }, { merge: true });
      }

      if (left > 2 && u.expiryWarningsSent) {
        await uDoc.ref.set({ expiryWarningsSent: false }, { merge: true });
      }
    }
  } catch (e) {
    console.error('[cron] Ошибка абонементов:', e.message);
  }
}, { timezone: 'Europe/Astrakhan' });

// ═══ SELF-PING ════════════════════════════════════════

if (SERVER_URL) {
  cron.schedule('*/10 * * * *', async () => {
    try {
      await fetch(SERVER_URL);
      console.log('[ping] сервер активен');
    } catch (e) {
      console.error('[ping] ошибка:', e.message);
    }
  });
}

// ═══ ЗАПУСК + WEBHOOK ════════════════════════════════

app.listen(PORT, async () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);

  // Настройка команд бота (отображаются как меню в Telegram)
  await fetch(tg('setMyCommands'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: [
        { command: 'start', description: '🚀 Войти в аккаунт / Главное меню' },
        { command: 'menu', description: '📋 Открыть личный кабинет' },
        { command: 'logout', description: '🚪 Выйти из аккаунта' },
      ],
    }),
  });

  // Описание бота
  await fetch(tg('setMyDescription'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description:
        'Привет! Я официальный бот студии КУЛЬТ 🤍\n\n' +
        'Здесь ты можешь:\n' +
        '📅 Смотреть свои записи на тренировки\n' +
        '💳 Следить за абонементом\n' +
        '🔔 Получать напоминания за 10 часов до тренировки\n\n' +
        'Нажми СТАРТ и войди в свой аккаунт! 💪',
    }),
  });

  // Короткое описание (отображается в списке чатов)
  await fetch(tg('setMyShortDescription'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      short_description: 'Твой личный помощник в студии КУЛЬТ 🤍',
    }),
  });

  if (SERVER_URL) {
    const webhookUrl = `${SERVER_URL}/webhook`;
    const res = await fetch(tg('setWebhook'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });
    const data = await res.json();
    console.log(data.ok ? `✅ Webhook: ${webhookUrl}` : `❌ Webhook error: ${data.description}`);
  }
});