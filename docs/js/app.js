/* ============================================================
   КУЛЬТ — публичный сайт
   Данные (тренеры, расписание, абонементы, контакты) — из Firestore.
   Константы ниже — только запасные значения, если база пуста.
   ============================================================ */

const TELEGRAM_BOT_USERNAME = 'kult_astrakhan_bot'; // TODO: заменить на реальный username бота

/* Запасные значения (используются, если в Firestore нет документов) */
const DEFAULT_CONTACTS = {
  address: 'ул. Кремлёвская, 1, ЖК Кремлёвский, Астрахань',
  phone: '+7 (989) 794-94-11',
  phoneRaw: '79897949411',
  hours: 'Пн–Сб, с 9:00 до 20:00',
  instagram: 'https://www.instagram.com/fizkult_ast',
  vk: 'https://vk.ru/fizkult_ast_30',
  telegram: 'https://t.me/+79897949411',
  whatsapp: 'https://wa.me/79897949411',
};

const DEFAULT_ABONEMENTS = {
  single: { label: 'Разовое посещение', price: 700,  sessions: 1,  count: '1 занятие' },
  ab8:    { label: '8 тренировок',      price: 4300, sessions: 8,  count: 'в месяц' },
  ab12:   { label: '12 тренировок',     price: 4800, sessions: 12, count: 'в месяц' },
  ab16:   { label: '16 тренировок',     price: 6000, sessions: 16, count: 'в месяц' },
};

/* Описания тренировок (текст — не меняется админкой) */
const TRAININGS = {
  trx:         { name: 'TRX / Функциональный тренинг', tags: ['Функциональная', 'Все уровни', '55 мин'], what: 'Тренировка с подвесными петлями TRX. Вес собственного тела — для проработки всех мышечных групп.', includes: 'Разминка, основной блок на пресс, спину, ноги и руки, заминка и растяжка.', who: 'Подходит для всех уровней — нагрузка регулируется углом наклона тела.' },
  silovaya:    { name: 'Силовая', tags: ['Силовая', 'Начинающим', '55 мин'], what: 'Классическая силовая тренировка со штангой, гантелями и тренажёрами.', includes: 'Разминка, базовые упражнения: приседания, тяги, жимы, заминка.', who: 'Для всех, кто хочет стать сильнее и улучшить тонус мышц.' },
  crossfit:    { name: 'Crossfit', tags: ['Высокая интенсивность', 'Продвинутый', '55 мин'], what: 'Функциональные круговые тренировки высокой интенсивности.', includes: 'Разминка, WOD: гимнастика, тяжёлая атлетика, кардио, растяжка.', who: 'Рекомендуется при наличии базовой физической подготовки.' },
  shpagat:     { name: 'Шпагат / Растяжка', tags: ['Растяжка', 'Гибкость', '55 мин'], what: 'Специализированная тренировка для развития гибкости и освоения шпагата.', includes: 'Разогрев суставов, пассивная и активная растяжка, работа с тренером, релаксация.', who: 'Для всех — от новичков до тех, кто хочет улучшить растяжку.' },
  zdorovye:    { name: 'Женское здоровье + мобильность', tags: ['Здоровье', 'Мягкие практики', '55 мин'], what: 'Тренировки с учётом женской физиологии: тазовое дно, глубокие мышцы, гормональный баланс, подвижность суставов.', includes: 'Дыхательные практики, упражнения для тазового дна, мягкие силовые блоки, работа на мобильность, растяжка.', who: 'Для женщин любого возраста, особенно после родов.' },
  mama:        { name: 'Мама + Малыш', tags: ['Для мам', 'С детьми', '55 мин'], what: 'Тренировка для мамы, пока малыш рядом. Восстановление после родов.', includes: 'Упражнения с весом малыша, восстановительные упражнения, игры для ребёнка.', who: 'Для мам с детьми от 3 месяцев до 2 лет.' },
  spina:       { name: 'Здоровая спина', tags: ['Реабилитация', 'Спина', '55 мин'], what: 'Укрепление мышечного корсета и снятие напряжения со спины.', includes: 'Упражнения для глубоких мышц спины, растяжка, релаксация.', who: 'При болях в спине, сидячей работе, после беременности.' },
  silovayapro: { name: 'Силовая PRO', tags: ['Продвинутый', 'Силовая', '55 мин'], what: 'Продвинутая силовая программа с прогрессивной нагрузкой.', includes: 'Тяжёлые базовые движения, суперсеты, работа на гипертрофию.', who: 'Для женщин с опытом силовых тренировок от 6 месяцев.' },
  osanka:      { name: 'Здоровая спина + Растяжка', tags: ['Спина', 'Гибкость', '55 мин'], what: 'Комплексная тренировка для здоровья спины и развития гибкости.', includes: 'Укрепление спины и плечевого пояса, растяжка передней поверхности тела.', who: 'Для всех, кто хочет красиво держать спину и стать гибче.' },
};

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_MAP = { 'Пн': 1, 'Вт': 2, 'Ср': 3, 'Чт': 4, 'Пт': 5, 'Сб': 6, 'Вс': 0 };
const DAY_LABEL_TO_KEY = { 'Пн': 'mon', 'Вт': 'tue', 'Ср': 'wed', 'Чт': 'thu', 'Пт': 'fri', 'Сб': 'sat' };
const GROUP_DAYS = { mwf: ['mon', 'wed', 'fri'], tts: ['tue', 'thu', 'sat'] };

/* ── STATE ───────────────────────────────────────── */
let user = JSON.parse(localStorage.getItem('xk_user') || 'null');
let bookings = [];
let pendingBook = null;
let activeTrainer = null;
let currentPage = 'home';

let TRAINERS_FROM_DB = {};
let SCHEDULE = {};            // { mon: [...], tue: [...], ... }
let ABONEMENTS = [];          // [{id,label,count,price,total}]
let CONTACTS = { ...DEFAULT_CONTACTS };

/* ── HELPERS ─────────────────────────────────────── */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const fmtPrice = (n) => Number(n).toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₽';

const fb = () => window._fb;

/* Ждём готовности Firebase, возвращаем Firestore-инстанс */
function getDB() {
  return new Promise((resolve, reject) => {
    if (window._firebaseReady) return resolve(window._db);
    document.addEventListener('firebase-ready', () => resolve(window._db), { once: true });
    document.addEventListener('firebase-error', () => reject(window._firebaseError), { once: true });
  });
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 3200);
}

function closeOv(id) { document.getElementById(id).classList.remove('open'); }
function openOv(id) { document.getElementById(id).classList.add('open'); }

function setBtn(id, text, disabled) {
  const b = document.getElementById(id);
  if (!b) return;
  b.disabled = disabled;
  b.textContent = text;
}

/* ── FIRESTORE: ЧТЕНИЕ НАСТРОЕК ─────────────────── */

async function loadTrainersFromDB() {
  try {
    const db = await getDB();
    const snap = await db.collection('trainers').get();
    TRAINERS_FROM_DB = {};
    snap.docs.forEach((doc) => {
      const t = doc.data();
      TRAINERS_FROM_DB[doc.id] = {
        name: t.name || '',
        spec: t.spec || '',
        bio: t.bio || '',
        phone: t.phone || '',
        photoBase64: t.photoBase64 || null,
        schedule: Array.isArray(t.schedule) ? t.schedule : [],
        reviews: Array.isArray(t.reviews) ? t.reviews : [],
      };
    });
  } catch (e) {
    console.error('Ошибка загрузки тренеров:', e);
    TRAINERS_FROM_DB = {};
  }
}

/* Расписание из коллекции schedule, сгруппированное по дням */
async function loadScheduleFromDB() {
  try {
    const db = await getDB();
    const snap = await db.collection('schedule').get();
    const byDay = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] };

    snap.docs.forEach((doc) => {
      const s = doc.data();
      if (!s.time || !s.name) return;
      const days = GROUP_DAYS[s.group] || [];
      const trainerName = s.trainer || '';
      days.forEach((dayKey) => {
        byDay[dayKey].push({
          id: doc.id,
          time: s.time,
          name: s.name,
          trainer: trainerName,
          key: s.key || null,
        });
      });
    });

    Object.values(byDay).forEach((arr) => arr.sort((a, b) => a.time.localeCompare(b.time)));
    SCHEDULE = byDay;
  } catch (e) {
    console.error('Ошибка загрузки расписания:', e);
    SCHEDULE = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] };
  }
}

async function loadAbonementsFromDB() {
  try {
    const db = await getDB();
    const snap = await db.collection('settings').doc('abonements').get();
    const data = snap.exists ? snap.data() : {};
    ABONEMENTS = Object.entries(DEFAULT_ABONEMENTS).map(([id, def]) => {
      const cur = data[id] || {};
      const price = Number(cur.price ?? def.price);
      const sessions = Number(cur.sessions ?? def.sessions);
      return {
        id,
        label: cur.label || def.label,
        count: def.count,
        price: fmtPrice(price),
        priceNum: price,
        total: sessions,
      };
    });
  } catch (e) {
    console.error('Ошибка загрузки абонементов:', e);
    ABONEMENTS = Object.entries(DEFAULT_ABONEMENTS).map(([id, def]) => ({
      id, label: def.label, count: def.count,
      price: fmtPrice(def.price), priceNum: def.price, total: def.sessions,
    }));
  }
}

async function loadContactsFromDB() {
  try {
    const db = await getDB();
    const snap = await db.collection('settings').doc('contacts').get();
    CONTACTS = { ...DEFAULT_CONTACTS, ...(snap.exists ? snap.data() : {}) };
  } catch (e) {
    console.error('Ошибка загрузки контактов:', e);
    CONTACTS = { ...DEFAULT_CONTACTS };
  }
}

/* ── FIRESTORE: ПОЛЬЗОВАТЕЛИ И ЗАПИСИ ──────────── */

async function dbGetUser(phone) {
  const d = await getDB();
  const snap = await fb().getDoc(fb().doc(d, 'users', phone));
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function dbSaveUser(phone, data) {
  const d = await getDB();
  await fb().setDoc(fb().doc(d, 'users', phone), data, { merge: true });
}

async function dbGetBookings(phone) {
  const d = await getDB();
  const q = fb().query(fb().collection(d, 'bookings'), fb().where('phone', '==', phone));
  const snap = await fb().getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function dbAddBooking(data) {
  const d = await getDB();
  const ref = await fb().addDoc(fb().collection(d, 'bookings'), { ...data, createdAt: fb().serverTimestamp() });
  return ref.id;
}

async function dbDeleteBooking(id) {
  const d = await getDB();
  await fb().deleteDoc(fb().doc(d, 'bookings', id));
}

async function dbUpdateBookingStatus(id, status) {
  const d = await getDB();
  await fb().updateDoc(fb().doc(d, 'bookings', id), { status });
}

async function dbGetTrainingBookings(trainerName, trainingName) {
  const d = await getDB();
  const q = fb().query(
    fb().collection(d, 'bookings'),
    fb().where('trainer', '==', trainerName),
    fb().where('name', '==', trainingName)
  );
  const snap = await fb().getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function dbGetReviews(trainerKey) {
  const d = await getDB();
  const q = fb().query(fb().collection(d, 'reviews'), fb().where('trainerKey', '==', trainerKey));
  const snap = await fb().getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function dbAddReview(data) {
  const d = await getDB();
  await fb().addDoc(fb().collection(d, 'reviews'), { ...data, createdAt: fb().serverTimestamp() });
}

/* ── INIT ────────────────────────────────────────── */
window.addEventListener('load', async () => {
  // Сначала подгружаем все данные из Firestore, потом рисуем страницу
  await Promise.all([
    loadTrainersFromDB(),
    loadScheduleFromDB(),
    loadAbonementsFromDB(),
    loadContactsFromDB(),
  ]);

  applyContactsToPage();
  renderNav();
  renderSchedule();
  renderTrainers();
  renderPrices();
  initSiteImages();

  window.addEventListener('scroll', () => {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 10);
  });

  document.querySelectorAll('.overlay').forEach((o) =>
    o.addEventListener('click', (e) => { if (e.target === o) o.classList.remove('open'); })
  );

  if (user && !user.isTrainer) {
    try { bookings = await dbGetBookings(user.phone); } catch (e) { bookings = []; }
  }
});

/* ── КОНТАКТЫ НА СТРАНИЦЕ ────────────────────────── */
function applyContactsToPage() {
  const c = CONTACTS;
  const phoneDigits = String(c.phone || '').replace(/\D/g, '');

  const addr = document.getElementById('c-address');
  if (addr) addr.textContent = c.address;

  const phoneLink = document.getElementById('c-phone-link');
  if (phoneLink) {
    phoneLink.textContent = c.phone;
    phoneLink.href = 'tel:+' + phoneDigits;
  }

  const hours = document.getElementById('c-hours');
  if (hours) hours.textContent = c.hours;

  const socials = document.getElementById('socials-grid');
  if (socials) {
    const items = [
      { url: c.instagram, name: 'Instagram', bg: 'rgba(201,169,110,.2)', color: 'var(--gold)',
        icon: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="var(--gold)" stroke="none"/>' },
      { url: c.vk, name: 'ВКонтакте', bg: 'rgba(93,131,177,.2)', color: '#5d83b1',
        icon: '<ellipse cx="12" cy="12" rx="10" ry="10"/>' },
      { url: c.telegram, name: 'Telegram', bg: 'rgba(41,182,246,.15)', color: '#29b6f6',
        icon: '<path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/>' },
      { url: c.whatsapp, name: 'WhatsApp', bg: 'rgba(72,187,120,.15)', color: '#48bb78',
        icon: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' },
    ].filter((i) => i.url);

    socials.innerHTML = items.map((i) => `
      <a href="${esc(i.url)}" target="_blank" rel="noopener noreferrer" class="social-btn">
        <div class="social-icon-wrap" style="background:${i.bg}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${i.color}" stroke-width="1.5">${i.icon}</svg>
        </div>
        <span class="social-btn-name">${i.name}</span>
      </a>`).join('');
  }

  // Schema.org — телефон и часы из базы
  const ld = document.getElementById('ld-json');
  if (ld) {
    try {
      const data = JSON.parse(ld.textContent);
      data.telephone = '+' + phoneDigits;
      data.openingHours = c.hours;
      data.sameAs = [c.instagram, c.vk].filter(Boolean);
      ld.textContent = JSON.stringify(data);
    } catch (e) { /* ignore */ }
  }
}

/* ── IMAGES ──────────────────────────────────────── */
function initSiteImages() {
  const navLogo = document.getElementById('nav-logo-img');
  if (navLogo) navLogo.src = 'images/logo-dark.png';

  const heroBg = document.getElementById('hero-bg-photo');
  const isMobile = window.innerWidth <= 680;
  if (heroBg) {
    const src = isMobile ? 'images/hero-mobile.jpg' : 'images/hero-collage.jpg';
    heroBg.style.backgroundImage = `url('${src}')`;
    if (isMobile) heroBg.classList.add('mobile-contain');
    requestAnimationFrame(() => heroBg.classList.add('loaded'));
  }

  ['lk-bg-photo', 'tc-bg-photo'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.backgroundImage = "url('images/equipment.jpg')";
    requestAnimationFrame(() => el.classList.add('loaded'));
  });
}

/* ── NAV / AUTH UI ───────────────────────────────── */
function renderNav() {
  const el = document.getElementById('nav-auth');
  const mm = document.getElementById('mm-auth-section');
  const adminLink = document.getElementById('admin-link');

  if (user) {
    const first = esc(user.name.split(' ')[0]);
    const pg = user.isTrainer ? 'tc' : 'lk';
    el.innerHTML = `
      <button class="btn-outline" onclick="showPage('${pg}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${first}
      </button>
      <button class="btn-primary" onclick="doLogout()">Выйти</button>`;
    mm.innerHTML = `
      <div class="mm-section-label">Личный кабинет</div>
      <button onclick="showPage('${pg}');closeMenu()">Мой профиль</button>
      <button onclick="doLogout();closeMenu()">Выйти</button>`;
    // Ссылка на админку — только для администратора (проверка на сервере — в правилах Firestore)
    if (adminLink) adminLink.style.display = user.isAdmin ? 'inline' : 'none';
  } else {
    el.innerHTML = `
      <button class="btn-outline" onclick="openAuth('login')">Войти</button>
      <button class="btn-primary" onclick="openAuth('register')">Записаться</button>`;
    mm.innerHTML = `
      <button onclick="openAuth('login');closeMenu()">Войти</button>
      <button onclick="openAuth('register');closeMenu()">Записаться</button>`;
    if (adminLink) adminLink.style.display = 'none';
  }
}

function navTo(id) {
  const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  if (currentPage !== 'home') { showPage('home'); setTimeout(scroll, 80); }
  else scroll();
}
function backToSchedule() { showPage('home'); setTimeout(() => navTo('schedule'), 60); }
function backToTrainers() { showPage('home'); setTimeout(() => navTo('trainers'), 60); }
function toggleMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }
function closeMenu() { document.getElementById('mobile-menu').classList.remove('open'); }

/* ── PAGES ───────────────────────────────────────── */
async function showPage(p) {
  ['home-page', 'trainer-page', 'lk-page', 'tc-page'].forEach((id) => {
    document.getElementById(id).style.display = 'none';
  });
  currentPage = p;
  const map = { home: 'home-page', trainer: 'trainer-page', lk: 'lk-page', tc: 'tc-page' };
  document.getElementById(map[p]).style.display = 'block';

  if (p === 'lk') {
    if (user && !user.isTrainer) {
      try {
        const fresh = await dbGetUser(user.phone);
        if (fresh) user = { ...user, ...fresh };
        bookings = await dbGetBookings(user.phone);
      } catch (e) { console.error(e); }
    }
    renderLK();
  }
  if (p === 'tc') renderTC();
  window.scrollTo(0, 0);
}

/* ── PHONE ───────────────────────────────────────── */
function formatPhone(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.startsWith('7') || v.startsWith('8')) v = v.slice(1);
  v = v.slice(0, 10);
  let out = '';
  if (v.length > 0) out = '(' + v.slice(0, 3);
  if (v.length >= 4) out += ') ' + v.slice(3, 6);
  if (v.length >= 7) out += '-' + v.slice(6, 8);
  if (v.length >= 9) out += '-' + v.slice(8, 10);
  input.value = out;
}
/* Единая нормализация: всегда 11 цифр, начинается с 7 */
function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) d = '7' + d;
  if (d.length === 11 && d.startsWith('8')) d = '7' + d.slice(1);
  return d;
}
function getRawPhone(val) { return normalizePhone(val); }

/* ── SCHEDULE ────────────────────────────────────── */
function renderSchedule() {
  DAY_KEYS.forEach((day) => {
    const el = document.getElementById('sched-' + day);
    const items = SCHEDULE[day] || [];
    el.innerHTML = items.length
      ? items.map((s) => `
        <div class="sched-card" onclick="openTraining(${JSON.stringify(s.key || '')}, ${JSON.stringify(s.name)}, ${JSON.stringify(s.trainer)}, ${JSON.stringify(s.time)})">
          <span class="sched-time">${esc(s.time)}</span>
          <div>
            <div class="sched-info-name">${esc(s.name)}</div>
            <div class="sched-info-trainer">${esc(s.trainer)}</div>
          </div>
          <button class="sched-book-btn">Записаться</button>
        </div>`).join('')
      : '<div style="color:var(--ink-muted);padding:16px">На этот день тренировок пока нет</div>';
  });
}

function switchDay(day, btn) {
  document.querySelectorAll('.day-tab').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.sched-grid').forEach((g) => g.classList.remove('active'));
  document.getElementById('sched-' + day).classList.add('active');
}

/* ── PRICES ──────────────────────────────────────── */
function renderPrices() {
  const grid = document.getElementById('prices-grid');
  if (!grid) return;
  grid.innerHTML = ABONEMENTS.map((a) => {
    const perSession = a.total > 1 ? Math.round(a.priceNum / a.total) : null;
    const featured = a.id === 'ab12';
    return `
      <div class="price-card${featured ? ' featured' : ''}">
        ${featured ? '<div class="price-tag-popular">Популярный</div>' : ''}
        <div class="price-sessions">${esc(a.label)}</div>
        <div class="price-amount">${esc(a.price)}</div>
        <div class="price-per">${perSession ? fmtPrice(perSession) + ' за занятие' : 'одно занятие'}</div>
      </div>`;
  }).join('');
}

/* ── TRAINERS ────────────────────────────────────── */
function renderTrainers() {
  const grid = document.getElementById('trainers-grid');
  const entries = Object.entries(TRAINERS_FROM_DB);
  if (!entries.length) {
    grid.innerHTML = '<div style="color:var(--ink-muted);padding:24px">Тренеры не добавлены</div>';
    return;
  }
  grid.innerHTML = entries.map(([k, t]) => `
    <div class="trainer-card" onclick="openTrainerPage('${esc(k)}')">
      <div class="trainer-photo-wrap">
        ${t.photoBase64
          ? `<img src="${esc(t.photoBase64)}" alt="${esc(t.name)}" style="width:100%;height:100%;object-fit:cover;display:block">`
          : `<div class="trainer-photo-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>`}
      </div>
      <div class="trainer-card-info">
        <div class="trainer-card-name">${esc(t.name)}</div>
        <div class="trainer-card-spec">${esc(t.spec)}</div>
      </div>
    </div>`).join('');
}

async function openTrainerPage(key) {
  activeTrainer = key;
  const t = TRAINERS_FROM_DB[key];
  if (!t) return;

  document.getElementById('tp-name').textContent = t.name;
  document.getElementById('tp-spec').textContent = t.spec;

  document.getElementById('tp-avatar').innerHTML = t.photoBase64
    ? `<img src="${esc(t.photoBase64)}" alt="${esc(t.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius)">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width=".8">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg></div>`;

  document.getElementById('tp-bio').innerHTML = esc(t.bio)
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((p) => `<p style="margin-bottom:16px">${p}</p>`)
    .join('');

  document.getElementById('tp-sched').innerHTML = (t.schedule || []).map((s) => `
    <div class="tsched-item">
      <span class="tsched-time">${esc(s.time)}</span>
      <span class="tsched-name">${esc(s.name)}</span>
      <span class="tsched-days">${esc(s.days)}</span>
      <button class="tsched-btn" onclick="openBookingModal(${JSON.stringify(s.name)}, ${JSON.stringify(t.name)}, ${JSON.stringify(s.time)}, ${JSON.stringify(s.days)})">Записаться</button>
    </div>`).join('') || '<div style="color:var(--ink-muted)">Расписание не добавлено</div>';

  document.getElementById('tp-reviews').innerHTML = '<div class="lk-empty-state" style="padding:20px">Загружаем отзывы...</div>';
  showPage('trainer');

  try {
    const fbReviews = await dbGetReviews(key);
    const allR = [...(t.reviews || []), ...fbReviews];
    document.getElementById('tp-reviews').innerHTML = allR.length
      ? allR.map((r) => `
          <div class="review-card">
            <div class="review-author">${esc(r.author)}</div>
            <div class="review-body">${esc(r.text)}</div>
          </div>`).join('')
      : '<div class="lk-empty-state">Пока нет отзывов. Будьте первыми!</div>';
  } catch (e) {
    document.getElementById('tp-reviews').innerHTML = '<div class="lk-empty-state">Не удалось загрузить отзывы.</div>';
  }
}

/* ── TRAINING MODAL ──────────────────────────────── */
function openTraining(key, name, trainer, time) {
  // Описание: по ключу, либо по названию (для тренировок из базы)
  const t = (key && TRAININGS[key]) || Object.values(TRAININGS).find((x) => x.name === name) || { name, tags: [], what: '', includes: '', who: '' };

  // Дни берём из расписания тренера
  const trainerObj = Object.values(TRAINERS_FROM_DB).find((tr) => tr.name === trainer);
  const schedEntry = trainerObj ? trainerObj.schedule.find((s) => s.time === time) : null;
  const days = schedEntry ? schedEntry.days : '';

  document.getElementById('training-content').innerHTML = `
    <h2 class="modal-title">${esc(t.name)}</h2>
    <div class="training-tags">${(t.tags || []).map((tg) => `<span class="t-tag">${esc(tg)}</span>`).join('')}</div>
    ${t.what ? `<div class="t-block"><h4>Что это</h4><p>${esc(t.what)}</p></div>` : ''}
    ${t.includes ? `<div class="t-block"><h4>Что входит</h4><p>${esc(t.includes)}</p></div>` : ''}
    ${t.who ? `<div class="t-block"><h4>Для кого</h4><p>${esc(t.who)}</p></div>` : ''}
    <div class="t-block"><h4>Тренер</h4><p>${esc(trainer)}</p></div>
    <button class="form-submit" style="margin-top:20px" onclick="closeOv('ov-training');openBookingModal(${JSON.stringify(name)}, ${JSON.stringify(trainer)}, ${JSON.stringify(time)}, ${JSON.stringify(days)})">Записаться</button>`;
  openOv('ov-training');
}

/* ── DATES ───────────────────────────────────────── */
function nextDateForDays(daysStr, timeStr) {
  if (!daysStr) return null;
  const targetDows = daysStr.split(',').map((s) => DAY_MAP[s.trim()]).filter((d) => d !== undefined);
  if (!targetDows.length) return null;
  const now = new Date();
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
  for (let i = 0; i < 14; i++) {
    const cand = new Date(now);
    cand.setDate(now.getDate() + i);
    cand.setHours(hh, mm, 0, 0);
    if (targetDows.includes(cand.getDay()) && cand > now) return cand.toISOString();
  }
  return null;
}

function formatDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/* ── BOOKING ─────────────────────────────────────── */
function openBookingModal(name, trainer, time, days) {
  if (!user) { openAuth('login'); return; }
  pendingBook = { name, trainer, time, days };
  const t = Object.values(TRAININGS).find((x) => x.name === name);
  const tName = t ? t.name : name;
  const nextDate = nextDateForDays(days, time);
  document.getElementById('bk-title').textContent = tName;
  document.getElementById('bk-sub').textContent =
    `Тренер: ${trainer}${time ? ' · ' + time : ''}` +
    (nextDate ? ' · Ближайшая: ' + formatDateShort(nextDate) : (days ? ' · ' + days : ''));
  openOv('ov-booking');
}

async function confirmBook() {
  if (!pendingBook) return;
  if (!user) { toast('Войдите, чтобы записаться'); return; }

  // Проверка абонемента: без активного абонемента записываться нельзя
  if (!user.isTrainer && !user.abonement) {
    toast('Сначала выберите абонемент в личном кабинете');
    return;
  }

  setBtn('btn-confirm-book', 'Записываем...', true);
  try {
    const nextDate = nextDateForDays(pendingBook.days, pendingBook.time);
    const bookingData = {
      ...pendingBook,
      phone: user.phone,
      userName: user.name,
      status: 'upcoming',
      trainingDate: nextDate,
    };
    const id = await dbAddBooking(bookingData);
    bookings.push({ ...bookingData, id });
    closeOv('ov-booking');
    toast('Вы записаны! Напоминание придёт в Telegram за 10 часов');
  } catch (e) {
    console.error(e);
    toast('Не удалось записаться. Попробуйте ещё раз.');
  } finally {
    setBtn('btn-confirm-book', 'Подтвердить запись', false);
    pendingBook = null;
  }
}

/* ── REVIEWS ─────────────────────────────────────── */
function openReviewModal() {
  if (!user) { openAuth('login'); return; }
  const t = TRAINERS_FROM_DB[activeTrainer];
  document.getElementById('rv-sub').textContent = `Отзыв о тренере ${t ? t.name : ''}`;
  document.getElementById('rv-text').value = '';
  openOv('ov-review');
}

async function submitReview() {
  if (!user) { toast('Войдите, чтобы оставить отзыв'); return; }
  const text = document.getElementById('rv-text').value.trim();
  if (!text) { toast('Напишите отзыв'); return; }

  setBtn('btn-review', 'Отправляем...', true);
  try {
    const author = user.name.split(' ').slice(0, 2).join(' ');
    await dbAddReview({ trainerKey: activeTrainer, author, text, phone: user.phone });
    closeOv('ov-review');
    toast('Спасибо за отзыв!');
    openTrainerPage(activeTrainer);
  } catch (e) {
    console.error(e);
    toast('Не удалось отправить отзыв');
  } finally {
    setBtn('btn-review', 'Отправить', false);
  }
}

/* ── AUTH ────────────────────────────────────────── */
function openAuth(view) { switchAuth(view); openOv('ov-auth'); }
function switchAuth(v) {
  document.getElementById('auth-login').style.display = v === 'login' ? 'block' : 'none';
  document.getElementById('auth-register').style.display = v === 'register' ? 'block' : 'none';
}

async function doLogin() {
  const phone = getRawPhone(document.getElementById('li-phone').value);
  if (phone.length !== 11) { toast('Введите номер телефона'); return; }

  setBtn('btn-login', 'Загрузка...', true);
  try {
    // 1. Тренер?
    await loadTrainersFromDB();
    const trainerEntry = Object.entries(TRAINERS_FROM_DB).find(([, t]) => normalizePhone(t.phone) === phone);
    if (trainerEntry) {
      const [trainerKey, trainerData] = trainerEntry;
      user = { name: trainerData.name, phone, isTrainer: true, trainerKey };
      save();
      closeOv('ov-auth');
      renderNav();
      showPage('tc');
      return;
    }

    // 2. Клиент?
    const found = await dbGetUser(phone);
    if (!found) {
      toast('Пользователь не найден. Зарегистрируйтесь.');
      return;
    }
    user = { ...found, phone };
    bookings = await dbGetBookings(phone);
    save();
    closeOv('ov-auth');
    renderNav();
    showPage('lk');
  } catch (e) {
    console.error(e);
    toast('Ошибка входа. Проверьте соединение.');
  } finally {
    setBtn('btn-login', 'Войти', false);
  }
}

async function doRegister() {
  const name = document.getElementById('rg-name').value.trim();
  const phone = getRawPhone(document.getElementById('rg-phone').value);
  if (!name || phone.length !== 11) { toast('Заполните все поля'); return; }

  setBtn('btn-register', 'Создаём...', true);
  try {
    const existing = await dbGetUser(phone);
    if (existing) { toast('Этот номер уже зарегистрирован'); return; }

    const userData = { name, phone, isTrainer: false, abonement: null, createdAt: new Date().toISOString() };
    await dbSaveUser(phone, userData);
    user = { ...userData };
    save();
    closeOv('ov-auth');
    renderNav();
    toast('Добро пожаловать в КУЛЬТ!');
    showPage('lk');
  } catch (e) {
    console.error(e);
    toast('Не удалось зарегистрироваться. Попробуйте ещё раз.');
  } finally {
    setBtn('btn-register', 'Создать аккаунт', false);
  }
}

function doLogout() {
  user = null;
  bookings = [];
  localStorage.removeItem('xk_user');
  renderNav();
  showPage('home');
}

function save() { localStorage.setItem('xk_user', JSON.stringify(user)); }

/* ── LK (клиент) ─────────────────────────────────── */
function renderLK() {
  if (!user) return;
  document.getElementById('lk-greeting').textContent = `Привет, ${user.name.split(' ')[0]}!`;
  document.getElementById('lk-phone').textContent = '+' + user.phone;

  const abEl = document.getElementById('lk-header-ab');
  const ab = user.abonement ? ABONEMENTS.find((a) => a.id === user.abonement) : null;
  abEl.innerHTML = ab
    ? `<div class="lk-ab-badge"><div class="lk-ab-badge-dot"></div><span class="lk-ab-badge-text">${esc(ab.label)}</span></div>`
    : '';

  const sb = document.getElementById('lk-sidebar');
  if (ab) {
    const used = bookings.filter((b) => b.status === 'attended').length;
    const total = ab.total;
    sb.innerHTML = `
      <div class="lk-ab-active">
        <div class="lk-ab-tag">Активный абонемент</div>
        <div class="lk-ab-title">${esc(ab.label)}</div>
        <div class="lk-ab-track"><div class="lk-ab-fill" style="width:${Math.min(100, Math.round(used / total * 100))}%"></div></div>
        <div class="lk-ab-meta">Посещено ${used} из ${total} занятий</div>
        <button class="lk-ab-change" onclick="renderAbSelect()">Сменить абонемент</button>
      </div>`;
  } else {
    sb.innerHTML = renderAbSelectHTML();
  }

  const tgBanner = document.getElementById('lk-telegram-banner');
  tgBanner.innerHTML = !user.telegramChatId ? `
    <div class="tg-banner">
      <div class="tg-banner-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#29b6f6" stroke-width="1.8"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
      </div>
      <div style="flex:1">
        <div class="tg-banner-title">Подключи уведомления в Telegram</div>
        <div class="tg-banner-text">Напоминания о тренировках за 10 часов и подтверждение записи — прямо в мессенджере</div>
      </div>
      <a href="https://t.me/${esc(TELEGRAM_BOT_USERNAME)}?start=${esc(user.phone)}" target="_blank" rel="noopener noreferrer" class="tg-banner-btn">Подключить</a>
    </div>` : '';

  const list = document.getElementById('lk-list');
  const sorted = [...bookings].sort((a, b) => new Date(a.trainingDate || 0) - new Date(b.trainingDate || 0));
  list.innerHTML = sorted.length
    ? sorted.map((b) => {
        const status = b.status || 'upcoming';
        const statusBadge =
          status === 'attended' ? '<span class="lk-status-badge lk-status-attended">Посещено</span>' :
          status === 'missed'   ? '<span class="lk-status-badge lk-status-missed">Пропуск</span>' :
          '<span class="lk-status-badge lk-status-upcoming">Предстоит</span>';
        const label = Object.values(TRAININGS).find((x) => x.name === b.name)?.name || b.name;
        return `
        <div class="lk-booking-row">
          <div class="lk-booking-time">${esc(b.time || '—')}${b.trainingDate ? `<div class="lk-booking-date">${esc(formatDateShort(b.trainingDate))}</div>` : ''}</div>
          <div>
            <div class="lk-booking-name">${esc(label)}</div>
            <div class="lk-booking-trainer">${esc(b.trainer)}${b.days ? ' · ' + esc(b.days) : ''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            ${statusBadge}
            ${status === 'upcoming' ? `<button class="lk-cancel-btn" onclick="cancelBook('${esc(b.id)}')">Отменить</button>` : ''}
          </div>
        </div>`;
      }).join('')
    : '<div class="lk-empty-state">Вы ещё не записаны ни на одну тренировку.<br>Перейдите в расписание и выберите занятие.</div>';
}

function renderAbSelectHTML(selectedId) {
  return `<div class="ab-select-card">
    <div class="ab-select-title">Выбери абонемент</div>
    <div class="ab-select-sub">Выбери подходящий формат занятий</div>
    <div class="ab-options">
      ${ABONEMENTS.map((a) => `
        <div class="ab-option${selectedId === a.id ? ' selected' : ''}" onclick="selectAb('${esc(a.id)}',this)">
          <div class="ab-option-left">
            <div class="ab-radio"><div class="ab-radio-dot"></div></div>
            <div><div class="ab-option-name">${esc(a.label)}</div><div class="ab-option-count">${esc(a.count)}</div></div>
          </div>
          <div class="ab-option-price">${esc(a.price)}</div>
        </div>`).join('')}
    </div>
    <button class="ab-save-btn" onclick="saveAb()">Выбрать абонемент</button>
  </div>`;
}

let pendingAbId = null;
function renderAbSelect() {
  document.getElementById('lk-sidebar').innerHTML = renderAbSelectHTML(user.abonement);
  pendingAbId = user.abonement;
}
function selectAb(id, el) {
  pendingAbId = id;
  document.querySelectorAll('.ab-option').forEach((o) => o.classList.remove('selected'));
  el.classList.add('selected');
}

async function saveAb() {
  if (!pendingAbId) { toast('Выберите абонемент'); return; }
  try {
    await dbSaveUser(user.phone, { abonement: pendingAbId });
    user.abonement = pendingAbId;
    save();
    renderLK();
    toast('Абонемент выбран!');
  } catch (e) {
    console.error(e);
    toast('Не удалось сохранить абонемент');
  }
}

async function cancelBook(id) {
  if (!id || !confirm('Отменить запись?')) return;
  try {
    await dbDeleteBooking(id);
    bookings = bookings.filter((b) => b.id !== id);
    renderLK();
    toast('Запись отменена');
  } catch (e) {
    console.error(e);
    toast('Не удалось отменить запись');
  }
}

/* ── TC (кабинет тренера) ────────────────────────── */
async function renderTC() {
  if (!user || !user.isTrainer) return;

  if (!TRAINERS_FROM_DB[user.trainerKey]) await loadTrainersFromDB();
  const trainer = TRAINERS_FROM_DB[user.trainerKey] || {};

  document.getElementById('tc-greeting').textContent = trainer.name || user.name;
  document.getElementById('tc-role').textContent = trainer.spec || '';

  const list = document.getElementById('tc-list');
  list.innerHTML = '<div class="lk-empty-state">Загружаем данные...</div>';

  const schedule = trainer.schedule || [];
  const withClients = await Promise.all(schedule.map(async (s) => {
    try {
      const clients = await dbGetTrainingBookings(trainer.name, s.name);
      clients.sort((a, b) => new Date(a.trainingDate || 0) - new Date(b.trainingDate || 0));
      return { ...s, clients };
    } catch (e) {
      return { ...s, clients: [] };
    }
  }));

  list.innerHTML = withClients.map((s, i) => `
    <div class="tc-group">
      <div class="tc-group-header" onclick="toggleTC(${i})">
        <span class="tc-group-time">${esc(s.time)}</span>
        <div>
          <div class="tc-group-name">${esc(s.name)}</div>
          <div class="tc-group-days">${esc(s.days)}</div>
        </div>
        <span class="tc-group-count">${s.clients.length} клиентов</span>
      </div>
      <div class="tc-clients-list" id="tc-cl-${i}">
        ${s.clients.length
          ? s.clients.map((c) => `
            <div class="tc-client-row-full" data-booking-id="${esc(c.id)}">
              <div class="tc-client-info">
                <div class="tc-client-name">${esc(c.userName || '—')}</div>
                <div class="tc-client-meta">+${esc(c.phone || '')}${c.trainingDate ? ' · ' + esc(formatDateShort(c.trainingDate)) : ''}</div>
              </div>
              <div class="tc-attend-buttons">
                <button class="tc-attend-btn tc-attend-yes${c.status === 'attended' ? ' active' : ''}"
                  onclick="markAttendance('${esc(c.id)}','attended',this)" title="Пришла">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <button class="tc-attend-btn tc-attend-no${c.status === 'missed' ? ' active' : ''}"
                  onclick="markAttendance('${esc(c.id)}','missed',this)" title="Не пришла">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>`).join('')
          : '<div style="padding:16px 24px;font-size:14px;color:var(--ink-muted)">Записей пока нет</div>'}
      </div>
    </div>`).join('');
}

function toggleTC(i) {
  document.getElementById('tc-cl-' + i)?.classList.toggle('open');
}

async function markAttendance(bookingId, status, btn) {
  try {
    await dbUpdateBookingStatus(bookingId, status);
    const row = btn.closest('.tc-client-row-full');
    row.querySelectorAll('.tc-attend-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    toast(status === 'attended' ? 'Отмечено: пришла' : 'Отмечено: не пришла');
  } catch (e) {
    console.error(e);
    toast('Не удалось сохранить отметку');
  }
}
