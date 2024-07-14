// public/js/profile-setup.js

import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const profileSetupForm = document.getElementById('profileSetupForm');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Load existing profile data if available
            await loadExistingProfileData(user.uid);

            profileSetupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fullName = document.getElementById('fullName').value;
                const course = document.getElementById('courseSelect').value;
                const year = document.getElementById('yearSelect').value;

                try {
                    await updateUserProfile(user.uid, { fullName, course, year });
                    alert('Profile setup completed successfully!');
                    window.location.href = 'dashboard.html';
                } catch (error) {
                    console.error('Error setting up profile:', error);
                    alert('An error occurred while setting up your profile. Please try again.');
                }
            });
        } else {
            alert('Please log in to set up your profile.');
            window.location.href = 'index.html';
        }
    });
});

async function updateUserProfile(userId, profileData) {
    try {
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);
        
        if (!docSnap.exists()) {
            // If the document doesn't exist, create it
            await setDoc(userRef, {
                email: auth.currentUser.email,
                createdAt: new Date(),
                ...profileData,
                hasCompletedSetup: true,
                updatedAt: new Date()
            });
            console.log('User document created and updated');
        } else {
            // If the document exists, update it
            await updateDoc(userRef, {
                ...profileData,
                hasCompletedSetup: true,
                updatedAt: new Date()
            });
            console.log('User profile updated');
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

async function loadExistingProfileData(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.fullName) document.getElementById('fullName').value = data.fullName;
            if (data.course) document.getElementById('courseSelect').value = data.course;
            if (data.year) document.getElementById('yearSelect').value = data.year;
        }
    } catch (error) {
        console.error('Error loading existing profile data:', error);
    }
}

// Function to redirect to dashboard if profile is already set up
async function checkProfileSetup(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists() && docSnap.data().hasCompletedSetup) {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Error checking profile setup:', error);
    }
}

// Check profile setup on page load
onAuthStateChanged(auth, (user) => {
    if (user) {
        checkProfileSetup(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});
