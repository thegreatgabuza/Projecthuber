// project-upload.js

import { auth, db, storage } from './firebase-config.js';
import { ref, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

let dropArea = document.getElementById('drop-area');
let progressBar = document.getElementById('progress-bar');
let uploadButton = document.getElementById('upload-button');
let fileInput = document.getElementById('fileElem');
let projectForm = document.getElementById('project-details-form');
let gallery = document.getElementById('gallery');

let files = []; // Store selected files

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropArea.classList.add('highlight');
}

function unhighlight(e) {
    dropArea.classList.remove('highlight');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    let dt = e.dataTransfer;
    let newFiles = dt.files;
    handleFiles(newFiles);
}

fileInput.addEventListener('change', function() {
    handleFiles(this.files);
});

function handleFiles(newFiles) {
    files = [...files, ...newFiles];
    updateGallery();
}

function updateGallery() {
    gallery.innerHTML = '';
    files.forEach((file, index) => {
        let div = document.createElement('div');
        div.className = 'file-preview';
        
        if (file.type === 'application/pdf') {
            let embed = document.createElement('embed');
            embed.src = URL.createObjectURL(file);
            embed.type = 'application/pdf';
            embed.width = '100';
            embed.height = '100';
            div.appendChild(embed);
        } else if (file.type.startsWith('image/')) {
            let img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.height = 100;
            img.onload = function() {
                URL.revokeObjectURL(this.src);
            }
            div.appendChild(img);
        } else {
            let icon = document.createElement('i');
            icon.className = 'fas fa-file';
            icon.style.fontSize = '48px';
            div.appendChild(icon);
        }

        let fileName = document.createElement('p');
        fileName.textContent = file.name;
        div.appendChild(fileName);

        let deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteFile(index);
        div.appendChild(deleteBtn);

        gallery.appendChild(div);
    });
}

function deleteFile(index) {
    files.splice(index, 1);
    updateGallery();
}

projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (files.length === 0) {
        alert('Please select at least one file to upload.');
        return;
    }

    let projectName = document.getElementById('project-name').value;
    let projectDescription = document.getElementById('project-description').value;

    uploadButton.disabled = true;
    uploadButton.textContent = 'Uploading...';

    try {
        let fileUrls = await uploadFiles(files);
        await saveProjectToFirestore(projectName, projectDescription, fileUrls);
        alert('Project uploaded successfully!');
        window.location.href = 'dashboard.html'; // Redirect to dashboard or projects page
    } catch (error) {
        console.error('Error uploading project:', error);
        alert('An error occurred while uploading the project. Please try again.');
    } finally {
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload Project';
    }
});

async function uploadFiles(files) {
    let fileUrls = [];
    for (let file of files) {
        const storageRef = ref(storage, `projects/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressBar.value = progress;
                },
                (error) => {
                    console.error('Error uploading file:', error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    fileUrls.push({
                        name: file.name,
                        type: file.type,
                        url: downloadURL
                    });
                    resolve();
                }
            );
        });
    }
    return fileUrls;
}

async function saveProjectToFirestore(name, description, fileUrls) {
    try {
        const docRef = await addDoc(collection(db, 'projects'), {
            name: name,
            description: description,
            files: fileUrls,
            userId: auth.currentUser.uid,
            createdAt: serverTimestamp()
        });
        console.log('Project saved with ID: ', docRef.id);
    } catch (error) {
        console.error('Error saving project to Firestore:', error);
        throw error;
    }
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await auth.signOut();
        window.location.href = 'index.html'; // Redirect to login page
    } catch (error) {
        console.error('Error signing out:', error);
    }
});
