# Abundance website

On-demand training data for physical AI.

A plain static site (HTML, CSS, and JavaScript) with no build step, hosted on Cloudflare.

## Pages

| File | Page |
|---|---|
| `index.html` | Homepage |
| `jobs.html` | Jobs listing with tabs, filters, search, sorting, pagination, and saved jobs |
| `signup.html` | Sign-up flow (contributor or team) |
| `login.html` | Log-in and password reset flow |
| `demo.html` | Dataset builder demo with cart |
| `checkout.html` | Checkout: order summary, contact details, sends the request |
| `coming-soon.html` | Placeholder for pages not built yet (`?page=Name`) |
| `insiders/` | Private area, meant to be locked with Cloudflare Access |
| `404.html` | Page-not-found page |

## Folders

- `css/styles.css`: all styles
- `js/site.js`: shared header (Products and Resources menus, search, mobile menu)
- `js/jobs-data.js`: the job listings; edit this file to add, remove, or reorder jobs
- `css/demo.css`, `css/checkout.css`: styles for the demo and checkout pages
- `js/jobs.js`, `js/signup.js`, `js/login.js`, `js/demo.js`, `js/checkout.js`, `js/coming-soon.js`: page behavior
- `_headers`: security headers Cloudflare adds to every page (content security policy and others). Keep all JavaScript in files under `js/`: inline `<script>` blocks and `on...=""` attributes are blocked by this policy
- `assets/`: logo and icons

- `.assetsignore`: repository files that should not be served on the site

## Deploy

The site is served by Cloudflare, connected to this GitHub repository. Every push to `main` redeploys it automatically. There is no build step.

The domain abundancephysical.com uses Cloudflare nameservers (set at GoDaddy), and Cloudflare manages HTTPS.

## Before launch

- Sign-up and log-in are front-end prototypes: nothing is saved and no emails are sent. Connect an auth provider (for example Supabase, Firebase, or Clerk) before real users sign up.
- Job pay ranges are ballpark estimates.
