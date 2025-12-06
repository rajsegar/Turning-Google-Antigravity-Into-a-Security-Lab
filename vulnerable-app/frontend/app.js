// ⚠️ VULNERABLE CLIENT CODE - FOR EDUCATIONAL PURPOSES ONLY ⚠️

const API_BASE = 'http://localhost:3000/api';

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Login function - SQL Injection vulnerable
async function login(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        // Display full response including errors
        document.getElementById('login-result').innerHTML = `
            <strong>Response:</strong>
            ${JSON.stringify(data, null, 2)}
        `;

        if (data.success) {
            document.getElementById('login-result').style.borderColor = 'var(--success)';
            // Store token (insecurely in localStorage)
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        } else {
            document.getElementById('login-result').style.borderColor = 'var(--danger)';
        }
    } catch (error) {
        document.getElementById('login-result').innerHTML = `
            <strong>Error:</strong>
            ${error.message}
        `;
        document.getElementById('login-result').style.borderColor = 'var(--danger)';
    }
}

// Import repository - SSRF vulnerable
async function importRepo(event) {
    event.preventDefault();

    const url = document.getElementById('repo-url').value;
    const userId = document.getElementById('user-id').value;

    try {
        const response = await fetch(`${API_BASE}/import-github`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, userId })
        });

        const data = await response.json();

        document.getElementById('import-result').innerHTML = `
            <strong>SSRF Response:</strong>
            ${JSON.stringify(data, null, 2)}
        `;

        if (data.success) {
            document.getElementById('import-result').style.borderColor = 'var(--success)';
        } else {
            document.getElementById('import-result').style.borderColor = 'var(--danger)';
        }
    } catch (error) {
        document.getElementById('import-result').innerHTML = `
            <strong>Error:</strong>
            ${error.message}
        `;
        document.getElementById('import-result').style.borderColor = 'var(--danger)';
    }
}

// Request password reset
async function requestReset(event) {
    event.preventDefault();

    const email = document.getElementById('reset-email').value;

    try {
        const response = await fetch(`${API_BASE}/request-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        document.getElementById('reset-request-result').innerHTML = `
            <strong>Reset Token Generated:</strong>
            ${JSON.stringify(data, null, 2)}
            
            ${data.success ? `\n<strong>⚠️ Token will NEVER expire!</strong>` : ''}
        `;

        if (data.success) {
            document.getElementById('reset-request-result').style.borderColor = 'var(--success)';
            // Auto-fill the token
            document.getElementById('reset-token').value = data.token;
        }
    } catch (error) {
        document.getElementById('reset-request-result').innerHTML = `
            <strong>Error:</strong>
            ${error.message}
        `;
    }
}

// Reset password
async function resetPassword(event) {
    event.preventDefault();

    const token = document.getElementById('reset-token').value;
    const newPassword = document.getElementById('new-password').value;

    try {
        const response = await fetch(`${API_BASE}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();

        document.getElementById('reset-result').innerHTML = `
            <strong>Password Reset Result:</strong>
            ${JSON.stringify(data, null, 2)}
            
            ${data.success ? `\n<strong>⚠️ Token is still valid and can be reused!</strong>` : ''}
        `;

        if (data.success) {
            document.getElementById('reset-result').style.borderColor = 'var(--success)';
        }
    } catch (error) {
        document.getElementById('reset-result').innerHTML = `
            <strong>Error:</strong>
            ${error.message}
        `;
    }
}

// Search users - SQL Injection vulnerable
async function searchUsers(event) {
    event.preventDefault();

    const query = document.getElementById('search-query').value;

    try {
        const response = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (Array.isArray(data)) {
            document.getElementById('search-result').innerHTML = `
                <strong>Search Results (${data.length} users):</strong>
                ${JSON.stringify(data, null, 2)}
            `;
            document.getElementById('search-result').style.borderColor = 'var(--success)';
        } else {
            document.getElementById('search-result').innerHTML = `
                <strong>Error Response:</strong>
                ${JSON.stringify(data, null, 2)}
            `;
            document.getElementById('search-result').style.borderColor = 'var(--danger)';
        }
    } catch (error) {
        document.getElementById('search-result').innerHTML = `
            <strong>Error:</strong>
            ${error.message}
        `;
    }
}

// Update bio - XSS vulnerable
async function updateBio(event) {
    event.preventDefault();

    const userId = document.getElementById('profile-user-id').value;
    const bio = document.getElementById('profile-bio').value;

    try {
        const response = await fetch(`${API_BASE}/users/${userId}/bio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bio })
        });

        const data = await response.json();

        alert('Bio updated! Now view the profile to see XSS in action.');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// View profile - Renders XSS
async function viewProfile(event) {
    event.preventDefault();

    const userId = document.getElementById('view-user-id').value;

    try {
        const response = await fetch(`${API_BASE}/users/${userId}`);
        const user = await response.json();

        // VULNERABLE: Directly rendering user bio without sanitization
        document.getElementById('profile-result').innerHTML = `
            <strong>User Profile:</strong><br>
            <strong>ID:</strong> ${user.id}<br>
            <strong>Username:</strong> ${user.username}<br>
            <strong>Email:</strong> ${user.email}<br>
            <strong>Role:</strong> ${user.role}<br>
            <strong>Bio:</strong><br>
            <div style="padding: 10px; background: var(--bg-primary); margin-top: 10px; border-radius: 4px;">
                ${user.bio}
            </div>
        `;
        document.getElementById('profile-result').style.borderColor = 'var(--success)';
    } catch (error) {
        document.getElementById('profile-result').innerHTML = `
            <strong>Error:</strong>
            ${error.message}
        `;
    }
}

// Browse files - Path traversal vulnerable
async function browseFiles(event) {
    event.preventDefault();

    const filePath = document.getElementById('file-path').value;

    try {
        const response = await fetch(`${API_BASE}/files?path=${encodeURIComponent(filePath)}`);
        const data = await response.json();

        if (data.type === 'directory') {
            document.getElementById('files-result').innerHTML = `
                <strong>Directory Listing:</strong>
                <strong>Path:</strong> ${data.path}
                
                <strong>Files:</strong>
                ${data.files.map(f => `• ${f}`).join('\n')}
            `;
            document.getElementById('files-result').style.borderColor = 'var(--success)';
        } else if (data.type === 'file') {
            document.getElementById('files-result').innerHTML = `
                <strong>File Contents:</strong>
                <strong>Path:</strong> ${data.path}
                
                ${data.content}
            `;
            document.getElementById('files-result').style.borderColor = 'var(--success)';
        } else {
            document.getElementById('files-result').innerHTML = `
                <strong>Error:</strong>
                ${JSON.stringify(data, null, 2)}
            `;
            document.getElementById('files-result').style.borderColor = 'var(--danger)';
        }
    } catch (error) {
        document.getElementById('files-result').innerHTML = `
            <strong>Error:</strong>
            ${error.message}
        `;
    }
}

// Check security headers on page load
window.addEventListener('load', async () => {
    console.log('%c⚠️ VULNERABLE APPLICATION LOADED ⚠️', 'color: red; font-size: 20px; font-weight: bold;');
    console.log('%cThis application contains intentional security vulnerabilities.', 'color: orange; font-size: 14px;');
    console.log('%cFor educational purposes only!', 'color: orange; font-size: 14px;');

    // Check if backend is running
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        console.log('Backend health check:', data);
    } catch (error) {
        console.error('Backend not running! Start with: cd vulnerable-app/backend && npm install && npm run dev');
    }
});
