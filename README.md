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
| `404.html` | Page-not-found page |

## Folders

- `css/styles.css`: all styles
- `js/site.js`: shared header (Products and Resources menus, search, mobile menu)
- `js/jobs-data.js`: the job listings; edit this file to add, remove, or reorder jobs
- `js/jobs.js`, `js/signup.js`, `js/login.js`: page behavior
- `assets/`: logo and icons

## Deploy

The site is served by Cloudflare, connected to this GitHub repository. Every push to `main` redeploys it automatically. There is no build step.

The domain abundancephysical.com uses Cloudflare nameservers (set at GoDaddy), and Cloudflare manages HTTPS.

## Before launch

- Sign-up and log-in are front-end prototypes: nothing is saved and no emails are sent. Connect an auth provider (for example Supabase, Firebase, or Clerk) before real users sign up.
- Job pay ranges are ballpark estimates.
