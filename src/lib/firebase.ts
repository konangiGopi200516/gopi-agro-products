import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDE76TNNjVB_SM3jbpUS4ZwV1rzIZxRVVA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "farmer-friendly-web-app.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://farmer-friendly-web-app-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "farmer-friendly-web-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "farmer-friendly-web-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "813146870272",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:813146870272:web:6d1a40075347a39fccbee5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
