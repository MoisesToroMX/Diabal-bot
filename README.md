# Diabal Bot

Prototype for the Excel-to-JSON chat flow challenge.

Diabal Bot helps a user turn a product spreadsheet into a clean JSON file.
It guides the user step by step: upload the file, review the detected mapping,
fix values by chat, confirm the result, and download the final JSON.

The app lets a user upload a CSV or XLSX product file, maps flexible source
columns into a product JSON schema, keeps unmatched columns as dynamic JSON
properties, allows small edits through a chat-style interface, and downloads
the final JSON.

## Tech stack

- Frontend: React 18, TypeScript, Vite, HeroUI, TailwindCSS, Socket.IO client.
- Backend: Node.js 22, Express, Socket.IO, Multer, csv-parse,
  read-excel-file.
- Runtime: Docker Compose with a slim Node Alpine backend image and an Nginx
  Alpine frontend image.

No OpenAI key is required. The core mapping and chat commands are deterministic
so the project can run in a recap without external AI services.

## Run with Docker

Requirements:

- Docker Desktop or Docker Engine with Compose.

Steps:

```bash
cd /Users/ingtony/Documents/Diabal-bot
docker compose up --build
```

Open:

```text
http://localhost:8081
```

Use the app:

1. Open `http://localhost:8081`.
2. Select the Diabal chat.
3. Upload or drag and drop a `.csv` or `.xlsx` product file.
4. Open `File details` to review the detected mapping and dynamic fields.
5. Use chat commands to inspect or edit values.
6. Click `Download final JSON`.

Example chat commands:

```text
mapping
show row 1
show json
set row 2 supplier_email to qa@example.com
confirm
```

Spanish commands are also supported:

```text
mapeo
ver fila 1
mostrar json
cambia fila 2 supplier_email a qa@example.com
confirmar
para que sirve este bot
```

Stop containers:

```bash
docker compose down
```

## Local development

Backend:

```bash
cd /Users/ingtony/Documents/Diabal-bot/diabal-bot-backend
npm install
npm run dev
```

Frontend:

```bash
cd /Users/ingtony/Documents/Diabal-bot/diabal-bot-frontend
npm install
npm run dev
```

Development URLs:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:3001/health`

The frontend `.env` points to the local backend:

```text
VITE_SOCKET_URL=http://localhost:3001
VITE_API_URL=http://localhost:3001
```

## Backend API

Upload a file:

```bash
curl -X POST http://localhost:3001/api/upload \
  -H "x-session-id: demo-room" \
  -F "file=@/path/to/products.csv"
```

Get session state:

```bash
curl http://localhost:3001/api/sessions/demo-room
```

Download final JSON:

```bash
curl -OJ http://localhost:3001/api/sessions/demo-room/final-json
```

## Solution summary

The backend imports the spreadsheet into rows, scans the first rows to find the
most likely header row, maps source headers to the target JSON fields through a
synonym-based scorer, and keeps unmatched source columns as safe snake_case
dynamic properties in the final JSON. Product records are stored in memory by
chat session.

The frontend sends real files to the backend, displays:

- uploaded file name,
- number of imported products,
- source column used for every JSON field,
- confidence score,
- dynamic-field badges for properties created from unmatched columns,
- warnings for missing fields,
- first-row preview,
- final JSON download action.

The chat layer supports deterministic commands for review, edits and
confirmation. This keeps the project stable with different CSV/XLSX files while
remaining easy to explain during the recap.

## Validation

Backend syntax check:

```bash
cd /Users/ingtony/Documents/Diabal-bot/diabal-bot-backend
npm run lint
```

Backend tests:

```bash
cd /Users/ingtony/Documents/Diabal-bot/diabal-bot-backend
npm test
```

Frontend validation:

```bash
cd /Users/ingtony/Documents/Diabal-bot/diabal-bot-frontend
npm test
npm run lint
npm run build
```

Docker validation:

```bash
cd /Users/ingtony/Documents/Diabal-bot
docker compose config
docker compose up --build -d
docker compose ps
docker compose logs --tail=100
```

## Assumptions

- Product rows live below a detectable header row.
- Source columns can vary, but their names contain business terms close to the
  expected schema, such as `PO Number`, `Vendor`, `Origin Country`, `SKU`,
  `Material Composition` or `Certifications`.
- `.csv` and modern `.xlsx` files are supported. Legacy `.xls` is not included
  to keep the container small and avoid heavier parser dependencies.
- Session data is in memory. Restarting the backend clears uploaded files and
  edits.

## Known limitations and next steps

- Add persistent storage if sessions must survive restarts.
- Add richer natural-language parsing for complex edit instructions.
- Add authentication before using this beyond a local challenge/demo setting.
- Add support for multiple sheets and explicit sheet selection.
- Add end-to-end browser tests for upload, edit and download.
