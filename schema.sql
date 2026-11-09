-- Database setup for TATARI Platform: Store, Career Jobs, and Upwork-style Freelance Hub

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_am TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_am TEXT;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS title_am TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description_am TEXT;

-- 1. Upwork-Style Freelance Projects Table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title_en TEXT NOT NULL,
    title_am TEXT,
    description_en TEXT NOT NULL,
    description_am TEXT,
    category TEXT NOT NULL,
    budget_min NUMERIC(12,2),
    budget_max NUMERIC(12,2),
    currency TEXT DEFAULT 'ETB',
    job_type TEXT DEFAULT 'Fixed-Price',
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Freelance Proposals Table
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

-- 3. Dedicated Full-Time / Remote Job Board Table
CREATE TABLE IF NOT EXISTS public.career_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_am TEXT,
    description_en TEXT NOT NULL,
    description_am TEXT,
    location TEXT DEFAULT 'Addis Ababa',
    job_type TEXT DEFAULT 'Full-Time', -- Full-Time, Remote, Hybrid, Contract
    salary_range TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Full-Time Job Applications Table
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

-- Row Level Security (RLS) Policies
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open freelance projects" ON public.jobs FOR SELECT USING (status = 'open' OR auth.uid() = client_id);
CREATE POLICY "Authenticated users can create freelance projects" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Freelancers can view own proposals or project owners view proposals" ON public.proposals
    FOR SELECT USING (auth.uid() = freelancer_id OR EXISTS (SELECT 1 FROM public.jobs WHERE id = proposals.job_id AND client_id = auth.uid()));
CREATE POLICY "Authenticated freelancers can submit proposals" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = freelancer_id);

CREATE POLICY "Anyone can view open career jobs" ON public.career_jobs FOR SELECT USING (status = 'open' OR auth.uid() = recruiter_id);
CREATE POLICY "Authenticated users can post career jobs" ON public.career_jobs FOR INSERT WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Applicants or recruiters can view job applications" ON public.career_applications
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.career_jobs WHERE id = career_applications.job_id AND recruiter_id = auth.uid()));
CREATE POLICY "Authenticated users can submit job applications" ON public.career_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
