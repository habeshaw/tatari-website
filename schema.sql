-- =========================================================================
-- TATARI PLATFORM v4: COMPLETE SUPABASE SCHEMA (JOBS, FREELANCE, PROFILES)
-- =========================================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('public-logos', 'public-logos', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access for Logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
CREATE POLICY "Public Access for Logos" ON storage.objects FOR SELECT USING (bucket_id = 'public-logos');
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public-logos' AND auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'seeker', -- 'employer', 'seeker', 'admin'
    headline_en TEXT,
    headline_am TEXT,
    skills TEXT[] DEFAULT '{}',
    hourly_rate_etb NUMERIC(10,2) DEFAULT 500,
    location TEXT DEFAULT 'Addis Ababa',
    cv_url TEXT,
    portfolio_url TEXT,
    bio TEXT,
    is_vetted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
    requirements TEXT,
    deadline DATE,
    location TEXT DEFAULT 'Addis Ababa',
    job_type TEXT DEFAULT 'Full-time',
    salary_range TEXT,
    company_logo TEXT,
    category TEXT DEFAULT 'IT & Data',
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
    status TEXT DEFAULT 'Applied',
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
    category TEXT DEFAULT 'IT & Data',
    budget_min NUMERIC(12,2),
    budget_max NUMERIC(12,2),
    currency TEXT DEFAULT 'ETB',
    job_type TEXT DEFAULT 'Fixed-Price',
    accepted_proposal_id UUID,
    milestone_status TEXT DEFAULT 'open',
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles viewable by all" ON public.profiles;
CREATE POLICY "Public profiles viewable by all" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;
CREATE POLICY "Anyone can view roles" ON public.user_roles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users modify subscription" ON public.subscriptions;
CREATE POLICY "Users modify subscription" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view open career jobs" ON public.career_jobs;
CREATE POLICY "Anyone can view open career jobs" ON public.career_jobs FOR SELECT USING (status = 'open' OR auth.uid() = recruiter_id);
DROP POLICY IF EXISTS "Authenticated users post career jobs" ON public.career_jobs;
CREATE POLICY "Authenticated users post career jobs" ON public.career_jobs FOR INSERT WITH CHECK (auth.uid() = recruiter_id);

DROP POLICY IF EXISTS "Applicants, recruiters or admins view applications" ON public.career_applications;
CREATE POLICY "Applicants, recruiters or admins view applications" ON public.career_applications
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.career_jobs WHERE id = career_applications.job_id AND recruiter_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Authenticated users submit job applications" ON public.career_applications;
CREATE POLICY "Authenticated users submit job applications" ON public.career_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins update job applications" ON public.career_applications;
CREATE POLICY "Admins update job applications" ON public.career_applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Anyone can view open freelance jobs" ON public.jobs;
CREATE POLICY "Anyone can view open freelance jobs" ON public.jobs FOR SELECT USING (status = 'open' OR auth.uid() = client_id);
DROP POLICY IF EXISTS "Authenticated users post freelance jobs" ON public.jobs;
CREATE POLICY "Authenticated users post freelance jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = client_id);
DROP POLICY IF EXISTS "Clients update own freelance jobs" ON public.jobs;
CREATE POLICY "Clients update own freelance jobs" ON public.jobs FOR UPDATE USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Proposals viewable by freelancer or project client" ON public.proposals;
CREATE POLICY "Proposals viewable by freelancer or project client" ON public.proposals
    FOR SELECT USING (auth.uid() = freelancer_id OR EXISTS (SELECT 1 FROM public.jobs WHERE id = proposals.job_id AND client_id = auth.uid()));
DROP POLICY IF EXISTS "Freelancers insert proposals" ON public.proposals;
CREATE POLICY "Freelancers insert proposals" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = freelancer_id);
DROP POLICY IF EXISTS "Clients update proposal status" ON public.proposals;
CREATE POLICY "Clients update proposal status" ON public.proposals
    FOR UPDATE USING (EXISTS (SELECT 1 FROM public.jobs WHERE id = proposals.job_id AND client_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view testimonials" ON public.testimonials FOR SELECT USING (true);
