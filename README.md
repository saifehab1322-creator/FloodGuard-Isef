# FloodGuard-ISEF – Flood Early Warning System

Team: Saif El-Din Ehab Mohamed, Rana Mostafa Mahmoud

React + Vite + Tailwind + Recharts + Leaflet (client) · Node.js + Express + mysql2 (server) · MySQL `floodguard_isef` · Open-Meteo (forecast + geocoding) · OpenStreetMap.

## Run on Windows (CMD)
Requirements: Node.js 18+ and MySQL 8 (running).

**1. Backend**
```
cd FloodGuard-ISEF\server
copy .env.example .env
notepad .env          (set DB_PASSWORD to your MySQL root password)
npm install
npm run db:init       (creates database floodguard_isef, tables and seed data)
npm test              (10 risk-engine unit tests)
npm start             (API on http://localhost:5000)
```
Check: open http://localhost:5000/api/health and http://localhost:5000/api/locations

**2. Frontend** (a second CMD window)
```
cd FloodGuard-ISEF\client
npm install
npm run dev           (open http://localhost:5173)
```
Alternative to `db:init`: run `database\schema.sql` then `database\seed.sql` in MySQL Workbench.

## Integrity rules
- Weather comes only from Open-Meteo. If the API fails, the latest cached real record (MySQL) is shown with a warning; otherwise an error is shown. Nothing is fabricated.
- **Demo mode** (sidebar toggle): labeled sample scenarios only. Demo and real records are stored with `is_demo` and never shown together.
- The score is an **indicative risk index**, not a validated flood probability. No accuracy is claimed.
- Alerts are project-generated, labeled as NOT official government warnings.
- Normalization ranges, default weights and terrain scores are documented modelling assumptions (`server/src/riskEngine.js`).

## Risk model
Factors: rainfall (peak intensity 40% + total 60%, merged to avoid double counting; duration is informational), soil moisture, elevation (lower = higher risk), terrain class. Default weights 0.50/0.20/0.15/0.15. Missing variables are dropped, remaining weights renormalized, and "input coverage" is reduced (high ≥ 80%, medium ≥ 50%). No rainfall data → "insufficient data", no score. Levels: Low < 33 ≤ Moderate < 66 ≤ High (editable on the Alerts page).

## API
`GET /api/health, /locations, /geocode?q=, /weather/:locationId, /assessments[?demo=1], /assessments/latest, /alerts, /settings, /dashboard, /demo/scenarios` · `POST /api/risk/calculate, /assessments, /locations` · `PUT /api/settings`

## Presentation tips
Before presenting, open each location you will show once while online so the cache is filled. Map tiles need internet.
