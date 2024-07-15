// public/js/my-projects.js

import { auth, db } from './firebase-config.js';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

const projectsContainer = document.getElementById('projects-container');
const editProjectModal = document.getElementById('editProjectModal');
const viewProjectModal = document.getElementById('viewProjectModal');
const editProjectForm = document.getElementById('editProjectForm');
let currentProjectId = null;

auth.onAuthStateChanged(async (user) => {
    if (user) {
        await loadUserProjects(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

// In your my-projects.js file, update the loadUserProjects function

async function loadUserProjects(userId) {
    try {
        const projectsQuery = query(collection(db, 'projects'), where('userId', '==', userId));
        const querySnapshot = await getDocs(projectsQuery);

        if (querySnapshot.empty) {
            projectsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>You haven't uploaded any projects yet.</p>
                    <a href="project-upload.html" class="btn-new-project">Upload Your First Project</a>
                </div>
            `;
            return;
        }

        let projectsHTML = '';
        querySnapshot.forEach((doc) => {
            const project = doc.data();
            projectsHTML += `
                <div class="project-card" data-id="${doc.id}">
                    <h3>${project.name}</h3>
                    <p>${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>
                    <div class="project-actions">
                        <button class="view-btn" onclick="viewProject('${doc.id}')">View</button>
                        <button class="edit-btn" onclick="editProject('${doc.id}')">Edit</button>
                        <button class="delete-btn" onclick="deleteProject('${doc.id}')">Delete</button>
                    </div>
                </div>
            `;
        });

        projectsContainer.innerHTML = projectsHTML;
    } catch (error) {
        console.error('Error loading projects:', error);
        projectsContainer.innerHTML = '<p>An error occurred while loading your projects. Please try again later.</p>';
    }
}


window.viewProject = async (projectId) => {
    try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
            const project = projectDoc.data();
            document.getElementById('viewProjectName').textContent = project.name;
            document.getElementById('viewProjectDescription').textContent = project.description;
            
            let filesHTML = '<h3>Project Files:</h3>';
            project.files.forEach(file => {
                filesHTML += `
                    <div class="file-item">
                        <i class="fas ${getFileIcon(file.type)}"></i>
                        <a href="${file.url}" target="_blank">${file.name}</a>
                    </div>
                `;
            });
            document.getElementById('viewProjectFiles').innerHTML = filesHTML;
            
            viewProjectModal.style.display = 'block';
        } else {
            throw new Error('Project not found');
        }
    } catch (error) {
        console.error('Error viewing project:', error);
        alert('An error occurred while viewing the project. Please try again.');
    }
};

window.editProject = async (projectId) => {
    currentProjectId = projectId;
    try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
            const project = projectDoc.data();
            document.getElementById('editProjectName').value = project.name;
            document.getElementById('editProjectDescription').value = project.description;
            editProjectModal.style.display = 'block';
        } else {
            throw new Error('Project not found');
        }
    } catch (error) {
        console.error('Error editing project:', error);
        alert('An error occurred while editing the project. Please try again.');
    }
};

window.deleteProject = async (projectId) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        try {
            await deleteDoc(doc(db, 'projects', projectId));
            alert('Project deleted successfully.');
            await loadUserProjects(auth.currentUser.uid);
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('An error occurred while deleting the project. Please try again.');
        }
    }
};

editProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = document.getElementById('editProjectName').value;
    const newDescription = document.getElementById('editProjectDescription').value;

    try {
        await updateDoc(doc(db, 'projects', currentProjectId), {
            name: newName,
            description: newDescription
        });
        alert('Project updated successfully.');
        editProjectModal.style.display = 'none';
        await loadUserProjects(auth.currentUser.uid);
    } catch (error) {
        console.error('Error updating project:', error);
        alert('An error occurred while updating the project. Please try again.');
    }
});

// Close modal when clicking on the close button or outside the modal
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.onclick = function() {
        editProjectModal.style.display = 'none';
        viewProjectModal.style.display = 'none';
    }
});

window.onclick = function(event) {
    if (event.target == editProjectModal) {
        editProjectModal.style.display = 'none';
    }
    if (event.target == viewProjectModal) {
        viewProjectModal.style.display = 'none';
    }
}

function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) {
        return 'fa-file-image';
    } else if (fileType === 'application/pdf') {
        return 'fa-file-pdf';
    } else {
        return 'fa-file';
    }
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
});
