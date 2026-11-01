# SecurePass

A neo-brutalist password generator that runs entirely in your browser. Built with plain HTML, CSS and JavaScript, and the Web Crypto API. No backend, no dependencies, no build step.

## Features
- Cyan password card with **Copy**, **New**, a 5-segment strength meter, entropy in bits and a short explanation
- Length slider (8-128, default 20), lowercase / uppercase / digits / symbols, and **avoid look-alikes** (`I l 1 O 0`)
- **Multiple passwords** (1-20, default 5), a copy button on each, and **Copy all**
- **Recent activity** that stores only date, length and rating, never passwords
- Light / dark theme, responsive layout, copy toast, validation when no character type is selected

## Run it
Open `index.html` in a browser, or serve the folder:
```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```
Run the logic tests (Node 19+): `node tests/generator.test.js`

## Structure
```
securepass/
├── index.html          # all views (Home, Generate, Recent, Settings) via #/hash routes
├── css/style.css       # neo-brutalist design system
├── css/responsive.css  # small-phone, tablet and desktop rules
├── js/security.js      # CSPRNG: unbiased randomInt + Fisher-Yates shuffle
├── js/generator.js     # pools, generate, entropy, strength rating
├── js/history.js       # non-sensitive history only
├── js/app.js           # UI, copy, theme, router
├── assets/logo.svg
└── tests/generator.test.js
```

## Security notes
- Characters come from `crypto.getRandomValues` with rejection sampling (no modulo bias). `Math.random()` is never used.
- Every enabled category appears at least once, then the whole password is shuffled with a secure Fisher-Yates.
- Passwords are never logged, stored or sent. localStorage holds only the theme and history metadata.
- Entropy = length x log2(pool size). It is an estimate, not a guarantee.

## Deploy
**GitHub Pages**
```bash
git init && git add . && git commit -m "SecurePass"
git branch -M main
git remote add origin https://github.com/<you>/securepass.git
git push -u origin main
```
Then on GitHub: Settings → Pages → Deploy from branch → `main` / root.

**Vercel**: import the GitHub repo at vercel.com/new, choose "Other" as the framework, leave build command empty and output directory as `.`, then Deploy. Or run `npx vercel --prod` in the folder.
