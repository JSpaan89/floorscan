# FloorScan PWA — Deploy via GitHub Pages

> Doel: voormannen kunnen FloorScan installeren op hun Android tablet via een eigen URL.
> Tijd: ±10 minuten eenmalige setup. Daarna ±1 minuut per update.

## Stap 1 — GitHub-account aanmaken (3 min)

1. Ga naar https://github.com/signup
2. Vul in:
   - Email: `j.spaan@gpi-tanks.com`
   - Password: kies iets sterks (bewaar in password-manager)
   - Username: bijvoorbeeld `j-spaan-gpi` of `gpi-tanks-pilot` — komt straks in de URL
3. Verifieer je email (klik op link in inbox)
4. Skip alle "personalize your experience"-vragen — niet relevant
5. Kies de **Free** tier (geen kosten)

## Stap 2 — Nieuwe repository aanmaken (1 min)

1. Klik rechtsboven op de **+** → **New repository**
2. Vul in:
   - Repository name: `floorscan` (kort, lowercase, geen spaties)
   - Description: `FloorScan Pilot — Gpi Tanks` (optioneel)
   - **Public** aanvinken (Pages is gratis op public repos)
   - ✅ **Add a README file** uitvinken (we hebben er al één)
   - .gitignore: None
   - License: None
3. Klik **Create repository**

Je komt nu op een lege repo-pagina met een blauw vlak: "Quick setup — if you've done this kind of thing before".

## Stap 3 — Bestanden uploaden (2 min)

1. Op de lege repo-pagina, klik op de tekst **"uploading an existing file"** (in het blauwe vlak), of ga naar de URL `https://github.com/<jouw-username>/floorscan/upload/main`.
2. Open Windows Explorer en navigeer naar:
   `C:\Users\j.spaan\OneDrive - Gpi Tanks - Process Equipment\Documents\Claude\Projects\GPI Tanks - operational\floorscan-github\`
3. Selecteer **alle 9 bestanden** in deze folder (Ctrl+A) — let op: ook het verborgen `.nojekyll` bestand. Als je 't niet ziet: View → Hidden items aanvinken.
4. Sleep ze allemaal naar het GitHub upload-vlak op de webpagina.
5. Wacht tot alle bestanden geüpload zijn (groene vinkjes).
6. Onderin: **Commit message** = "Initial PWA upload v2.4.0". Klik **Commit changes**.

Je ziet nu de bestanden in je repo.

## Stap 4 — GitHub Pages activeren (1 min + 2 min wachten)

1. In de repo, klik bovenaan op **Settings**.
2. Links in het menu, klik op **Pages**.
3. Onder "Build and deployment" → "Source", kies **Deploy from a branch**.
4. Onder "Branch", kies **main** + **/ (root)**. Klik **Save**.
5. Wacht 1-2 minuten. Refresh de Settings/Pages-pagina.
6. Bovenin verschijnt een groene balk met:
   `Your site is live at https://<jouw-username>.github.io/floorscan/`

Kopieer die URL.

## Stap 5 — Test in Chrome op je laptop

1. Open Chrome (niet Edge, niet Firefox — Chrome is het meest predictable voor deze test).
2. Plak de URL + `FloorScan_pilot_v24.html` aan het einde:
   `https://<jouw-username>.github.io/floorscan/FloorScan_pilot_v24.html`
3. De app moet laden in 1-2 seconden.
4. Open DevTools (F12) → tabblad **Application** → links **Service Workers**:
   - Status moet zijn: `activated and is running`
   - Source: `sw.js`
5. Klik in DevTools links op **Manifest**:
   - Name: `FloorScan — Gpi Tanks`
   - 3 icons groen
   - Geen rode foutmeldingen

## Stap 6 — Installeren in Chrome

1. Rechts in de adresbalk verschijnt een klein **install-icoontje** (computermonitor met ⊕).
2. Klik erop → **Installeren** in het bevestigings-dialoog.
3. FloorScan opent in een eigen window zonder browser-chroom.
4. Het verschijnt nu ook in je Windows Start-menu en (optioneel) op je bureaublad.

Hetzelfde geldt op Android tablets: open de URL in Chrome, krijg de install-banner of via menu (⋮) → "App installeren".

## Stap 7 — Updates uitrollen

Wanneer je iets wijzigt:

1. Bewerk lokaal in `floorscan-github\` folder.
2. **Belangrijk**: bump `SW_VERSION` in `sw.js` (bv. `v2.4.0` → `v2.4.1`).
3. Ga naar https://github.com/<jouw-username>/floorscan
4. Klik op het bestand dat je wijzigde → potlood-icoon (Edit) → plak nieuwe inhoud → Commit.
   *Of:* Op de repo-hoofdpagina, **Add file** → **Upload files** → drop nieuwe versie → Commit (overschrijft).
5. Wacht 1-2 minuten — Pages re-deploy is automatisch.
6. Bij eerstvolgende open van de app (op tablet of desktop) ziet de gebruiker de banner *"Nieuwe versie beschikbaar — Bijwerken"*.

## Troubleshooting

| Probleem | Oplossing |
|---|---|
| 404 op de Pages-URL | Wacht 5 min en refresh; eerste deploy duurt soms langer |
| Service worker registreert niet | Check dat je via `https://...github.io/...` opent, niet `file://` |
| Manifest 404 in DevTools | Bestand niet geüpload — controleer in repo of `manifest.webmanifest` aanwezig is |
| Icons niet zichtbaar | Bestandsnamen hoofdlettergevoelig — moet `icon-192.png` zijn, niet `Icon-192.png` |
| Install-knop verschijnt niet | F12 → Console → kijk naar rode errors — bijna altijd een 404 op een asset |
| Update wordt niet getoond | `SW_VERSION` niet opgehoogd; ophogen, opnieuw committen |

## Privacy

- De repo is **public** — iedereen kan de app-code zien. **Maar**: de app bevat geen GPI-data, geen project-info, geen klantnamen. Alle data leeft in de browser-`localStorage` van elke individuele gebruiker en wordt nooit naar GitHub geüpload.
- Foto's en projectvoortgang worden alleen per JSON-export gedeeld (via OS-deelmenu naar Files / OneDrive / mail) — buiten GitHub om.

## Volgende stappen na werkende deploy

- Test de installatie op één Android-tablet van een voorman → laat ze 1 dag mee proefdraaien.
- Update README.md met de live URL zodat collega's die kennen.
- Overweeg de repo over te zetten naar een GPI-organisatie (Settings → Transfer ownership) zodra meer collega's moeten meebewerken.

---

*Versie: v2.4.0 — laatste update: 2026-04-29.*
