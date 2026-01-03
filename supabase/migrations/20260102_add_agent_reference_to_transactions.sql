-- Add agent_reference column to transactions table
ALTER TABLE transactions
ADD COLUMN agent_reference TEXT;

-- Add comment to document the column
COMMENT ON COLUMN transactions.agent_reference IS 'Agent''s unique reference number for the property';

-- Create an index for faster searching/sorting by agent reference
CREATE INDEX idx_transactions_agent_reference ON transactions(agent_reference);
