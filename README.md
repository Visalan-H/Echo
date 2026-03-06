# Echo — Job Application Tracker

Echo is an automated job application tracker that reads your Gmail to build your job application timeline. No more manual data entry, messy spreadsheets, or lost interview invites. Connect your account, and Echo organizes everything for you.

---

## The Problem It Solves

Job seekers receive a flood of emails across different stages (applied, interviewing, offered, rejected) from various companies. Keeping track of where things stand manually is tedious and error-prone.

Echo removes the manual work by scanning for job-related emails, parsing them, and displaying your pipeline in a clean Dashboard.

---

## Tech Stack

Echo is built primarily with the MERN stack (MongoDB, Express, React, Node) and leverages Google's Gemini AI for intelligent email parsing.

| Component           | Technology                  | Description                                                            |
| ------------------- | --------------------------- | ---------------------------------------------------------------------- |
| **Frontend**        | React (Vite) + Tailwind CSS | Fast, component-based, highly styled UI                                |
| **Backend**         | Node.js + Express           | Handles routing, DB operations, and API integrations                   |
| **Database**        | MongoDB (Atlas)             | Flexible document store for users and parsed job data                  |
| **Authentication**  | Custom OAuth + JWT          | Secure cookie-based login via Google OAuth 2.0                         |
| **Email Ingestion** | Gmail API                   | Read-only access to user emails                                        |
| **Email Parsing**   | Google Gemini 1.5 Flash     | AI-driven extraction of structured company/role/status data            |
| **Hosting**         | Vercel (FE & BE)            | Serverless functions for the backend, static edge hosting for frontend |
| **Scheduling**      | cron-job.org                | Triggers background synchronization periodically                       |

---

## How It Works Under the Hood

### 1. Secure Authentication

Users connect their Gmail using standard OAuth 2.0. Our backend securely stores their access/refresh tokens in MongoDB (encrypted) and issues an HTTP-only JWT for their browser session. The user never hands over their password.

### 2. Automated Syncing

A scheduled cron job calls an internal Vercel API endpoint. This endpoint iterates through connected users, hitting the Gmail API to find new emails received since their last sync.

### 3. AI-Powered Parsing

Because raw emails are incredibly diverse, simple keyword matching fails. We extract the plain text of new emails and feed it to **Gemini 1.5 Flash**. The AI is prompted to return structured JSON containing:

- Is this email job-related?
- Company Name
- Job Role
- Application Stage (Applied, Interviewing, Offered, Rejected)

This structured data is then securely saved to the database.

---

## Security Model

- **Tokens Encrypted at Rest**: Gmail API tokens are encrypted in MongoDB.
- **HTTP-Only Cookies**: JWTs are stored securely to prevent XSS.
- **Protected Endpoints**: The sync cron endpoint requires a shared secret.
- **Minimum Scopes**: The app only asks for `gmail.readonly` permission. We cannot send or delete your emails.

---

## Future Scope

Current scope deliberately excludes features to maintain focus:

- No scanning of historical emails (sync starts from connection date).
- No manual data entry allowed yet.
- Only supports Gmail out of the box.

These bounds keep the product fast, simple, and reliable.
