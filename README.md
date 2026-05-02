# FloorScan Pilot — Gpi Tanks

Single-file Progressive Web App voor het registreren van tankvloer-werkbonnen via QR-scan, foto's en weekdoel-checklists. Pilot-versie voor Hal M / Hal L op de hoofdsite.

**Live demo:** https://jspaan89.github.io/floorscan/FloorScan_pilot_v24.html

## Hosting

Deze repo wordt gehost via GitHub Pages. De app draait volledig client-side — geen backend, geen database. Data leeft in `localStorage` van de browser plus optionele JSON-export naar OneDrive of het bedrijfsnetwerk via het OS-deelmenu.

## Doel-platform

- Android tablets (Chrome of Edge)
- Windows desktop (Chrome of Edge) voor planners
- iOS/iPadOS wordt **niet** ondersteund

## Bestanden

| Bestand | Doel |
|---|---|
| `FloorScan_pilot_v24.html` | De volledige app, single-file |
| `manifest.webmanifest` | PWA manifest (homescreen install) |
| `sw.js` | Service worker (offline cache, update-flow) |
| `icon-*.png` | App-iconen (192, 512, 512-maskable, 32) |
| `.nojekyll` | Disable Jekyll processing op GitHub Pages |

## Updaten

1. Pas de relevante bestanden aan.
2. Bump `SW_VERSION` in `sw.js` (anders blijft de oude versie in de cache hangen).
3. Commit + push naar `main`.
4. Wacht 1-2 minuten — GitHub Pages deploy is automatisch.
5. Voormannen krijgen bij volgende app-open een update-banner.

## Versie

**v2.5.3** (2026-05-02) — App-iconen voller (scene zonder witte rand, +18% zoom). Top-bar krijgt scene-icoon naast wordmark.
**v2.5.2** (2026-05-02) — Wordmark crop-fix (top van "Gpi" was afgesneden) + mobile responsive top-bar (geen knop-overlap meer op smalle schermen).
**v2.5.1** (2026-05-02) — Nieuwe Gpi · Floorscanner brand: hero-illustratie (worker+tank+scan-beam) als app-iconen op alle maten. Top-bar wordmark vervangen door Gpi Floorscanner.
**v2.5.0** (2026-05-02) — Volledige Gpi Group huisstijl: Sofia Sans, teal #00B3A0, sharp corners, top-bar met Gpi Group logo. Cw-banner als donker hero-blok. Indigo AI-box. Theme-color naar GPI teal.
**v2.4.4** (2026-05-01) — Side-foto's (voor/zijde/achter) klikbaar als gallery in lightbox; lightbox-beeld groter (98vw × 82vh); header-versie dynamisch.
**v2.4.3** (2026-05-01) — Foto-lightbox (groot beeld + nav), grotere thumbnails, projectenlijst chronologisch gesorteerd.
**v2.4.2** (2026-05-01) — Smarticate-QR (SPCPART) fallback met handmatige koppeling, Tekening-paneel verwijderd.
**v2.4.1** (2026-04-29) — Web Share Target + file_handlers + binary-content detectie.
**v2.4.0** (2026-04-29) — eerste PWA-release.

## Licentie

Intern Gpi Tanks. Geen externe distributie.
