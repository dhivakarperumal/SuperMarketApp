import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOrC2nIui7TE4x7BQPGE1SP1Yhov_-z10",
  authDomain: "dhiva-deva-supermarkets.firebaseapp.com",
  projectId: "dhiva-deva-supermarkets",
  storageBucket: "dhiva-deva-supermarkets.firebasestorage.app",
  messagingSenderId: "493101868874",
  appId: "1:493101868874:web:ae5b44c0a1dbf7f9fa83b3",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };

