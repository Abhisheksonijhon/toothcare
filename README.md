# Tooth Care Centre website (Panna)

Static site: upload the contents of this folder to any hosting (cPanel, Netlify, Vercel, GitHub Pages). No build step or server needed.

## Pages (18)
index, about, services, 6 treatment pages (root canal, implants, smile designing, braces, kids, gums), gallery, blog + 6 articles, contact (booking + map), 404. Also sitemap.xml and robots.txt.

## Before you go live (checklist)
1. **Domain**: SEO tags use `https://www.toothcarecentre.in`. Rebuild with your real domain (see "Editing content") or find/replace it in all files.
2. **Doctor photo**: add `assets/img/dr-shewtank-singh.jpg` (portrait, 4:5). Until then a placeholder shows. The old file used a stock portrait, which should not be shown as the doctor.
3. **Testimonials**: only the first one is real (from the Google profile). The other four are marked "Sample text" and must be replaced with real reviews (with patient permission). In `content.py`, set `sample=False` to remove the tag.
4. **Booking data**: NOT connected. Open `assets/js/config.js` and paste your endpoint in `bookingEndpoint` (Google Apps Script, Formspree, Make/Zapier webhook, your API). Until then the form shows the patient "call to confirm" instead of claiming the request was received.
5. **WhatsApp**: set `whatsappNumber` (e.g. `"917509999033"`) in config.js. A floating button and a confirmation-screen button appear automatically.
6. **Social links**: fill `facebook`, `instagram`, `youtube` in config.js. Empty icons stay inactive.
7. **Verify claims**: check that the wording about M.D.S., 3D imaging, rotary endodontics, digital smile design and the "everyday care" list matches what the clinic actually offers. Add registration number and experience in about.html (see the TODO comment).
8. **Local SEO**: add exact latitude/longitude, social profile URLs and (with the real review count) aggregateRating to the schema in `build.py` (`dentist_schema`). Submit `sitemap.xml` in Google Search Console, and keep name, address and phone identical on the Google Business Profile.

## Editing content
`_source/` holds the generator. Copy lives in `content.py`.
```
cd _source
python3 build.py --url https://yourdomain.in --out ../site
```

## Notes
- The 3D tooth uses Three.js r128 from cdnjs (home page only) and falls back to an illustration if WebGL is unavailable or JavaScript is off. It pauses when off screen.
- Photos are free Unsplash images loaded by URL; any that fail are hidden automatically. Download and host them locally for speed and reliability.
- The before/after slider is an illustration, not patient photos.
