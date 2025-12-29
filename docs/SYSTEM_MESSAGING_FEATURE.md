# System Messaging Feature - Documentation

## Overview

This feature allows Super Admins to send system-wide notifications and emails to agents and buyers. It's designed for sending outage notices, update reports, and other system announcements.

## Features Implemented

### 1. Database Schema
- **Table**: `system_announcements`
- **Location**: `supabase/migrations/20251229_add_system_announcements.sql`
- **Purpose**: Track all system messages sent by admins
- **Fields**:
  - `id`: Unique identifier
  - `admin_user_id`: ID of the admin who sent the message
  - `recipient_type`: 'agents', 'buyers', or 'all'
  - `message_type`: 'notification', 'email', or 'both'
  - `subject`: Message subject
  - `message`: Message content
  - `recipient_count`: Number of recipients
  - `sent_at`: Timestamp
  - `created_at`: Creation timestamp

### 2. Email Template
- **Component**: `SystemAnnouncementEmail`
- **Location**: `src/components/emails/SystemAnnouncementEmail.tsx`
- **Features**:
  - Professional system announcement styling
  - Supports multi-line messages
  - Role-specific greeting (Agent/Buyer)
  - Link to dashboard
  - Responsive design

### 3. API Endpoints

#### Send System Notification
- **Endpoint**: `/api/super-admin/send-system-notification`
- **Method**: POST
- **Auth**: Super Admin required
- **Purpose**: Create in-app notifications (logged to database)
- **Request Body**:
  ```json
  {
    "recipientType": "agents" | "buyers" | "all",
    "subject": "string",
    "message": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "recipientCount": 25,
    "message": "Notification logged for 25 agents"
  }
  ```

#### Send System Email
- **Endpoint**: `/api/super-admin/send-system-email`
- **Method**: POST
- **Auth**: Super Admin required
- **Purpose**: Send emails to all users in a group
- **Request Body**: Same as notification endpoint
- **Response**:
  ```json
  {
    "success": true,
    "successCount": 23,
    "failureCount": 2,
    "totalRecipients": 25,
    "errors": ["email@example.com: Rate limit exceeded"],
    "message": "Successfully sent 23 of 25 emails"
  }
  ```

**Features**:
- Batch processing (50 emails per batch)
- Rate limiting protection (1 second delay between batches)
- Detailed error reporting
- Audit logging
- Uses Resend API for delivery

### 4. UI Components

#### SendSystemMessageDialog
- **Location**: `src/components/features/SendSystemMessageDialog.tsx`
- **Purpose**: Reusable dialog for composing system messages
- **Features**:
  - Subject and message fields
  - Character counter
  - Real-time validation
  - Success/error feedback
  - Automatic close on success
  - Loading states
  - Sample message templates in placeholder

#### All Agents Page Buttons
- **Location**: `src/app/admin/agents/page.tsx`
- **Additions**:
  - "Send Notification" button (Bell icon)
  - "Send Email" button (Mail icon)
  - Both trigger respective dialogs with `recipientType="agents"`

#### All Buyers Page Buttons
- **Location**: `src/app/admin/buyers/page.tsx`
- **Additions**:
  - "Send Notification" button (Bell icon)
  - "Send Email" button (Mail icon)
  - Both trigger respective dialogs with `recipientType="buyers"`

## How to Use

### Setup (First Time)

1. **Apply Database Migration**:
   ```bash
   # Via Supabase Dashboard (recommended):
   # 1. Go to Database > SQL Editor
   # 2. Open: supabase/migrations/20251229_add_system_announcements.sql
   # 3. Run the migration
   
   # OR via Supabase CLI:
   cd estate-portal
   supabase db push
   ```

2. **Verify Environment Variables**:
   ```bash
   # In .env.local or .env.production
   RESEND_API_KEY=re_xxxxx
   SUPABASE_SERVICE_ROLE_KEY=xxxxx
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

### Sending Messages

#### Send to All Agents
1. Navigate to `/admin/agents`
2. Click "Send Notification" or "Send Email"
3. Fill in:
   - **Subject**: Brief description (e.g., "Scheduled Maintenance")
   - **Message**: Detailed message (supports multi-line)
4. Click "Send Notification" or "Send Email"
5. Wait for confirmation

#### Send to All Buyers
1. Navigate to `/admin/buyers`
2. Follow same steps as agents

### Example Use Cases

#### Scheduled Maintenance
```
Subject: Scheduled System Maintenance - Dec 30, 2025

Message:
We will be performing scheduled maintenance on December 30, 2025 from 2:00 AM to 4:00 AM UTC.

During this period, the platform will be temporarily unavailable. We apologize for any inconvenience.

Thank you for your understanding.
```

#### New Feature Announcement
```
Subject: New Feature: Real-Time Translation

Message:
We're excited to announce a new feature - Real-Time Translation!

You can now translate messages instantly in any transaction. This feature is available in your dashboard under the Communications tab.

Learn more at: https://help.thepropertygateway.com/real-time-translation
```

#### Security Update
```
Subject: Important Security Update

Message:
We've deployed an important security update to enhance the protection of your account.

No action is required from you. However, we recommend reviewing your account settings and ensuring your password is strong and unique.

If you have any questions, please contact our support team.
```

## Technical Details

### Security
- **Authentication**: Super Admin JWT token required
- **Authorization**: Checks `profiles.is_super_admin = true`
- **RLS Policies**: Only super admins can view/insert announcements
- **Audit Trail**: All messages logged with admin ID and timestamp

### Email Delivery
- **Service**: Resend API
- **From Address**: `system@mail.thepropertygateway.com`
- **Batch Size**: 50 emails per batch
- **Rate Limiting**: 1 second delay between batches
- **Error Handling**: Continues on individual failures, reports all errors

### In-App Notifications
- **Current Implementation**: Logged to database only
- **Future Enhancement**: Could be implemented using:
  - Supabase Realtime channels
  - Push notifications
  - WebSocket connections
  - Service workers

### Performance
- **Email Sending**: Async batch processing
- **Database Queries**: Optimized with indexes
- **UI**: Non-blocking with loading states

## Testing Checklist

- [ ] Apply database migration successfully
- [ ] Verify super admin can access agents/buyers pages
- [ ] Click "Send Notification" button on agents page
- [ ] Fill in subject and message
- [ ] Send notification successfully
- [ ] Verify entry in `system_announcements` table
- [ ] Click "Send Email" button on buyers page
- [ ] Send email successfully
- [ ] Check that emails were received
- [ ] Verify audit log in database
- [ ] Test with invalid/missing fields (should show error)
- [ ] Test as non-super-admin (should be forbidden)

## Database Queries

### View All Sent Announcements
```sql
SELECT 
  id,
  admin_user_id,
  recipient_type,
  message_type,
  subject,
  recipient_count,
  sent_at
FROM public.system_announcements
ORDER BY sent_at DESC
LIMIT 50;
```

### View Announcements by Admin
```sql
SELECT 
  sa.*,
  p.full_name as admin_name
FROM public.system_announcements sa
JOIN public.profiles p ON p.id = sa.admin_user_id
WHERE sa.admin_user_id = 'USER_ID_HERE'
ORDER BY sa.sent_at DESC;
```

### Count Messages by Type
```sql
SELECT 
  recipient_type,
  message_type,
  COUNT(*) as count,
  SUM(recipient_count) as total_recipients
FROM public.system_announcements
GROUP BY recipient_type, message_type
ORDER BY count DESC;
```

## Troubleshooting

### Emails Not Sending
1. Check `RESEND_API_KEY` is set and valid
2. Verify Resend domain is verified
3. Check API logs for specific errors
4. Verify recipients have valid email addresses

### Notifications Not Appearing
1. Check `system_announcements` table for entries
2. Verify super admin permissions
3. Check browser console for API errors
4. Implement real-time notification system (future enhancement)

### Permission Errors
1. Verify user has `is_super_admin = true` in profiles table
2. Check RLS policies are enabled
3. Verify service role key is correct
4. Check API authentication headers

## Future Enhancements

### Planned Features
1. **In-App Notification System**: Real-time notifications using Supabase channels
2. **Notification History**: UI to view past announcements
3. **Scheduled Messages**: Schedule announcements for future delivery
4. **Message Templates**: Pre-defined templates for common announcements
5. **Rich Text Editor**: HTML formatting support
6. **File Attachments**: Attach documents to announcements
7. **Read Receipts**: Track who has viewed the announcement
8. **User Preferences**: Allow users to opt out of certain notifications
9. **Push Notifications**: Browser/mobile push notifications
10. **Multi-Language Support**: Auto-translate announcements to user's preferred language

## Support

For issues or questions:
1. Check this documentation
2. Review API logs in terminal
3. Check database audit logs
4. Verify environment variables
5. Test with SQL queries to isolate issues

## Change Log

- **2025-12-29**: Initial implementation
  - Created database schema
  - Implemented email sending
  - Added UI components
  - Integrated with All Agents/Buyers pages

