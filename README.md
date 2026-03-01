# DevPersona AI

Full-stack Next.js 14 app that analyzes code using three AI personas: **Senior Software Engineer**, **Security Engineer**, and **Software Architect**.

## Features

- **Code input** — Paste or type code in the text area
- **Analyze** — One click sends the code to the backend
- **3 response cards** — One response per persona with structured feedback

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set your Hugging Face token:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```
   HF_TOKEN=your-hf-api-token-here
   ```

3. **Run locally**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## API

- **POST /api/analyze**
  - Body: `{ "code": "your code string" }`
  - Returns: `{ "results": { "senior-engineer": { "name", "content" }, "security-engineer": { ... }, "architect": { ... } } }`
  - Errors: 400 (missing/invalid body), 500 (missing `HF_TOKEN` or Hugging Face API failure)

## AWS Lambda deployment

The app is built for serverless compatibility:

- **Standalone output** — `next.config.js` uses `output: 'standalone'` so you can run the app in a single Node process (e.g. in a Lambda handler or container).
- **Stateless API** — `/api/analyze` does not rely on in-memory state or long-lived connections; it only reads the request body and calls the Hugging Face API (Mistral-7B-Instruct-v0.2).
- **Environment** — All configuration is via `HF_TOKEN`; no file system or server-specific assumptions.

### Deploying to Lambda

Common options:

1. **AWS Amplify** — Connect the repo; Amplify builds and deploys Next.js and runs API routes as serverless functions.
2. **Serverless Framework + OpenNext** — Use [OpenNext](https://opennext.js.org/) or the [serverless-next.js](https://github.com/serverless-nextjs/serverless-nextjs) plugin to build and deploy the app so each route becomes a Lambda.
3. **Custom Lambda + standalone** — Run `npm run build`, then use the `.next/standalone` output inside a Lambda (or container) and route requests through a custom handler that forwards to the Next.js server.

Ensure `OPENAI_API_KEY` is set in the Lambda (or Amplify) environment variables.

For the Hugging Face integration, ensure `HF_TOKEN` is configured in your Lambda (or Amplify) environment.

## Tech stack

- Next.js 14 (App Router)
- React 18
- Hugging Face Inference API (`mistralai/Mistral-7B-Instruct-v0.2`)
- TypeScript
