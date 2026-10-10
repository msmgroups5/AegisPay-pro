-- Restore the original Tier 1 deposit amount while preserving its $5 initial cycle profit.
UPDATE public.vip_tiers
SET deposit_amount=30.00,
    initial_profit=5.00,
    updated_at=now()
WHERE id='T1' AND name='Tier 1';
