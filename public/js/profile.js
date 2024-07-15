import { auth, db, storage } from './firebase-config.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { ref, getDownloadURL, uploadBytes, deleteObject } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js';

document.addEventListener('DOMContentLoaded', () => {
    const profileImage = document.getElementById('profileImage');
    const profileImageInput = document.getElementById('profileImageInput');
    const removeProfileImageBtn = document.getElementById('removeProfileImageBtn');
    const profileFullName = document.getElementById('profileFullName');
    const profileCourse = document.getElementById('profileCourse');
    const profileYear = document.getElementById('profileYear');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileForm = document.getElementById('editProfileForm');
    const profileForm = document.getElementById('profileForm');
    const editFullName = document.getElementById('editFullName');
    const editCourse = document.getElementById('editCourse');
    const editYear = document.getElementById('editYear');

    let currentUser;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadUserProfile(user.uid);
        } else {
            window.location.href = 'index.html';
        }
    });

    profileImage.addEventListener('click', () => {
        profileImageInput.click();
    });

    profileImageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const storageRef = ref(storage, `profileImages/${currentUser.uid}`);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    profileImageUrl: downloadURL
                });
                profileImage.src = downloadURL;
            } catch (error) {
                console.error('Error uploading profile image:', error);
                alert('An error occurred while uploading the profile image. Please try again.');
            }
        }
    });

    removeProfileImageBtn.addEventListener('click', async () => {
        try {
            const storageRef = ref(storage, `profileImages/${currentUser.uid}`);
            await deleteObject(storageRef);
            await updateDoc(doc(db, 'users', currentUser.uid), {
                profileImageUrl: ''
            });
            profileImage.src = 'public/images/default-profile.png';
        } catch (error) {
            console.error('Error removing profile image:', error);
            alert('An error occurred while removing the profile image. Please try again.');
        }
    });

    editProfileBtn.addEventListener('click', () => {
        editProfileForm.style.display = 'block';
        editFullName.value = profileFullName.textContent;
        editCourse.value = profileCourse.textContent.toLowerCase().replace(' ', '_');
        editYear.value = profileYear.textContent.replace('Year ', '');
    });

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = editFullName.value;
        const course = editCourse.value;
        const year = editYear.value;

        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                fullName,
                course,
                year
            });
            profileFullName.textContent = fullName;
            profileCourse.textContent = course.replace('_', ' ').toUpperCase();
            profileYear.textContent = `Year ${year}`;
            editProfileForm.style.display = 'none';
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('An error occurred while updating your profile. Please try again.');
        }
    });

    async function loadUserProfile(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                profileFullName.textContent = userData.fullName || 'User';
                profileCourse.textContent = userData.course ? userData.course.replace('_', ' ').toUpperCase() : 'N/A';
                profileYear.textContent = userData.year ? `Year ${userData.year}` : 'N/A';
                if (userData.profileImageUrl) {
                    profileImage.src = userData.profileImageUrl;
                } else {
                    profileImage.src = 'public/images/default-profile.png';
                }
            } else {
                console.log('No such document!');
            }
        } catch (error) {
            console.error('Error getting user document:', error);
        }
    }
});
