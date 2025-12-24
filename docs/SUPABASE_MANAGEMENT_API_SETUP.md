# Supabase Management API Setup Guide

⚠️ **Important Update:** The public Supabase Management API (v1) does **NOT** expose usage metrics like database size, bandwidth, or MAU. These metrics are only available through the Supabase Dashboard UI.

## What You Can Get

~~With the Management API configured, you'll see real-time metrics instead of calculated estimates~~

**Reality:** The Management API can only verify your project connection. It cannot provide:
- ❌ **Database Size** - Not available via public API
- ❌ **Storage** - Not available via public API
- ❌ **Bandwidth (Egress)** - Not available via public API
- ❌ **Monthly Active Users (MAU)** - Not available via public API

**What it CAN do:**
- ✅ Verify project exists and is accessible
- ✅ Get basic project info (name, region, status)

## Step 1: Get Your Personal Access Token (PAT)

1. Go to [Supabase Account Settings](https://supabase.com/dashboard/account/tokens)
2. Click **"Generate New Token"**
3. Give it a name like "Estate Portal Metrics"
4. **Copy the token** - You won't be able to see it again!

Example token format:
```
sbp_1234567890abcdef1234567890abcdef1234567890
```

## Step 2: Get Your Project Reference

Your Project Reference is in your Supabase project URL:

```
https://supabase.com/dashboard/project/YOUR_PROJECT_REF
                                          ^^^^^^^^^^^^^^^^
```

Or you can find it in: **Project Settings → General → Reference ID**

Example:
```
skvfgvlwccxetglmfhpm
```

## Step 3: Add to Your Environment Variables

### Local Development

Add these to your `.env.local` file:

```bash
# Supabase Management API (for real-time metrics)
SUPABASE_MANAGEMENT_TOKEN=sbp_1234567890abcdef1234567890abcdef1234567890
SUPABASE_PROJECT_REF=your-project-ref-here
```

### Production (Linode Server)

1. SSH into your server:
   ```bash
   ssh root@your-server-ip
   ```

2. Navigate to your project:
   ```bash
   cd /var/www/thepropertygateway.com/E-Agent
   ```

3. Edit your environment file:
   ```bash
   nano .env.local
   # or
   nano .env.production
   ```

4. Add the variables:
   ```bash
   SUPABASE_MANAGEMENT_TOKEN=sbp_your_token_here
   SUPABASE_PROJECT_REF=your-project-ref-here
   ```

5. Save and exit (Ctrl+X, then Y, then Enter)

6. Rebuild and restart:
   ```bash
   npm run build
   pm2 restart thepropertygateway
   ```

## Step 4: Verify It's Working

1. Log in to your Super Admin Dashboard
2. You should see a green badge that says **"Management API Connected"**
3. Metrics will have a **"Live"** badge next to them
4. You'll see new metrics:
   - Database Size
   - Bandwidth (Egress)
   - Monthly Active Users (MAU)

If it's not working, check the server logs:
```bash
pm2 logs thepropertygateway --lines 50
```

Look for lines like:
```
[Metrics API] Management API data: ...
```

If you see errors, they'll be logged there.

## Security Notes

🔒 **Keep your PAT secure!**

- Never commit it to git
- Never share it publicly
- Treat it like a password
- You can revoke it at any time from Supabase Account Settings

## Permissions

The Personal Access Token has access to:
- ✅ Read project metrics and usage data
- ✅ View project settings
- ❌ Cannot modify your database
- ❌ Cannot delete or create projects
- ❌ Cannot access user data

It's safe to use for read-only metrics.

## Troubleshooting

### Error: "Supabase Management API error: 401"

Your token is invalid or expired. Generate a new one.

### Error: "Supabase Management API error: 404"

Your `SUPABASE_PROJECT_REF` is incorrect. Double-check it in your Supabase dashboard.

### Error: "Management API not available"

Some metrics endpoints might not be available in all Supabase plans. The API will gracefully fall back to calculated metrics if certain endpoints aren't accessible.

### Metrics Still Show "Calculated"

1. Check that both environment variables are set correctly
2. Restart your application (locally: restart dev server, production: `pm2 restart`)
3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Check server logs for error messages

## API Endpoints Used

The Management API client uses these Supabase API endpoints:

```
GET /v1/projects/{ref}                    - Project details
GET /v1/projects/{ref}/database/stats     - Database size
GET /v1/projects/{ref}/storage/stats      - Storage usage
GET /v1/projects/{ref}/usage              - Usage metrics (bandwidth, MAU, etc.)
```

## Further Reading

- [Supabase Management API Docs](https://supabase.com/docs/reference/api/introduction)
- [Personal Access Tokens](https://supabase.com/docs/guides/platform/access-tokens)

