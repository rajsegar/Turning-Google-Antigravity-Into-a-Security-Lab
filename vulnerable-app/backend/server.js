// ⚠️ VULNERABLE CODE - FOR EDUCATIONAL PURPOSES ONLY ⚠️
// This server intentionally contains multiple security vulnerabilities

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// VULNERABILITY #7: Missing Security Headers
// No helmet, no CSP, no HSTS, no X-Frame-Options
app.use(cors()); // Wide open CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files - VULNERABILITY #5: Directory Listing
app.use('/static', express.static(path.join(__dirname, 'public'), { 
  dotfiles: 'allow',
  index: false // Allows directory listing
}));

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

// Create tables with intentionally vulnerable schema
db.serialize(() => {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    email TEXT,
    role TEXT,
    bio TEXT
  )`);

  db.run(`CREATE TABLE password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE repositories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    url TEXT,
    name TEXT,
    imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert sample users
  db.run(`INSERT INTO users (username, password, email, role, bio) VALUES 
    ('admin', 'admin123', 'admin@vulnerable.local', 'admin', 'System Administrator'),
    ('user', 'password', 'user@vulnerable.local', 'user', 'Regular User'),
    ('testuser', 'test123', 'test@vulnerable.local', 'user', 'Test Account')`
  );
});

// VULNERABILITY #6: SQL Injection in login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // VULNERABLE: Direct string concatenation in SQL query
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  
  console.log('Executing query:', query); // VULNERABILITY #4: Logging sensitive queries
  
  db.get(query, (err, user) => {
    if (err) {
      // VULNERABILITY #4: Error messages revealing backend information
      return res.status(500).json({ 
        error: 'Database error',
        details: err.message,
        stack: err.stack,
        query: query
      });
    }
    
    if (user) {
      res.json({ 
        success: true, 
        user: user,
        token: Buffer.from(`${username}:${Date.now()}`).toString('base64')
      });
    } else {
      res.status(401).json({ 
        error: 'Invalid credentials',
        query: query // Leaking query structure
      });
    }
  });
});

// VULNERABILITY #1: Server-Side Request Forgery (SSRF)
app.post('/api/import-github', async (req, res) => {
  const { url, userId } = req.body;
  
  try {
    // VULNERABLE: No URL validation or whitelist
    // Allows access to internal services, metadata endpoints, etc.
    console.log('Fetching URL:', url);
    
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5,
      // No restrictions on private IP ranges
    });
    
    // Store repository info
    db.run(
      `INSERT INTO repositories (user_id, url, name) VALUES (${userId}, '${url}', 'imported-repo')`,
      (err) => {
        if (err) {
          return res.status(500).json({ 
            error: err.message,
            stack: err.stack 
          });
        }
        
        res.json({ 
          success: true, 
          data: response.data,
          headers: response.headers,
          statusCode: response.status
        });
      }
    );
  } catch (error) {
    // VULNERABILITY #4: Detailed error exposure
    res.status(500).json({ 
      error: 'Failed to fetch repository',
      message: error.message,
      stack: error.stack,
      config: error.config,
      url: url
    });
  }
});

// VULNERABILITY #3: Password reset with non-expiring tokens
app.post('/api/request-reset', (req, res) => {
  const { email } = req.body;
  
  // VULNERABLE SQL Injection in email lookup
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  
  db.get(query, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ 
        error: 'User not found',
        query: query 
      });
    }
    
    // Generate token that NEVER expires
    const token = uuidv4();
    
    db.run(
      `INSERT INTO password_resets (user_id, token) VALUES (${user.id}, '${token}')`,
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // In real app, would email this. Here we just return it.
        res.json({ 
          success: true, 
          token: token,
          message: 'Password reset token generated',
          user_id: user.id 
        });
      }
    );
  });
});

// VULNERABILITY #3: Reset password with reusable token
app.post('/api/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  
  // VULNERABLE: No token expiration check, no token deletion after use
  const query = `SELECT * FROM password_resets WHERE token = '${token}'`;
  
  db.get(query, (err, reset) => {
    if (err || !reset) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // Update password without deleting token (reusable!)
    db.run(
      `UPDATE users SET password = '${newPassword}' WHERE id = ${reset.user_id}`,
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json({ 
          success: true, 
          message: 'Password updated',
          token: token // Sending back the still-valid token
        });
      }
    );
  });
});

// VULNERABILITY #6: SQL Injection in user search
app.get('/api/users/search', (req, res) => {
  const { q } = req.query;
  
  // VULNERABLE: Direct query parameter injection
  const query = `SELECT * FROM users WHERE username LIKE '%${q}%' OR email LIKE '%${q}%'`;
  
  db.all(query, (err, users) => {
    if (err) {
      return res.status(500).json({ 
        error: err.message,
        stack: err.stack,
        query: query
      });
    }
    
    res.json(users);
  });
});

// VULNERABILITY #4 & #8: XSS - Stored in user profile
app.post('/api/users/:id/bio', (req, res) => {
  const { id } = req.params;
  const { bio } = req.body;
  
  // VULNERABLE: No input sanitization, direct storage of HTML/JS
  const query = `UPDATE users SET bio = '${bio}' WHERE id = ${id}`;
  
  db.run(query, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ success: true, bio: bio });
  });
});

// Get user profile (will execute XSS when bio is rendered)
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  // VULNERABLE: SQL Injection in ID parameter
  const query = `SELECT * FROM users WHERE id = ${id}`;
  
  db.get(query, (err, user) => {
    if (err) {
      return res.status(500).json({ 
        error: err.message,
        stack: err.stack 
      });
    }
    
    // No XSS protection when sending bio with HTML/JS
    res.json(user);
  });
});

// VULNERABILITY #5: Path Traversal & Directory Listing
app.get('/api/files', (req, res) => {
  const { path: filePath } = req.query;
  
  // VULNERABLE: No path sanitization
  const fullPath = path.join(__dirname, filePath || '.');
  
  try {
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Directory listing
        const files = fs.readdirSync(fullPath);
        res.json({ 
          type: 'directory', 
          path: fullPath,
          files: files 
        });
      } else {
        // File contents
        const content = fs.readFileSync(fullPath, 'utf8');
        res.json({ 
          type: 'file', 
          path: fullPath,
          content: content 
        });
      }
    } else {
      res.status(404).json({ error: 'Path not found' });
    }
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      path: fullPath 
    });
  }
});

// Debug endpoint - VULNERABILITY #4: Information Disclosure
app.get('/api/debug/info', (req, res) => {
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    env: process.env, // Exposes all environment variables!
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid
  });
});

// Health check that reveals too much
app.get('/api/health', (req, res) => {
  res.json({
    status: 'running',
    database: 'sqlite:memory',
    version: '1.0.0',
    vulnerabilities: 'ALL OF THEM',
    endpoints: [
      '/api/login',
      '/api/import-github',
      '/api/request-reset',
      '/api/reset-password',
      '/api/users/search',
      '/api/users/:id',
      '/api/files',
      '/api/debug/info'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`
  ⚠️  VULNERABLE SERVER RUNNING ⚠️
  Port: ${PORT}
  
  WARNING: This server contains intentional vulnerabilities!
  - SQL Injection
  - SSRF
  - XSS
  - Path Traversal
  - Information Disclosure
  - Missing Security Headers
  - Non-expiring tokens
  
  DO NOT expose to the internet!
  For educational purposes only.
  `);
});
