// firebase.js

// 從 SDK 中匯入您需要的功能
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // 1. 從 SDK 匯入 Storage

// 您的 Web 應用程式的 Firebase 設定 (從 Firebase 控制台複製)
const firebaseConfig = {
  apiKey: "AIzaSyDB1LQryyu1C_-xTI2zLeQxNYM9xgtnavo",
  authDomain: "vr-mmse-test-710d8.firebaseapp.com",
  databaseURL: "https://vr-mmse-test-710d8-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "vr-mmse-test-710d8",
  storageBucket: "vr-mmse-test-710d8.firebasestorage.app",
  messagingSenderId: "914496434850",
  appId: "1:914496434850:web:2bc4fe4a9410dc4e3c5dfb"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化您需要的服務，並將它們匯出
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // 2. 初始化 Storage 並匯出
// 如果您還需要其他服務，也可以在這裡初始化並匯出
// export const storage = getStorage(app);