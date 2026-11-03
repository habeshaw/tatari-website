# TATARI English-only release QA report

## Package checks completed

- `node --check app.js` — passed.
- `node --check supabase-config.js` — passed.
- HTML parser check — passed.
- Duplicate HTML ID check — passed.
- Internal page-anchor check — passed; every local `#section` link has a target.
- Local asset check — passed; every local script and stylesheet referenced by the page exists.
- English-only source check — passed; no Amharic/Ethiopic characters, language toggle, translation script, Amharic display class, or Amharic text remains in the website HTML, CSS, or application JavaScript.
- Authentication navigation source check — passed; signed-out state shows Login, authenticated state shows My account and Logout, and Logout calls Supabase local sign-out.
- Catalog/admin form source check — passed; product upload form and its JavaScript selector now use the same `data-product-upload` attribute.
- Supabase configuration check — passed; the existing project URL and browser-safe publishable key are retained. No service-role secret is configured in the frontend.
- Vercel configuration JSON check — passed.
- ZIP archive integrity check — passed (`ZipFile.testzip()` returned no errors).

## Tests not completed / live environment required

A real browser session against Supabase/Vercel was not completed in this build environment. The headless Chromium process did not complete, so no browser-interaction test is claimed. The following must be tested after deployment using the real project:

- Sign-up, sign-in, session persistence, password recovery email delivery, and customer/admin logout.
- Customer versus administrator role access and Row Level Security.
- Live inquiry inserts, order RPC, payment evidence uploads, Telebirr payment review, and download entitlements.
- Storage policy enforcement and signed download links.
- Production deployment and mobile/desktop browser testing.

The JavaScript syntax, page structure, links, configuration, and ZIP have been checked locally. This is not a certification that all backend features work against the live database.

## Catalog policy

No fictitious downloadable products, course curricula, files, prices, testimonials, staff, customers, orders, payments, or receipts are seeded. The Digital Store and Academy display only published records from the connected Supabase catalog. Add actual deliverables, course materials, and confirmed prices before publishing items for sale.

## Branding note

The original TATARI logo image was not present in the available website ZIP or identifiable uploaded image files. The existing TATARI text/lettermark is retained rather than replacing it with an invented logo. Supply the original logo file to replace it accurately.
