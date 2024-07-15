// public/js/dashboard.js

import { auth, db } from './firebase-config.js';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

const userNameElement = document.getElementById('userName');
const userCourseElement = document.getElementById('userCourse');
const userYearElement = document.getElementById('userYear');
const editUserInfoBtn = document.getElementById('editUserInfoBtn');
const courseYearForm = document.getElementById('courseYearForm');
const courseYearSelectForm = document.getElementById('courseYearSelectForm');
const myProjectsCountElement = document.getElementById('myProjectsCount');
const downloadedProjectsCountElement = document.getElementById('downloadedProjectsCount');
const averageRatingElement = document.getElementById('averageRating');
const recentActivityList = document.getElementById('recentActivityList');

let currentUser;

auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData();
        await loadUserStats();
        await loadRecentActivity();
        await loadRecentProjects();
        await loadProjectAnalytics();
    } else {
        window.location.href = 'index.html';
    }
});

async function loadUserData() {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
        const userData = userDoc.data();
        const fullName = userData.fullName || 'User';
        userNameElement.textContent = fullName;
        document.querySelector('h2').textContent = `Welcome, ${fullName}!`;
        userCourseElement.textContent = userData.course || 'Not set';
        userYearElement.textContent = userData.year || 'Not set';

        if (!userData.course || !userData.year) {
            courseYearForm.style.display = 'block';
        }
    }
}

async function loadUserStats() {
    const projectsQuery = query(collection(db, 'projects'), where('userId', '==', currentUser.uid));
    const projectsSnapshot = await getDocs(projectsQuery);
    myProjectsCountElement.textContent = projectsSnapshot.size;

    let totalDownloads = 0;
    let totalRating = 0;
    let ratedProjects = 0;
    projectsSnapshot.forEach(doc => {
        const projectData = doc.data();
        totalDownloads += projectData.downloads || 0;
        if (projectData.ratings && projectData.ratings.length > 0) {
            totalRating += projectData.ratings.reduce((a, b) => a + b, 0) / projectData.ratings.length;
            ratedProjects++;
        }
    });
    downloadedProjectsCountElement.textContent = totalDownloads;
    const avgRating = ratedProjects > 0 ? (totalRating / ratedProjects).toFixed(1) : 'N/A';
    averageRatingElement.textContent = avgRating;
}

async function loadRecentActivity() {
    // This is a placeholder. You need to implement activity tracking in your app
    const activities = [
        'Uploaded a new project',
        'Downloaded a project',
        'Rated a project'
    ];
    recentActivityList.innerHTML = activities.map(activity => `<li>${activity}</li>`).join('');
}

// Edit button click event to redirect to profile.html
editUserInfoBtn.addEventListener('click', () => {
    window.location.href = 'profile.html'; // Redirect to profile page
});

courseYearSelectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const course = document.getElementById('courseSelect').value;
    const year = document.getElementById('yearSelect').value;

    await updateDoc(doc(db, 'users', currentUser.uid), {
        course: course,
        year: year
    });

    courseYearForm.style.display = 'none';
    userCourseElement.textContent = course;
    userYearElement.textContent = year;
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function loadRecentProjects() {
    const projectsQuery = query(
        collection(db, 'projects'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
    );

    const projectsSnapshot = await getDocs(projectsQuery);
    const recentProjects = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    const recentProjectsList = document.createElement('ul');
    recentProjects.forEach(project => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${project.name}</strong>
            <span>Uploaded on ${formatDate(project.createdAt.toDate())}</span>
        `;
        recentProjectsList.appendChild(li);
    });

    const recentProjectsSection = document.createElement('div');
    recentProjectsSection.className = 'recent-projects';
    recentProjectsSection.innerHTML = '<h3>Recent Projects</h3>';
    recentProjectsSection.appendChild(recentProjectsList);

    document.querySelector('main').appendChild(recentProjectsSection);
}

async function loadProjectAnalytics() {
    const projectsQuery = query(collection(db, 'projects'), where('userId', '==', currentUser.uid));
    const projectsSnapshot = await getDocs(projectsQuery);

    let totalDownloads = 0;
    let totalRatings = 0;
    let ratedProjects = 0;
    let projectNames = [];
    let projectDownloads = [];
    let projectRatings = [];

    projectsSnapshot.forEach(doc => {
        const projectData = doc.data();
        totalDownloads += projectData.downloads || 0;
        projectNames.push(projectData.name);
        projectDownloads.push(projectData.downloads || 0);

        if (projectData.ratings && projectData.ratings.length > 0) {
            const avgRating = projectData.ratings.reduce((a, b) => a + b, 0) / projectData.ratings.length;
            totalRatings += avgRating;
            ratedProjects++;
            projectRatings.push(avgRating);
        } else {
            projectRatings.push(0);
        }
    });

    const overallAverageRating = ratedProjects > 0 ? (totalRatings / ratedProjects).toFixed(1) : 'N/A';

    // Update the existing elements
    document.getElementById('totalDownloads').textContent = totalDownloads;
    document.getElementById('overallAverageRating').textContent = overallAverageRating;

    // Add canvas for the chart
    const analyticsDiv = document.getElementById('projectAnalytics');
    const canvas = document.createElement('canvas');
    canvas.id = 'projectAnalyticsChart';
    analyticsDiv.appendChild(canvas);

    // Create the chart
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: projectNames,
            datasets: [
                {
                    label: 'Downloads',
                    data: projectDownloads,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Average Rating',
                    data: projectRatings,
                    backgroundColor: 'rgba(255, 206, 86, 0.5)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Downloads'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Average Rating'
                    },
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Project Analytics'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

async function updateUserProfile(fullName, email) {
    try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
            fullName: fullName,
            email: email
        });

        userNameElement.textContent = fullName;
        document.querySelector('h2').textContent = `Welcome, ${fullName}!`;
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
    }
}

const profileUpdateForm = document.getElementById('profileUpdateForm');
if (profileUpdateForm) {
    profileUpdateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullNameInput').value;
        const email = document.getElementById('emailInput').value;
        await updateUserProfile(fullName, email);
    });
}

export { updateUserProfile };

