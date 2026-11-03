# TATARI Phase 3 — Supabase Authentication

This is a static-site Phase 3 starter for the TATARI website. It includes email/password registration, sign-in, sign-out, email confirmation messaging, and password reset/update using Supabase Auth.

## Supabase configuration already inserted

- Project URL: `https://rcloqzhlwcmmlnhmgjyc.supabase.co`
- Browser key: Supabase publishable key supplied by the project owner.

The publishable key is intended for browser use. Never add a Supabase `service_role` or secret key to frontend files or GitHub.

## Deploy through GitHub and Vercel

1. Extract this ZIP on your computer.
2. Open the extracted `TATARI_PHASE3_AUTH` folder.
3. Upload the files and folders inside it to the root of a **new GitHub repository or a separate branch** first. Do not overwrite your existing live website until you have reviewed and tested this package.
4. In Vercel, import that repository as a new project, or create a preview deployment. No build command is needed; the site is static. The output directory is the repository root.
5. After deployment, note the exact Vercel URL.

## Supabase Auth URL settings

In Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://tatari-website.vercel.app`
- Add Redirect URL: `https://tatari-website.vercel.app/**`
- If testing a preview deployment, add its exact URL pattern as an additional redirect URL, for example `https://your-preview-domain.vercel.app/**`.

Do not remove other redirect URLs that your project needs.

## Test checklist

- Register with an email address you control.
- If email confirmation is enabled, open the confirmation email and follow its link.
- Sign in with the same email and password.
- Use “Forgot your password?” and follow the email link.
- Set a new password and sign in again.
- Sign out.

## Important limitations

This phase is authentication only. It does not yet implement the consulting inquiry backend, admin dashboard, product catalogue, order creation, manual Telebirr payment review, protected downloads, or Academy/LMS workflows. Do not accept customer payments or promise paid access until those workflows and their server-side authorization have been implemented and tested.

This package is a standalone starter and does not contain your earlier website's complete source. Merge it with the existing TATARI site only after reviewing the current repository and testing a separate deployment.
