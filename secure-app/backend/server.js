// ✅ SECURE CODE - Best Practices Implementation

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const validator = require('validator');
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');

const app = express();
const PORT = 3001;

// SECURITY: Use Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// SECURITY: Configure CORS properly
const corsOptions = {
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    optionsSuccessStatus: 200,
    credentials: true
};
app.use(cors(corsOptions));

// SECURITY: Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later.'
});

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Initialize DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

// Create tables with proper schema
db.serialize(() => {
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        bio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE repositories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        name TEXT,
        imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Insert sample users with hashed passwords
    const users = [
        { username: 'admin', password: 'admin123', email: 'admin@secure.local', role: 'admin' },
        { username: 'user', password: 'password', email: 'user@secure.local', role: 'user' },
        { username: 'testuser', password: 'test123', email: 'test@secure.local', role: 'user' }
    ];

    users.forEach(async (user) => {
        const hash = await bcrypt.hash(user.password, 10);
        db.run(
            `INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)`,
            [user.username, hash, user.email, user.role]
        );
    });
});

// SECURITY: Input validation middleware
function validateInput(schema) {
    return (req, res, next) => {
        const errors = [];

        for (const [field, rules] of Object.entries(schema)) {
            const value = req.body[field] || req.query[field] || req.params[field];

            if (rules.required && !value) {
                errors.push(`${field} is required`);
                continue;
            }

            if (value) {
                if (rules.type === 'email' && !validator.isEmail(value)) {
                    errors.push(`${field} must be a valid email`);
                }
                if (rules.type === 'url' && !validator.isURL(value, { protocols: ['http', 'https'] })) {
                    errors.push(`${field} must be a valid URL`);
                }
                if (rules.maxLength && value.length > rules.maxLength) {
                    errors.push(`${field} must be less than ${rules.maxLength} characters`);
                }
                if (rules.minLength && value.length < rules.minLength) {
                    errors.push(`${field} must be at least ${rules.minLength} characters`);
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }

        next();
    };
}

// SECURITY: Parameterized query wrapper
function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Database error:', err.message);
                reject(new Error('Database error occurred'));
            } else {
                resolve(rows);
            }
        });
    });
}

function runSingleQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                console.error('Database error:', err.message);
                reject(new Error('Database error occurred'));
            } else {
                resolve(row);
            }
        });
    });
}

function runUpdate(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) {
                console.error('Database error:', err.message);
                reject(new Error('Database error occurred'));
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
}

// SECURED: Login with parameterized queries and password hashing
app.post('/api/login',
    authLimiter,
    validateInput({
        username: { required: true, maxLength: 50 },
        password: { required: true, maxLength: 100 }
    }),
    async (req, res) => {
        try {
            const { username, password } = req.body;

            // Use parameterized query to prevent SQL injection
            const user = await runSingleQuery(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Compare hashed password
            const validPassword = await bcrypt.compare(password, user.password_hash);

            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Don't send password hash to client
            delete user.password_hash;

            res.json({
                success: true,
                user: user,
                token: Buffer.from(`${username}:${Date.now()}`).toString('base64')
            });
        } catch (error) {
            // SECURITY: Don't expose internal errors
            res.status(500).json({ error: 'An error occurred during login' });
        }
    }
);

// SECURED: SSRF protection with URL whitelist
app.post('/api/import-github',
    validateInput({
        url: { required: true, type: 'url' },
        userId: { required: true }
    }),
    async (req, res) => {
        try {
            const { url, userId } = req.body;

            // SECURITY: Whitelist allowed domains
            const allowedDomains = ['api.github.com', 'github.com'];
            const urlObj = new URL(url);

            if (!allowedDomains.includes(urlObj.hostname)) {
                return res.status(400).json({
                    error: 'Invalid URL. Only GitHub URLs are allowed.'
                });
            }

            // SECURITY: Prevent access to private IP ranges
            const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|169\.254\.)/;
            if (privateIPRegex.test(urlObj.hostname)) {
                return res.status(400).json({ error: 'Access to private IPs is forbidden' });
            }

            // SECURITY: Use timeout and limit response size
            const response = await axios.get(url, {
                timeout: 5000,
                maxRedirects: 0,
                maxContentLength: 1024 * 1024, // 1MB limit
                validateStatus: (status) => status === 200
            });

            // Store repository info with parameterized query
            await runUpdate(
                'INSERT INTO repositories (user_id, url, name) VALUES (?, ?, ?)',
                [userId, url, 'imported-repo']
            );

            res.json({
                success: true,
                message: 'Repository imported successfully',
                name: response.data.name || 'Unknown'
            });
        } catch (error) {
            // SECURITY: Don't expose detailed error information
            res.status(500).json({ error: 'Failed to import repository' });
        }
    }
);

// SECURED: Password reset with expiring tokens
app.post('/api/request-reset',
    authLimiter,
    validateInput({
        email: { required: true, type: 'email' }
    }),
    async (req, res) => {
        try {
            const { email } = req.body;

            // Use parameterized query
            const user = await runSingleQuery(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (!user) {
                // SECURITY: Don't reveal if email exists
                return res.json({
                    success: true,
                    message: 'If the email exists, a reset link has been sent.'
                });
            }

            // Generate secure token
            const token = uuidv4();
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

            await runUpdate(
                'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user.id, token, expiresAt.toISOString()]
            );

            // In production, send email here instead of returning token
            res.json({
                success: true,
                message: 'If the email exists, a reset link has been sent.',
                // Only for demo purposes:
                token: token,
                expiresAt: expiresAt
            });
        } catch (error) {
            res.status(500).json({ error: 'An error occurred' });
        }
    }
);

// SECURED: Password reset with token validation and expiry
app.post('/api/reset-password',
    authLimiter,
    validateInput({
        token: { required: true },
        newPassword: { required: true, minLength: 8, maxLength: 100 }
    }),
    async (req, res) => {
        try {
            const { token, newPassword } = req.body;

            // Use parameterized query
            const reset = await runSingleQuery(
                'SELECT * FROM password_resets WHERE token = ? AND used = 0',
                [token]
            );

            if (!reset) {
                return res.status(400).json({ error: 'Invalid or already used token' });
            }

            // SECURITY: Check if token has expired
            const now = new Date();
            const expiresAt = new Date(reset.expires_at);

            if (now > expiresAt) {
                return res.status(400).json({ error: 'Token has expired' });
            }

            // Hash the new password
            const passwordHash = await bcrypt.hash(newPassword, 10);

            // Update password
            await runUpdate(
                'UPDATE users SET password_hash = ? WHERE id = ?',
                [passwordHash, reset.user_id]
            );

            // SECURITY: Mark token as used
            await runUpdate(
                'UPDATE password_resets SET used = 1 WHERE token = ?',
                [token]
            );

            res.json({
                success: true,
                message: 'Password has been reset successfully'
            });
        } catch (error) {
            res.status(500).json({ error: 'An error occurred' });
        }
    }
);

// SECURED: User search with parameterized query
app.get('/api/users/search',
    validateInput({
        q: { required: true, maxLength: 50 }
    }),
    async (req, res) => {
        try {
            const { q } = req.query;

            // Use parameterized query with LIKE
            const users = await runQuery(
                'SELECT id, username, email, role FROM users WHERE username LIKE ? OR email LIKE ?',
                [`%${q}%`, `%${q}%`]
            );

            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Search failed' });
        }
    }
);

// SECURED: Update bio with XSS protection
app.post('/api/users/:id/bio',
    validateInput({
        bio: { required: true, maxLength: 500 }
    }),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { bio } = req.body;

            // SECURITY: Sanitize HTML to prevent XSS
            const sanitizedBio = purify.sanitize(bio, {
                ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
                ALLOWED_ATTR: []
            });

            await runUpdate(
                'UPDATE users SET bio = ? WHERE id = ?',
                [sanitizedBio, id]
            );

            res.json({
                success: true,
                bio: sanitizedBio
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update bio' });
        }
    }
);

// SECURED: Get user profile
app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID is numeric
        if (!/^\d+$/.test(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const user = await runSingleQuery(
            'SELECT id, username, email, role, bio FROM users WHERE id = ?',
            [id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// SECURED: File access is completely removed for security
// In production, use signed URLs or proper authorization
app.get('/api/files', (req, res) => {
    res.status(403).json({
        error: 'Direct file access is disabled for security reasons'
    });
});

// Health check - minimal information
app.get('/api/health', (req, res) => {
    res.json({
        status: 'running',
        version: '1.0.0',
        secure: true
    });
});

// SECURITY: Generic error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
});

app.listen(PORT, () => {
    console.log(`
    ✅ SECURE SERVER RUNNING ✅
    Port: ${PORT}
    
    Security features enabled:
    ✓ Helmet security headers
    ✓ Rate limiting
    ✓ Parameterized queries
    ✓ Password hashing
    ✓ Input validation
    ✓ XSS protection
    ✓ SSRF protection
    ✓ Token expiration
    ✓ CORS configuration
    `);
});
