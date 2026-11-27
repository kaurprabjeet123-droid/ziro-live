# ziro — standalone live build

A standalone, deployable copy of **ziro**, the worldwide reselling marketplace.
Built as a Vite + React app so Vercel can deploy it from GitHub.
It does **not** depend on Muse.

- Name: lowercase `ziro`, deep navy `#141B56`, vibrant teal `#00B0A9`
- Flat, utilitarian eBay / Facebook Marketplace style
- No sample listings — the site starts empty, ready for real sellers, from cities around the world, Rent It, Best deals, Local deals,
  Saved / Watch / price-drop alerts, Chat, Sell / Your listings, ads,
  payment-methods demo, Terms / Privacy / Safety / Launch checklist
- **Real photos**: the original's own photo assets are bundled in
  `public/assets/` (the listing photos, banner, logo, SNAP IT icon) —
  no emoji tiles anywhere. Rent rate is the original's formula:
  about 4% of the price a day ($2 minimum), deposit half the price.
- Home order matches the original: banner, Rent It (empty until real rentals are listed),
  ad spotlight, Gift them home / Cook with heart / Game like a gamer /
  Move like an athlete photo tiles, Best deals ($25 and under, cheapest
  first), Local deals ($25 and under within 5 km, nearest first),
  Recently viewed, All listings grid with city filter + sort.
- SNAP IT is only a small scan icon inside the search bar, no text;
  Take Photo opens the live camera (`capture="environment"`).

## What works now

- Home, Browse (city filter + sort), product pages, Rent It panel
  (1/3/7/14/30 days, deposit, total — no Buy Now), Make Offer, Share, Report
- Sell form, Your listings (edit / delete your own only), Saved, Watching
- Notifications when a watched listing's price drops
- Chat (starts empty — no seeded chats), SNAP IT modal, rotating ad spotlight (7s, 1.4s fade, hidden while there are no live ads)
- Ads: $0.99 image / $2.99 video, PENDING until paid (demo), then LIVE
- Sign-in: **real Google / Facebook OAuth, like eBay.** Tap "Continue
  with Google" → Google's own "Choose an account" page → Google sends
  you back to ziro at `/signin/google/cb` → a Vercel serverless
  function (`api/auth/google.js`) swaps the one-time code for your
  name + email using the client secret (server-side only) → ziro shows
  "We'll use your Google details to create your ziro account" and one
  tap ("Create account") creates/logs in the account, no password typed
  into ziro, no phone code. Facebook works the same way
  (`api/auth/facebook.js`, `/signin/fb/cb`). There is no name/email or
  password form in ziro at all — sign-in is Google or Facebook only,
  and the sign-in box says "Sign in to your account" with "New to
  ziro? Create account", exactly like eBay. **This only works live once
  the env vars below are set in Vercel** — without them the buttons say
  so instead of sending you to a dead-end page.
- Data: no sample listings in `src/data/listings.js`; your listings, saved,
  watched, notifications and recent views persist in `localStorage`.

## What is still missing / next steps

- **Real database** — localStorage is per-browser. Next step: Supabase,
  Firebase, or a small Postgres + API, then move listings/users there.
- **Real OAuth server flow — BUILT, needs env vars to work live** —
  the redirect URIs below are registered, and the server code that
  completes sign-in back into the app is in `api/auth/google.js` and
  `api/auth/facebook.js` (Vercel serverless functions). They exchange
  the code with the client secret, which is read from Vercel
  environment variables only. Never put secrets in code — use Vercel
  environment variables. **To switch it on (an adult):** in Vercel →
  Settings → Environment Variables, add `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_ID`,
  `FACEBOOK_APP_SECRET`, and `VITE_SITE_URL=https://ziro.site`, then redeploy.
  (The browser fetches the public client IDs at run time from
  `/api/auth/config` — there are no VITE_GOOGLE_CLIENT_ID /
  VITE_FACEBOOK_APP_ID vars, on purpose: baking them in at build
  time made the bundler delete the sign-in redirect.)
  Get the values from the user's private Notepad file / Google Cloud /
  Meta dashboard — never paste them in chat or in code. To test on the
  Vercel preview URL before ziro.site is connected, also add the
  preview redirect URIs (`https://<project>.vercel.app/signin/google/cb`
  and `.../signin/fb/cb`) in Google Cloud and in Facebook, exactly as
  written. Until the env vars are set, the sign-in buttons explain
  that sign-in is not set up yet instead of failing silently.
- **Real payments** — the checkout is a demo: no real money moves.
  Real charging needs Stripe, set up with an adult.
- **Real photos** — showcase tiles use the original's bundled photos.
  Photos for *new* listings a user uploads in the Sell form are stored
  in the browser only (localStorage); a shared photo store
  (e.g. Cloudinary / Supabase Storage) is still needed for a real launch.
- Apple sign-in is **not** included — the user declined it ($99/year).

## Publish-ready check (2026-11-23, not published)

- `npm run build` passes (Vite, 32 modules, ~225 kB JS / ~70 kB gzip).
- Built site serves the bundled assets (photos, logo, banner, SNAP IT icon).
- Bundle contains no sample listings; showcase sections, ad titles,
  footer links and all 19 info pages; no emoji tiles remain in the code.
- **NOT published**: nothing was committed to GitHub, nothing deployed
  to Vercel, no domain added, no link shared. Show the user first and
  ask before publishing.

## OAuth — already registered

- Google Cloud project `ziro`, OAuth client (Web application)
  - Redirect URI: `https://ziro.site/signin/google/cb`
- Meta/Facebook app `ziro`, Facebook Login
  - Valid OAuth Redirect URI: `https://ziro.site/signin/fb/cb`

Copy `.env.example` to `.env` locally (never commit `.env`).
Set the same values in Vercel, not in the repo.

## Deploy on Vercel (for Dad / an adult)

1. Push this folder to GitHub:
   ```bash
   cd ziro-live
   git init
   git add .
   git commit -m "ziro live build"
   git branch -M main
   git remote add origin https://github.com/<your-account>/ziro-live.git
   git push -u origin main
   ```
   Use a **new public repo** (e.g. `ziro-live`). Do not reuse the old
   Lovable repo `kaurprabjeet123-droid/ziro-secondhand-circle` — that is
   a different, older version of ziro, not this one.
2. Go to https://vercel.com → Add New → Project → Import `ziro-live`.
   Framework: Vite. Build command: `npm run build`. Output: `dist`.
3. Environment variables (Vercel → Settings → Environment Variables):
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`,
   `VITE_SITE_URL=https://ziro.site`
   Get the values from the user's private Notepad file / Google Cloud /
   Meta dashboard — never paste them in chat or in code. Without these,
   Google/Facebook sign-in shows "not set up yet" instead of working.
4. Deploy. Open the `*.vercel.app` URL and check: home, Rent It, a
   product page, Sell, Saved, sign-in links.
5. Custom domain: Vercel → Project → Settings → Domains → add
   `ziro.site`. Vercel will show DNS records (usually an A record
   `76.76.21.21` and/or a CNAME). In Namecheap → Domain List →
   `ziro.site` → Advanced DNS, add exactly those records. Wait up to
   an hour for DNS to spread, then open https://ziro.site.
6. Test Google and Facebook sign-in on `ziro.site` once the server
   OAuth step is built.

## Run locally

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # checks the production build
npm run preview
```

## Domain

`ziro.site` — bought 2026-11-23 on Namecheap, $1.41/yr + $0.29 ICANN
(C$1.69 total, renews at C$2.55/yr), in Dad's Namecheap account.
