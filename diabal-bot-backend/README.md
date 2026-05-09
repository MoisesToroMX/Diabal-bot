# Diabal Backend

Node.js backend for CSV/XLSX upload, product JSON normalization, chat commands
and final JSON download.

Run locally:

```bash
npm install
npm run dev
```

Validate:

```bash
npm run lint
npm test
```

Main endpoints:

- `GET /health`
- `POST /api/upload` with `x-session-id` and multipart `file`
- `GET /api/sessions/:sessionId`
- `GET /api/sessions/:sessionId/final-json`

See the root `README.md` for Docker and full project setup.
