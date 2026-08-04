-- Add bank_accounts JSONB column to hotels table
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS bank_accounts JSONB DEFAULT '[]'::jsonb;

-- Add bank_accounts JSONB column to agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS bank_accounts JSONB DEFAULT '[]'::jsonb;

-- Add bank_accounts JSONB column to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_accounts JSONB DEFAULT '[]'::jsonb;
