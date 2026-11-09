# TATARI Consulting — Multilingual Job Portal & Digital Learning Marketplace (v2)

A fully responsive, bilingual (English & Amharic) Job Search Engine, Freelance Platform, and Digital Learning Marketplace designed for Ethiopia and international deployment.

## Key Improvements in v2
- **True Bilingual Translation System (`i18n.js`)**: Complete UI translation dictionary adhering to proper Amharic grammar and structure (avoiding literal word-for-word translation).
- **Noto Sans Ethiopic Font Integration**: Automatically activates professional Amharic typography when switching to Amharic mode.
- **Persistent Language Preference**: Automatically remembers user language choice using `localStorage`.
- **Granular Role Separation**: Distinct permissions for Ordinary Users, Employers, and System Administrators, with role switching simulation and dedicated data export (CSV/Excel).
- **Supabase PostgreSQL & RLS**: Fully updated database schema and RLS security policies.

## How to Deploy to GitHub and Vercel

1. **Extract Zip File**: Download and extract `tatari-multilingual-job-portal-complete-v2.zip`.
2. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Upgrade to TATARI v2 Multilingual Platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```
3. **Database Setup**: Execute `schema.sql` in your Supabase SQL Editor.
4. **Deploy to Vercel**: Connect your GitHub repository to Vercel.
