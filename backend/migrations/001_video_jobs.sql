-- Migration: Create video_jobs table for Higgsfield video generation
-- Run this in the Supabase Dashboard SQL Editor: https://supabase.com/dashboard/project/wqiizowaeyyvlpcstshe/sql

CREATE TABLE IF NOT EXISTS public.video_jobs (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  prompt text NOT NULL,
  model text DEFAULT 'dop-turbo',
  status text DEFAULT 'pending',
  progress integer DEFAULT 0,
  video_url text,
  error_message text,
  higgsfield_request_id text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations for service role (backend)
CREATE POLICY IF NOT EXISTS "service_role_all" ON public.video_jobs
  FOR ALL USING (true) WITH CHECK (true);

-- Expose to PostgREST API
GRANT ALL ON public.video_jobs TO postgres, service_role;
GRANT SELECT ON public.video_jobs TO anon, authenticated;
