# PHASE 8: Security & Deployment

> **Days 13-14 of 14**  
> Implement security headers, service worker, and deploy to Cloudflare Pages

**Prerequisites:** Phase 7 complete (Site fully polished)

---

## DELIVERABLES

By end of Phase 8, you will have:
- ✅ Content Security Policy headers configured
- ✅ All security headers (X-Frame-Options, HSTS, etc.)
- ✅ Service worker for asset caching
- ✅ Production build optimized
- ✅ Site deployed to Cloudflare Pages
- ✅ Custom domain configured (miserabletaco.dev)
- ✅ Cloudflare Web Analytics enabled
- ✅ Final QA and testing complete

---

## STEP 1: Security Headers

### 1.1 Create _headers file

**Create `public/_headers`:**

```
/*
  Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; media-src 'self'; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-XSS-Protection: 1; mode=block
```

**Explanation:**
- **CSP:** No inline scripts (all JS in separate files), allow self-hosted assets
- **X-Frame-Options:** Prevent clickjacking
- **HSTS:** Force HTTPS for 1 year
- **Permissions-Policy:** Disable unnecessary browser features
- **Referrer-Policy:** Don't leak referrer to external sites

### 1.2 Verify no inline scripts

**Check `index.html` has NO inline scripts:**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>miserabletaco.dev</title>
  </head>
  <body>
    <div id="root"></div>
    <div id="grain-overlay"></div>
    <div id="vignette-overlay"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

✅ All scripts external (`src="/src/main.tsx"`)  
❌ NO `<script>` tags with inline JavaScript

### 1.3 Verify input sanitization

**Check all user input sanitized (already done in Phase 3):**

```typescript
// src/store/terminalStore.ts
function sanitizeInput(input: string): string {
  let cleaned = input.replace(/<[^>]*>/g, ''); // Strip HTML
  if (cleaned.length > 100) cleaned = cleaned.substring(0, 100); // Limit length
  return cleaned.trim();
}
```

✅ Terminal input sanitized  
✅ localStorage reads validated  
✅ No `eval()`, `Function()`, or `innerHTML` with user data

---

## STEP 2: Service Worker

### 2.1 Create service worker

**Create `public/sw.js`:**

```javascript
const CACHE_NAME = 'portfolio-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  // Audio files
  '/audio/room-tone.mp3',
  '/audio/keyboard-1.mp3',
  '/audio/keyboard-2.mp3',
  '/audio/keyboard-3.mp3',
  '/audio/mug-clink.mp3',
  '/audio/paper-rustle.mp3',
  '/audio/stapler.mp3',
  '/audio/pen-rattle.mp3',
  '/audio/book-thud.mp3',
  '/audio/drawer-slide.mp3',
  '/audio/leaf-rustle.mp3',
  '/audio/window-open.mp3',
  '/audio/window-close.mp3',
  '/audio/icon-click.mp3',
  '/audio/error-beep.mp3',
  '/audio/success-chime.mp3',
  '/audio/snap.mp3',
  '/audio/ping.mp3',
  '/audio/verify-chime.mp3',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control immediately
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log('[SW] Serving from cache:', event.request.url);
        return response;
      }
      
      console.log('[SW] Fetching from network:', event.request.url);
      return fetch(event.request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
```

### 2.2 Register service worker

**Edit `src/main.tsx`:**

Add after imports:

```typescript
// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered:', registration.scope);
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });
  });
}
```

---

## STEP 3: Production Build

### 3.1 Build for production

```bash
pnpm build
```

This creates optimized production files in `dist/`.

### 3.2 Verify build output

```bash
ls dist/
# Should see:
# - index.html
# - assets/ (JS and CSS bundles)
# - audio/ (sound files)
# - favicon.svg
# - sw.js
# - _headers
```

### 3.3 Preview production build locally

```bash
pnpm preview
```

Open browser to `http://localhost:4173`

**Test:**
- Site loads correctly
- All features work (terminal, windows, 3D objects, audio)
- Service worker registers (check DevTools → Application → Service Workers)
- Assets cached (check DevTools → Application → Cache Storage)

### 3.4 Check bundle size

```bash
ls -lh dist/assets/
```

**Target:** Total JS + CSS < 500KB (before gzip)

If too large:
- Three.js is main contributor (~500KB) - acceptable
- Zustand is tiny (~3KB)
- React is ~130KB

Total should be ~650KB uncompressed, ~180KB gzipped.

---

## STEP 4: Deploy to Cloudflare Pages

### 4.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - portfolio site complete"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/portfolio.git
git push -u origin main
```

### 4.2 Create Cloudflare Pages project

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Pages** → **Create a project**
3. Connect to GitHub
4. Select your portfolio repository
5. Configure build settings:
   - **Framework preset:** Vite
   - **Build command:** `pnpm build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
6. Click **Save and Deploy**

Cloudflare will build and deploy automatically.

### 4.3 Verify deployment

Once deployed, Cloudflare gives you a URL:
`https://portfolio-xxx.pages.dev`

Open this URL and verify site works.

---

## STEP 5: Configure Custom Domain

### 5.1 Purchase domain

Go to your domain registrar and purchase: **miserabletaco.dev**

### 5.2 Add custom domain to Cloudflare Pages

1. In Cloudflare Pages project → **Custom domains** tab
2. Click **Set up a custom domain**
3. Enter: `miserabletaco.dev`
4. Cloudflare will provide DNS records

### 5.3 Update DNS

In your domain registrar (or Cloudflare DNS if domain is on Cloudflare):

Add CNAME record:
```
Name: @
Type: CNAME
Content: portfolio-xxx.pages.dev
Proxy: Yes (orange cloud)
```

**Wait 5-60 minutes for DNS propagation.**

### 5.4 Verify custom domain

Open `https://miserabletaco.dev` in browser.

Site should load correctly with HTTPS (Cloudflare auto-provisions SSL).

---

## STEP 6: Enable Cloudflare Web Analytics

### 6.1 Add analytics

1. In Cloudflare dashboard → **Web Analytics**
2. Click **Add a site**
3. Enter domain: `miserabletaco.dev`
4. Copy the analytics token

### 6.2 Add analytics to site

**Edit `index.html`:**

Add before `</head>`:

```html
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "YOUR_TOKEN_HERE"}'></script>
```

Replace `YOUR_TOKEN_HERE` with actual token from Cloudflare.

### 6.3 Redeploy

```bash
git add index.html
git commit -m "Add Cloudflare Web Analytics"
git push
```

Cloudflare Pages will auto-rebuild and deploy.

---

## STEP 7: Final QA Testing

### 7.1 Functionality tests

**Test on production site (miserabletaco.dev):**

✅ Loading sequence works (eyes → blur → boot → interactive)  
✅ Terminal opens automatically  
✅ All commands execute correctly  
✅ Portfolio pages open and are interactive (TRUST, CULTURE, UNDERTOW, ABOUT, CONTACT)  
✅ 3D objects clickable with visual/audio feedback  
✅ Audio plays correctly (mute toggle works)  
✅ Visit counter increments  
✅ Sticky note and backup filename update  
✅ Mobile fallback works (test on phone or resize <768px)

### 7.2 Performance tests

Open DevTools → Performance tab → record 10 seconds:

✅ 60fps sustained  
✅ Memory usage <200MB  
✅ No console errors  
✅ Assets load from cache on repeat visit (service worker working)

### 7.3 Security tests

**Check headers:**

```bash
curl -I https://miserabletaco.dev
```

Verify headers present:
```
content-security-policy: default-src 'none'; script-src 'self'; ...
x-frame-options: DENY
strict-transport-security: max-age=31536000; includeSubDomains; preload
```

**Check CSP:**
- Open site in Chrome DevTools → Console
- No CSP violations (would show as errors)

**Test XSS prevention:**
- In terminal, type: `<script>alert('xss')</script>`
- ✅ Should display as text, not execute

### 7.4 Cross-browser tests

Test on:
- ✅ Chrome 145+ (primary)
- ✅ Edge 145+
- ✅ Firefox 148+
- ✅ Safari 18+ (macOS) or Safari 26+ (iOS)

### 7.5 Mobile tests

Test on actual mobile device:
- ✅ 2D terminal fallback loads
- ✅ All terminal commands work
- ✅ Touch input works
- ✅ No horizontal scroll

---

## STEP 8: Post-Launch

### 8.1 Monitor analytics

Check Cloudflare Web Analytics after 24 hours:
- Visitor count
- Page views
- Device breakdown (desktop vs mobile)
- Geographic distribution

### 8.2 Monitor errors

Check browser console for any errors reported by users.  
Set up error tracking if needed (Sentry, LogRocket, etc.)

### 8.3 Backups

Your code is on GitHub (backed up).  
Cloudflare Pages keeps deployment history (rollback available).  
No additional backups needed for static site.

### 8.4 Future updates

To update site:
```bash
# Make changes
git add .
git commit -m "Update: description"
git push
```

Cloudflare Pages auto-rebuilds and deploys (2-3 minutes).

---

## PHASE 8 COMPLETE ✅

**PROJECT COMPLETE! 🎉**

Your portfolio is now:
- ✅ Live at **miserabletaco.dev**
- ✅ Secured with CSP and security headers
- ✅ Cached with service worker (fast repeat visits)
- ✅ Monitored with Cloudflare Web Analytics
- ✅ Fully tested across browsers and devices

---

## FINAL CHECKLIST

**Before considering project complete:**

1. ✅ Site loads at miserabletaco.dev with HTTPS
2. ✅ Loading sequence works (8 seconds)
3. ✅ Terminal opens with all commands functional
4. ✅ Portfolio pages all interactive (TRUST, CULTURE, UNDERTOW)
5. ✅ All 15 3D objects visible (10 interactive)
6. ✅ Audio system works (generative + sampled sounds)
7. ✅ Post-processing effects visible (grain, vignette, scanlines)
8. ✅ Visit counter increments and sticky note evolves
9. ✅ Mobile fallback works on small screens
10. ✅ Performance sustained at 60fps
11. ✅ Security headers configured and verified
12. ✅ Service worker caching assets
13. ✅ No console errors
14. ✅ Cross-browser tested (Chrome, Edge, Firefox, Safari)
15. ✅ Analytics tracking enabled

**If all checked:** Project complete. Congratulations!

---

## NEXT STEPS (OPTIONAL)

**Future enhancements (beyond initial launch):**

1. **Interactive terminal games:**
   - Snake game (playable with arrow keys)
   - Matrix animation (10-second visual effect)

2. **More horror easter eggs:**
   - Email from future appears after 5+ minutes
   - My Computer folder shows corrupted files
   - Notepad text writes itself

3. **Additional 3D objects:**
   - Expand from 15 to 20 objects
   - Add more shelf decorations

4. **Advanced audio:**
   - Spatial audio with PannerNode for 3D objects
   - More ambient layers (distant footsteps, elevator ding)

5. **Analytics insights:**
   - Track which portfolio pages users visit most
   - Track average session duration
   - A/B test different sticky note messages

**But for now:** The core portfolio is complete and deployed. Well done!

```bash
git add .
git commit -m "Phase 8 complete: Site deployed to production"
git tag v1.0.0
git push --tags
```

🎉 **PROJECT COMPLETE** 🎉
