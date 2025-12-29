# Resend Rate Limits & Upgrades

## Current Implementation

The system email API now respects Resend's rate limits:

**Current Setting**: 2 emails per second (Free tier)
- Sends emails in batches of 2
- Waits 1 second between batches
- Progress logged to console

**For 22 buyers**: Takes ~11 seconds to send all emails (22 ÷ 2 = 11 batches)
**For 6 agents**: Takes ~3 seconds (6 ÷ 2 = 3 batches)

## Resend Pricing Tiers

### Free Tier (Current)
- ✅ **Cost**: $0/month
- ⚠️ **Rate Limit**: 2 emails/second
- ⚠️ **Monthly Limit**: 100 emails/day, 3,000/month
- Good for: Testing, small announcements

### Pro Tier ($20/month)
- 💰 **Cost**: $20/month
- ✅ **Rate Limit**: 10 emails/second (5x faster!)
- ✅ **Monthly Limit**: 50,000 emails/month
- ✅ **Features**: Custom domains, analytics
- Good for: Production use

### Business Tier ($200/month+)
- 💰 **Cost**: Starting at $200/month
- ✅ **Rate Limit**: 50+ emails/second
- ✅ **Monthly Limit**: 250,000+ emails/month
- ✅ **Features**: Dedicated IPs, priority support
- Good for: Large-scale operations

## How to Upgrade

### Option 1: Upgrade Your Plan
1. Go to: https://resend.com/settings/billing
2. Choose Pro plan ($20/month)
3. Update payment method
4. Instant upgrade!

### Option 2: Configure Higher Rate Limit
If you upgrade your Resend plan, update the rate limit in the code:

**File**: `src/app/api/super-admin/send-system-email/route.ts`

```typescript
// Change this line based on your Resend plan:
const EMAILS_PER_SECOND = 2;  // Free tier

// To:
const EMAILS_PER_SECOND = 10; // Pro tier
// or
const EMAILS_PER_SECOND = 50; // Business tier
```

**Or** add to `.env`:
```env
# Add this to your .env.local or .env.production
RESEND_RATE_LIMIT=10  # Pro tier
```

Then update the code to read from env:
```typescript
const EMAILS_PER_SECOND = parseInt(process.env.RESEND_RATE_LIMIT || '2');
```

## Performance Comparison

### Free Tier (2/sec)
- 10 recipients: 5 seconds
- 25 recipients: 12.5 seconds
- 50 recipients: 25 seconds
- 100 recipients: 50 seconds

### Pro Tier (10/sec)
- 10 recipients: 1 second
- 25 recipients: 2.5 seconds
- 50 recipients: 5 seconds
- 100 recipients: 10 seconds

### Business Tier (50/sec)
- 10 recipients: < 1 second
- 25 recipients: < 1 second
- 50 recipients: 1 second
- 100 recipients: 2 seconds

## Alternative: Use Environment Variable

**Recommended approach** for easy configuration:

### 1. Add to `.env.local`:
```env
# Resend Configuration
RESEND_API_KEY=re_your_key_here
RESEND_RATE_LIMIT=2  # Change to 10 for Pro, 50 for Business
```

### 2. Update the code:
```typescript
// At the top of send-system-email/route.ts
const EMAILS_PER_SECOND = parseInt(process.env.RESEND_RATE_LIMIT || '2');
const DELAY_MS = 1000; // 1 second between batches
```

### 3. When you upgrade:
Just change `RESEND_RATE_LIMIT=10` in `.env` - no code changes needed!

## Monitoring Rate Limits

Check your current usage:
1. Go to: https://resend.com/dashboard
2. View: Settings > Usage
3. See: Daily/monthly email counts and limits

## Recommendations

### For Development/Testing
- ✅ **Free tier is fine** (2/sec)
- Emails send slower but it works
- Good for testing the feature

### For Production
- ⚠️ **Consider Pro tier** ($20/month)
- 5x faster email sending
- 50,000 emails/month (plenty for system notifications)
- Professional appearance

### When to Upgrade
Upgrade to Pro if:
- You send notifications to 50+ users regularly
- Users complain about slow delivery
- You hit the 100 emails/day limit
- You want custom email domain

## Current Code Behavior

With the updated code:
- ✅ Respects rate limits (no more 429 errors!)
- ✅ Logs progress to console
- ✅ Reports success/failure counts
- ✅ Handles errors gracefully
- ✅ Works on any Resend tier

**Console output example:**
```
[System Email] Sent to user1@example.com (User 1)
[System Email] Sent to user2@example.com (User 2)
[System Email] Rate limiting: waiting 1000ms... (2/22 sent)
[System Email] Sent to user3@example.com (User 3)
[System Email] Sent to user4@example.com (User 4)
[System Email] Rate limiting: waiting 1000ms... (4/22 sent)
...
[System Email] Completed: 22 sent, 0 failed
```

## Testing

After the update, test with:
1. Send notification to all buyers (22 users)
2. Check console - should see progress logs
3. Should complete in ~11 seconds
4. All 22 emails should be delivered!

No more rate limit errors! 🎉

