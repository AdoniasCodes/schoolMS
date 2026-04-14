-- Migration 0010: Add subscription & billing fields to schools table
-- Supports centralized SaaS model: schools are tenants, founders control access

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'basic'
    CHECK (subscription_plan IN ('basic', 'standard', 'premium')),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 200,
  ADD COLUMN IF NOT EXISTS max_teachers INTEGER DEFAULT 20;

-- Index for quick lookups by subscription status (used by super admin dashboard)
CREATE INDEX IF NOT EXISTS idx_schools_subscription_status ON public.schools(subscription_status);
