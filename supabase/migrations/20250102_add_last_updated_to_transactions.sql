-- Add last_updated column to transactions table for tracking activity
-- This field updates when milestones, messages, or files change (user-visible activity)
-- Separate from updated_at which tracks ANY change including admin edits

-- Add the column (nullable initially)
ALTER TABLE public.transactions
ADD COLUMN last_updated timestamptz;

-- Initialize last_updated with updated_at for existing records
UPDATE public.transactions
SET last_updated = updated_at;

-- Set NOT NULL constraint after initialization
ALTER TABLE public.transactions
ALTER COLUMN last_updated SET NOT NULL;

-- Set default to now() for new records
ALTER TABLE public.transactions
ALTER COLUMN last_updated SET DEFAULT now();

-- Add index for efficient sorting by last_updated (descending for "newest first")
CREATE INDEX idx_transactions_last_updated ON public.transactions(last_updated DESC);

-- Add comment explaining the field
COMMENT ON COLUMN public.transactions.last_updated IS 'Timestamp of last significant user activity (milestone change, message, file upload). Updated via update_transaction_last_updated() function.';
