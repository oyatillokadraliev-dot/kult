# КУЛЬТ — Женский спортивный клуб

Полный проект: сайт + Telegram-бот уведомлений.

```
kult/
├── site/          ← сайт (GitHub Pages)
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js
│       ├── firebase-init.js
│       └── images-data.js
└── bot/           ← Telegram-бот (Render.com)
    ├── index.js
    ├── package.json
    ├── .env.example
    └── .gitignore
```

---

## 🚀 Шаг 1 — GitHub

1. Зайди на github.com → войди в аккаунт
2. New repository → назови kult → Private → Create
3. На компьютере в терминале:

git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/ТУТ_ТВОЙ_ЛОГИН/kult.git
git push -u origin main

---

## 🌐 Шаг 2 — Сайт на GitHub Pages (бесплатно)

1. Репозиторий → Settings → Pages
2. Source: Deploy from a branch
3. Branch: main, папка: /site → Save
4. Через 2 минуты сайт: https://ТВОЙ_ЛОГИН.github.io/kult/site/

---

## 🤖 Шаг 3 — Бот на Render.com (бесплатно)

### 3.1 — Service Account Firebase
Firebase Console → Project Settings → Service Accounts
→ Generate new private key → скачается JSON
→ значения из него вставишь в переменные Render

### 3.2 — Render.com
1. render.com → войти через GitHub
2. New → Web Service → выбери репозиторий kult
3. Настройки:
   - Root Directory: bot
   - Runtime: Node
   - Build Command: npm install
   - Start Command: npm start
   - Instance Type: Free
4. Advanced → Add Environment Variable, добавь:

TELEGRAM_BOT_TOKEN        = токен от BotFather
TELEGRAM_BOT_USERNAME     = username бота (без @)
FIREBASE_PROJECT_ID       = fiz-cult
FIREBASE_PRIVATE_KEY_ID   = из JSON
FIREBASE_PRIVATE_KEY      = из JSON (длинный ключ)
FIREBASE_CLIENT_EMAIL     = из JSON
FIREBASE_CLIENT_ID        = из JSON
PORT                      = 3000
SERVER_URL                = (пока пусто)

5. Create Web Service → Render выдаст URL: https://kult-bot.onrender.com
6. Вернись в Environment → добавь SERVER_URL = https://kult-bot.onrender.com
7. Manual Deploy → Deploy latest commit
8. Бот сам установит webhook!

---

## 🔗 Финальный шаг

В site/js/app.js найди:
  const TELEGRAM_BOT_USERNAME = 'kult_astrakhan_bot';
Замени на реальный username → git push → GitHub Pages обновится сам.

---

## Стоимость: 0 ₽/мес

GitHub Pages — бесплатно
Firebase Firestore Spark — бесплатно  
Render.com Free — бесплатно
