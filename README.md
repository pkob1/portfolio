# papaorleansbosomtwe.vercel.app

Personal site for Papa Kobina Orleans-Bosomtwe. Static HTML, CSS and JS, plus one Vercel serverless function.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page Vercel serves. Generated, don't edit by hand. |
| `body.html` | The page markup. Edit this, then run `./build.sh`. |
| `site.css`, `site.js` | All styles and scripts (kept external so the CSP can ban inline scripts). |
| `api/kev.js` | `GET /api/kev`: newest CISA KEV entries, cached at the edge for an hour. |
| `vercel.json` | Security headers (CSP, HSTS, X-Frame-Options and more). |
| `.well-known/security.txt` | Security contact, per RFC 9116. |
| `resume.pdf` | **Add this yourself.** The Resume buttons link to it. |

## Deploy

1. Add `resume.pdf` to this folder.
2. Push this folder to the GitHub repo connected to your Vercel project, or run `npx vercel --prod` from this folder.
3. No build step is needed. `vercel.json` sets the framework to "Other", which overrides the old Vite preset. If Vercel still tries to run `vite build`, open Project Settings → Build & Development Settings, set Framework Preset to "Other" and clear any Build Command or Output Directory override.

## After deploying, check

- `https://papaorleansbosomtwe.vercel.app/api/kev` returns JSON.
- [securityheaders.com](https://securityheaders.com) shows your headers.
- The browser console on the live site has no CSP errors.

## CTF

Three flags are hidden on the site. The answers are deliberately not in this public repo, and `site.js` only stores their SHA-256 hashes.
