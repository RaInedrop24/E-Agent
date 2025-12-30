# Production Deployment Guide

## Git Pull Issues on Production Server

### Common Issue: package-lock.json Conflicts

**Problem**: When pulling from main branch, you get:
```
error: Your local changes to the following files would be overwritten by merge:
        package-lock.json
```

**Why it happens**: 
- `package-lock.json` gets auto-generated when you run `npm install`
- If you run `npm install` on the server before pulling, it modifies `package-lock.json`
- Git sees local changes and won't overwrite them

## Quick Fix (Right Now)

### Option 1: Discard Local Changes (Recommended for package-lock.json)

```bash
# On production server
cd /var/www/thepropertygateway.com/E-Agent

# Discard local changes to package-lock.json
git checkout -- package-lock.json

# Now pull again
git pull origin main

# Then install dependencies if needed
npm install
```

### Option 2: Stash Changes

```bash
# Stash local changes
git stash

# Pull changes
git pull origin main

# Apply stashed changes (if needed)
git stash pop

# If conflicts, just discard package-lock.json changes
git checkout -- package-lock.json
npm install
```

## Prevention Strategy

### Best Practice: Always Reset package-lock.json Before Pulling

Create a simple script or follow this workflow:

```bash
# 1. Always reset package-lock.json before pulling
git checkout -- package-lock.json

# 2. Pull latest changes
git pull origin main

# 3. Then install dependencies (this will regenerate package-lock.json)
npm install
```

### Create a Deployment Script

Create `deploy.sh` on your server:

```bash
#!/bin/bash
# Production deployment script

cd /var/www/thepropertygateway.com/E-Agent

echo "🔄 Resetting package-lock.json..."
git checkout -- package-lock.json

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building application..."
npm run build

echo "🔄 Restarting PM2..."
pm2 restart the-property-gateway

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

Then just run:
```bash
./deploy.sh
```

## Why package-lock.json Changes

`package-lock.json` can differ between environments due to:
- Different npm versions
- Different Node.js versions
- Platform-specific dependencies
- Dependency resolution differences

## Recommended Workflow

### On Development Machine
1. Make code changes
2. Run `npm install` if you add dependencies
3. **Commit `package-lock.json`** with your changes
4. Push to main

### On Production Server
1. **Always reset `package-lock.json` first**
2. Pull latest changes
3. Run `npm install` (regenerates lock file for production)
4. Build and restart

## Alternative: Ignore package-lock.json (Not Recommended)

You could add it to `.gitignore`, but this is **not recommended** because:
- ❌ Different environments might get different dependency versions
- ❌ Breaks reproducible builds
- ❌ Can cause "works on my machine" issues

**Better**: Keep it in git, just always reset it on production before pulling.

## Quick Reference Commands

```bash
# Fix current issue
git checkout -- package-lock.json && git pull origin main && npm install

# Safe pull workflow
git checkout -- package-lock.json
git pull origin main
npm install
npm run build
pm2 restart the-property-gateway
```

## Troubleshooting

### If you still get conflicts:

```bash
# Force reset to remote version
git fetch origin
git reset --hard origin/main

# Then install
npm install
```

### If package-lock.json keeps changing:

Check your npm version:
```bash
npm --version
```

Make sure it matches between dev and production (or at least is close).

---

**TL;DR**: Always run `git checkout -- package-lock.json` before `git pull` on production! 🚀

