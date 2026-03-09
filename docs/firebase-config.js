// ══════════════════════════════════════════════════════════════
//  CONFIGURATION FIREBASE – à remplir selon les instructions SETUP.md
//  Ne partagez pas ce fichier publiquement si vous ajoutez des
//  secrets — les clés Firebase client SONT publiques par conception
//  et l'accès est sécurisé par les règles Firestore.
// ══════════════════════════════════════════════════════════════

// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyCP2-5PDwAwGZUuDmIF4VjycJ2A0K9zwtU",
  authDomain: "distrigouttes-b9426.firebaseapp.com",
  projectId: "distrigouttes-b9426",
  storageBucket: "distrigouttes-b9426.firebasestorage.app",
  messagingSenderId: "178482086392",
  appId: "1:178482086392:web:a1e5680f7d8462b24dd60d"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
