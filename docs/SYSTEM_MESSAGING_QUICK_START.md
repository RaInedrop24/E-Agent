# System Messaging - Quick Start Guide

## 🎯 Quick Overview

Super Admins can now send system notifications and emails to agents and buyers from the admin dashboard.

## 📍 Where to Find the Buttons

### All Agents Page (`/admin/agents`)
```
┌─────────────────────────────────────────────────────────────┐
│  ← All Agents                                               │
│                                                              │
│  [🔔 Send Notification]  [✉️ Send Email]  [🛡️ Super Admin] │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Total Agents: 25                                      │ │
│  │  Active Agents: 15                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Agent List...]                                            │
└─────────────────────────────────────────────────────────────┘
```

### All Buyers Page (`/admin/buyers`)
```
┌─────────────────────────────────────────────────────────────┐
│  ← All Buyers                                               │
│                                                              │
│  [🔔 Send Notification]  [✉️ Send Email]  [🛡️ Super Admin] │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Total Buyers: 50                                      │ │
│  │  Active Buyers: 30                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Buyer List...]                                            │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 3-Step Process

### Step 1: Navigate
Go to either:
- `/admin/agents` - To message all agents
- `/admin/buyers` - To message all buyers

### Step 2: Choose Type
Click:
- **Send Notification** - For in-app notification (logged to database)
- **Send Email** - For email to all users

### Step 3: Compose & Send
1. Enter **Subject** (e.g., "System Maintenance Notice")
2. Enter **Message** (multi-line supported)
3. Click **Send**
4. Wait for confirmation ✓

## 📝 Common Use Cases

### 🔧 Maintenance Notice
```
Subject: Scheduled Maintenance - Dec 30
Message: System will be unavailable Dec 30, 2-4 AM UTC for maintenance.
```

### 🎉 New Feature
```
Subject: New Feature: Real-Time Translation
Message: We've added instant message translation! Check it out in your dashboard.
```

### ⚠️ Security Alert
```
Subject: Important Security Update
Message: We've deployed a security update. No action required on your part.
```

### 📢 Policy Update
```
Subject: Terms of Service Update
Message: Our Terms of Service have been updated. Review them at [link].
```

## ⚙️ Setup (First Time Only)

Run this SQL in Supabase Dashboard > SQL Editor:

```sql
-- Copy and paste the contents from:
-- supabase/migrations/20251229_add_system_announcements.sql
```

## ✅ What Happens When You Send

### Email
1. System fetches all agents/buyers from database
2. Gets their email addresses from auth system
3. Sends professional branded emails in batches
4. Reports success/failure count
5. Logs to `system_announcements` table

### Notification
1. System fetches all agents/buyers from database
2. Logs notification to `system_announcements` table
3. Reports recipient count
4. *(Future: Display in user's dashboard)*

## 📊 Monitoring

Check sent messages in database:
```sql
SELECT 
  subject,
  recipient_type,
  message_type,
  recipient_count,
  sent_at
FROM system_announcements
ORDER BY sent_at DESC
LIMIT 10;
```

## 🔒 Security

- ✅ Only Super Admins can access
- ✅ All messages are logged with admin ID
- ✅ Full audit trail in database
- ✅ Secure authentication required

## 💡 Pro Tips

1. **Be Clear**: Use descriptive subjects
2. **Be Concise**: Keep messages focused
3. **Include Dates**: Specify exact times for maintenance
4. **Add Links**: Include relevant documentation links
5. **Test First**: Send yourself a test email first

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Buttons not visible | Verify you're logged in as super admin |
| Email not sending | Check RESEND_API_KEY in environment |
| Permission denied | Verify `is_super_admin = true` in profiles table |
| Migration error | Ensure migration is applied in Supabase |

## 📚 More Information

See full documentation at:
- `docs/SYSTEM_MESSAGING_FEATURE.md` - Complete technical docs
- `SYSTEM_MESSAGING_IMPLEMENTATION.md` - Implementation summary

---

**Ready to use!** 🚀
Navigate to `/admin/agents` or `/admin/buyers` and start sending system messages!

