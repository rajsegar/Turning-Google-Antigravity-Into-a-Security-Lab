# Vulnerable Website - Pentesting Research Project

 **WARNING**: This project contains intentionally vulnerable code for educational and research purposes only. DO NOT deploy to production or expose to the internet.

## Overview

This project contains two versions of a web application:
1. **Vulnerable App** - Contains intentional security flaws for pentesting research
2. **Secure App** - Demonstrates proper security implementations

### 1. Vulnerable Application
A fully functional web application with **intentional security flaws** including:
- ✅ SQL Injection (Critical)
- ✅ Server-Side Request Forgery - SSRF (Critical)
- ✅ Cross-Site Scripting - XSS (High)
- ✅ Path Traversal (High)
- ✅ Non-Expiring Password Reset Tokens (High)
- ✅ Information Disclosure (High)
- ✅ Missing Security Headers (High)

**Location:** `vulnerable-app/`
**Backend:** Node.js/Express on port 3000
**Frontend:** HTML/CSS/JavaScript

### 2. Secure Application
A parallel implementation showing **proper security controls**:
- ✅ Parameterized SQL queries
- ✅ SSRF protection with URL whitelisting
- ✅ XSS prevention with DOMPurify
- ✅ Input validation and sanitization
- ✅ Expiring single-use tokens
- ✅ Generic error messages
- ✅ Complete security headers (Helmet.js)
- ✅ Rate limiting
- ✅ Password hashing with bcrypt

**Location:** `secure-app/`
**Backend:** Node.js/Express on port 3001
**Frontend:** HTML/CSS/JavaScript

### 3. Comprehensive Documentation

#### Exploitation Guide (`docs/exploitation-guide.md`)
- Detailed attack techniques for each vulnerability
- Payload examples
- Step-by-step exploitation procedures
- Impact analysis
- Tool recommendations

#### Remediation Guide (`docs/remediation-guide.md`)
- Secure coding practices
- Code comparisons (vulnerable vs secure)
- Implementation examples
- Best practices for each vulnerability type

#### OWASP Top 10 Mapping (`docs/owasp-mapping.md`)
- Complete mapping to OWASP Top 10 (2021)
- CWE references
- CVSS scores
- Vulnerability statistics

#### Penetration Testing Checklist (`docs/pentesting-checklist.md`)
- Comprehensive testing procedures
- Attack payloads library
- Tool recommendations
- Reporting templates

### 4. Quick Start Guide (`QUICKSTART.md`)
- Installation instructions
- Running both applications
- Testing examples
- Troubleshooting tips

## Project Structure

```
📁 Vulnerable website/
│
├── 📁 docs/
│   ├── code-comparison.md
│   ├── exploitation-guide.md
│   ├── owasp-mapping.md
│   ├── pentesting-checklist.md
│   └── remediation-guide.md
│
├── 📁 secure-app/
│   ├── 📁 backend/
│   │   ├── server.js
│   │   └── package.json
│   └── 📁 frontend/
│       ├── app.js
│       ├── index.html
│       └── styles.css
│
├── 📁 vulnerable-app/
│   ├── 📁 backend/
│   │   ├── server.js
│   │   └── package.json
│   └── 📁 frontend/
│       ├── app.js
│       ├── index.html
│       └── styles.css
│
├── PROJECT-SUMMARY.md
├── QUICKSTART.md
└── README.md

```

## Quick Start

## 🛠️ How to Run the Applications

### 🔴 Vulnerable Application

#### Backend (API Server)

```bash
cd /Users/user/Desktop/Anitgravity/Vulnerable\ website/vulnerable-app/backend
npm install
npm run dev
```

Runs on: **[http://localhost:3000](http://localhost:3000)**

#### Frontend (Web UI)

```bash
cd /Users/user/Desktop/Anitgravity/Vulnerable\ website/vulnerable-app/frontend
python3 -m http.server 8080
```

Open: **[http://localhost:8080](http://localhost:8080)**

---

### 🟢 Secure Application

#### Backend (API Server)

```bash
cd /Users/user/Desktop/Anitgravity/Vulnerable\ website/secure-app/backend
npm install
npm run dev
```

Runs on: **[http://localhost:3001](http://localhost:3001)**

#### Frontend (Web UI)

```bash
cd /Users/user/Desktop/Anitgravity/Vulnerable\ website/secure-app/frontend
python3 -m http.server 8081
```

Open: **[http://localhost:8081](http://localhost:8081)**

---

## 🔑 Test Credentials

Use any of the following test accounts:

```
admin / admin123
user / password
testuser / test123
```

### Vulnerable App (8080)

* **SQL Injection**: `admin' OR '1'='1'--`
* **XSS** in bio fields
* **SSRF** via "/import from URL" feature
* **Path Traversal** attempts

### Secure App (8081)

All the above attacks **should be blocked** with proper sanitization and validation.
---
## Educational Use Only

This project is designed for:
- Red team training
- Penetration testing practice
- Security awareness training
- Vulnerability research

## Legal Disclaimer

Use of this software for attacking targets without prior mutual consent is illegal. The developers assume no liability for misuse or damage caused by this program.

## OWASP Top 10 (2021) Coverage

- A01:2021 – Broken Access Control ✓
- A02:2021 – Cryptographic Failures ✓
- A03:2021 – Injection ✓
- A05:2021 – Security Misconfiguration ✓
- A07:2021 – Identification and Authentication Failures ✓
- A10:2021 – Server-Side Request Forgery (SSRF) ✓

# Vulnerable & Secure Web Application

A side‑by‑side demo showing insecure vs secure implementations of a simple web application. Perfect for training, demonstrations, and learning secure coding.

---


This project contains **two separate applications**:

1. **Vulnerable Application** – intentionally insecure, used for teaching/learning how attacks work.
2. **Secure Application** – hardened version with proper security controls.

---


## 🎓 Learning Path

### For Beginners
1. Start with the **Exploit Guide** to understand what each vulnerability is
2. Run the **Vulnerable App** and try the basic payloads
3. Read the **Remediation Guide** to see how to fix vulnerabilities
4. Compare the vulnerable and secure code side-by-side

### For Intermediate
1. Use the **Penetration Testing Checklist** as a guide
2. Try advanced exploitation techniques
3. Use automated tools (SQLMap, Burp Suite, ZAP)
4. Map findings to **OWASP Top 10**

### For Advanced
1. Develop custom exploits
2. Chain multiple vulnerabilities
3. Write automation scripts
4. Contribute improvements to the project

## 📊 Vulnerability Coverage

### By Severity
- **Critical:** 2 vulnerabilities (SQL Injection, SSRF)
- **High:** 5 vulnerabilities (XSS, Path Traversal, Token Issues, Info Disclosure, Missing Headers)

### By OWASP Category
- **A01:2021 – Broken Access Control** ✓
- **A02:2021 – Cryptographic Failures** ✓
- **A03:2021 – Injection** ✓
- **A04:2021 – Insecure Design** ✓
- **A05:2021 – Security Misconfiguration** ✓
- **A07:2021 – Authentication Failures** ✓
- **A10:2021 – Server-Side Request Forgery** ✓

## 🛠️ Technologies Used

### Backend
- Node.js
- Express.js
- SQLite3
- Axios (for SSRF demonstration)
- Helmet (secure app)
- bcrypt (secure app)
- DOMPurify (secure app)

### Frontend
- HTML5
- CSS3 (Modern design with dark theme)
- Vanilla JavaScript
- No external frameworks (intentional for simplicity)

## 🎨 Design Philosophy

### Vulnerable App (Red Theme)
- Dark cyberpunk aesthetic
- Red/pink accents indicating danger
- Warning badges and messages
- Exploit hints on every page

### Secure App (Green Theme)
- Professional security theme
- Green accents indicating safety
- Security feature badges
- Educational info boxes


## 🔥 Quick Test Examples

### SQL Injection
```
Username: admin' OR '1'='1'--
Password: anything
```

### SSRF
```
URL: http://localhost:3000/api/debug/info
```

### XSS
```
Bio: <script>alert('XSS')</script>
```

### Path Traversal
```
Path: ../server.js
```

## ⚠️ Important Warnings

### DO NOT:
- ❌ Deploy to production environments
- ❌ Expose to the internet
- ❌ Use on systems you don't own
- ❌ Store real user data
- ❌ Use for malicious purposes

### DO:
- ✅ Use in isolated/local environments only
- ✅ Use for educational purposes
- ✅ Practice ethical hacking
- ✅ Learn secure coding practices
- ✅ Share knowledge responsibly

## 🎯 Educational Goals

This project helps you:
1. **Understand** common web vulnerabilities
2. **Exploit** them in a safe environment
3. **Remediate** using best practices
4. **Recognize** vulnerabilities in real code
5. **Implement** secure solutions

## 📈 Next Steps

### For Further Learning:
- Practice on [HackTheBox](https://www.hackthebox.com/)
- Study [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- Take [PortSwigger Academy](https://portswigger.net/web-security) courses
- Get certified (CEH, OSCP, GWAPT)

### For Contributing:
- Add more vulnerability types
- Create video tutorials
- Develop automated testing scripts
- Improve documentation

## 📝 Testing Credentials

**Default accounts for testing:**
- admin / admin123
- user / password
- testuser / test123

## 🔗 Useful Resources

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [HackTheBox](https://www.hackthebox.com/)
- [TryHackMe](https://tryhackme.com/)
- [SANS Penetration Testing](https://www.sans.org/cyber-security-courses/)

## 🤝 Support & Community

This is an educational project. Use it to:
- Learn web security
- Practice pentesting
- Teach others
- Research vulnerabilities
- Improve your secure coding skills

## ⚠️ Important Notes

* Do **NOT** expose the vulnerable app to the internet.
* Both apps are meant for **local testing only**.
* Perfect for workshops, demos, & red teaming practice.

---

## 🧑‍💻 Author

Created by **Rajsegar_Alagarathnam** for cybersecurity learning and testing.


## 📜 License

MIT License - For Educational Purposes Only

## ⚖️ Legal Disclaimer

This software is provided for educational and research purposes only. Unauthorized access to computer systems is illegal. Always obtain proper authorization before testing. The authors assume no liability for misuse of this software.

---

**Remember:** With great power comes great responsibility. Use this knowledge ethically and legally.

Happy (ethical) hacking! 🔒🎓
