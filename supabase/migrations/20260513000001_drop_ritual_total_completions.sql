-- Phase 4 Session 2 follow-up: rituals.total_completions is now derived
-- from the joined ritual_completions array at the rowMapper boundary.
-- The column is no longer read by application code.

ALTER TABLE public.rituals DROP COLUMN IF EXISTS total_completions;
