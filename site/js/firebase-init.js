import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
  import {
    getFirestore, collection, doc, setDoc, getDoc, getDocs,
    addDoc, deleteDoc, query, where, serverTimestamp, updateDoc
  } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

  const firebaseConfig = {
    apiKey: "AIzaSyA9AByymeqj8RFy1dhitLPpifoXTf8wLF8",
    authDomain: "fiz-cult.firebaseapp.com",
    projectId: "fiz-cult",
    storageBucket: "fiz-cult.firebasestorage.app",
    messagingSenderId: "451011766706",
    appId: "1:451011766706:web:2f58d16b5edfc620409cab",
    measurementId: "G-81MXX3S99H"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  window._db = db;
  window._fb = { collection, doc, setDoc, getDoc, getDocs, addDoc, deleteDoc, query, where, serverTimestamp, updateDoc };
  window._firebaseReady = true;
  document.dispatchEvent(new Event('firebase-ready'));