-- Add full_address column to bounties to store optional detailed address
ALTER TABLE public.bounties
ADD COLUMN IF NOT EXISTS full_address text;

-- Optional: comment for documentation
COMMENT ON COLUMN public.bounties.full_address IS 'Optional full street address from Place a Bounty form';

