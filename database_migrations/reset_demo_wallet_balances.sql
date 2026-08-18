-- Demo wallets were seeded at ₦1,000,000 in September 2025.
-- Live organization deposits start from ₦0.00 (Monnify credits only).

UPDATE public.organization_wallets
SET balance = 0
WHERE balance <> 0;

CREATE OR REPLACE FUNCTION public.get_or_create_wallet(org_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wallet_id uuid;
BEGIN
  SELECT id INTO wallet_id
  FROM public.organization_wallets
  WHERE organization_id = org_id;

  IF wallet_id IS NULL THEN
    INSERT INTO public.organization_wallets (organization_id, balance)
    VALUES (org_id, 0)
    RETURNING id INTO wallet_id;
  END IF;

  RETURN wallet_id;
END;
$$;
