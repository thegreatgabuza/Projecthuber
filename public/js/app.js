// public/js/app.js

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Tab switching functionality
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

    // Check if user is already logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            console.log('User is signed in:', user);
            checkUserProfileStatus(user);
        } else {
            // User is signed out
            console.log('No user is signed in');
            showLoginForm();
        }
    });
});

function showLoginForm() {
    document.getElementById('loginTab').click();
}

async function checkUserProfileStatus(user) {
    // This function should check if the user has completed their profile setup
    // If not, redirect to profile setup page
    // If yes, redirect to dashboard
    // For now, we'll just redirect to profile setup
    window.location.href = 'profile-setup.html';
}

// You can add more general app functionality here
// For example, handling navigation, loading user data, etc.

export function showLoadingSpinner() {
    // Implement a loading spinner or progress indicator
    console.log('Loading...');
}

export function hideLoadingSpinner() {
    // Hide the loading spinner
    console.log('Loading complete');
}

// Add any other general app functions you might need
