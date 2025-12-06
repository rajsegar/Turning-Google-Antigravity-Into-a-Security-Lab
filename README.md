# Vulnerable Website - Pentesting Research Project

⚠️ **WARNING**: This project contains intentionally vulnerable code for educational and research purposes only. DO NOT deploy to production or expose to the internet.

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
vulnerable-website/
├── vulnerable-app/          # Intentionally vulnerable version
│   ├── backend/            # Node.js/Express API
│   ├── frontend/           # HTML/CSS/JS client
│   └── database/           # SQLite database
├── secure-app/             # Secure implementation
│   ├── backend/
│   ├── frontend/
│   └── database/
└── docs/                   # Vulnerability documentation
    ├── exploitation-guide.md
    ├── remediation-guide.md
    └── owasp-mapping.md
```

## Quick Start

### Running Vulnerable Application
```bash
cd vulnerable-app/backend
npm install
npm run dev
```

### Running Secure Application
```bash
cd secure-app/backend
npm install
npm run dev
```

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

## License

MIT License - For Educational Purposes Only
