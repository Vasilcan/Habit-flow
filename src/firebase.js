import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDMGrQKANTqfHYP2tWipKS3ibu9aOWdvoA",
    authDomain: "habit-flow-f71c1.firebaseapp.com",
    projectId: "habit-flow-f71c1",
    storageBucket: "habit-flow-f71c1.firebasestorage.app",
    messagingSenderId: "953327401568",
    appId: "1:953327401568:web:5ee81f3903511e083aa105",
    measurementId: "G-2D1W1CT49E"
};

// Inițializăm Firebase cu datele tale
const app = initializeApp(firebaseConfig);

// Exportăm Auth și Baza de date ca să le putem folosi în paginile noastre de Login/Register
export const auth = getAuth(app);
export const db = getFirestore(app);