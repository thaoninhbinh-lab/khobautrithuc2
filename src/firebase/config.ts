import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCTb16U3p5K09quKkLuqFg9P480dEdkhBk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'khobautrithuc.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'khobautrithuc',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'khobautrithuc.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '98419353157',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:98419353157:web:00fc092a8c4979952a652c',
};

// Kiểm tra xem biến môi trường Firebase đã được thiết lập thật hay chưa
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 10 &&
  !firebaseConfig.apiKey.includes('YourApiKey') &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes('YourProject')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.warn('Không thể khởi tạo Firebase SDK, sử dụng chế độ lưu trữ cục bộ:', error);
  }
}

export { app, auth, db, googleProvider, firebaseConfig };
