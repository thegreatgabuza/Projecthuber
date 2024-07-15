import { auth, db, storage } from './firebase-config.js';
import { collection, query, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { ref, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js';

const projectsContainer = document.getElementById('projects-container');
const viewProjectModal = document.getElementById('viewProjectModal');
const searchInput = document.getElementById('searchInput');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const sortSelect = document.getElementById('sortSelect');
let allProjects = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadAllProjects();
        } else {
            window.location.href = 'index.html';
        }
    });
});

const loadAllProjects = async () => {
    try {
        const projectsQuery = query(collection(db, 'projects'));
        const querySnapshot = await getDocs(projectsQuery);

        allProjects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sortedProjects = sortProjects(allProjects, 'date'); // Sort by date by default
        displayProjects(sortedProjects);
    } catch (error) {
        handleError(error, 'An error occurred while loading projects. Please try again later.');
    }
};

const displayProjects = (projects) => {
    let projectsHTML = '';
    projects.forEach((project) => {
        const averageRating = calculateAverageRating(project.ratings || []);
        projectsHTML += `
            <div class="project-card" data-id="${project.id}">
                <h3>${project.name}</h3>
                <p>${project.description.substring(0, 100)}${project.description.length > 100 ? '...' : ''}</p>
                <p>Uploaded by: ${project.userName || 'Anonymous'}</p>
                <p>Upload Date: ${formatDate(project.createdAt)}</p>
                <p>Average Rating: ${averageRating.toFixed(1)} / 5</p>
                <div class="project-actions">
                    <button class="view-btn" onclick="viewProject('${project.id}')">View</button>
                    <button class="download-btn" onclick="downloadProject('${project.id}')">Download</button>
                </div>
            </div>
        `;
    });

    projectsContainer.innerHTML = projectsHTML;
};

window.downloadProject = async (projectId) => {
    try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
            const project = projectDoc.data();
            await downloadAllFiles(project.files);
            await incrementUserDownloadCount();
        }
    } catch (error) {
        handleError(error, 'An error occurred while downloading the project. Please try again.');
    }
};

async function incrementUserDownloadCount() {
    try {
        const user = auth.currentUser;
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                downloadCount: arrayUnion(1)
            });
            console.log('User download count incremented successfully');
        }
    } catch (error) {
        console.error('Error incrementing user download count:', error);
    }
}

async function getUserDownloadCount() {
    try {
        const user = auth.currentUser;
        if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                return userData.downloadCount || 0;
            }
        }
        return 0;
    } catch (error) {
        console.error('Error retrieving user download count:', error);
        return 0;
    }
}



const downloadAllFiles = async (files) => {
    for (const file of files) {
        await downloadSingleFile(file);
    }
};

window.downloadSingleFile = async (file) => {
    try {
        console.log('Attempting to download file:', file);

        let url;
        if (file.url) {
            url = file.url;
        } else if (file.path) {
            url = await getDownloadURL(ref(storage, file.path)).catch(error => {
                throw new Error(`Failed to get download URL: ${error.message}`);
            });
        } else {
            throw new Error('File does not have a valid URL or path');
        }

        console.log('Download URL:', url);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        
        console.log('File downloaded successfully');
    } catch (error) {
        console.error('Detailed error:', error);
        handleError(error, `Failed to download ${file.name}. Error: ${error.message}`);
    }
};

window.viewProject = async (projectId) => {
    try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
            const project = projectDoc.data();
            document.getElementById('viewProjectName').textContent = project.name;
            document.getElementById('viewProjectDescription').textContent = project.description;
            document.getElementById('viewProjectUploader').textContent = `Uploaded by: ${project.userName || 'Anonymous'}`;
            document.getElementById('viewProjectDate').textContent = `Upload Date: ${formatDate(project.createdAt)}`;
            
            let filesHTML = '<h3>Project Files:</h3>';
            project.files.forEach((file) => {
                filesHTML += `
                    <div class="file-item">
                        <i class="fas ${getFileIcon(file.type)}"></i>
                        <span>${file.name}</span>
                        <button class="download-btn" onclick='downloadSingleFile(${JSON.stringify(file)})'>Download</button>
                    </div>
                `;
            });
            document.getElementById('viewProjectFiles').innerHTML = filesHTML;
            
            updateRatingDisplay(project);
            viewProjectModal.setAttribute('data-project-id', projectId);
            viewProjectModal.style.display = 'block';
            
            // Set up star rating functionality
            const stars = document.querySelectorAll('.star');
            stars.forEach(star => {
                star.onclick = function() {
                    rateProject(projectId, parseInt(this.getAttribute('data-rating')));
                }
            });
        }
    } catch (error) {
        handleError(error, 'An error occurred while viewing the project. Please try again.');
    }
};

function updateRatingDisplay(project) {
    const stars = document.querySelectorAll('.star');
    const averageRating = calculateAverageRating(project.ratings || []);
    
    stars.forEach((star, index) => {
        if (index < averageRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });

    document.querySelector('#averageRating span').textContent = averageRating.toFixed(1);
}

function calculateAverageRating(ratings) {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((a, b) => a + b, 0);
    return sum / ratings.length;
}

async function rateProject(projectId, rating) {
    try {
        await updateProjectRating(projectId, rating);
        const updatedProjectDoc = await getDoc(doc(db, 'projects', projectId));
        const updatedProject = updatedProjectDoc.data();
        updateRatingDisplay(updatedProject);
    } catch (error) {
        handleError(error, 'An error occurred while rating the project. Please try again.');
    }
}

async function updateProjectRating(projectId, newRating) {
    try {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            ratings: arrayUnion(newRating)
        });
        console.log('Project rating updated successfully');
    } catch (error) {
        throw error;
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

function formatDate(timestamp) {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function sortProjects(projects, sortBy) {
    switch (sortBy) {
        case 'name':
            return projects.sort((a, b) => a.name.localeCompare(b.name));
        case 'date':
            return projects.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
        case 'rating':
            return projects.sort((a, b) => calculateAverageRating(b.ratings || []) - calculateAverageRating(a.ratings || []));
        default:
            return projects;
    }
}

function handleError(error, message) {
    console.error(error);
    alert(message);
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProjects = allProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm) || 
        project.description.toLowerCase().includes(searchTerm)
    );
    displayProjects(filteredProjects);
});

downloadAllBtn.addEventListener('click', () => {
    const projectId = viewProjectModal.getAttribute('data-project-id');
    downloadProject(projectId);
});

document.querySelector('.close').onclick = function() {
    viewProjectModal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == viewProjectModal) {
        viewProjectModal.style.display = 'none';
    }
}

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        handleError(error, 'An error occurred while signing out. Please try again.');
    }
});

sortSelect.addEventListener('change', (e) => {
    const sortedProjects = sortProjects(allProjects, e.target.value);
    displayProjects(sortedProjects);
});

