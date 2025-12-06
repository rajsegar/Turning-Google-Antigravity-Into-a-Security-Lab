# Vulnerability Remediation Guide

This guide explains how each vulnerability can be fixed with secure coding practices.

## 📋 Table of Contents

1. [SQL Injection](#1-sql-injection)
2. [Server-Side Request Forgery (SSRF)](#2-ssrf-mitigation)
3. [Token Security](#3-token-security)
4. [Information Disclosure](#4-information-disclosure)
5. [Path Traversal](#5-path-traversal)
6. [Cross-Site Scripting (XSS)](#6-xss-protection)
7. [Security Headers](#7-security-headers)

---

## 1. SQL Injection

### The Problem
```javascript
// VULNERABLE CODE
const query = `SELECT * FROM users WHERE username = '${username}'`;
db.get(query, callback);
```

### The Solution: Parameterized Queries

```javascript
// SECURE CODE
const query = 'SELECT * FROM users WHERE username = ?';
db.get(query, [username], callback);
```

### Implementation Methods

#### SQLite (sqlite3)
```javascript
// Prepared statements
db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
  // Handle result
});

// Multiple parameters
db.run(
  'INSERT INTO users (username, email) VALUES (?, ?)',
  [username, email],
  callback
);
```

#### PostgreSQL (pg)
```javascript
const query = {
  text: 'SELECT * FROM users WHERE username = $1',
  values: [username]
};
client.query(query, (err, result) => {
  // Handle result
});
```

#### MySQL (mysql2)
```javascript
connection.execute(
  'SELECT * FROM users WHERE username = ?',
  [username],
  (err, results) => {
    // Handle results
  }
);
```

#### MongoDB (mongoose)
```javascript
// Mongoose automatically sanitizes
User.find({ username: username });

// Raw MongoDB with sanitization
const { sanitize } = require('mongo-sanitize');
db.collection('users').find({ username: sanitize(username) });
```

### Additional Protection

#### Input Validation
```javascript
const validator = require('validator');

function validateUsername(username) {
  // Whitelist allowed characters
  const regex = /^[a-zA-Z0-9_-]{3,20}$/;
  return regex.test(username);
}

if (!validateUsername(username)) {
  return res.status(400).json({ error: 'Invalid username format' });
}
```

#### ORM Usage
```javascript
// Using Sequelize
const users = await User.findAll({
  where: { username: username }
});

// Using TypeORM
const users = await userRepository.find({
  where: { username: username }
});
```

### Best Practices
✅ Always use parameterized queries  
✅ Never concatenate user input into SQL  
✅ Use prepared statements  
✅ Implement input validation as defense-in-depth  
✅ Use ORMs when possible  
✅ Apply principle of least privilege to database users  
✅ Disable dangerous SQL functions when not needed  

---

## 2. SSRF Mitigation

### The Problem
```javascript
// VULNERABLE CODE
const response = await axios.get(userSuppliedURL);
```

### The Solution: URL Validation & Whitelisting

```javascript
// SECURE CODE
function validateURL(urlString) {
  try {
    const url = new URL(urlString);
    
    // 1. Whitelist allowed protocols
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
    
    // 2. Whitelist allowed domains
    const allowedDomains = ['api.github.com', 'github.com'];
    if (!allowedDomains.includes(url.hostname)) {
      throw new Error('Domain not whitelisted');
    }
    
    // 3. Block private IP ranges
    const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|169\.254\.|::1|fc00:)/;
    if (privateIPRegex.test(url.hostname)) {
      throw new Error('Private IP addresses are not allowed');
    }
    
    // 4. Block localhost variations
    const localhostVariations = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    if (localhostVariations.includes(url.hostname.toLowerCase())) {
      throw new Error('Localhost is not allowed');
    }
    
    return url;
  } catch (error) {
    throw new Error('Invalid URL: ' + error.message);
  }
}

// Use validation
app.post('/api/import-github', async (req, res) => {
  try {
    const url = validateURL(req.body.url);
    
    const response = await axios.get(url.href, {
      timeout: 5000,
      maxRedirects: 0,  // Prevent redirect-based bypasses
      maxContentLength: 1024 * 1024,  // 1MB limit
      validateStatus: (status) => status === 200
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request' });
  }
});
```

### Advanced Protection

#### DNS Rebinding Protection
```javascript
const dns = require('dns').promises;

async function validateURLWithDNS(urlString) {
  const url = new URL(urlString);
  
  // Resolve hostname to IP
  const addresses = await dns.resolve4(url.hostname);
  
  // Check if any resolved IP is private
  for (const ip of addresses) {
    if (isPrivateIP(ip)) {
      throw new Error('URL resolves to private IP');
    }
  }
  
  return url;
}

function isPrivateIP(ip) {
  const parts = ip.split('.').map(Number);
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 169 && parts[1] === 254)
  );
}
```

#### Network Segmentation
```javascript
// Use a proxy that blocks private IPs
const { SocksProxyAgent } = require('socks-proxy-agent');

const agent = new SocksProxyAgent('socks://safe-proxy:1080');

axios.get(url, {
  httpAgent: agent,
  httpsAgent: agent
});
```

### Best Practices
✅ Whitelist allowed domains  
✅ Block private IP ranges  
✅ Disable redirects or validate redirect targets  
✅ Use DNS resolution checks  
✅ Implement network segmentation  
✅ Set timeouts and size limits  
✅ Log all external requests  

---

## 3. Token Security

### The Problem
```javascript
// VULNERABLE CODE
// Tokens never expire and can be reused
const token = uuidv4();
db.run('INSERT INTO password_resets (token) VALUES (?)', [token]);
```

### The Solution: Expiring Single-Use Tokens

```javascript
// SECURE CODE
const crypto = require('crypto');

// Generate secure token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Store with expiration
async function createPasswordResetToken(userId) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  
  await db.run(
    'INSERT INTO password_resets (user_id, token, expires_at, used) VALUES (?, ?, ?, 0)',
    [userId, token, expiresAt.toISOString()]
  );
  
  return token;
}

// Validate and consume token
async function validateAndConsumeToken(token) {
  const reset = await db.get(
    'SELECT * FROM password_resets WHERE token = ? AND used = 0',
    [token]
  );
  
  if (!reset) {
    throw new Error('Invalid token');
  }
  
  // Check expiration
  const now = new Date();
  const expiresAt = new Date(reset.expires_at);
  
  if (now > expiresAt) {
    throw new Error('Token expired');
  }
  
  // Mark as used (single-use)
  await db.run(
    'UPDATE password_resets SET used = 1 WHERE token = ?',
    [token]
  );
  
  return reset;
}
```

### Token Storage Hashing
```javascript
const bcrypt = require('bcrypt');

// Hash token before storing
async function createPasswordResetToken(userId) {
  const token = generateToken();
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + 3600000);
  
  await db.run(
    'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt.toISOString()]
  );
  
  return token; // Return unhashed to send to user
}

// Validate by comparing hash
async function validateToken(token) {
  const resets = await db.all(
    'SELECT * FROM password_resets WHERE used = 0 AND expires_at > ?',
    [new Date().toISOString()]
  );
  
  for (const reset of resets) {
    if (await bcrypt.compare(token, reset.token_hash)) {
      return reset;
    }
  }
  
  throw new Error('Invalid token');
}
```

### JWT Tokens
```javascript
const jwt = require('jsonwebtoken');

// Create JWT with expiration
function createToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Verify JWT
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

### Best Practices
✅ Set expiration times (1-24 hours max)  
✅ Single-use tokens only  
✅ Use cryptographically secure random generators  
✅ Hash tokens before storage  
✅ Invalidate old tokens  
✅ Implement rate limiting  
✅ Send tokens via secure channels only  

---

## 4. Information Disclosure

### The Problem
```javascript
// VULNERABLE CODE
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    ...err
  });
});
```

### The Solution: Generic Error Messages

```javascript
// SECURE CODE
app.use((err, req, res, next) => {
  // Log detailed error server-side
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Send generic message to client
  res.status(500).json({
    error: 'An internal error occurred'
  });
});
```

### Environment-Based Error Handling
```javascript
const isDevelopment = process.env.NODE_ENV === 'development';

app.use((err, req, res, next) => {
  // Detailed errors in development only
  if (isDevelopment) {
    return res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
  
  // Generic errors in production
  res.status(500).json({
    error: 'An error occurred'
  });
});
```

### Structured Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

app.use((err, req, res, next) => {
  logger.error('Application error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    user: req.user?.id
  });
  
  res.status(500).json({ error: 'An error occurred' });
});
```

### Best Practices
✅ Never expose stack traces to users  
✅ Use generic error messages in production  
✅ Log detailed errors server-side  
✅ Remove debug endpoints in production  
✅ Don't expose system information  
✅ Sanitize error messages from third-party libraries  

---

## 5. Path Traversal

### The Problem
```javascript
// VULNERABLE CODE
const filePath = path.join(__dirname, req.query.path);
const content = fs.readFileSync(filePath);
```

### The Solution: Path Validation

```javascript
// SECURE CODE
const path = require('path');

function validatePath(userPath, baseDir) {
  // Resolve to absolute path
  const resolvedPath = path.resolve(baseDir, userPath);
  const resolvedBase = path.resolve(baseDir);
  
  // Check if path is within baseDir
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Path traversal detected');
  }
  
  return resolvedPath;
}

app.get('/api/files', (req, res) => {
  try {
    const baseDir = path.join(__dirname, 'public');
    const safePath = validatePath(req.query.path, baseDir);
    
    const content = fs.readFileSync(safePath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(403).json({ error: 'Access denied' });
  }
});
```

### Alternative: Use IDs Instead of Paths
```javascript
 // Map file IDs to paths
const FILE_MAP = {
  'doc1': '/safe/path/document1.pdf',
  'doc2': '/safe/path/document2.pdf'
};

app.get('/api/files/:id', (req, res) => {
  const filePath = FILE_MAP[req.params.id];
  
  if (!filePath) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.sendFile(filePath);
});
```

### Best Practices
✅ Use absolute path validation  
✅ Implement whitelist of allowed paths  
✅ Use file IDs instead of paths  
✅ Never serve files outside designated directories  
✅ Disable directory listing  
✅ Implement access control checks  

---

## 6. XSS Protection

### The Problem
```javascript
// VULNERABLE CODE
document.getElementById('output').innerHTML = userInput;
```

### The Solution: Input Sanitization & Output Encoding

#### Server-Side Sanitization
```javascript
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

app.post('/api/users/:id/bio', (req, res) => {
  const sanitized = purify.sanitize(req.body.bio, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  });
  
  // Store sanitized content
  db.run('UPDATE users SET bio = ? WHERE id = ?', [sanitized, req.params.id]);
});
```

#### Client-Side Protection
```javascript
// Use textContent instead of innerHTML
element.textContent = userInput;

// Or escape HTML
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

element.innerHTML = escapeHTML(userInput);
```

#### Content Security Policy
```javascript
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"]
  }
}));
```

### Best Practices
✅ Sanitize all user input  
✅ Use Content Security Policy  
✅ Encode output based on context  
✅ Use textContent over innerHTML  
✅ Implement HTTPOnly cookies  
✅ Validate input on both client and server  

---

## 7. Security Headers

### The Problem
```javascript
// Missing security headers
app.use(cors());
```

### The Solution: Comprehensive Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  
  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  
  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false
  }
}));
```

### Manual Header Configuration
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
```

### Best Practices
✅ Use helmet middleware  
✅ Implement CSP  
✅ Enable HSTS  
✅ Set X-Frame-Options  
✅ Configure CORS properly  
✅ Regular security header audits  

---

## 🔒 Additional Security Measures

### Password Hashing
```javascript
const bcrypt = require('bcrypt');

// Hash password
const hash = await bcrypt.hash(password, 10);

// Verify password
const valid = await bcrypt.compare(password, hash);
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

### Input Validation
```javascript
const validator = require('validator');

if (!validator.isEmail(email)) {
  return res.status(400).json({ error: 'Invalid email' });
}
```

---

## 📚 Resources

- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
