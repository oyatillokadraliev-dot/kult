// Инициализация Firebase. SDK подключаются в index.html и admin.html до этого файла.
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyA9AByymeqj8RFy1dhitLPpifoXTf8wLF8",
    authDomain: "fiz-cult.firebaseapp.com",
    projectId: "fiz-cult",
    storageBucket: "fiz-cult.firebasestorage.app",
    messagingSenderId: "451011766706",
    appId: "1:451011766706:web:2f58d16b5edfc620409cab"
  };

  function initFirebase() {
    if (window._firebaseReady) return;
    try {
      // Защита от повторной инициализации (горячая перезагрузка, два скрипта)
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
      const db = firebase.firestore(app);
      window._db = db;
      window._fb = {
        collection: (d, c) => d.collection(c),
        doc: (d, c, id) => (id ? d.collection(c).doc(id) : d.doc(c)),
        setDoc: (ref, data, opts) => (opts ? ref.set(data, opts) : ref.set(data)),
        getDoc: (ref) => ref.get(),
        getDocs: (q) => q.get(),
        addDoc: (ref, data) => ref.add(data),
        deleteDoc: (ref) => ref.delete(),
        updateDoc: (ref, data) => ref.update(data),
        query: (ref, ...constraints) => constraints.reduce((q, c) => c(q), ref),
        where: (field, op, val) => (ref) => ref.where(field, op, val),
        serverTimestamp: () => firebase.firestore.FieldValue.serverTimestamp(),
      };
      window._firebaseReady = true;
      document.dispatchEvent(new Event('firebase-ready'));
      console.log('Firebase ready');
    } catch (e) {
      console.error('Firebase init error:', e);
      window._firebaseError = e;
      document.dispatchEvent(new Event('firebase-error'));
    }
  }

  if (typeof firebase !== 'undefined') initFirebase();
  else window.addEventListener('load', initFirebase);
})();
