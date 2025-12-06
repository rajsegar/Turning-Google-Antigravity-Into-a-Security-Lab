# OWASP Top 10 (2021) Mapping

This document maps the vulnerabilities in this project to the OWASP Top 10 2021.

## 📊 Coverage Overview

| OWASP Category | Included | Vulnerability Examples |
|----------------|----------|------------------------|
| A01:2021 – Broken Access Control | ✅ | Path traversal, directory listing |
| A02:2021 – Cryptographic Failures | ✅ | Plain text passwords, weak token generation |
| A03:2021 – Injection | ✅ | SQL Injection |
| A04:2021 – Insecure Design | ✅ | Non-expiring tokens, reusable reset tokens |
| A05:2021 – Security Misconfiguration | ✅ | Missing security headers, verbose errors |
| A06:2021 – Vulnerable Components | ⚠️ | Intentionally outdated dependencies |
| A07:2021 – Authentication Failures | ✅ | Weak password policy, token reuse |
| A08:2021 – Software & Data Integrity | ⚠️ | No code signing, no SRI |
| A09:2021 – Security Logging Failures | ✅ | Insufficient logging |
| A10:2021 – Server-Side Request Forgery | ✅ | SSRF via import feature |

---

## A01:2021 – Broken Access Control

### Description
Restrictions on what authenticated users are allowed to do are not properly enforced.

### Vulnerabilities in This Project

#### 1. Path Traversal (CWE-22)
**Location:** `/api/files`

**Vulnerable Code:**
```javascript
const fullPath = path.join(__dirname, req.query.path);
const content = fs.readFileSync(fullPath, 'utf8');
```

**Exploitation:**
```bash
GET /api/files?path=../../../etc/passwd
GET /api/files?path=../server.js
```

**Impact:** 
- Unauthorized file access
- Source code disclosure
- Credential theft

**CVSS Score:** 7.5 (High)

#### 2. Directory Listing (CWE-548)
**Location:** Static file serving

**Vulnerable Code:**
```javascript
app.use('/static', express.static(path.join(__dirname, 'public'), { 
  index: false // Allows directory listing
}));
```

**Impact:**
- Information disclosure
- Reconnaissance for further attacks

**CVSS Score:** 5.3 (Medium)

### Remediation
- Implement path validation
- Use access control lists
- Disable directory listings
- Use indirect object references

---

## A02:2021 – Cryptographic Failures

### Description
Failures related to cryptography which often lead to exposure of sensitive data.

### Vulnerabilities in This Project

#### 1. Plain Text Password Storage (CWE-256)
**Location:** Database schema

**Vulnerable Code:**
```javascript
db.run(`CREATE TABLE users (
  username TEXT,
  password TEXT  // Plain text!
)`);
```

**Impact:**
- Complete credential compromise
- Account takeover

**CVSS Score:** 9.8 (Critical)

#### 2. Weak Token Generation (CWE-330)
**Location:** Password reset

**Vulnerable Code:**
```javascript
const token = uuidv4(); // Predictable if weak PRNG
```

**Impact:**
- Token prediction
- Account takeover

**CVSS Score:** 7.5 (High)

### Remediation
- Use bcrypt/scrypt/Argon2 for passwords
- Use crypto.randomBytes() for tokens
- Implement proper key management

---

## A03:2021 – Injection

### Description
User-supplied data is not validated, filtered, or sanitized by the application.

### Vulnerabilities in This Project

#### 1. SQL Injection (CWE-89)
**Location:** Multiple endpoints

**Vulnerable Code:**
```javascript
const query = `SELECT * FROM users WHERE username = '${username}'`;
```

**Exploitation:**
```sql
username: admin' OR '1'='1'--
username: ' UNION SELECT * FROM users--
```

**Impact:**
- Authentication bypass
- Data exfiltration
- Data manipulation
- Privilege escalation

**CVSS Score:** 9.8 (Critical)

**CVE References:**
- CVE-2019-16943 (Blind SQL Injection)
- CVE-2020-35489 (SQL Injection in login)

#### 2. Cross-Site Scripting - XSS (CWE-79)
**Location:** User bio field

**Vulnerable Code:**
```javascript
element.innerHTML = user.bio; // Unsanitized
```

**Exploitation:**
```html
<script>alert(document.cookie)</script>
<img src=x onerror=alert('XSS')>
```

**Impact:**
- Session hijacking
- Credential theft
- Malware distribution

**CVSS Score:** 7.2 (High)

### Remediation
- Use parameterized queries
- Implement input validation
- Sanitize all user input
- Use ORMs

---

## A04:2021 – Insecure Design

### Description
Missing or ineffective control design.

### Vulnerabilities in This Project

#### 1. Non-Expiring Password Reset Tokens (CWE-640)
**Location:** Password reset flow

**Vulnerable Design:**
```javascript
// No expiration check
// No single-use enforcement
SELECT * FROM password_resets WHERE token = ?
```

**Impact:**
- Indefinite account takeover risk
- Token reuse attacks

**CVSS Score:** 8.1 (High)

#### 2. No Rate Limiting (CWE-307)
**Location:** All endpoints

**Impact:**
- Brute force attacks
- Credential stuffing
- DoS attacks

**CVSS Score:** 5.3 (Medium)

### Remediation
- Implement token expiration
- Single-use tokens only
- Rate limiting on all endpoints
- Account lockout policies

---

## A05:2021 – Security Misconfiguration

### Description
Missing appropriate security hardening or improperly configured permissions.

### Vulnerabilities in This Project

#### 1. Missing Security Headers (CWE-693)
**Location:** Server configuration

**Missing Headers:**
- Content-Security-Policy
- X-Frame-Options
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy

**Impact:**
- XSS attacks
- Clickjacking
- MIME sniffing
- Information leakage

**CVSS Score:** 6.5 (Medium)

#### 2. Verbose Error Messages (CWE-209)
**Location:** Error handlers

**Vulnerable Code:**
```javascript
res.status(500).json({ 
  error: err.message,
  stack: err.stack,
  query: query
});
```

**Impact:**
- Information disclosure
- Attack surface mapping
- Credential exposure

**CVSS Score:** 5.3 (Medium)

#### 3. Wide-Open CORS (CWE-942)
**Location:** CORS configuration

**Vulnerable Code:**
```javascript
app.use(cors()); // No origin restrictions
```

**Impact:**
- Cross-origin data theft
- CSRF attacks

**CVSS Score:** 6.4 (Medium)

### Remediation
- Implement security headers (use Helmet)
- Generic error messages in production
- Proper CORS configuration
- Remove debug endpoints

---

## A06:2021 – Vulnerable and Outdated Components

### Description
Using components with known vulnerabilities.

### Vulnerabilities in This Project

#### Intentionally Outdated Dependencies
This project may use intentionally outdated packages for educational purposes.

**Example:**
```json
{
  "express": "^4.17.0"  // May have known vulnerabilities
}
```

### Detection Tools
```bash
npm audit
npm audit fix
```

### Remediation
- Regular dependency updates
- Use Snyk/Dependabot
- Monitor CVE databases

---

## A07:2021 – Identification and Authentication Failures

### Description
Confirmation of the user's identity, authentication, and session management.

### Vulnerabilities in This Project

#### 1. Weak Password Policy (CWE-521)
**Location:** User registration

**Issue:** No password complexity requirements

**Impact:** Easy password cracking

**CVSS Score:** 7.5 (High)

#### 2. Credential Stuffing (CWE-307)
**Location:** Login endpoint

**Issue:** No rate limiting, no CAPTCHA

**Impact:** Automated credential testing

**CVSS Score:** 7.5 (High)

#### 3. Session Token in URL/Storage
**Location:** Client-side code

**Vulnerable Code:**
```javascript
localStorage.setItem('token', data.token);
```

**Impact:** Token theft via XSS

**CVSS Score:** 6.5 (Medium)

### Remediation
- Enforce strong passwords
- Implement rate limiting
- Use HTTPOnly cookies
- Multi-factor authentication
- Account lockout

---

## A08:2021 – Software and Data Integrity Failures

### Description
Code and infrastructure that does not protect against integrity violations.

### Vulnerabilities in This Project

#### 1. No Subresource Integrity (SRI)
**Location:** Frontend dependencies

**Vulnerable Code:**
```html
<script src="https://cdn.example.com/library.js"></script>
<!-- No integrity attribute -->
```

**Impact:** Supply chain attacks

#### 2. No Code Signing
**Issue:** Updates not verified

### Remediation
- Implement SRI for CDN resources
- Code signing for releases
- Verify package integrity

---

## A09:2021 – Security Logging and Monitoring Failures

### Description
Without logging and monitoring, breaches cannot be detected.

### Vulnerabilities in This Project

#### 1. Insufficient Logging
**Location:** All endpoints

**Issues:**
- No authentication attempt logging
- No failed login tracking
- No audit trail

**Impact:** Attacks go undetected

#### 2. No Intrusion Detection

### Remediation
- Comprehensive logging
- SIEM integration
- Alert on suspicious activity
- Log retention policies

---

## A10:2021 – Server-Side Request Forgery (SSRF)

### Description
Fetching a remote resource without validating the user-supplied URL.

### Vulnerabilities in This Project

#### SSRF via GitHub Import (CWE-918)
**Location:** `/api/import-github`

**Vulnerable Code:**
```javascript
const response = await axios.get(url);
```

**Exploitation:**
```bash
# Access cloud metadata
POST /api/import-github
{"url": "http://169.254.169.254/latest/meta-data/"}

# Internal port scanning
{"url": "http://127.0.0.1:3306"}

# Access internal services
{"url": "http://localhost:6379"}
```

**Impact:**
- Cloud credential theft
- Internal network access
- Port scanning
- RCE via internal services

**CVSS Score:** 9.8 (Critical)

**CVE Reference:**
- CVE-2024-34351 (Next.js SSRF - mentioned in requirements)

### Remediation
- URL whitelist
- Block private IP ranges
- Disable redirects
- Network segmentation

---

## 🎯 Vulnerability Statistics

### By Severity
- **Critical:** 3 vulnerabilities
- **High:** 6 vulnerabilities
- **Medium:** 4 vulnerabilities
- **Low:** 2 vulnerabilities

### By Category
- **Injection:** 2 vulnerabilities
- **Access Control:** 2 vulnerabilities
- **Authentication:** 3 vulnerabilities
- **Configuration:** 3 vulnerabilities
- **SSRF:** 1 vulnerability
- **Design Flaws:** 2 vulnerabilities

---

## 🛡️ Security Testing Checklist

- [ ] SQL Injection testing
- [ ] XSS testing (stored, reflected, DOM)
- [ ] SSRF testing
- [ ] Path traversal testing
- [ ] Authentication bypass
- [ ] Token security
- [ ] Security headers check
- [ ] Rate limiting verification
- [ ] Error message analysis
- [ ] Dependency vulnerability scan

---

## 📚 References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

## ⚠️ Disclaimer

This mapping is for educational purposes. Real-world applications may have additional vulnerabilities not covered here.
