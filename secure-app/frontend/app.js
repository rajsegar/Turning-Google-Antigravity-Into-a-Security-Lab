// ✅ SECURE CLIENT CODE - Best Practices

const API_BASE = 'http://localhost:3001/api';

// Tab switching
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Helper function to escape HTML
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Secure login function
async function login(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',  // Include cookies
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Store token securely (in production, use HTTPOnly cookies)
            sessionStorage.setItem('token', data.token);

            document.getElementById('login-result').textContent =
                `✅ Login successful!\nWelcome, ${escapeHTML(data.user.username)}`;
            document.getElementById('login-result').style.borderColor = 'var(--success)';
        } else {
            document.getElementById('login-result').textContent =
                `❌ ${data.error || 'Login failed'}`;
            document.getElementById('login-result').style.borderColor = 'var(--danger)';
        }
    } catch (error) {
        document.getElementById('login-result').textContent =
            '❌ An error occurred during login';
        document.getElementById('login-result').style.borderColor = 'var(--danger)';
    }
}

// Secure import repository
async function importRepo(event) {
    event.preventDefault();

    const url = document.getElementById('repo-url').value;
    const userId = document.getElementById('user-id').value;

    // Client-side validation
    try {
        const urlObj = new URL(url);
        if (!['api.github.com', 'github.com'].includes(urlObj.hostname)) {
            throw new Error('Only GitHub URLs are allowed');
        }
    } catch (error) {
        document.getElementById('import-result').textContent =
            `❌ Invalid URL: ${error.message}`;
        document.getElementById('import-result').style.borderColor = 'var(--danger)';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/import-github`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, userId })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            document.getElementById('import-result').textContent =
                `✅ ${data.message}\nRepository: ${escapeHTML(data.name || 'Unknown')}`;
            document.getElementById('import-result').style.borderColor = 'var(--success)';
        } else {
            document.getElementById('import-result').textContent =
                `❌ ${data.error || 'Import failed'}`;
            document.getElementById('import-result').style.borderColor = 'var(--danger)';
        }
    } catch (error) {
        document.getElementById('import-result').textContent =
            '❌ An error occurred during import';
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

        if (response.ok && data.success) {
            document.getElementById('reset-request-result').textContent =
                `✅ ${data.message}\n\n` +
                `🔑 Token (for demo): ${data.token}\n` +
                `⏰ Expires: ${new Date(data.expiresAt).toLocaleString()}\n\n` +
                `🔒 This token expires in 1 hour and can only be used once.`;
            document.getElementById('reset-request-result').style.borderColor = 'var(--success)';

            // Auto-fill token
            document.getElementById('reset-token').value = data.token;
        } else {
            document.getElementById('reset-request-result').textContent =
                `❌ ${data.error || 'Request failed'}`;
            document.getElementById('reset-request-result').style.borderColor = 'var(--danger)';
        }
    } catch (error) {
        document.getElementById('reset-request-result').textContent =
            '❌ An error occurred';
        document.getElementById('reset-request-result').style.borderColor = 'var(--danger)';
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

        if (response.ok && data.success) {
            document.getElementById('reset-result').textContent =
                `✅ ${data.message}\n\n🔒 The token has been invalidated and cannot be reused.`;
            document.getElementById('reset-result').style.borderColor = 'var(--success)';
        } else {
            document.getElementById('reset-result').textContent =
                `❌ ${data.error || 'Reset failed'}`;
            document.getElementById('reset-result').style.borderColor = 'var(--danger)';
        }
    } catch (error) {
        document.getElementById('reset-result').textContent =
            '❌ An error occurred';
        document.getElementById('reset-result').style.borderColor = 'var(--danger)';
    }
}

// Search users
async function searchUsers(event) {
    event.preventDefault();

    const query = document.getElementById('search-query').value;

    try {
        const response = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
            let resultText = `✅ Found ${data.length} user(s):\n\n`;
            data.forEach(user => {
                // Note: No password field is returned from secure API
                resultText += `ID: ${user.id}\n`;
                resultText += `Username: ${escapeHTML(user.username)}\n`;
                resultText += `Email: ${escapeHTML(user.email)}\n`;
                resultText += `Role: ${escapeHTML(user.role)}\n`;
                resultText += '---\n';
            });

            document.getElementById('search-result').textContent = resultText;
            document.getElementById('search-result').style.borderColor = 'var(--success)';
        } else {
            document.getElementById('search-result').textContent =
                `❌ ${data.error || 'Search failed'}`;
            document.getElementById('search-result').style.borderColor = 'var(--danger)';
        }
    } catch (error) {
        document.getElementById('search-result').textContent =
            '❌ An error occurred during search';
        document.getElementById('search-result').style.borderColor = 'var(--danger)';
    }
}

// Update bio with client-side validation
async function updateBio(event) {
    event.preventDefault();

    const userId = document.getElementById('profile-user-id').value;
    const bio = document.getElementById('profile-bio').value;

    if (bio.length > 500) {
        alert('Bio must be less than 500 characters');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/users/${userId}/bio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bio })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('✅ Bio updated successfully! Malicious content has been sanitized.');
        } else {
            alert(`❌ ${data.error || 'Update failed'}`);
        }
    } catch (error) {
        alert('❌ An error occurred');
    }
}

// View profile - Secure rendering
async function viewProfile(event) {
    event.preventDefault();

    const userId = document.getElementById('view-user-id').value;

    try {
        const response = await fetch(`${API_BASE}/users/${userId}`);
        const user = await response.json();

        if (response.ok && user.id) {
            // SECURE: Use textContent to prevent XSS
            const resultDiv = document.getElementById('profile-result');
            resultDiv.textContent = '';  // Clear previous content

            const content = document.createElement('div');
            content.style.fontFamily = 'monospace';

            const fields = [
                { label: 'ID', value: user.id },
                { label: 'Username', value: user.username },
                { label: 'Email', value: user.email },
                { label: 'Role', value: user.role },
                { label: 'Bio', value: user.bio || 'No bio' }
            ];

            fields.forEach(field => {
                const line = document.createElement('div');
                line.textContent = `${field.label}: ${field.value}`;
                line.style.marginBottom = '8px';
                content.appendChild(line);
            });

            resultDiv.appendChild(content);
            resultDiv.style.borderColor = 'var(--success)';
        } else {
            document.getElementById('profile-result').textContent =
                `❌ ${user.error || 'User not found'}`;
            document.getElementById('profile-result').style.borderColor = 'var(--danger)';
        }
    } catch (error) {
        document.getElementById('profile-result').textContent =
            '❌ An error occurred';
        document.getElementById('profile-result').style.borderColor = 'var(--danger)';
    }
}

// Check backend on load
window.addEventListener('load', async () => {
    console.log('%c🔒 SECURE APPLICATION LOADED', 'color: green; font-size: 20px; font-weight: bold;');
    console.log('%cThis application implements security best practices.', 'color: green; font-size: 14px;');

    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        console.log('✅ Backend health check:', data);
    } catch (error) {
        console.error('❌ Backend not running! Start with: cd secure-app/backend && npm install && npm run dev');
    }
});
