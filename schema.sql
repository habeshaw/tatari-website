-- Database setup for TATARI Search Engine: User Roles, Applications, Exports & Subscriptions

-- Public Storage Bucket for Logos and Avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public-logos', 'public-logos', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access for Logos" ON storage.objects FOR SELECT USING (bucket_id = 'public-logos');
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public-logos' AND auth.role() = 'authenticated');

-- 1. User Roles Table (Admin, Employer, Normal User)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'normal_user', -- admin, employer, normal_user
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 2. Full-Time Career Jobs Table
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

-- 3. Job Applications Table
CREATE TABLE IF NOT EXISTS public.career_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.career_jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    resume_url TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Upwork-Style Freelance Projects Table
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

-- 5. Freelance Proposals Table
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

-- 6. Testimonials Table
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    company_title TEXT,
    author_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan_tier TEXT DEFAULT 'free', -- starter, pro, enterprise
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Anyone can view open career jobs" ON public.career_jobs FOR SELECT USING (status = 'open' OR auth.uid() = recruiter_id);
CREATE POLICY "Authenticated users can post career jobs" ON public.career_jobs FOR INSERT WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Applicants, recruiters or admins view applications" ON public.career_applications
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.career_jobs WHERE id = career_applications.job_id AND recruiter_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users submit job applications" ON public.career_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update job applications" ON public.career_applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can view open freelance jobs" ON public.jobs FOR SELECT USING (status = 'open' OR auth.uid() = client_id);
CREATE POLICY "Authenticated users post freelance jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Anyone can view testimonials" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Authenticated users create testimonials" ON public.testimonials FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users modify subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
