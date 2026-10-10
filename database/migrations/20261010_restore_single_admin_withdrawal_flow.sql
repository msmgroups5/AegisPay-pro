-- Restore the documented single Master Admin withdrawal approval flow.
-- Telegram payout notifications remain optional; real payouts remain disabled by platform settings.
CREATE OR REPLACE FUNCTION public.finalize_withdrawal(p_request_id UUID,p_approve BOOLEAN)
RETURNS public.withdrawal_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  w public.withdrawal_requests;
  v_actor UUID;
BEGIN
  v_actor := public.current_app_user_id();
  IF COALESCE(public.current_app_role(),'') <> 'MASTER ADMIN'
     OR NOT EXISTS (
       SELECT 1 FROM public.users
       WHERE id=v_actor AND upper(COALESCE(status,'')) IN ('ACTIVE','NORMAL')
     ) THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Active Master Admin approval is required';
  END IF;
  IF p_approve IS NULL THEN RAISE EXCEPTION 'Withdrawal decision is required'; END IF;

  SELECT * INTO w FROM public.withdrawal_requests
  WHERE id=p_request_id AND status='PENDING_APPROVAL'
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found or already finalized'; END IF;
  IF w.panel_decision <> 'PENDING' THEN
    RAISE EXCEPTION 'Master Admin has already reviewed this withdrawal';
  END IF;

  UPDATE public.withdrawal_requests SET
    panel_decision=CASE WHEN p_approve THEN 'APPROVED' ELSE 'REJECTED' END,
    panel_decided_at=now(),
    approved_by=v_actor,
    approval_date=now(),
    telegram_decision=CASE WHEN p_approve THEN 'APPROVED' ELSE 'REJECTED' END,
    telegram_status='NOT_REQUIRED',
    telegram_approver_id='MASTER_ADMIN_SINGLE_APPROVAL',
    telegram_decided_at=now(),
    balance_deducted=CASE WHEN p_approve THEN TRUE ELSE FALSE END,
    status=CASE WHEN p_approve THEN 'APPROVED' ELSE 'REJECTED' END
  WHERE id=p_request_id
  RETURNING * INTO w;

  IF NOT p_approve THEN
    UPDATE public.users
      SET withdrawal_held=GREATEST(0,COALESCE(withdrawal_held,0)-w.amount)
      WHERE id=w.user_id;
  ELSE
    UPDATE public.users SET
      withdrawal_held=GREATEST(0,COALESCE(withdrawal_held,0)-w.amount),
      current_platform_balance=GREATEST(0,COALESCE(current_platform_balance,0)-w.amount)
    WHERE id=w.user_id;
  END IF;

  INSERT INTO public.audit_events(actor_user_id,target_user_id,event_type,description,reference_id)
  VALUES(
    v_actor,
    w.user_id,
    CASE WHEN p_approve THEN 'WITHDRAWAL_PANEL_APPROVED' ELSE 'WITHDRAWAL_PANEL_REJECTED' END,
    CASE WHEN p_approve
      THEN 'Master Admin approved the withdrawal under the single-approval workflow; live payout remains controlled by platform settings.'
      ELSE 'Master Admin rejected the withdrawal and released the reserved amount.'
    END,
    p_request_id::TEXT
  );
  RETURN w;
END;
$function$;

REVOKE ALL ON FUNCTION public.finalize_withdrawal(UUID,BOOLEAN) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finalize_withdrawal(UUID,BOOLEAN) TO authenticated;
