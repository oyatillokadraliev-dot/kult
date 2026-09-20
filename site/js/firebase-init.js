// Firebase подключается через глобальные CDN скрипты в index.html
// Этот файл только инициализирует приложение после загрузки SDK

(function() {
  const firebaseConfig = {
    apiKey: "AIzaSyA9AByymeqj8RFy1dhitLPpifoXTf8wLF8",
    authDomain: "fiz-cult.firebaseapp.com",
    projectId: "fiz-cult",
    storageBucket: "fiz-cult.firebasestorage.app",
    messagingSenderId: "451011766706",
    appId: "1:451011766706:web:2f58d16b5edfc620409cab"
  };

  function initFirebase() {
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    window._db = db;
    window._fb = {
      collection: (d, c) => d.collection(c),
      doc: (d, c, id) => id ? d.collection(c).doc(id) : d.doc(c),
      setDoc: (ref, data, opts) => opts ? ref.set(data, opts) : ref.set(data),
      getDoc: (ref) => ref.get(),
      getDocs: (q) => q.get(),
      addDoc: (ref, data) => ref.add(data),
      deleteDoc: (ref) => ref.delete(),
      updateDoc: (ref, data) => ref.update(data),
      query: (ref, ...constraints) => {
        let q = ref;
        constraints.forEach(c => { q = c(q); });
        return q;
      },
      where: (field, op, val) => (ref) => ref.where(field, op, val),
      serverTimestamp: () => firebase.firestore.FieldValue.serverTimestamp(),
    };
    window._firebaseReady = true;
    document.dispatchEvent(new Event('firebase-ready'));
    console.log('Firebase ready');
  }

  if (typeof firebase !== 'undefined') {
    initFirebase();
  } else {
    window.addEventListener('load', initFirebase);
  }
})();
