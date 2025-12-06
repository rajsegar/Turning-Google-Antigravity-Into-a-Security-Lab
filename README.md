# Vulnerable Website - Pentesting Research Project

 **WARNING**: This project contains intentionally vulnerable code for educational and research purposes only. DO NOT deploy to production or expose to the internet.

## Overview

This project contains two versions of a web application:
1. **Vulnerable App** - Contains intentional security flaws for pentesting research
2. **Secure App** - Demonstrates proper security implementations

## Vulnerabilities Included

### Critical Vulnerabilities
1. **Server-Side Request Forgery (SSRF)** - CVE-2024-34351
   - Exploitable via "Import from GitHub" feature
   - Allows access to internal services and metadata endpoints

2. **SQL Injection**
   - User authentication bypass
   - Data exfiltration via login forms

### High Severity Vulnerabilities
3. **Non-Expiring Password Reset Tokens**
   - Tokens remain valid indefinitely
   - Can be reused multiple times

4. **Information Disclosure via Error Messages**
   - Stack traces exposed to frontend
   - Database structure revealed

5. **Directory Listing & Path Traversal**
   - Source code exposure
   - Sensitive file access

6. **Missing Security Headers**
   - No CSP, X-Frame-Options, HSTS
   - Vulnerable to XSS and clickjacking

7. **Cross-Site Scripting (XSS)**
   - Stored XSS in user profiles
   - Reflected XSS in search

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


## ⚠️ Important Notes

* Do **NOT** expose the vulnerable app to the internet.
* Both apps are meant for **local testing only**.
* Perfect for workshops, demos, & red teaming practice.

---

## 🧑‍💻 Author

Created by **Rajsegar_Alagarathnam** for cybersecurity learning and testing.

## License

MIT License - For Educational Purposes Only


