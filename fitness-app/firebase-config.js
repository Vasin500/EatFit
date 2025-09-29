// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBRXqmB33Alumlgxb6OEHNdJ5L_5B4ha5A",
  authDomain: "game-killer-82700.firebaseapp.com",
  projectId: "game-killer-82700",
  storageBucket: "game-killer-82700.firebasestorage.app",
  messagingSenderId: "1020819084097",
  appId: "1:1020819084097:web:05b76622dd6bae2d25c7c0",
  measurementId: "G-FXGN4MKC3L"
};

// init Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);

// export ตัวแปรไปใช้หน้าอื่นได้
export const auth = getAuth(app);
export const db = getFirestore(app);
