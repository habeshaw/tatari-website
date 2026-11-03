# TATARI release QA report

## Checks completed on this package

- `node --check app.js` — passed.
- `node --check i18n.js` — passed.
- `node --check supabase-config.js` — passed.
- Header navigation state is wired so signed-out users see **Login**, signed-in users see **My account** and **Logout**, and Logout invokes Supabase local sign-out.
- English and Amharic labels are set for the header Login/Logout controls.
- Static HTML parse — passed; all initialization IDs exist and there are no duplicate IDs.
- English-to-Amharic static copy audit — 143 of 143 visible English text nodes have Amharic translations or are preserved brand/wordmark text.
- Frontend/database reference audit — every referenced public table, RPC function and Storage bucket has a corresponding definition in the supplied migrations.
- No sample products, courses, testimonials, staff, customers, orders, payments or receipts are seeded.
- Private storage buckets are created/kept private. File upload controls use authenticated admin access; payment evidence is uploaded under the signed-in customer's UUID folder.

## Checks that still require your live Supabase/Vercel environment

These cannot be truthfully marked as passed from a local source inspection:

- Supabase SQL execution against your existing project and schema compatibility.
- Email confirmation and password-reset email delivery (including SMTP provider limits).
- Real sign-up, sign-in, password recovery and session persistence.
- RLS enforcement with separate customer and administrator accounts.
- Real order creation, Telebirr submission and admin approval.
- Storage upload/download permissions and signed download links.
- Live production deployment and browser testing on the deployed domain.

Run `supabase/diagnostics.sql` after migrations. Complete the first-use checklist in `README.md` before accepting payments or customers.


## Product/catalog scope

The product and course tables are connected to the storefront and administrator catalog workflows. They remain empty unless real product files, course materials and confirmed prices are supplied. No fictional products or deliverables are seeded.
