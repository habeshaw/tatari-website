# TATARI Consulting — website + Supabase backend

This package is a deployable static website and Supabase-backed customer/admin system for the existing TATARI site. It keeps the existing project choices:

- Website hosting: existing Vercel project `tatari-website`
- Source: existing GitHub repository connected to Vercel
- Backend/database: existing Supabase project `rcloqzhlwcmmlnhmgjyc` (Frankfurt)
- Payment: manual Telebirr only; there is no payment gateway or card processor
- Currency: ETB and USD for catalog items, with the administrator responsible for entering the actual supported prices

The browser configuration contains the previously supplied Supabase **publishable** key. This key is designed for browser use; Row Level Security (RLS) is required. Never add a Supabase `service_role` key, secret key, database password, SMTP password or personal access token to this project or GitHub.

## Latest navigation/authentication update

- Signed-out visitors see a clearly labelled **Login** button. It opens the sign-in form, where they can also create an account or request a password reset.
- Signed-in customers and administrators see **My account** and **Logout**. My account opens the customer portal or the administrator control centre according to the signed-in role.
- Logout calls Supabase `auth.signOut({ scope: 'local' })`, clears the current browser session, and returns the navigation to the signed-out Login state.
- Amharic navigation labels are supported: Login = ግባ, Logout = ውጣ.

This is a frontend update. It does not require a database migration and does not delete or replace any existing Supabase records. The existing project URL and browser-safe publishable key are already in `supabase-config.js`.

## What is included

### Public website content

- TATARI brand statement: “People • Data • Technology • Growth”
- About TATARI, Addis Ababa location, five capability areas, four published signature solutions and starting prices, delivery process, reasons to work with TATARI and target customer groups
- Full bilingual public-page interface: navigation, service descriptions, solutions, Academy, delivery process, audience, inquiry form and footer switch between English and Amharic; language choice is saved in the browser and to the signed-in profile
- Inquiry form that writes to Supabase
- Digital Store and Academy catalog areas, which remain honestly empty until actual products/files, course curriculum and prices are supplied

The content and starting prices were transcribed from the existing public TATARI site on 2026-11-03. The website's previous email and telephone fields were placeholders (`name@tatariconsulting.com` and `+251 9XX XXX XXX`), so they are not presented as verified contact details or seeded into the database. No invented staff, testimonials, customers, courses, downloadable products, orders, payment records or sample transactions are added.

### Customer features

- Email/password registration, sign-in and sign-out
- Password reset email and a password-update screen after the user opens the recovery link
- Live catalog from Supabase
- Cart and server-priced order creation
- Manual Telebirr payment submission with transaction reference and optional receipt evidence
- Customer portal for order status, download entitlements and course enrolments

### Admin features

- Payment review and approve/reject workflow
- Inquiry tracking
- Create/publish products and courses
- Upload private product download files from the admin catalog
- Create course sections and lessons, add optional video links and upload private lesson materials
- View orders and their current status
- Configure official Telebirr number, account name and payment instructions
- Admin role is assigned manually in Supabase; public visitors cannot promote themselves

### Products and courses — publishing policy

The four existing signature consulting solutions and the service-offering records remain part of the public TATARI offering. The Digital Store and Academy use the live Supabase catalog and include administrator forms for adding products, uploading private downloadable files, creating course sections and lessons, and publishing only when ready. No fictitious digital products, downloadable files, course curricula, testimonials, or unverified prices have been inserted. To make a digital item genuinely saleable, TATARI must provide its actual deliverable/file, bilingual title and description, and confirmed ETB/USD price before it is published.

### Database content

Migration `202611030003_tatari_verified_site_content.sql` creates `site_content` and `service_offerings` tables and seeds the verified public website content (five capabilities, four signature solutions, descriptions, bilingual copy where supplied, and the starting-price labels already published on the existing website). Migration `202611030004_bilingual_catalog.sql` adds optional Amharic fields to actual products, courses, course sections and lessons. It deliberately does not seed products or courses because actual downloadable files, course curricula and confirmed catalog prices have not been supplied.

## Deployment — follow in order

### A. Download and prepare the frontend

1. Extract the ZIP file on your computer.
2. Open the `TATARI_PHASE3_COMPLETE` folder.
3. The files `index.html`, `app.js`, `style.css`, `supabase-config.js` and `vercel.json` must be at the root of the GitHub repository. Do not upload an extra nested folder containing them.
4. The Supabase URL and publishable key are already filled in `supabase-config.js` for the existing TATARI project. Do not replace them with a secret/service-role key.

### B. Check and prepare the existing Supabase database

Do not delete the existing project and do not create a second database. Open Supabase Dashboard → SQL Editor and run this diagnostic query first:

```sql
select
  to_regclass('public.profiles') as profiles_table,
  to_regclass('public.products') as products_table,
  to_regprocedure('public.create_customer_order(text,jsonb,text)') as create_order_function,
  to_regprocedure('public.review_payment(uuid,text,text)') as review_payment_function,
  to_regclass('public.site_content') as site_content_table;
```

Interpret the results:

- If `profiles_table` and `products_table` are `NULL`, the base schema is not installed. Run `supabase/migrations/202611030001_initial_schema.sql` once.
- If the base tables already exist, **do not rerun 001**. It creates policies and triggers and is not intended as a repeat-install script.
- If `create_order_function` is `NULL`, run `supabase/migrations/202611030002_phase3_functions_and_policies.sql` once. If the function exists, skip 002.
- Run `supabase/migrations/202611030003_tatari_verified_site_content.sql` after the base schema. This migration is designed to be repeatable and updates the seeded public content without creating fake catalog items.
- Run `supabase/migrations/202611030004_bilingual_catalog.sql` after 003. It adds optional Amharic fields to products, courses, sections and lessons; it does not create sample catalog content.

Run each required SQL file separately and wait for the Supabase success message. If a script returns an error, stop and share the exact error; do not continue with later migrations blindly.

### C. Configure Supabase Storage

If you ran migration 001 successfully, it creates these private buckets:

- `product-files`
- `payment-evidence`
- `course-materials`

Open Supabase → Storage and confirm that all three exist and are **private**, not public. Do not upload customer payment evidence to a public bucket.

### D. Configure authentication and password reset

In Supabase → Authentication → URL Configuration:

- Site URL: `https://tatari-website.vercel.app`
- Redirect URL: `https://tatari-website.vercel.app/**`

Save the settings. The reset-email code redirects to the existing production website and displays a new-password form after Supabase reports the `PASSWORD_RECOVERY` event.

If Supabase displays “email rate limit exceeded”, repeated reset clicks will not solve it. Wait for the limit window to pass, then configure a verified SMTP sender under Supabase → Project Settings → Authentication/SMTP (menu wording can vary). Use the SMTP credentials supplied by the email provider; never place SMTP credentials in the frontend or GitHub. Confirm the sender/domain with the provider first. Built-in email delivery may have restrictive limits.

### E. Deploy the frontend to the existing Vercel project

1. Sign in to GitHub and open the repository currently connected to `https://tatari-website.vercel.app/`.
2. Replace the old website files with the contents of the extracted `TATARI_PHASE3_COMPLETE` folder. Keep `index.html` at repository root.
3. Commit the changes to the same deployment branch already connected to Vercel.
4. Open Vercel → existing `tatari-website` project → Deployments.
5. Wait until the newest deployment says **Ready**.
6. Open `https://tatari-website.vercel.app/` in a private/incognito window and press Ctrl+Shift+R.

No build command is needed. This is a static HTML/CSS/JavaScript site.

### F. Create your administrator account

1. Open the deployed website and register using your own email address.
2. If email confirmation is enabled, confirm the account first.
3. In Supabase → Authentication → Users, open your account and copy its UUID.
4. In SQL Editor, replace the placeholder below with that UUID (not your email) and run:

```sql
insert into public.user_roles(user_id, role)
values ('YOUR_AUTH_USER_UUID', 'admin')
on conflict do nothing;
```

5. Sign out of TATARI and sign in again. Your account should now show **My account** and open the administration area.

Do not give the admin role to customers or unknown accounts.

### G. Configure manual Telebirr

1. Sign in with the administrator account.
2. Open **My account → Settings**.
3. Enter TATARI's real official Telebirr number, account holder name and payment instructions.
4. Save the settings.

Those fields are intentionally blank until you enter the correct business payment details. Customers submit a transaction reference and may upload receipt evidence. An administrator must independently confirm the transaction in Telebirr before approving it. A screenshot alone is not proof of payment.

### H. Add actual products and courses

The public catalog is intentionally empty until TATARI has real products and course details to publish.

1. Open **My account → Catalog**.
2. Add a product or course using its real title, description and confirmed ETB/USD price.
3. Publish only when the content is ready.
4. For downloadable products, use the **Upload product files** control under the product in the admin Catalog. It uploads to the private `product-files` bucket and records the file metadata automatically.
5. For courses, use **Manage sections and lessons** beside the course. Add sections and lessons, enter optional video links, and upload private lesson materials through the form.
6. Publish courses only after their real curriculum, materials and confirmed prices are complete.

Do not use invented demonstration prices or sample receipts for real customer transactions.

For a broader read-only verification of required tables, functions, storage buckets and RLS policies, run `supabase/diagnostics.sql` in SQL Editor. It does not modify the database.

See `QA_REPORT.md` for the checks completed on this source package and the tests that still require the live Supabase/Vercel environment.

## First-use test checklist

- [ ] Homepage and all static TATARI content load.
- [ ] Public capability and signature-solution content is visible.
- [ ] `site_content` and `service_offerings` contain seeded rows in Supabase Table Editor.
- [ ] Migration 004 is applied; Amharic catalog and Academy fields are available.
- [ ] A customer can register and sign in.
- [ ] Password reset email arrives, opens the current site, and allows a new password to be saved.
- [ ] Contact form inserts a row into `public.inquiries`.
- [ ] A normal customer cannot access the admin dashboard.
- [ ] Admin can configure Telebirr and manage inquiries.
- [ ] After adding a real product/course, catalog and order creation work.
- [ ] Payment approval is tested only with a real, independently verifiable test transaction.
- [ ] Approval grants the corresponding download/course access.

## Important honest limitations

- This ZIP is prepared for deployment, but I cannot sign in to your GitHub, Vercel or Supabase account or press Deploy on your behalf. Your account-side steps above are required.
- I have checked JavaScript syntax, the bilingual dictionary and package structure locally; I have not authenticated against your live Supabase project, run the migrations in your database, or completed a live checkout. Do not accept real customer payments until the checklist passes.
- Password reset still depends on Supabase email delivery, correct URL allowlisting and any configured SMTP provider. The code fixes the post-reset password-update flow; it cannot bypass provider rate limits.
- No actual products, courses, files, contact email, telephone, staff profiles, testimonials, customer/order records or Telebirr account details were invented or preloaded.
