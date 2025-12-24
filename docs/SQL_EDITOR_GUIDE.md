# SQL Query Editor - Super Admin Guide

## Overview

The SQL Query Editor is a powerful tool available to Super Admins that allows you to execute SQL queries directly against your production database. This tool is useful for:

- Analyzing system data
- Generating custom reports
- Debugging issues
- Performing bulk operations
- Gathering insights not available in standard dashboards

## Access

**Location**: Super Admin Dashboard → SQL Query Editor

**Requirements**:
- Super Admin role (`is_super_admin = true` in profiles table)
- Active authentication session

## Features

### 1. **Query Editor**
- Syntax-highlighted text area for writing SQL queries
- Character counter
- Copy to clipboard functionality
- Monospace font for better readability

### 2. **Example Queries**
Pre-built queries for common tasks:
- **User Overview** - Summary of all users, roles, and activity
- **Transaction Statistics** - Overview of transactions by status
- **Top Agents by Transactions** - Most active agents
- **Milestone Templates Usage** - Most used templates
- **Storage Analysis** - File storage usage
- **Recent Activity Log** - Last 50 system activities
- **Milestone Completion Rates** - Completion rates by transaction
- **User Language Preferences** - Distribution of preferred languages
- **Database Tables Overview** - All tables with row counts
- **Super Admin List** - All users with super admin access

### 3. **Write Protection**
- Write operations (INSERT, UPDATE, DELETE, etc.) are **disabled by default**
- Must explicitly enable "Allow Write Operations" switch
- Helps prevent accidental data modifications

### 4. **Query Results**
- Tabular display of results
- Row count and execution time
- Handles null values and JSON objects
- Support for large result sets
- Automatic scrolling for wide tables

### 5. **Error Handling**
- Detailed error messages from PostgreSQL
- Error hints and suggestions
- SQL error codes
- Execution time even on errors

## Security

### Protection Mechanisms

1. **Authentication Check**: Verifies user session token
2. **Super Admin Verification**: Confirms `is_super_admin = true`
3. **Write Protection**: Blocks write operations unless explicitly enabled
4. **SQL Injection Protection**: Uses prepared statements via RPC
5. **Timeout Protection**: 30-second query timeout
6. **Audit Trail**: All queries can be logged (enable if needed)

### Best Practices

✅ **DO:**
- Test queries on development first
- Use `LIMIT` clauses for large tables
- Review example queries before running
- Use read-only queries when possible
- Keep the "Allow Write Operations" switch OFF unless needed

❌ **DON'T:**
- Run queries you don't understand
- Execute untrusted queries from external sources
- Delete data without backups
- Run queries without `WHERE` clauses on large tables
- Share your super admin credentials

## Example Queries Explained

### User Overview
```sql
SELECT 
  role,
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_super_admin THEN 1 END) as super_admins,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
  COUNT(CASE WHEN updated_at > NOW() - INTERVAL '1 day' THEN 1 END) as active_today
FROM profiles
GROUP BY role
ORDER BY total_users DESC;
```
**Purpose**: Get counts of users by role, including super admins, recent signups, and active users.

### Transaction Statistics
```sql
SELECT 
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as created_last_30_days,
  AVG(
    (SELECT COUNT(*) FROM milestones m WHERE m.transaction_id = t.id AND m.completed)::float / 
    NULLIF((SELECT COUNT(*) FROM milestones m WHERE m.transaction_id = t.id), 0) * 100
  )::numeric(5,2) as avg_completion_rate
FROM transactions t
GROUP BY status
ORDER BY count DESC;
```
**Purpose**: Analyze transactions by status with completion rates.

### Storage Analysis
```sql
SELECT 
  t.id,
  t.title_en as transaction_title,
  p.full_name as agent_name,
  COUNT(tf.id) as file_count,
  SUM(tf.file_size)::bigint as total_bytes,
  ROUND(SUM(tf.file_size) / 1024.0 / 1024.0, 2) as total_mb
FROM transactions t
LEFT JOIN transaction_files tf ON tf.transaction_id = t.id
LEFT JOIN profiles p ON p.id = t.created_by
GROUP BY t.id, t.title_en, p.full_name
HAVING SUM(tf.file_size) > 0
ORDER BY total_bytes DESC
LIMIT 20;
```
**Purpose**: Identify transactions using the most storage space.

## Common Tasks

### Find a User by Email
```sql
SELECT 
  p.id,
  p.full_name,
  au.email,
  p.role,
  p.preferred_language,
  p.created_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE au.email ILIKE '%example@domain.com%';
```

### Count Transactions by Agent
```sql
SELECT 
  p.full_name,
  COUNT(t.id) as transaction_count
FROM profiles p
LEFT JOIN transactions t ON t.created_by = p.id
WHERE p.role = 'agent'
GROUP BY p.id, p.full_name
ORDER BY transaction_count DESC
LIMIT 10;
```

### Find Incomplete Milestones
```sql
SELECT 
  t.title_en,
  m.label_en,
  m.completed,
  t.status,
  p.full_name as agent
FROM milestones m
JOIN transactions t ON t.id = m.transaction_id
JOIN profiles p ON p.id = t.created_by
WHERE m.completed = false
  AND t.status = 'active'
ORDER BY m.order_index;
```

### Recent User Signups
```sql
SELECT 
  p.full_name,
  au.email,
  p.role,
  p.created_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC;
```

## Troubleshooting

### Query Times Out
- Add `LIMIT` clause to reduce result set
- Optimize with proper indexes
- Break complex queries into smaller ones

### Permission Denied Error
- Verify you're logged in as super admin
- Check RLS policies aren't blocking the query
- Ensure the `execute_sql_query` function is installed

### Write Operation Blocked
- Enable "Allow Write Operations" switch
- Verify query syntax is correct
- Check you have necessary permissions

## Technical Details

### Database Function
The SQL editor uses a PostgreSQL function:
```sql
execute_sql_query(p_query text) RETURNS jsonb
```

Located in: `supabase/migrations/20251224_add_sql_query_executor.sql`

### API Endpoint
- **Path**: `/api/super-admin/sql`
- **Method**: `POST`
- **Auth**: Bearer token required
- **Body**: `{ query: string, allowWrite: boolean }`

### Security Model
- API layer verifies super admin status
- RPC function executes with `SECURITY DEFINER`
- Write operations require explicit opt-in
- Query timeout prevents runaway queries

## Migration Required

Before using the SQL editor, run this migration:
```bash
# In Supabase SQL Editor
supabase/migrations/20251224_add_sql_query_executor.sql
```

This creates the `execute_sql_query` function required by the editor.

## Support

For issues or questions:
1. Check this documentation
2. Verify migration is applied
3. Check browser console for errors
4. Ensure super admin role is properly set

---

**Last Updated**: 2024-12-24  
**Version**: 1.0.0  
**Access Level**: Super Admin Only

