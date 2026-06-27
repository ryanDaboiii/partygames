// NOTE: If you update the bundle ID in app.json, also update it in:
// Firebase Console → Project Settings → Your Apps → iOS app → Bundle ID
// Current bundle ID: com.ryan.partyfrenzy
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBoZsTFYqR4RUey2wFj6twa0NbegIPrN8w",
  authDomain: "partygames-6b0ed.firebaseapp.com",
  projectId: "partygames-6b0ed",
  storageBucket: "partygames-6b0ed.firebasestorage.app",
  messagingSenderId: "841034907172",
  appId: "1:841034907172:web:5d8ef3e92fe0ee457562b1",
};

// Prevent re-initialization on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
