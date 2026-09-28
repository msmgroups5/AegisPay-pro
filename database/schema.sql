-- AegisPay consolidated business schema
-- Prototype/Testnet foundation. No live Mainnet payout or custody is implemented by this schema.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Existing node tables are intentionally retired by the following statement.
DROP TABLE IF EXISTS public.active_nodes CASCADE;

DROP TABLE IF EXISTS public.tasks CASCADE;
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  offer_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  task_level TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','In Progress','Completed','Expired')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  reward NUMERIC(18,2) NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ
);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS frozen_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS withdrawal_wallet_owner_name TEXT,
  ADD COLUMN IF NOT EXISTS principal_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS manual_credit_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withdrawal_held NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_deposit_done BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS selected_tier_id TEXT;

-- AegisPay tiers
CREATE TABLE IF NOT EXISTS public.vip_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  deposit_amount NUMERIC(18,2) NOT NULL,
  initial_profit NUMERIC(18,2) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 1,
  color_key TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.vip_tiers(id,name,deposit_amount,initial_profit,display_order,color_key)
VALUES
 ('T1','Tier 1',30,5,1,'green'),
 ('T2','Tier 2',50,10,2,'blue'),
 ('T3','Tier 3',100,15,3,'purple'),
 ('V1','VVIP 1',250,40,4,'gold'),
 ('V2','VVIP 2',500,65,5,'violet'),
 ('V3','VVIP 3',1000,135,6,'platinum')
ON CONFLICT(id) DO UPDATE SET
 name=EXCLUDED.name,deposit_amount=EXCLUDED.deposit_amount,initial_profit=EXCLUDED.initial_profit,
 display_order=EXCLUDED.display_order,color_key=EXCLUDED.color_key,updated_at=NOW();

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.platform_settings(key,value_json)
VALUES
 ('deposit_rules','{"first_minimum":30,"repeat_minimum":10,"fee":2,"network":"TRON TESTNET"}'),
 ('withdrawal_rules','{"minimum":50,"fee_rate":0.10}'),
 ('cycle_rules','{"hours":18,"profit_basis":"TIER_GROSS_DEPOSIT"}'),
 ('referral_rules','{"level_1":5,"level_2":2}'),
 ('system_mode','{"mode":"TESTNET_DEMO","real_payouts":false}')
ON CONFLICT(key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.deposit_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL REFERENCES public.vip_tiers(id),
  gross_amount NUMERIC(18,2) NOT NULL CHECK (gross_amount > 0),
  deposit_fee NUMERIC(18,2) NOT NULL DEFAULT 2,
  credited_amount NUMERIC(18,2) NOT NULL CHECK (credited_amount >= 0),
  txid TEXT NOT NULL,
  screenshot_path TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION'
    CHECK (status IN ('PENDING_VERIFICATION','VERIFIED','REJECTED')),
  verification_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_deposit_txid ON public.deposit_submissions(txid);

CREATE TABLE IF NOT EXISTS public.cycle_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL REFERENCES public.vip_tiers(id),
  cycle_base NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'TASKS_OPEN'
    CHECK (status IN ('TASKS_OPEN','WAITING_18H','SETTLED','CANCELLED')),
  task_completed_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  profit_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_level INTEGER NOT NULL CHECK (referral_level IN (1,2)),
  bonus_amount NUMERIC(18,2) NOT NULL,
  triggered_by_deposit_id UUID REFERENCES public.deposit_submissions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id,referred_user_id,referral_level)
);

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(18,2) NOT NULL CHECK (amount >= 50),
  fee_amount NUMERIC(18,2) NOT NULL,
  net_amount NUMERIC(18,2) NOT NULL,
  destination_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL'
    CHECK (status IN ('PENDING_APPROVAL','APPROVED','REJECTED')),
  telegram_status TEXT NOT NULL DEFAULT 'PREPARED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approval_date TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.account_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  actor_user_id UUID REFERENCES public.users(id),
  reference_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES public.users(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('CREDIT','REVERSAL')),
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shop_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  task_level TEXT,
  tier_min_id TEXT REFERENCES public.vip_tiers(id),
  reward_text TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposits_user ON public.deposit_submissions(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cycles_user ON public.cycle_runs(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawal_requests(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON public.account_ledger(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_time ON public.audit_events(created_at DESC);

-- Helpers
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT id FROM public.users WHERE auth_user_id=auth.uid() LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=public
AS $$ SELECT role FROM public.users WHERE auth_user_id=auth.uid() LIMIT 1; $$;

-- Wallet linking: only the client can set it once; subsequent changes are Master Admin only.
CREATE OR REPLACE FUNCTION public.link_withdrawal_wallet(p_address TEXT,p_owner_name TEXT)
RETURNS public.users LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE u public.users;
BEGIN
  SELECT * INTO u FROM public.users WHERE id=public.current_app_user_id() FOR UPDATE;
  IF u.id IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF COALESCE(u.destination_address,'')<>'' THEN RAISE EXCEPTION 'Withdrawal wallet already linked'; END IF;
  IF lower(trim(p_owner_name))<>lower(trim(u.name)) THEN RAISE EXCEPTION 'Wallet owner name must match signup name'; END IF;
  UPDATE public.users
    SET destination_address=trim(p_address),
        withdrawal_wallet_owner_name=trim(p_owner_name)
    WHERE id=u.id
    RETURNING * INTO u;
  RETURN u;
END;
$$;

-- Withdrawal request only creates an approval record. No blockchain transfer is executed here.
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount NUMERIC)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE uid UUID; bal NUMERIC; wallet TEXT; rid UUID; fee NUMERIC; net NUMERIC; held NUMERIC;
BEGIN
  uid:=public.current_app_user_id();
  IF uid IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF p_amount<50 THEN RAISE EXCEPTION 'Minimum withdrawal is $50'; END IF;
  SELECT current_platform_balance,destination_address,withdrawal_held INTO bal,wallet,held FROM public.users WHERE id=uid FOR UPDATE;
  IF COALESCE(wallet,'')='' THEN RAISE EXCEPTION 'Withdrawal wallet is not linked'; END IF;
  IF p_amount>(COALESCE(bal,0)-COALESCE(held,0)) THEN RAISE EXCEPTION 'Insufficient available balance'; END IF;
  fee:=ROUND(p_amount*0.10,2);net:=p_amount-fee;
  INSERT INTO public.withdrawal_requests(user_id,amount,fee_amount,net_amount,destination_address)
  VALUES(uid,p_amount,fee,net,wallet) RETURNING id INTO rid;
  UPDATE public.users SET withdrawal_held=COALESCE(withdrawal_held,0)+p_amount WHERE id=uid;
  RETURN rid;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_withdrawal(p_request_id UUID,p_approve BOOLEAN)
RETURNS public.withdrawal_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE w public.withdrawal_requests;
BEGIN
  IF public.current_app_role()<>'MASTER ADMIN' THEN RAISE EXCEPTION 'Master Admin approval is required'; END IF;
  UPDATE public.withdrawal_requests
    SET status=CASE WHEN p_approve THEN 'APPROVED' ELSE 'REJECTED' END,
        approval_date=NOW(),
        approved_by=public.current_app_user_id()
  WHERE id=p_request_id AND status='PENDING_APPROVAL'
  RETURNING * INTO w;
  IF w.id IS NULL THEN RAISE EXCEPTION 'Request not found or already finalized'; END IF;
  UPDATE public.users SET withdrawal_held=GREATEST(0,COALESCE(withdrawal_held,0)-w.amount) WHERE id=w.user_id;
  IF p_approve THEN
    UPDATE public.users SET current_platform_balance=GREATEST(0,current_platform_balance-w.amount) WHERE id=w.user_id;
  END IF;
  RETURN w;
END;
$$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_self_select ON public.users;
CREATE POLICY users_self_select ON public.users FOR SELECT USING(auth_user_id=auth.uid() OR public.current_app_role()='MASTER ADMIN');
DROP POLICY IF EXISTS users_self_update ON public.users;
CREATE POLICY users_self_update ON public.users FOR UPDATE USING(auth_user_id=auth.uid()) WITH CHECK(auth_user_id=auth.uid());
DROP POLICY IF EXISTS users_master_all ON public.users;
CREATE POLICY users_master_all ON public.users FOR ALL USING(public.current_app_role()='MASTER ADMIN') WITH CHECK(public.current_app_role()='MASTER ADMIN');

DROP POLICY IF EXISTS tiers_public_read ON public.vip_tiers;
CREATE POLICY tiers_public_read ON public.vip_tiers FOR SELECT USING(auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS offers_public_read ON public.shop_offers;
CREATE POLICY offers_public_read ON public.shop_offers FOR SELECT USING(auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS settings_master ON public.platform_settings;
CREATE POLICY settings_master ON public.platform_settings FOR ALL USING(public.current_app_role()='MASTER ADMIN') WITH CHECK(public.current_app_role()='MASTER ADMIN');

DROP POLICY IF EXISTS tasks_user_read ON public.tasks;
CREATE POLICY tasks_user_read ON public.tasks FOR SELECT USING(user_id=public.current_app_user_id() OR public.current_app_role()='MASTER ADMIN');
DROP POLICY IF EXISTS tasks_user_update ON public.tasks;
CREATE POLICY tasks_user_update ON public.tasks FOR UPDATE USING(user_id=public.current_app_user_id() OR public.current_app_role()='MASTER ADMIN');

DROP POLICY IF EXISTS deposits_user_read ON public.deposit_submissions;
CREATE POLICY deposits_user_read ON public.deposit_submissions FOR SELECT USING(user_id=public.current_app_user_id() OR public.current_app_role()='MASTER ADMIN');
DROP POLICY IF EXISTS deposits_user_insert ON public.deposit_submissions;
CREATE POLICY deposits_user_insert ON public.deposit_submissions FOR INSERT WITH CHECK(user_id=public.current_app_user_id());
DROP POLICY IF EXISTS deposits_master_write ON public.deposit_submissions;
CREATE POLICY deposits_master_write ON public.deposit_submissions FOR UPDATE USING(public.current_app_role()='MASTER ADMIN') WITH CHECK(public.current_app_role()='MASTER ADMIN');

DROP POLICY IF EXISTS cycles_user_read ON public.cycle_runs;
CREATE POLICY cycles_user_read ON public.cycle_runs FOR SELECT USING(user_id=public.current_app_user_id() OR public.current_app_role()='MASTER ADMIN');

DROP POLICY IF EXISTS refs_user_read ON public.referrals;
CREATE POLICY refs_user_read ON public.referrals FOR SELECT USING(user_id=public.current_app_user_id() OR referred_user_id=public.current_app_user_id() OR public.current_app_role()='MASTER ADMIN');

DROP POLICY IF EXISTS withdraw_user_read ON public.withdrawal_requests;
CREATE POLICY withdraw_user_read ON public.withdrawal_requests FOR SELECT USING(user_id=public.current_app_user_id() OR public.current_app_role()='MASTER ADMIN');
DROP POLICY IF EXISTS withdraw_user_insert ON public.withdrawal_requests;
CREATE POLICY withdraw_user_insert ON public.withdrawal_requests FOR INSERT WITH CHECK(user_id=public.current_app_user_id());
DROP POLICY IF EXISTS withdraw_master_update ON public.withdrawal_requests;
CREATE POLICY withdraw_master_update ON public.withdrawal_requests FOR UPDATE USING(public.current_app_role()='MASTER ADMIN') WITH CHECK(public.current_app_role()='MASTER ADMIN');

DROP POLICY IF EXISTS ledger_user_read ON public.account_ledger;
CREATE POLICY ledger_user_read ON public.account_ledger FOR SELECT USING(user_id=public.current_app_user_id() OR public.current_app_role()='MASTER ADMIN');
DROP POLICY IF EXISTS admin_adjust_master ON public.admin_adjustments;
CREATE POLICY admin_adjust_master ON public.admin_adjustments FOR ALL USING(public.current_app_role()='MASTER ADMIN') WITH CHECK(public.current_app_role()='MASTER ADMIN');

DROP POLICY IF EXISTS audit_master_read ON public.audit_events;
CREATE POLICY audit_master_read ON public.audit_events FOR SELECT USING(public.current_app_role()='MASTER ADMIN');

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.link_withdrawal_wallet(TEXT,TEXT) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.request_withdrawal(NUMERIC) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.finalize_withdrawal(UUID,BOOLEAN) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.link_withdrawal_wallet(TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_withdrawal(UUID,BOOLEAN) TO authenticated;
