# Deployment — Linode (Node + PM2 + Nginx)

This guide deploys the Next.js app for live testing on a Linode instance using Node.js, PM2, and Nginx as a reverse proxy.

## Prerequisites
- Linode instance (Ubuntu 22.04+ recommended)
- Node.js 18+ installed
- Git installed
- Domain or subdomain (optional) pointing to server IP

## 1) System setup
```bash
sudo apt update && sudo apt install -y git nginx
```

Install Node.js 18:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Install PM2:
```bash
sudo npm i -g pm2
pm2 -v
```

## 2) Clone repository
```bash
cd /var/www
sudo mkdir -p thepropertygateway.com && sudo chown $USER:$USER thepropertygateway.com
cd thepropertygateway.com
git clone https://github.com/RaInedrop24/E-Agent.git
cd E-Agent/estate-portal
```

## 3) Environment variables
Create `.env.production` or `.env.local`:
```bash
cat > .env.production << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
DEEPL_API_KEY=your-deepl-api-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
EOF
```

## 4) Install and build
```bash
npm ci || npm install
npm run build
```

## 5) Run with PM2 (port 3001)
```bash
PORT=3001 pm2 start npm --name thepropertygateway -- start -- -p 3001
pm2 save
pm2 status
```

Optional: enable PM2 startup
```bash
pm2 startup systemd
# follow printed instructions, then:
pm2 save
```

## 6) Nginx reverse proxy
```bash
sudo tee /etc/nginx/sites-available/thepropertygateway << 'EOF'
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
EOF
```

Enable site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/thepropertygateway /etc/nginx/sites-enabled/thepropertygateway
sudo nginx -t
sudo systemctl reload nginx
```

## 7) HTTPS (optional, recommended)
```bash
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d your-domain.com
```

## 8) Update/deploy flow
```bash
cd /var/www/thepropertygateway.com/E-Agent/estate-portal
git pull
npm ci || npm install
npm run build
pm2 restart thepropertygateway
```

## Notes
- Ensure Supabase and DeepL keys are valid before testing translation features.
- For quick tests without a domain, you can skip Nginx and access `http://SERVER_IP:3001`.


