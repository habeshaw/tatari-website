# TATARI customer checkout follow-up QA report

## Source-level fixes in this package

- Cart contents are saved in browser localStorage and restored after a page reload.
- Cart quantity is refreshed after add, remove, and quantity changes.
- Checkout rechecks the current Supabase authentication session before attempting order creation.
- If sign-in is required during checkout, the customer cart is retained and the cart modal reopens after successful sign-in.
- After a successful order RPC, the cart is cleared from browser storage.
- Existing Supabase project URL and browser-safe publishable key are retained. No service-role key is included.
- Existing database migrations are included as reference only; this follow-up package does not require rerunning them.

## Local checks completed

- `node --check app.js` — passed.
- `node --check supabase-config.js` — passed.
- ZIP archive integrity — passed.

## Live checks not completed

The build environment could not resolve the live Vercel hostname, so the deployed website and Supabase backend could not be reached from this session. Therefore the following remain unverified: real customer sign-in/session persistence, order RPC execution, payment submission and receipt upload, admin approval, storage permissions, and download entitlement creation. These must be tested in the live site before accepting real customer payments.

## Database safety

Do not drop tables, recreate the Supabase project, or rerun the bundled initial-schema/site-content migrations on an already configured database. The existing database and its records must be preserved. This package contains frontend changes only for cart/session continuity; it does not apply SQL changes.
