// public/js/auth.js

import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc 
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// Tab switching
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
});

registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.style.display = 'flex';
    loginForm.style.display = 'none';
});

// Hard-coded admin emails
const ADMIN_EMAILS = [
    'admin@projecthuber.com',
    'superadmin@projecthuber.com'
];

// Initialize user profile function
async function initializeUserProfile(user) {
    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        try {
            await setDoc(userRef, {
                email: user.email,
                createdAt: new Date(),
                role: ADMIN_EMAILS.includes(user.email) ? 'admin' : 'user',
                hasCompletedSetup: false,
                fullName: '',
                course: '',
                year: '',
                updatedAt: null
            });
            console.log('User profile initialized');
        } catch (error) {
            console.error('Error initializing user profile:', error);
        }
    }
}

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    try {
        await signIn(email, password);
        alert('Logged in successfully!');
        redirectToProfileSetup();
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Register
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = registerForm.querySelector('input[type="email"]').value;
    const password = registerForm.querySelector('input[type="password"]').value;

    try {
        await signUp(email, password);
        alert('Registered successfully!');
        redirectToProfileSetup();
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Google Sign-In
document.getElementById('googleSignIn').addEventListener('click', async () => {
    try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        
        await initializeUserProfile(user);
        
        alert('Signed in with Google successfully!');
        redirectToProfileSetup();
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Apple Sign-In
document.getElementById('appleSignIn').addEventListener('click', async () => {
    try {
        const provider = new OAuthProvider('apple.com');
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        
        await initializeUserProfile(user);
        
        alert('Signed in with Apple successfully!');
        redirectToProfileSetup();
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// Sign up function
async function signUp(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create a user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            createdAt: new Date(),
            role: ADMIN_EMAILS.includes(user.email) ? 'admin' : 'user',
            hasCompletedSetup: false,
            fullName: '',
            course: '',
            year: '',
            updatedAt: null
        });
        
        console.log('User document created in Firestore');
        return userCredential;
    } catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
}

// Sign in function
async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await initializeUserProfile(user);
        
        return userCredential;
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}

// Sign out function
async function signOut() {
    try {
        await firebaseSignOut(auth);
        alert('Signed out successfully!');
        window.location.href = 'index.html';
    } catch (error) {
        alert('Error signing out: ' + error.message);
    }
}

// Set user role
async function setUserRole(userId, role) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role: role });
}

// Get user role
async function getUserRole(userId) {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        return docSnap.data().role;
    } else {
        return null;
    }
}

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log('User is signed in:', user);
        const role = await getUserRole(user.uid);
        console.log('User role:', role);
        document.body.classList.add('signed-in');
        document.body.classList.add(`role-${role}`);
        const hasCompletedSetup = await checkProfileSetup(user.uid);
        if (!hasCompletedSetup) {
            redirectToProfileSetup();
        } else if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            redirectToDashboard();
        }
    } else {
        console.log('User is signed out');
        document.body.classList.remove('signed-in');
        document.body.classList.remove('role-admin', 'role-user');
    }
});

// Function to redirect to profile setup
function redirectToProfileSetup() {
    window.location.href = 'profile-setup.html';
}

// Function to redirect to dashboard
function redirectToDashboard() {
    window.location.href = 'dashboard.html';
}

// Function to check if user has completed profile setup
async function checkProfileSetup(userId) {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return data.hasCompletedSetup === true;
    }
    return false;
}

export { signUp, signIn, signOut, getUserRole };
