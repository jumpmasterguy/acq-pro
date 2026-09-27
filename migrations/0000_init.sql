-- Initial schema: ensure users table exists with all columns
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  stripe_customer_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'free',
  subscription_id TEXT,
  completed_lessons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  quiz_scores JSONB NOT NULL DEFAULT '{}'::JSONB,
  xp INTEGER NOT NULL DEFAULT 0,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  module_skill_levels JSONB NOT NULL DEFAULT '{}'::JSONB,
  module_assessment_scores JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- Add columns if upgrading from older schema
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS module_skill_levels JSONB NOT NULL DEFAULT '{}'::JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS module_assessment_scores JSONB NOT NULL DEFAULT '{}'::JSONB;
