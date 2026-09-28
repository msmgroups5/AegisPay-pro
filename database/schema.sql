-- AegisPay PostgreSQL data model
-- Repository-side schema only. No real payment/blockchain/custody execution is defined here.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('USER','ADMIN','MASTER ADMIN')),
  destination_address TEXT,
  current_platform_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Active',
  auth_user_id UUID UNIQUE
);

CREATE TABLE IF NOT EXISTS active_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_tier TEXT NOT NULL,
  allocated_platform_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  daily_yield_percentage NUMERIC(8,4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  region TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activation_date DATE,
  expiry_date DATE,
  completion_date DATE
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_level TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','In Progress','Completed','Expired')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  reward NUMERIC(18,2) NOT NULL DEFAULT 0,
  start_date DATE,
  due_date DATE,
  completion_date DATE,
  related_node_id UUID REFERENCES active_nodes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_level INTEGER NOT NULL CHECK (referral_level BETWEEN 1 AND 3),
  platform_reward NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, referred_user_id, referral_level)
);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  destination_address TEXT NOT NULL,
  ai_risk_score NUMERIC(6,4) NOT NULL CHECK (ai_risk_score >= 0 AND ai_risk_score <= 1),
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL','APPROVED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approval_date TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nodes_user ON active_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_user ON referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_user ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Security blueprint notes:
-- 1) USER must only read/update their own permitted records.
-- 2) ADMIN accesses operational tables according to permission policy.
-- 3) MASTER ADMIN controls final approval/settings/audit functions.
-- 4) Sensitive credentials/secrets remain server-side.
-- 5) RLS/policy definitions are expected in the production Supabase migration layer.


-- Production Supabase authentication/RLS layer
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.claim_aegispay_profile()
RETURNS public.users LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_profile public.users; v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN RAISE EXCEPTION 'Authenticated Supabase user not found'; END IF;
  UPDATE public.users SET auth_user_id=auth.uid()
  WHERE lower(email)=lower(v_email) AND auth_user_id IS NULL RETURNING * INTO v_profile;
  IF v_profile.id IS NULL THEN SELECT * INTO v_profile FROM public.users WHERE auth_user_id=auth.uid() LIMIT 1; END IF;
  IF v_profile.id IS NULL THEN RAISE EXCEPTION 'This email is not an approved AegisPay user'; END IF;
  RETURN v_profile;
END;
$$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_self_select ON public.users;
CREATE POLICY users_self_select ON public.users FOR SELECT USING (auth_user_id=auth.uid() OR public.current_app_role() IN ('ADMIN','MASTER ADMIN'));
DROP POLICY IF EXISTS users_self_update ON public.users;
CREATE POLICY users_self_update ON public.users FOR UPDATE USING (auth_user_id=auth.uid()) WITH CHECK (auth_user_id=auth.uid());
DROP POLICY IF EXISTS users_admin_all ON public.users;
CREATE POLICY users_admin_all ON public.users FOR ALL USING (public.current_app_role() IN ('ADMIN','MASTER ADMIN')) WITH CHECK (public.current_app_role() IN ('ADMIN','MASTER ADMIN'));

DROP POLICY IF EXISTS nodes_user_select ON public.active_nodes;
CREATE POLICY nodes_user_select ON public.active_nodes FOR SELECT USING (user_id=public.current_app_user_id() OR public.current_app_role() IN ('ADMIN','MASTER ADMIN'));
DROP POLICY IF EXISTS nodes_admin_write ON public.active_nodes;
CREATE POLICY nodes_admin_write ON public.active_nodes FOR ALL USING (public.current_app_role() IN ('ADMIN','MASTER ADMIN')) WITH CHECK (public.current_app_role() IN ('ADMIN','MASTER ADMIN'));

DROP POLICY IF EXISTS tasks_user_select ON public.tasks;
CREATE POLICY tasks_user_select ON public.tasks FOR SELECT USING (user_id=public.current_app_user_id() OR public.current_app_role() IN ('ADMIN','MASTER ADMIN'));
DROP POLICY IF EXISTS tasks_user_update ON public.tasks;
CREATE POLICY tasks_user_update ON public.tasks FOR UPDATE USING (user_id=public.current_app_user_id()) WITH CHECK (user_id=public.current_app_user_id());
DROP POLICY IF EXISTS tasks_admin_write ON public.tasks;
CREATE POLICY tasks_admin_write ON public.tasks FOR ALL USING (public.current_app_role() IN ('ADMIN','MASTER ADMIN')) WITH CHECK (public.current_app_role() IN ('ADMIN','MASTER ADMIN'));

DROP POLICY IF EXISTS referrals_user_select ON public.referrals;
CREATE POLICY referrals_user_select ON public.referrals FOR SELECT USING (user_id=public.current_app_user_id() OR referred_user_id=public.current_app_user_id() OR public.current_app_role() IN ('ADMIN','MASTER ADMIN'));
DROP POLICY IF EXISTS referrals_admin_write ON public.referrals;
CREATE POLICY referrals_admin_write ON public.referrals FOR ALL USING (public.current_app_role() IN ('ADMIN','MASTER ADMIN')) WITH CHECK (public.current_app_role() IN ('ADMIN','MASTER ADMIN'));

DROP POLICY IF EXISTS withdrawals_user_select ON public.withdrawal_requests;
CREATE POLICY withdrawals_user_select ON public.withdrawal_requests FOR SELECT USING (user_id=public.current_app_user_id() OR public.current_app_role() IN ('ADMIN','MASTER ADMIN'));
DROP POLICY IF EXISTS withdrawals_user_insert ON public.withdrawal_requests;
CREATE POLICY withdrawals_user_insert ON public.withdrawal_requests FOR INSERT WITH CHECK (user_id=public.current_app_user_id());
DROP POLICY IF EXISTS withdrawals_master_update ON public.withdrawal_requests;
CREATE POLICY withdrawals_master_update ON public.withdrawal_requests FOR UPDATE USING (public.current_app_role()='MASTER ADMIN') WITH CHECK (public.current_app_role()='MASTER ADMIN');

DROP POLICY IF EXISTS activity_authenticated_select ON public.activity_logs;
CREATE POLICY activity_authenticated_select ON public.activity_logs FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS activity_admin_insert ON public.activity_logs;
CREATE POLICY activity_admin_insert ON public.activity_logs FOR INSERT WITH CHECK (public.current_app_role() IN ('ADMIN','MASTER ADMIN'));

DROP POLICY IF EXISTS notifications_user_select ON public.notifications;
CREATE POLICY notifications_user_select ON public.notifications FOR SELECT USING (user_id=public.current_app_user_id() OR public.current_app_role() IN ('ADMIN','MASTER ADMIN'));
DROP POLICY IF EXISTS notifications_user_update ON public.notifications;
CREATE POLICY notifications_user_update ON public.notifications FOR UPDATE USING (user_id=public.current_app_user_id()) WITH CHECK (user_id=public.current_app_user_id());
DROP POLICY IF EXISTS notifications_admin_insert ON public.notifications;
CREATE POLICY notifications_admin_insert ON public.notifications FOR INSERT WITH CHECK (public.current_app_role() IN ('ADMIN','MASTER ADMIN'));

DROP POLICY IF EXISTS settings_master_access ON public.platform_settings;
CREATE POLICY settings_master_access ON public.platform_settings FOR ALL USING (public.current_app_role()='MASTER ADMIN') WITH CHECK (public.current_app_role()='MASTER ADMIN');

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_aegispay_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_aegispay_profile() TO authenticated;

-- Withdrawal RPCs used by the production UI; they update workflow records only.
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount NUMERIC,p_destination_address TEXT,p_ai_risk_score NUMERIC)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE v_user_id UUID; v_balance NUMERIC; v_pending NUMERIC; v_request_id UUID;
BEGIN
  v_user_id:=public.current_app_user_id();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authenticated AegisPay user profile not found'; END IF;
  IF p_amount IS NULL OR p_amount<=0 THEN RAISE EXCEPTION 'Withdrawal amount must be greater than zero'; END IF;
  IF COALESCE(p_destination_address,'')='' THEN RAISE EXCEPTION 'Destination address is required'; END IF;
  IF p_ai_risk_score IS NULL OR p_ai_risk_score<0 OR p_ai_risk_score>1 THEN RAISE EXCEPTION 'Risk score must be between 0 and 1'; END IF;
  SELECT current_platform_balance INTO v_balance FROM public.users WHERE id=v_user_id FOR UPDATE;
  SELECT COALESCE(SUM(amount),0) INTO v_pending FROM public.withdrawal_requests WHERE user_id=v_user_id AND status='PENDING_APPROVAL';
  IF p_amount>(COALESCE(v_balance,0)-v_pending) THEN RAISE EXCEPTION 'Withdrawal exceeds available platform balance'; END IF;
  INSERT INTO public.withdrawal_requests(user_id,amount,destination_address,ai_risk_score,status) VALUES(v_user_id,p_amount,p_destination_address,p_ai_risk_score,'PENDING_APPROVAL') RETURNING id INTO v_request_id;
  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_withdrawal(p_request_id UUID,p_approve BOOLEAN)
RETURNS public.withdrawal_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE v_request public.withdrawal_requests;
BEGIN
  IF public.current_app_role()<>'MASTER ADMIN' THEN RAISE EXCEPTION 'MASTER ADMIN approval is required'; END IF;
  UPDATE public.withdrawal_requests SET status=CASE WHEN p_approve THEN 'APPROVED' ELSE 'REJECTED' END,approval_date=NOW(),approved_by=public.current_app_user_id()
  WHERE id=p_request_id AND status='PENDING_APPROVAL' RETURNING * INTO v_request;
  IF v_request.id IS NULL THEN RAISE EXCEPTION 'Withdrawal request is missing or already finalized'; END IF;
  RETURN v_request;
END;
$$;

REVOKE ALL ON FUNCTION public.request_withdrawal(NUMERIC,TEXT,NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(NUMERIC,TEXT,NUMERIC) TO authenticated;
REVOKE ALL ON FUNCTION public.finalize_withdrawal(UUID,BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_withdrawal(UUID,BOOLEAN) TO authenticated;
