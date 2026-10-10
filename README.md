# Abundance website

On-demand training data for physical AI.

A plain static site (HTML, CSS, and JavaScript) with no build step, ready for Netlify.

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
- `js/site.js`: shared header (Products menu, search, mobile menu)
- `js/jobs-data.js`: the job listings; edit this file to add, remove, or reorder jobs
- `js/jobs.js`, `js/signup.js`, `js/login.js`: page behavior
- `assets/`: logo and icons

## Deploy on Netlify

1. In Netlify, choose **Add new site → Import an existing project → GitHub**, then pick this repository.
2. Leave the build command empty and set the publish directory to `.` (already set in `netlify.toml`).
3. Every push to `main` redeploys the site.

## Connect the GoDaddy domain

1. In Netlify, open **Domain management → Add a domain** and enter your domain.
2. Either point GoDaddy's nameservers to the ones Netlify lists, or add the DNS records Netlify shows in GoDaddy's DNS settings.
3. Netlify issues the HTTPS certificate automatically once DNS is connected.

## Before launch

- Sign-up and log-in are front-end prototypes: nothing is saved and no emails are sent. Connect an auth provider (for example Netlify Identity, Supabase, Firebase, or Clerk) before real users sign up.
- Replace the `[YOUR EMAIL]` placeholders in `index.html`, `jobs.html`, and the footer with a real contact email.
- Job pay ranges are ballpark estimates.
