# Supabase Management API - Quick Start

⚠️ **Update:** The public Supabase Management API v1 doesn't expose usage metrics. This feature is **not functional** for getting database size, bandwidth, or MAU.

## ~~Get Real-Time Metrics in 3 Steps~~ (Not Available)

### Step 1: Get Your Token
Go to: https://supabase.com/dashboard/account/tokens
- Click "Generate New Token"
- Copy it (starts with `sbp_`)

### Step 2: Get Your Project Ref
Find it in your Supabase URL:
```
https://supabase.com/dashboard/project/YOUR_PROJECT_REF
```

### Step 3: Add to `.env.local`
```bash
SUPABASE_MANAGEMENT_TOKEN=sbp_your_token_here
SUPABASE_PROJECT_REF=your-project-ref
```

### Step 4: Restart
```bash
# Local
npm run dev

# Production
npm run build && pm2 restart thepropertygateway
```

## What You'll See

Before (Calculated):
- ⚪ Storage (from file sizes)
- ⚪ Total Users (just a count)

After (Live from Supabase):
- 🟢 Storage (actual bucket usage)
- 🟢 Database Size (PostgreSQL size)
- 🟢 Bandwidth (egress data)
- 🟢 Monthly Active Users (true MAU)

See full documentation: `docs/SUPABASE_MANAGEMENT_API_SETUP.md`

