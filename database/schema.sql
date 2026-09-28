-- AegisPay logical data model for repository-side implementation.
-- This schema is intentionally finance-demo safe: it stores workflow records only
-- and does not define payment execution, custody, blockchain transfer, or bank transfer.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('USER','ADMIN','MASTER ADMIN')),
  referral_code TEXT,
  referred_by TEXT,
  balance NUMERIC(18,2) DEFAULT 0,
  node_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  node_tier TEXT NOT NULL,
  allocated_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  daily_yield_percentage NUMERIC(8,4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  region TEXT,
  country TEXT,
  activation_date DATE,
  expiry_date DATE
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  reward NUMERIC(18,2) DEFAULT 0,
  start_date DATE,
  due_date DATE,
  completion_date DATE,
  node_id TEXT
);

CREATE TABLE referrals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  referred_user_id TEXT NOT NULL REFERENCES users(id),
  referral_level INTEGER NOT NULL CHECK (referral_level BETWEEN 1 AND 3),
  reward NUMERIC(18,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE withdrawal_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  destination_address TEXT NOT NULL,
  risk_score NUMERIC(6,4) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  approval_date TIMESTAMPTZ,
  approved_by TEXT
);

CREATE TABLE activity_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id TEXT,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
