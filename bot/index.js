/**
 * КУЛЬТ — Telegram-бот (обычный Node.js сервер)
 * ─────────────────────────────────────────────
 * Работает как Express-сервер.
 * Получает обновления от Telegram через webhook.
 * Cron-задачи: напоминания о тренировках + абонементы.
 *
 * Деплой: Railway.app / Render.com (бесплатно, без Cloud Functions)
 */

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cron = require('node-cron');
const admin = require('firebase-admin');

// ═══════════════════════════════════════════
// ИНИЦИАЛИЗАЦИЯ
// ═══════════════════════════════════════════

// Firebase Admin через переменные окружения (без JSON-файла)
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '')
      .replace(/\\n/g, '\n')      // буквальный \n → перенос строки
      .replace(/^"|"$/g, ''),     // убираем кавычки если есть
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

// ═══════════════════════════════════════════
// TELEGRAM API ХЕЛПЕРЫ
// ═══════════════════════════════════════════

const tg = (method) => `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;

async function sendMessage(chatId, text, replyMarkup) {
  const body = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(tg('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function answerCallback(callbackQueryId, text) {
  await fetch(tg('answerCallbackQuery'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
  });
}

async function editMessage(chatId, messageId, text) {
  await fetch(tg('editMessageText'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' }),
  });
}

function normalizePhone(raw) {
  let digits = String(raw).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (digits.length === 10) digits = '7' + digits;
  return digits;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// ═══════════════════════════════════════════
// ОБРАБОТЧИКИ СООБЩЕНИЙ
// ═══════════════════════════════════════════

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = (message.text || '').trim();

  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    const phoneArg = parts[1];

    if (!phoneArg) {
      await sendMessage(chatId,
        '👋 Привет! Это бот клуба <b>КУЛЬТ</b> 🤍\n\n' +
        'Чтобы получать напоминания о тренировках, отправь свой номер телефона — ' +
        'тот же, что указывала при регистрации на сайте.\n\n' +
        'Формат: <code>+7XXXXXXXXXX</code>'
      );
      return;
    }
    await linkPhone(chatId, phoneArg);
    return;
  }

  // Если прислали просто номер телефона
  const digits = text.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 11) {
    await linkPhone(chatId, text);
    return;
  }

  await sendMessage(chatId,
    'Не поняла 🙂 Пришли номер телефона в формате <code>+7XXXXXXXXXX</code>, ' +
    'чтобы привязать аккаунт.'
  );
}

async function linkPhone(chatId, phoneRaw) {
  const phone = normalizePhone(phoneRaw);

  if (phone.length !== 11) {
    await sendMessage(chatId, '❌ Номер выглядит некорректно. Формат: <code>+7XXXXXXXXXX</code>');
    return;
  }

  const userRef = db.collection('users').doc(phone);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    await sendMessage(chatId,
      '❌ Не нашла такой номер среди клиентов.\n\n' +
      'Убедись, что уже зарегистрирована на сайте с этим номером, и попробуй снова.'
    );
    return;
  }

  await userRef.set({ telegramChatId: String(chatId) }, { merge: true });

  const name = (userSnap.data().name || '').split(' ')[0];
  await sendMessage(chatId,
    `✅ Готово${name ? ', ' + name : ''}! 🤍\n\n` +
    'Теперь я буду присылать напоминания о тренировках <b>за 10 часов</b> до начала ' +
    'и предупреждать, если абонемент скоро закончится.'
  );
}

async function handleCallback(callback) {
  const chatId = callback.message.chat.id;
  const messageId = callback.message.message_id;
  const data = callback.data;
  const [action, bookingId] = data.split(':');

  if (!bookingId) { await answerCallback(callback.id, 'Что-то пошло не так'); return; }

  const bookingRef = db.collection('bookings').doc(bookingId);
  const bookingSnap = await bookingRef.get();
  if (!bookingSnap.exists) { await answerCallback(callback.id, 'Запись не найдена'); return; }

  if (action === 'confirm') {
    await bookingRef.set({ confirmed: true }, { merge: true });
    await answerCallback(callback.id, 'Отлично, ждём тебя! 🤍');
    await editMessage(chatId, messageId, callback.message.text + '\n\n✅ <b>Подтверждено</b>');
  } else if (action === 'decline') {
    // Клиент сам отменяет — занятие НЕ списывается
    await bookingRef.set({ status: 'cancelled_by_client', confirmed: false }, { merge: true });
    await answerCallback(callback.id, 'Хорошо, отменила запись. Ждём в другой раз!');
    await editMessage(chatId, messageId, callback.message.text + '\n\n❌ <b>Запись отменена</b>');
  }
}

// ═══════════════════════════════════════════
// WEBHOOK — принимает обновления от Telegram
// ═══════════════════════════════════════════

app.post('/webhook', async (req, res) => {
  res.status(200).send('OK'); // сразу отвечаем Telegram
  const update = req.body;
  try {
    if (update.message) await handleMessage(update.message);
    else if (update.callback_query) await handleCallback(update.callback_query);
  } catch (e) {
    console.error('Webhook error:', e.message);
  }
});

// Healthcheck для хостинга
app.get('/', (req, res) => res.send('КУЛЬТ bot is running 🤍'));

// ═══════════════════════════════════════════
// CRON — каждый час: напоминания о тренировках
// ═══════════════════════════════════════════

cron.schedule('0 * * * *', async () => {
  console.log('[cron] Проверяем напоминания...');
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 9.5 * 60 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 10.5 * 60 * 60 * 1000);

    const snap = await db.collection('bookings')
      .where('status', '==', 'upcoming')
      .get();

    for (const doc of snap.docs) {
      const b = doc.data();
      if (!b.trainingDate || b.reminderSent) continue;

      const td = new Date(b.trainingDate);
      if (td < windowStart || td > windowEnd) continue;

      const userSnap = await db.collection('users').doc(b.phone).get();
      if (!userSnap.exists) continue;
      const chatId = userSnap.data().telegramChatId;
      if (!chatId) continue;

      const text =
        `🔔 <b>Напоминание о тренировке</b>\n\n` +
        `<b>${b.name}</b>\n` +
        `Тренер: ${b.trainer}\n` +
        `${formatDate(b.trainingDate)} в ${b.time || ''}\n\n` +
        `Подтверди, что придёшь. Если не придёшь без отмены — занятие спишется с абонемента.`;

      await sendMessage(chatId, text, {
        inline_keyboard: [[
          { text: '✅ Приду', callback_data: `confirm:${doc.id}` },
          { text: '❌ Не приду', callback_data: `decline:${doc.id}` },
        ]],
      });

      await doc.ref.set({ reminderSent: true }, { merge: true });
      console.log(`[cron] Напоминание отправлено: ${b.userName} → ${b.name} в ${b.time}`);
    }
  } catch (e) {
    console.error('[cron] Ошибка напоминаний:', e.message);
  }
}, { timezone: 'Europe/Astrakhan' });

// ═══════════════════════════════════════════
// CRON — каждый день в 10:00: проверка абонементов
// ═══════════════════════════════════════════

cron.schedule('0 10 * * *', async () => {
  console.log('[cron] Проверяем абонементы...');
  try {
    const TOTALS = { single: 1, ab8: 8, ab12: 12, ab16: 16 };
    const LABELS = { single: 'Разовое', ab8: '8 тренировок', ab12: '12 тренировок', ab16: '16 тренировок' };

    const usersSnap = await db.collection('users').where('abonement', '!=', null).get();

    for (const uDoc of usersSnap.docs) {
      const u = uDoc.data();
      if (!u.telegramChatId || !u.abonement) continue;

      const total = TOTALS[u.abonement];
      if (!total) continue;

      const bSnap = await db.collection('bookings')
        .where('phone', '==', uDoc.id)
        .where('status', 'in', ['attended', 'missed'])
        .get();

      const used = bSnap.size;
      const remaining = total - used;

      if (remaining === 2 && !u.expiryWarningsSent) {
        await sendMessage(u.telegramChatId,
          `⏳ <b>Абонемент заканчивается</b>\n\n` +
          `У тебя осталось <b>${remaining} занятия</b> по абонементу «${LABELS[u.abonement]}».\n\n` +
          `Не забудь продлить, чтобы не прерывать тренировки! 🤍`
        );
        await uDoc.ref.set({ expiryWarningsSent: true }, { merge: true });
      }

      if (remaining > 2 && u.expiryWarningsSent) {
        await uDoc.ref.set({ expiryWarningsSent: false }, { merge: true });
      }
    }
  } catch (e) {
    console.error('[cron] Ошибка абонементов:', e.message);
  }
}, { timezone: 'Europe/Astrakhan' });

// ═══════════════════════════════════════════
// SELF-PING — не даём серверу засыпать на Render.com
// (бесплатный план засыпает через 15 мин бездействия)
// ═══════════════════════════════════════════

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

// ═══════════════════════════════════════════
// ЗАПУСК СЕРВЕРА + УСТАНОВКА WEBHOOK
// ═══════════════════════════════════════════

app.listen(PORT, async () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);

  if (SERVER_URL) {
    const webhookUrl = `${SERVER_URL}/webhook`;
    try {
      const res = await fetch(tg('setWebhook'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const data = await res.json();
      if (data.ok) {
        console.log(`✅ Webhook установлен: ${webhookUrl}`);
      } else {
        console.error('❌ Ошибка webhook:', data.description);
      }
    } catch (e) {
      console.error('❌ Не удалось установить webhook:', e.message);
    }
  } else {
    console.warn('⚠️  SERVER_URL не задан — webhook не установлен');
  }
});
