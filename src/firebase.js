// Firebase初期化
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDFHBc0SAW5-I5zmBa-P7jWqrwI49A06m0",
  authDomain: "homescreen-app-8cd6f.firebaseapp.com",
  projectId: "homescreen-app-8cd6f",
  storageBucket: "homescreen-app-8cd6f.firebasestorage.app",
  messagingSenderId: "1049787606180",
  appId: "1:1049787606180:web:12a3b89e7f078baad8b231",
  measurementId: "G-S0WC8ERSSB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
