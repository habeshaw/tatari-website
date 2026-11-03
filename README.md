# TATARI Phase 3 — Complete website and customer/admin workflows

This package continues the TATARI Consulting website from Phases 1 and 2. It uses the existing Supabase project as the **only database** and Vercel for static hosting. It does **not** use a payment gateway. Customers pay manually through the official Telebirr account; TATARI staff independently verify the transaction and approve or reject the submission.

## Included

- Responsive TATARI Consulting public website (Consulting, Academy, Digital Store, About, Contact).
- English-first interface with Amharic language switch placeholder (Amharic page translation is not yet complete).
- Supabase email/password registration, sign-in, password reset and sign-out.
- Live published product/course catalog and cart.
- Secure server-side order pricing through a PostgreSQL RPC (the browser cannot set its own prices).
- Manual Telebirr checkout, transaction reference and optional receipt upload.
- Customer portal: order history, payment status, purchased downloads and course enrolments.
- Admin portal: payment review, approval/rejection, product/course creation and publishing, inquiry tracking, Telebirr settings.
- Private Supabase Storage buckets and entitlement-based download access.
- Vercel-ready static deployment.

## Free services

The project is designed to run on free tiers: Supabase Free and Vercel Hobby. Free tiers have quotas and provider terms can change. Domain registration, email delivery beyond free quotas, and any optional paid services are not included. No payment gateway is integrated.

## Before deployment — one-time setup

### 1. Keep your existing Supabase project

Use the existing TATARI project (`rcloqzhlwcmmlnhmgjyc`, Frankfurt). Do not create a second database.

### 2. Apply the Phase 3 database migration

Phase 2 already created the base schema. In Supabase:

1. Open **SQL Editor → New query**.
2. Open `supabase/migrations/202611030002_phase3_functions_and_policies.sql` in this ZIP.
3. Copy the entire file into SQL Editor and click **Run**.
4. Confirm `Success` with no SQL errors.

Do not rerun Phase 2's initial schema if it has already been applied. The Phase 3 migration adds secure order creation, private file entitlement policies, lesson progress access and payment status tracking.

### 3. Configure the browser-safe Supabase key

1. Open `supabase-config.js`.
2. The project URL is already filled in.
3. Replace `PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE` with the existing **publishable key** (or legacy anon key) from Supabase → Project Settings → API / Connect.
4. Save the file.

Never paste a `service_role` key, secret key, database password or personal access token into this file or GitHub.

### 4. Configure Supabase Authentication URLs

In Supabase → Authentication → URL Configuration:

- Site URL: `https://tatari-website.vercel.app`
- Redirect URL: `https://tatari-website.vercel.app/**`

If testing locally, temporarily add the exact local origin you use (for example `http://localhost:5500/**`). Remove temporary URLs when no longer needed.

### 5. Make your existing user an administrator

1. Register your own account on the website.
2. In Supabase → Authentication → Users, copy your account's UUID.
3. Run this in SQL Editor after replacing the placeholder with the UUID (not the email):

```sql
insert into public.user_roles(user_id, role)
values ('YOUR_AUTH_USER_UUID', 'admin')
on conflict do nothing;
```

4. Sign out and sign back in. The **My account** button will open the admin control centre.

Do not give admin role to ordinary customers. Admin promotion is intentionally not available from public registration.

### 6. Configure Telebirr

From the admin control centre → **Settings**, enter the official Telebirr number, account name and customer instructions. Save. The checkout page displays these values.

Do not accept payment screenshots as proof by themselves. Independently confirm each transaction in Telebirr before clicking **Approve**. The database approval function checks the amount and currency against the order and grants access only after approval.

## Deploy to the existing Vercel project

1. Extract this ZIP on your computer.
2. Open the extracted `TATARI_PHASE3_COMPLETE` folder.
3. Confirm `supabase-config.js` contains your Supabase URL and publishable key.
4. Upload/replace the files in your existing GitHub repository. Keep the folder contents at the repository root (so `index.html` is at the root, not inside an extra nested folder).
5. Commit the changes to the branch connected to your existing Vercel project.
6. In Vercel, open the existing `tatari-website` project and wait for the deployment to finish.
7. Open `https://tatari-website.vercel.app` in a private/incognito browser window and test the checklist below.

`vercel.json` is included. No build command or framework preset is required; this is a static HTML/CSS/JavaScript site.

## Add digital products and files

1. Sign in with the administrator account and open **My account → Catalog**.
2. Create a product or course with a unique lowercase slug.
3. To attach a downloadable product file, open Supabase → Storage → `product-files` (private bucket). Upload the file using a path such as `product-slug/guide.pdf`.
4. In Supabase SQL Editor, attach the file to the product using the product UUID:

```sql
insert into public.product_files(product_id, storage_path, file_name)
values ('PRODUCT_UUID', 'product-slug/guide.pdf', 'guide.pdf');
```

The customer receives a time-limited download link only after the payment is approved and entitlement is granted.

## Add course lessons

Create the course in the admin Catalog tab, then add sections and lessons from Supabase SQL Editor. Example (replace IDs and content):

```sql
insert into public.course_sections(course_id, title, position)
values ('COURSE_UUID', 'Module 1 — Getting Started', 1)
returning id;

insert into public.lessons(section_id, title, description, video_url, position, is_preview)
values ('SECTION_UUID', 'Introduction', 'Course introduction', 'https://your-video-link', 1, true);
```

For paid course material, upload files to the private `course-materials` bucket and set the lesson `material_path` to the exact object path. Students can read lessons after enrollment; preview lessons are visible publicly.

## Test before launch

- [ ] Public home page, consulting sections and catalog load.
- [ ] Create a test customer account and confirm email if email confirmation is enabled.
- [ ] Sign in and add a published product to cart.
- [ ] Confirm checkout calculates price from the database, not browser input.
- [ ] Submit a test payment using a real test transaction only; do not invent a payment receipt.
- [ ] Verify a normal customer cannot see the admin control centre.
- [ ] Verify the admin can inspect payment evidence and independently verify the transaction.
- [ ] Approve a confirmed test payment and verify that download/course entitlement appears.
- [ ] Confirm another customer cannot download the purchased file.
- [ ] Test rejected payment and resubmission.
- [ ] Test inquiry submission and admin status update.

## Important scope and honest limitations

- This package is a complete first operational Phase 3 implementation, but it cannot be connected to your Supabase/Vercel account or deployed without your explicit account-side actions.
- The Amharic toggle is a placeholder; the current page content is English. A complete Amharic translation is a separate content pass.
- Admin can create and publish products/courses and manage payments/inquiries. Product file attachment and course lesson authoring are currently completed through the Supabase dashboard/SQL instructions above.
- Email delivery depends on your Supabase Auth email configuration and provider limits. Use a verified custom SMTP provider if the built-in email rate limit blocks sign-up/reset emails.
- Do not take real customer payments until the end-to-end checklist has passed with separate test customer and admin accounts.
