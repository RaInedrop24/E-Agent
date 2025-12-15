# Linode Server Documentation

## 🖥️ Server Overview

**Server IP:** `172.237.108.52`  
**OS:** Ubuntu 24.04.3 LTS  
**Hostname:** localhost  
**Node.js Version:** v20.19.6  
**Nginx Version:** 1.24.0  
**PM2 Version:** 6.0.13  

---

## 📊 Port Allocations

| Port | Service | Application | Status |
|------|---------|-------------|--------|
| 22 | SSH | System | ✅ Active |
| 53 | DNS | systemd-resolved | ✅ Active |
| 80 | HTTP | Nginx | ✅ Active |
| 443 | HTTPS | Nginx (with Let's Encrypt SSL) | ✅ Active |
| 5678 | Docker | Docker Proxy | ✅ Active |
| 8001 | Python App | Unknown | ✅ Active |
| 8080 | Python App | Unknown | ✅ Active |
| 8081 | Python App | Unknown | ✅ Active |
| **3002** | **Node.js** | **Linguista** | **✅ IN USE** |
| **3003** | **Node.js** | **The Property Gateway** | **✅ IN USE** |

---

## 🌐 Deployed Sites

### 1. **Linguista** (`linguista.rainedrop.co.uk`)
- **PM2 Name:** `linguista`
- **Port:** 3002
- **Status:** ✅ Online
- **Directory:** `/var/www/linguista/`
- **Nginx Config:** `/etc/nginx/sites-enabled/linguista.rainedrop.co.uk`
- **SSL:** ✅ Enabled

### 2. **The Property Gateway** (`thepropertygateway.com`)
- **PM2 Name:** `thepropertygateway`
- **Port:** 3003
- **Status:** ✅ Online
- **Directory:** `/var/www/thepropertygateway.com/E-Agent/`
- **Nginx Config:** `/etc/nginx/sites-enabled/thepropertygateway.com`
- **SSL:** ✅ Enabled (Let's Encrypt, expires 2026-03-15)
- **Environment:** Production
- **Supabase URL:** `https://skvfgvlwccxetglmfhpm.supabase.co`
- **DeepL API:** Configured
- **Build:** Next.js 16.0.10 (Turbopack)
- **Memory Usage:** ~180MB

### 3. **Match Stats** (`matchstats.rainedrop.co.uk`)
- **Nginx Config:** `/etc/nginx/sites-enabled/matchstats.conf`
- **Directory:** `/var/www/matchstats.rainedrop.co.uk/`

### 4. **Snooker Tracker**
- **Nginx Config:** `/etc/nginx/sites-enabled/snooker-tracker`

### 5. **Swifts**
- **Nginx Config:** `/etc/nginx/sites-enabled/swifts.conf`
- **Directory:** `/var/www/swifts/`

### 6. **Rainedrop Root** (`rainedrop.co.uk`)
- **Nginx Config:** `/etc/nginx/sites-enabled/rainedrop-root.conf`
- **Directory:** `/var/www/rainedrop.co.uk/`

### 7. **Dev Site** (`dev.rainedrop.co.uk`)
- **Nginx Config:** `/etc/nginx/sites-enabled/dev.conf`
- **Directory:** `/var/www/dev.rainedrop.co.uk/`

### 8. **n8n** (Automation)
- **Nginx Config:** `/etc/nginx/sites-enabled/n8n`

---

## 🔧 PM2 Configuration

### Current PM2 Processes

```bash
pm2 list
```

| ID | Name | Port | Mode | Status | CPU | Memory |
|----|------|------|------|--------|-----|--------|
| 0 | linguista | 3002 | fork | online | 0% | ~55MB |
| 6 | thepropertygateway | 3003 | fork | online | 0% | ~180MB |

### PM2 Commands Reference

```bash
# List all processes
pm2 list

# Start a process
pm2 start <app-name>

# Stop a process
pm2 stop <app-name>

# Restart a process
pm2 restart <app-name>

# Delete a process
pm2 delete <app-name>

# View logs
pm2 logs <app-name>

# View detailed info
pm2 describe <app-name>

# Save current process list (for auto-restart on reboot)
pm2 save

# Monitor processes
pm2 monit
```

### PM2 Startup Configuration

PM2 is configured to auto-start on system boot:
```bash
# Already configured, saved at: /etc/systemd/system/pm2-root.service
# To verify: systemctl status pm2-root
```

---

## 🔐 SSL Certificates (Let's Encrypt)

### Installed Certificates

1. **thepropertygateway.com**
   - Certificate: `/etc/letsencrypt/live/thepropertygateway.com/fullchain.pem`
   - Private Key: `/etc/letsencrypt/live/thepropertygateway.com/privkey.pem`
   - Expires: **2026-03-15**
   - Auto-renewal: ✅ Enabled (via certbot)

### Certbot Commands

```bash
# List all certificates
certbot certificates

# Renew all certificates
certbot renew

# Test renewal process
certbot renew --dry-run

# Renew specific certificate
certbot renew --cert-name thepropertygateway.com
```

---

## 🔄 Nginx Configuration

### Main Configuration
- **Config File:** `/etc/nginx/nginx.conf`
- **Sites Available:** `/etc/nginx/sites-available/`
- **Sites Enabled:** `/etc/nginx/sites-enabled/`

### Nginx Commands

```bash
# Test configuration
nginx -t

# Reload configuration (no downtime)
systemctl reload nginx

# Restart nginx
systemctl restart nginx

# Check status
systemctl status nginx

# View error log
tail -f /var/log/nginx/error.log

# View access log
tail -f /var/log/nginx/access.log
```

### Adding a New Site

1. Create config in `/etc/nginx/sites-available/sitename`
2. Enable with symlink: `ln -s /etc/nginx/sites-available/sitename /etc/nginx/sites-enabled/`
3. Test config: `nginx -t`
4. Reload: `systemctl reload nginx`
5. Add SSL: `certbot --nginx -d domain.com`

---

## 🐛 Common Issues & Solutions

### Issue 1: Port Conflicts (RESOLVED)

**Problem:** Multiple applications trying to use the same port.

**Example:** The Property Gateway initially tried to use port 3002, which was already used by Linguista.

**Solution:**
1. Check which ports are in use: `netstat -tulpn | grep LISTEN`
2. Check specific port: `lsof -i :PORT`
3. Stop conflicting process: `pm2 stop <app-name>` or `kill -9 <PID>`
4. Assign new port in PM2 ecosystem.config.js
5. Update corresponding Nginx configuration
6. Reload Nginx: `systemctl reload nginx`

**Current Status:** ✅ Resolved - The Property Gateway now uses port 3003

### Issue 2: Missing BUILD_ID in Next.js

**Problem:** PM2 logs show "Could not find a production build in the '.next' directory"

**Symptoms:**
- PM2 process crashes immediately
- Error: "Try building your app with 'next build'"
- `.next` directory exists but BUILD_ID file is missing

**Solution:**
1. Verify all environment variables are in `.env.production`
2. Ensure SUPABASE_SERVICE_ROLE_KEY is included (required for API routes during build)
3. Clean and rebuild: `rm -rf .next && npm run build`
4. Verify BUILD_ID created: `ls -la .next/BUILD_ID`
5. Restart PM2: `pm2 restart <app-name>`

**Current Status:** ✅ Resolved - All environment variables configured, build completes successfully

---

## 🔄 Managing The Property Gateway

### Quick Reference Commands

```bash
# Navigate to project
cd /var/www/thepropertygateway.com/E-Agent

# Check PM2 status
pm2 list
pm2 describe thepropertygateway

# View logs
pm2 logs thepropertygateway --lines 50

# Restart application
pm2 restart thepropertygateway

# Pull latest changes from GitHub
git pull origin main

# Rebuild and deploy
npm ci
npm run build
pm2 restart thepropertygateway

# Test the site
curl -I https://thepropertygateway.com
curl -s https://thepropertygateway.com | grep "<title>"
```

### Environment Variables

Located at: `/var/www/thepropertygateway.com/E-Agent/.env.production`

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for API routes)
- `DEEPL_API_KEY` - DeepL translation API key
- `NEXT_PUBLIC_SITE_URL` - Full site URL (https://thepropertygateway.com)

### PM2 Configuration

**Ecosystem File:** `/var/www/thepropertygateway.com/E-Agent/ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'thepropertygateway',
    script: 'node_modules/.bin/next',
    args: 'start -p 3003',
    cwd: '/var/www/thepropertygateway.com/E-Agent',
    env: {
      NODE_ENV: 'production',
      PORT: 3003
    },
    error_file: '/root/.pm2/logs/thepropertygateway-error.log',
    out_file: '/root/.pm2/logs/thepropertygateway-out.log'
  }]
};
```

---

## 📝 Maintenance Tasks

### Regular Maintenance

- **Weekly:** Check PM2 process status (`pm2 list`)
- **Monthly:** Review Nginx logs for errors
- **Quarterly:** Update system packages (`apt update && apt upgrade`)
- **As Needed:** Monitor disk usage (`df -h`)

### System Updates

```bash
# Update package lists
apt update

# Upgrade packages
apt upgrade -y

# Reboot if required
reboot
```

### Backup Recommendations

**Critical Directories to Backup:**
- `/var/www/` - All website files
- `/etc/nginx/sites-available/` - Nginx configurations
- `/root/.pm2/` - PM2 configurations
- `/etc/letsencrypt/` - SSL certificates

---

## 🚀 Deployment Workflow for New Sites

### 1. Prepare Application
```bash
cd /var/www
mkdir sitename.com && cd sitename.com
git clone <repository-url> .
npm install
npm run build
```

### 2. Configure Environment
```bash
# Create .env.production with required variables
cat > .env.production << EOF
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
EOF
```

### 3. Start with PM2
```bash
# Find available port (check port allocations above)
PORT=3004 pm2 start "node_modules/.bin/next start -p 3004" --name sitename
pm2 save
```

### 4. Configure Nginx
```bash
cat > /etc/nginx/sites-available/sitename.com << 'EOF'
server {
  listen 80;
  server_name sitename.com www.sitename.com;

  location / {
    proxy_pass http://127.0.0.1:3004;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
EOF

ln -s /etc/nginx/sites-available/sitename.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 5. Add SSL
```bash
certbot --nginx -d sitename.com -d www.sitename.com --non-interactive --agree-tos --register-unsafely-without-email
```

### 6. Verify
```bash
pm2 list
curl -I https://sitename.com
```

---

## 🔍 Troubleshooting Guide

### PM2 Process Keeps Crashing

**Check logs:**
```bash
pm2 logs <app-name> --lines 50
```

**Common causes:**
- Port already in use (check with `lsof -i :PORT`)
- Missing environment variables
- Build errors
- Database connection issues

### Site Not Loading

**Check Nginx:**
```bash
nginx -t
systemctl status nginx
tail -f /var/log/nginx/error.log
```

**Check PM2:**
```bash
pm2 list
pm2 logs <app-name>
```

**Check if app is responding locally:**
```bash
curl -I http://localhost:PORT
```

### SSL Certificate Issues

**Renew certificate:**
```bash
certbot renew --cert-name domain.com
systemctl reload nginx
```

**Check certificate expiry:**
```bash
certbot certificates
```

---

## 📞 Contact & Resources

- **Server Provider:** Linode
- **DNS Provider:** Porkbun
- **SSL Provider:** Let's Encrypt (Certbot)

### Useful Commands Cheat Sheet

```bash
# Quick server health check
pm2 list && systemctl status nginx && df -h

# View all listening ports
netstat -tulpn | grep LISTEN

# Find process using specific port
lsof -i :PORT

# Kill process on port
lsof -ti:PORT | xargs kill -9

# Check system resources
htop

# View system logs
journalctl -xe

# Check disk space
df -h

# Check memory usage
free -h
```

---

## 📅 Last Updated

**Date:** December 15, 2025  
**Updated By:** AI Assistant  
**Version:** 1.1

---

## 🔄 Change Log

### 2025-12-15 (v1.1) - Deployment Complete
- ✅ The Property Gateway successfully deployed
- ✅ All sites running and stable
- ✅ Port 3003 allocated to The Property Gateway
- ✅ SSL certificate installed and working
- ✅ Resolved port conflict (moved from 3002 to 3003)
- ✅ Fixed BUILD_ID issue with complete environment variables
- ✅ Updated PM2 process table with current status
- ✅ Documented common issues and solutions

### 2025-12-15 (v1.0) - Initial Documentation
- Initial documentation created
- Documented all deployed sites
- Listed all port allocations
- Added deployment workflow
- Added troubleshooting guide

