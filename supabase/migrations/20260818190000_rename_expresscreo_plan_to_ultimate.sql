-- Rename the internal platform plan so it is not confused with the ExpressCreo org.
UPDATE public.plans
SET name = 'Ultimate'
WHERE name = 'ExpressCreo';
