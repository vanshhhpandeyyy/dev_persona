# DevPersona AI

DevPersona AI reviews a code snippet from three perspectives:

- **Senior Software Engineer** — correctness, maintainability, testing, and refactoring
- **Security Engineer** — vulnerabilities, trust boundaries, input validation, and remediation
- **Software Architect** — structure, scalability, performance, and long-term maintainability

## Stack

- Next.js App Router (Next.js 16)
- React 18 and TypeScript
- Google Gemini API (server-side REST call)

## Run locally

1. Install Node.js 20.9 or newer.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the example environment file and add a Gemini API key:

   ```bash
   cp .env.example .env.local
   ```

   Create a key at https://aistudio.google.com/apikey and set:

   ```env
   GEMINI_API_KEY=your_actual_key
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000.

## Deploy on Vercel

1. Import this GitHub repository into a Vercel project.
2. Select the Next.js framework preset (normally detected automatically).
3. Add `GEMINI_API_KEY` under Project Settings → Environment Variables for Production (and Preview if needed).
4. Deploy the `main` branch.

Do not put the API key in frontend code, commit it to Git, or expose it through a `NEXT_PUBLIC_*` variable. The API route reads it only on the server.

## API

### `POST /api/analyze`

Request:

```json
{ "code": "const answer = 42;" }
```

Success response:

```json
{
  "results": {
    "senior-engineer": { "name": "Senior Software Engineer", "content": "..." },
    "security-engineer": { "name": "Security Engineer", "content": "..." },
    "architect": { "name": "Software Architect", "content": "..." }
  }
}
```

Each persona is handled independently. A provider error for one persona is returned in that persona's `error` field; if all three fail, the route returns HTTP 502. Empty input returns HTTP 400, input over 30,000 characters returns HTTP 413, and missing server configuration returns HTTP 503.

## Notes

- The API key is required for live AI analysis. The interface itself can load without it.
- The Gemini model is configured in `app/api/analyze/route.ts`.
- Never commit `.env.local` or a real API key.
