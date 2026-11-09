-- Extend products & courses tables with Amharic columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_am TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_am TEXT;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS title_am TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description_am TEXT;

-- Create Jobs table
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
    job_type TEXT DEFAULT 'fixed_price',
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Proposals table
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

-- Row Level Security (RLS) Policies
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open jobs" ON public.jobs
    FOR SELECT USING (status = 'open' OR auth.uid() = client_id);

CREATE POLICY "Authenticated users can create jobs" ON public.jobs
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Job owners can update jobs" ON public.jobs
    FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Freelancers can view own proposals or job owners view proposals" ON public.proposals
    FOR SELECT USING (
        auth.uid() = freelancer_id OR 
        EXISTS (SELECT 1 FROM public.jobs WHERE id = proposals.job_id AND client_id = auth.uid())
    );

CREATE POLICY "Authenticated freelancers can submit proposals" ON public.proposals
    FOR INSERT WITH CHECK (auth.uid() = freelancer_id);