// firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyCmIOzaro1envvQfOTE37HP1whVyTcGjZk",
    authDomain: "projecthuber-b07f8.firebaseapp.com",
    projectId: "projecthuber-b07f8",
    storageBucket: "projecthuber-b07f8.appspot.com",
    messagingSenderId: "528157007264",
    appId: "1:528157007264:web:YOUR_APP_ID_HERE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export Firebase services
export { auth, db, storage };
