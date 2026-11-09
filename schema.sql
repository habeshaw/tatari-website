-- =========================================================================
-- TATARI CONSULTING: SUPABASE DATABASE MIGRATION SCHEMA (FINAL v3)
-- =========================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('public-logos', 'public-logos', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access for Logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;

CREATE POLICY "Public Access for Logos" ON storage.objects FOR SELECT USING (bucket_id = 'public-logos');
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public-logos' AND auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'normal_user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan_tier TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.career_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_am TEXT,
    description_en TEXT NOT NULL,
    description_am TEXT,
    location TEXT DEFAULT 'Addis Ababa',
    job_type TEXT DEFAULT 'Full-Time',
    salary_range TEXT,
    company_logo TEXT,
    category TEXT DEFAULT 'Software & Tech',
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.career_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.career_jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    resume_url TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title_en TEXT NOT NULL,
    title_am TEXT,
    description_en TEXT NOT NULL,
    description_am TEXT,
    client_logo TEXT,
    category TEXT DEFAULT 'Software & Tech',
    budget_min NUMERIC(12,2),
    budget_max NUMERIC(12,2),
    currency TEXT DEFAULT 'ETB',
    job_type TEXT DEFAULT 'Fixed-Price',
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    freelancer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bid_amount NUMERIC(12,2) NOT NULL,
    delivery_days INT NOT NULL,
    cover_letter TEXT NOT NULL,
    status TEXT DEFAULT 'submitted',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    company_title TEXT,
    author_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users modify subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Anyone can view open career jobs" ON public.career_jobs;
DROP POLICY IF EXISTS "Authenticated users post career jobs" ON public.career_jobs;
DROP POLICY IF EXISTS "Applicants, recruiters or admins view applications" ON public.career_applications;
DROP POLICY IF EXISTS "Authenticated users submit job applications" ON public.career_applications;
DROP POLICY IF EXISTS "Admins update job applications" ON public.career_applications;
DROP POLICY IF EXISTS "Anyone can view open freelance jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users post freelance jobs" ON public.jobs;
DROP POLICY IF EXISTS "Anyone can view testimonials" ON public.testimonials;

CREATE POLICY "Anyone can view roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Users modify subscription" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view open career jobs" ON public.career_jobs FOR SELECT USING (status = 'open' OR auth.uid() = recruiter_id);
CREATE POLICY "Authenticated users post career jobs" ON public.career_jobs FOR INSERT WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Applicants, recruiters or admins view applications" ON public.career_applications
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.career_jobs WHERE id = career_applications.job_id AND recruiter_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users submit job applications" ON public.career_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update job applications" ON public.career_applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can view open freelance jobs" ON public.jobs FOR SELECT USING (status = 'open' OR auth.uid() = client_id);
CREATE POLICY "Authenticated users post freelance jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Anyone can view testimonials" ON public.testimonials FOR SELECT USING (true);