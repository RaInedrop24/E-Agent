# Deployment — Linode (Node + PM2 + Nginx)

The production site (https://www.thepropertygateway.com) runs on a Linode instance using Node.js, PM2, and Nginx as a reverse proxy.

## Current production setup (as of July 2026)

| Item | Value |
|---|---|
| Server | Linode, `172.237.108.52` |
| App directory | `/var/www/thepropertygateway.com/E-Agent` |
| Git remote | `https://github.com/RaInedrop24/E-Agent.git` (branch `main`) |
| Node.js | v20.x |
| PM2 process name | `thepropertygateway` |
| App port | `3003` (proxied by Nginx) |
| Nginx site config | `/etc/nginx/sites-available/thepropertygateway.com` |
| Env file | `.env.production` in the app directory |
| HTTPS | Let's Encrypt via certbot (auto-renews) |

> Note: the repository root on the server **is** the Next.js app — there is no
> `estate-portal` subfolder as in some local checkouts. The server also hosts
> other PM2 apps (e.g. `linguista` on port 3002); leave those alone.

## SSH access

```bash
ssh root@172.237.108.52
# or, with the deploy key configured in ~/.ssh/config:
ssh linode-tpg
```

## Environment variables (`.env.production`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://www.thepropertygateway.com
DEEPL_API_KEY=your-deepl-api-key
RESEND_API_KEY=your-resend-api-key
TWILIO_SID=your-twilio-sid
TWILIO_SECRET=your-twilio-secret
TWILIO_PHONE_NUMBER=your-twilio-number

# Error monitoring (Sentry)
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

`NEXT_PUBLIC_*` variables are baked into the client bundle at **build time**,
so a rebuild (not just a PM2 restart) is required after changing them.

## Standard update/deploy flow

```bash
cd /var/www/thepropertygateway.com/E-Agent
git pull
npm install --legacy-peer-deps   # legacy flag needed: react-joyride pins React <=18
npm run build
pm2 restart thepropertygateway --update-env
```

Verify:

```bash
pm2 status
curl -s -o /dev/null -w 'HTTP %{http_code}\n' http://127.0.0.1:3003
pm2 logs thepropertygateway --lines 20 --nostream
```

## Fresh server setup (reference)

Only needed if rebuilding the server from scratch.

### 1) System packages

```bash
sudo apt update && sudo apt install -y git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

### 2) Clone and configure

```bash
cd /var/www
sudo mkdir -p thepropertygateway.com && sudo chown $USER:$USER thepropertygateway.com
cd thepropertygateway.com
git clone https://github.com/RaInedrop24/E-Agent.git
cd E-Agent
# create .env.production with the variables listed above
```

### 3) Build and run with PM2

```bash
npm install --legacy-peer-deps
npm run build
PORT=3003 pm2 start npm --name thepropertygateway -- start -- -p 3003
pm2 save
pm2 startup systemd   # follow printed instructions, then: pm2 save
```

### 4) Nginx reverse proxy

```bash
sudo tee /etc/nginx/sites-available/thepropertygateway.com << 'EOF'
server {
  listen 80;
  server_name thepropertygateway.com www.thepropertygateway.com;

  location / {
    proxy_pass http://127.0.0.1:3003;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
EOF
sudo ln -s /etc/nginx/sites-available/thepropertygateway.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5) HTTPS

```bash
sudo snap install --classic certbot
sudo certbot --nginx -d thepropertygateway.com -d www.thepropertygateway.com
```

## Troubleshooting

- **"Failed to find Server Action" errors after deploy** — expected noise from
  browser tabs opened before the deploy; they clear as users refresh.
- **Port already in use** — check `ss -tlnp | grep 3003` and `pm2 status`.
- **Env change not taking effect** — rebuild if it's a `NEXT_PUBLIC_*` var,
  and always restart with `pm2 restart thepropertygateway --update-env`.
