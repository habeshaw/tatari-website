# TATARI Consulting — Multilingual Job Portal & Digital Learning Marketplace

A responsive, bilingual (English & Amharic) Job Search Engine, Freelance Platform, and Digital Learning Marketplace designed for desktop and mobile deployment.

## Key Features
- **Bilingual Interface**: Toggles interface text and listings between English (`EN`) and Amharic (`አማ`).
- **Selectable Discovery Engine**: Instant search filters for keyword, location, salary range, category, and employment type.
- **Role-Based Access Control**: Separate permissions and controls for Ordinary Users, Employers, and System Administrators.
- **Data Export Tools**: One-click CSV and Excel (`.xls`) application report generation.
- **Employer Subscriptions**: Pricing plans for recruitment vacancies and employer branding.
- **Supabase PostgreSQL & RLS**: Fully populated database migrations and Row Level Security policies.

## How to Deploy to GitHub and Vercel

1. **Extract Zip File**: Download and extract `tatari-multilingual-job-portal-complete.zip` on your computer.
2. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Tatari Multilingual Platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```
3. **Database Setup**: Run `schema.sql` inside your Supabase SQL Editor to provision tables, buckets, and RLS policies.
4. **Deploy to Vercel**: Connect your GitHub repository to Vercel. Vercel will automatically detect `vercel.json` and deploy your website live.
