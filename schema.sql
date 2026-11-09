-- Database setup for TATARI Platform: Company Logos, Testimonial Banners, Subscriptions, and Admin Bypass

-- Create Public Storage Bucket for Logos and Avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public-logos', 'public-logos', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access for Logos" ON storage.objects FOR SELECT USING (bucket_id = 'public-logos');
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public-logos' AND auth.role() = 'authenticated');

-- 1. Add Logo Column to Career Jobs & Freelance Projects
ALTER TABLE public.career_jobs ADD COLUMN IF NOT EXISTS company_logo TEXT;
ALTER TABLE public.career_jobs ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Software & Tech';

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS client_logo TEXT;

-- 2. Testimonials Table
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    company_title TEXT,
    author_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Employer Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan_tier TEXT DEFAULT 'free', -- free, pro, enterprise
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Testimonials & Subscriptions
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view testimonials" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create testimonials" ON public.testimonials FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert/update subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
