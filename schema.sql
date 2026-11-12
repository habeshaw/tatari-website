-- ============================================================================
-- TATARI BILINGUAL PLATFORM — PRODUCTION DATABASE SCHEMA (POSTGRESQL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    company_name TEXT,
    tin_number TEXT,
    role TEXT NOT NULL DEFAULT 'seeker' CHECK (role IN ('admin', 'employer', 'seeker')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
    subscription_tier TEXT DEFAULT 'Free Tier',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.profiles (email, full_name, role, status, subscription_tier)
VALUES ('admin@tatari.et', 'TATARI System Administrator', 'admin', 'approved', 'Enterprise')
ON CONFLICT (email) DO UPDATE SET role = 'admin', status = 'approved';

CREATE TABLE IF NOT EXISTS public.career_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_email TEXT,
    title_en TEXT NOT NULL,
    title_am TEXT,
    company_name TEXT NOT NULL,
    category TEXT NOT NULL,
    job_type TEXT NOT NULL,
    location TEXT NOT NULL,
    salary_range TEXT NOT NULL,
    deadline DATE NOT NULL,
    description_en TEXT NOT NULL,
    description_am TEXT,
    requirements TEXT NOT NULL,
    telebirr_fee NUMERIC DEFAULT 500,
    telebirr_txn TEXT,
    status TEXT NOT NULL DEFAULT 'pending_admin_approval' CHECK (status IN ('pending_admin_approval', 'approved', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.career_jobs(id) ON DELETE CASCADE,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    resume_url TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied', 'Shortlisted', 'Interview', 'Hired', 'Rejected')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_email TEXT,
    title_en TEXT NOT NULL,
    title_am TEXT,
    category TEXT NOT NULL,
    job_type TEXT NOT NULL DEFAULT 'Fixed-Price',
    budget_min NUMERIC NOT NULL,
    budget_max NUMERIC,
    description_en TEXT NOT NULL,
    description_am TEXT,
    telebirr_txn TEXT,
    telebirr_status TEXT DEFAULT 'Pending Escrow',
    status TEXT NOT NULL DEFAULT 'pending_admin_approval' CHECK (status IN ('pending_admin_approval', 'approved', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.freelance_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    freelancer_email TEXT NOT NULL,
    bid_amount NUMERIC NOT NULL,
    delivery_days INT NOT NULL,
    telebirr_phone TEXT NOT NULL,
    cover_letter TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'active_contract', 'completed')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_email TEXT,
    title_en TEXT NOT NULL,
    title_am TEXT,
    category TEXT NOT NULL,
    price_etb NUMERIC NOT NULL,
    description_en TEXT NOT NULL,
    description_am TEXT,
    download_url TEXT,
    telebirr_txn TEXT,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending_admin_approval', 'approved', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    buyer_email TEXT NOT NULL,
    amount_etb NUMERIC NOT NULL,
    telebirr_txn TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.telebirr_transactions (
    txn_id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    payment_type TEXT NOT NULL,
    amount_etb NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'ESCROW_HELD',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    action_type TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelance_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telebirr_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved jobs" ON public.career_jobs;
DROP POLICY IF EXISTS "Public insert jobs" ON public.career_jobs;
DROP POLICY IF EXISTS "Public update jobs" ON public.career_jobs;

DROP POLICY IF EXISTS "Public read freelance" ON public.jobs;
DROP POLICY IF EXISTS "Public insert freelance" ON public.jobs;
DROP POLICY IF EXISTS "Public update freelance" ON public.jobs;

DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public insert products" ON public.products;
DROP POLICY IF EXISTS "Public update products" ON public.products;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public update profiles" ON public.profiles;

DROP POLICY IF EXISTS "Public all logs" ON public.activity_logs;

CREATE POLICY "Public read approved jobs" ON public.career_jobs FOR SELECT USING (true);
CREATE POLICY "Public insert jobs" ON public.career_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update jobs" ON public.career_jobs FOR UPDATE USING (true);

CREATE POLICY "Public read freelance" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Public insert freelance" ON public.jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update freelance" ON public.jobs FOR UPDATE USING (true);

CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products" ON public.products FOR UPDATE USING (true);

CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public all logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
