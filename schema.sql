-- TATARI Comprehensive Database Schema (PostgreSQL / Supabase)

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    company_name TEXT,
    tin_number TEXT,
    role TEXT NOT NULL DEFAULT 'seeker', -- 'admin', 'employer', 'seeker', 'buyer'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' (requires admin approval), 'approved', 'suspended'
    subscription_tier TEXT DEFAULT 'Free Tier',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Default Single Admin User as required
INSERT INTO public.profiles (email, full_name, role, status, subscription_tier)
VALUES ('admin@tatari.et', 'TATARI System Administrator', 'admin', 'approved', 'Enterprise')
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.career_jobs (
    id TEXT PRIMARY KEY,
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
    status TEXT NOT NULL DEFAULT 'pending_admin_approval', -- 'pending_admin_approval', 'approved', 'suspended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.jobs (
    id TEXT PRIMARY KEY,
    title_en TEXT NOT NULL,
    title_am TEXT,
    category TEXT NOT NULL,
    job_type TEXT NOT NULL,
    budget_min NUMERIC NOT NULL,
    budget_max NUMERIC,
    description_en TEXT NOT NULL,
    description_am TEXT,
    telebirr_txn TEXT,
    telebirr_status TEXT DEFAULT 'Pending Escrow',
    status TEXT NOT NULL DEFAULT 'pending_admin_approval',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E-commerce Product Selling Platform Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    title_en TEXT NOT NULL,
    title_am TEXT,
    category TEXT NOT NULL,
    price_etb NUMERIC NOT NULL,
    stock_qty INT NOT NULL DEFAULT 10,
    description_en TEXT NOT NULL,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Activity & Login / Logout Notification Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'LOGIN', 'LOGOUT', 'REGISTER', 'POST_JOB', 'BUY_PRODUCT'
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
