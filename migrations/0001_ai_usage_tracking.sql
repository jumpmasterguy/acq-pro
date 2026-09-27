-- Add AI Study Assistant usage tracking so tier limits (free / monthly / lifetime)
-- can actually be enforced server-side, matching what the pricing page promises.
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_calls_today INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_calls_date TEXT;
