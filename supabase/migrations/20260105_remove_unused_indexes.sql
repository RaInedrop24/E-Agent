-- Performance Optimization: Remove Unused Indexes
-- These indexes have not been used and may be candidates for removal
-- This migration removes truly unused indexes while keeping potentially useful ones

-- ============================================================
-- REMOVE: Definitely Unused Indexes
-- ============================================================

-- 1. translation_language column doesn't exist in user_notifications anymore
DROP INDEX IF EXISTS public.idx_user_notifications_translation_language;

-- ============================================================
-- KEEP BUT MONITOR: Potentially Useful Indexes
-- ============================================================

-- These indexes are currently unused but may be useful as the application scales
-- Keeping them for now as they target common query patterns:
--
-- KEPT: idx_transactions_status - Will be used for filtering by status (active, completed, archived)
-- KEPT: idx_messages_tx - Essential for fetching messages for a transaction
-- KEPT: idx_messages_author - Useful for user's message history
-- KEPT: idx_user_notifications_user_id - Essential for user notification queries  
-- KEPT: idx_user_notifications_created_at - Used for ordering notifications
-- KEPT: idx_user_notifications_announcement_id - Useful for announcement-based queries
-- KEPT: idx_messages_translated_text - May be used for search functionality
-- KEPT: idx_admin_audit_log_created_at - Essential for audit log timeline
-- KEPT: idx_admin_audit_log_action - Useful for filtering audit logs by action
-- KEPT: idx_transactions_agent_reference - Useful for agent reference lookups

-- Note: These indexes show as "unused" because:
-- 1. The system is new/in development
-- 2. Query patterns haven't exercised all code paths yet
-- 3. Small data volumes don't trigger index usage
--
-- As the application scales and all features are used, these indexes will become valuable

-- ============================================================
-- RECOMMENDATION
-- ============================================================
-- Monitor index usage after deploying to production with real data
-- Query to check index usage:
--
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan ASC;
--
-- Remove indexes with idx_scan = 0 after 30+ days of production use

