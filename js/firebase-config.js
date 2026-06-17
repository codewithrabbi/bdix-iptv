import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyChhS0Y_qHPYHXBZ0XQ70K1dJe66kR0Si4",
  authDomain: "iptv-b631f.firebaseapp.com",
  projectId: "iptv-b631f",
  storageBucket: "iptv-b631f.firebasestorage.app",
  messagingSenderId: "1058351649630",
  appId: "1:1058351649630:web:4b0c2612c5567b2f4135cf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
