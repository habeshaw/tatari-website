# TATARI Consulting — Website

Static, bilingual (English / Amharic) website for TATARI Consulting. No build step required — plain HTML/CSS/JS.

## Files

- `index.html` — page markup
- `style.css` — all styling (light/dark mode aware)
- `script.js` — language toggle (EN/AM) + footer year
- `vercel.json` — clean URLs config for Vercel

## Deploy to Vercel

**Option A — Dashboard (no install needed)**
1. Go to vercel.com → **Add New… → Project**.
2. Choose **Deploy without Git** / drag-and-drop, and drop this folder (or the unzipped contents) in.
3. Framework preset: **Other** (static). Build command: none. Output directory: `/` (root).
4. Click **Deploy** — you'll get a `*.vercel.app` URL immediately.

**Option B — Vercel CLI**
```bash
npm install -g vercel
cd tatari-website        # this folder
vercel                   # first deploy (follow prompts)
vercel --prod             # promote to production
```

**Option C — Git**
Push this folder to a GitHub/GitLab/Bitbucket repo, then "Import Project" in Vercel and select it. Every push to `main` auto-deploys.

## Connect your own domain

In the Vercel project → **Settings → Domains** → add `tatariconsulting.com` (or whatever you've registered) → follow the DNS instructions Vercel gives you (usually one CNAME or A record at your registrar).

## Before going fully public

- [ ] **Contact form**: it currently just shows a confirmation alert. Wire it to a form service (e.g. Formspree, Web3Forms) or your own backend so messages actually reach you — see the `<form>` in `index.html`.
- [ ] **Real contact details**: replace the bracketed `[email]`, `[phone]`, `[LinkedIn]` placeholders in `index.html` (appears twice — English and Amharic blocks).
- [ ] **Amharic review**: the Amharic copy is a solid first draft but hasn't been reviewed by a native speaker — worth a proofread before launch.
- [ ] **Favicon / social preview image**: optional, but add a `favicon.ico` and Open Graph meta tags if you want a branded tab icon and link previews.
