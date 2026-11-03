# TATARI Consulting — Website Foundation

A responsive, bilingual (English / Amharic) static website foundation for TATARI Consulting. It uses plain HTML, CSS and JavaScript, so there is no frontend build step and it can be deployed to Vercel as a static site.

## Current implementation

- Responsive corporate homepage and mobile navigation.
- English / Amharic language switching with remembered preference.
- Three business divisions: Consulting, Academy and Digital Store.
- Consulting capability overview and training topic list.
- Digital product catalogue presentation (display-only at this stage).
- Contact and account setup placeholders clearly marked for later backend integration.
- Basic SEO metadata and accessible navigation labels.

## Important current limitations

This is the first frontend implementation stage, not yet the complete online business. Customer authentication, database operations, shopping cart, payment submission, payment verification, secure downloads, course enrollment, inquiry storage and admin functions require the Supabase backend phases. No payment gateway is integrated or intended. Do not advertise products as purchasable until the backend and payment review workflow are live.

Contact details and the mail link are intentionally placeholders. Configure the real TATARI email and contact information before launch. Review all Amharic text and confirm product details/prices before public release.

## Local preview

You can open `index.html` directly in a browser. For a local server, use Python:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Deploy to Vercel

1. Import this project folder into a Git repository or upload it through the Vercel dashboard.
2. Choose **Other** as the framework preset.
3. Leave Build Command empty.
4. Set Output Directory to `.` (project root).
5. Deploy.

`vercel.json` contains the static-site configuration.

## Planned next phases

1. Supabase project setup, schema and migrations.
2. Authentication, roles and row-level security.
3. Products, orders and manual Telebirr payment submissions.
4. Admin payment verification and secure file entitlements.
5. Academy, lessons, progress and certificates.
6. Consulting inquiries, bookings and admin dashboard.

Never commit `.env` files, database passwords, service-role keys or other secrets to source control.
