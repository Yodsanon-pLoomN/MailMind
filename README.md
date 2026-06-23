<<<<<<< HEAD
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
# MailMind - Smart Email Assistant with Auto-Scheduling

"MailMind is an intelligent email assistant web application designed to streamline appointment scheduling. By integrating directly with Gmail and Google Calendar, it utilizes Generative AI to analyze incoming emails, detect appointment requests, check calendar availability, and automatically generate smart draft replies (Accept or Reschedule). It is developed with a **Next.js** frontend and an **Express.js** backend, powered by the **Prisma** ORM and a **PostgreSQL** database."

## Table of Contents

  - [Features](https://www.google.com/search?q=%23features)
  - [Tech Stack](https://www.google.com/search?q=%23tech-stack)
  - [External APIs Used](https://www.google.com/search?q=%23external-apis-used)
  - [Prerequisites](https://www.google.com/search?q=%23prerequisites)
  - [Security & Rate Limiting](https://www.google.com/search?q=%23security--rate-limiting)
  - [Installation](https://www.google.com/search?q=%23installation)
  - [Environment Variables](https://www.google.com/search?q=%23environment-variables)
  - [Database Setup](https://www.google.com/search?q=%23database-setup)
  - [Running the Application](https://www.google.com/search?q=%23running-the-application)
  - [API Endpoints](https://www.google.com/search?q=%23api-endpoints)
  - [License](https://www.google.com/search?q=%23license)
  - [Contact](https://www.google.com/search?q=%23contact)

## Features

  - **Google Integration:** Seamless login via Google OAuth 2.0 with scopes for Gmail and Google Calendar.
  - **Automated Email Fetching:** Background cron jobs to automatically fetch and filter unread emails based on appointment keywords.
  - **AI-Powered Data Extraction:** Uses Generative AI to extract appointment details (Date, Time, Location, Subject) from email threads.
  - **Smart Auto-Drafting:** Automatically generates draft replies to accept appointments if the calendar is free, or proposes new times if there is a calendar conflict.
  - **Multi-AI Provider Support:** Flexibility to switch between Google Gemini, OpenAI, Claude, OpenRouter, and IntelSphere.
  - **Calendar Sync:** Automatically creates events in Google Calendar upon confirming an appointment draft.
  - **AI Schedule Summary:** Generates daily or weekly human-readable summaries of upcoming calendar events.
  - **Settings Management:** Users can customize working hours, default AI models, and email signature tones.

## Tech Stack

  - **Frontend:** Next.js, Tailwind CSS
  - **Backend:** Express.js, Node.js
  - **ORM:** Prisma
  - **Database:** PostgreSQL
  - **Background Jobs:** node-cron
  - **Authentication:** Google OAuth 2.0 & JSON Web Tokens (JWT)
  - **Package Manager:** pnpm

## External APIs Used

**Google Cloud APIs:**

  - Google OAuth 2.0 API
  - Gmail API
  - Google Calendar API

**Generative AI APIs:**

  - Google Gemini API
  - OpenAI API
  - Anthropic Claude API
  - OpenRouter API
  - IntelSphere API

## Prerequisites

  - Node.js v18+
  - pnpm (recommended) or npm
  - PostgreSQL database instance
  - Google Cloud Console Account (for Client ID and Client Secret)
  - API Keys for your preferred AI providers (Gemini, OpenAI, etc.)

## Security & Rate Limiting

  - **API Key Encryption:** All user-provided AI API keys are strictly encrypted using `AES-256-GCM` before being stored in the database.
  - **Token Management:** Google Access Tokens and Refresh Tokens are securely managed to prevent unauthorized access.
  - **Rate Limit Optimization:** Implements local keyword pre-filtering to avoid hitting AI provider rate limits unnecessarily.

## Installation

Clone the repository

```bash
git clone https://github.com/your-username/MailMind.git
cd MailMind
```
Run PostgreSQL docker compose

```bash
docker compose up -d --build
```

Install backend dependencies

```bash
cd backend
pnpm install
```

Install frontend dependencies

```bash
cd ../frontend
pnpm install
```



## Environment Variables

Create a `.env` file in the `backend` directory with the following:

```env
# Server
PORT=3000

# Database
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?schema=public"

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Security / Encryption
JWT_SECRET=your_super_secret_jwt_key
ENCRYPTION_KEY=your_32_byte_aes_256_secret_key
```

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Database Setup

Navigate to the backend directory

```bash
cd backend
```

Generate Prisma Client

```bash
npx prisma generate
```

Run migrations to create tables

```bash
npx prisma migrate dev --name init
```

## Running the Application

Start the backend

```bash
cd backend
pnpm run dev # starts Express server on http://localhost:3000
```

Start the frontend

```bash
cd frontend
pnpm run dev # starts Next.js on http://localhost:3001
```

## API Endpoints

### Authentication

  - `GET /api/auth/google` – Redirect to Google OAuth consent screen.
  - `GET /api/auth/google/callback` – Google OAuth callback handler.
  - `POST /api/auth/logout` – Clear user session and cookies.
  - `GET /api/auth/me` – Get current logged-in user profile.

### Settings & API Keys

  - `GET /api/settings` – Get user's application settings (working hours, default AI).
  - `PUT /api/settings` – Update user settings.
  - `GET /api/settings/keys` – List user's connected AI API keys (masked).
  - `POST /api/settings/keys` – Add and encrypt a new AI API key.
  - `DELETE /api/settings/keys/:provider` – Remove an API key.

### Emails & Processing

  - `GET /api/emails` – Fetch recent emails from Gmail.
  - `POST /api/emails/sync` – Manually trigger the email fetching and AI analysis process.
  - `GET /api/emails/:messageId` – Get full email thread details.

### Drafts Management

  - `GET /api/drafts` – List all pending AI-generated drafts.
  - `GET /api/drafts/:id` – Get specific draft details.
  - `PUT /api/drafts/:id` – Edit the content of an AI-generated draft.
  - `POST /api/drafts/:id/send` – Approve draft, send via Gmail API, and auto-insert to Google Calendar.
  - `DELETE /api/drafts/:id` – Discard a draft.

### Calendar & Summary

  - `GET /api/calendar/events` – List upcoming events from Google Calendar.
  - `GET /api/calendar/summary` – Generate an AI-powered summary of the weekly schedule.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## Contact

For questions or feedback, reach out to the development team:

  - **Email:** yodsanon.d@kkumail.com
  - **Email:** chetsada.k@kkumail.com
>>>>>>> main
