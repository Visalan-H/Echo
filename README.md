# Gmail Job Tracker — Project Overview

## What Is This App?

Gmail Job Tracker is a web app that **automatically builds your job application timeline by reading your Gmail**. When a user connects their Gmail account, the app periodically scans their inbox, identifies job-related emails (application confirmations, interview invites, offers, rejections), and organizes them into a clean job tracker — all without the user manually entering anything.

---

## Who Is It For?

Anyone actively job hunting. The core pain point is that job seekers receive a flood of emails from different companies across different stages, and keeping track of where things stand is a mess. This app removes that manual work entirely.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React (Vite) | Fast, component-based UI |
| Backend | Node.js + Express | Familiar, flexible, works well on Vercel |
| Database | MongoDB (Atlas) | Free tier, flexible schema for email data |
| Authentication | Custom OAuth + JWT | Full control, cookie-based sessions |
| Email Access | Gmail API (via googleapis) | Official, secure, no password handling |
| Email Parsing | Google Gemini 1.5 Flash | Free tier, accurate enough for email classification |
| Hosting | Vercel | Free tier, serverless functions for the backend |
| Cron Scheduling | cron-job.org | Completely free, triggers Vercel endpoints on a schedule |

---

## How Authentication Works

The app uses **OAuth 2.0** to connect Gmail — the same industry-standard flow used by any "Sign in with Google" button. Here's what happens in plain English:

1. The user clicks "Connect Gmail" on the frontend.
2. They get redirected to Google's login page where they approve the app's access.
3. Google sends them back to our app with a temporary code.
4. Our backend exchanges that code for two tokens — an **access token** (used to call the Gmail API) and a **refresh token** (used to get a new access token when the current one expires in an hour).
5. Both tokens are encrypted and saved in MongoDB, tied to that user.
6. Our backend creates a **JWT** (a signed session token) and stores it in a secure cookie in the user's browser.
7. From this point on, every request the user makes includes the JWT cookie, which tells the backend who they are. The backend looks up their Gmail tokens from MongoDB and makes API calls on their behalf.

The user never needs to touch their Gmail credentials — Google handles all of that. Our app only stores the tokens Google gives us, encrypted at rest.

---

## How Email Syncing Works

Since Vercel is a serverless platform, it can't run a persistent background process. Instead, we use **cron-job.org** — a free service that calls one of our API endpoints on a schedule (e.g., every 5 minutes).

Here's the sync flow:

1. cron-job.org sends a request to our `/api/cron/sync` endpoint with a secret key in the header (so random people can't trigger it).
2. The endpoint fetches all users who have connected Gmail.
3. For each user, it calls the Gmail API to check for new emails received **after the date they connected** (we don't look at old emails).
4. New emails are sent to Gemini Flash for parsing.
5. Gemini returns structured data — whether the email is job-related, and if so, the company name, job role, and application status.
6. That structured data gets saved to MongoDB as a job application record.
7. The frontend displays the up-to-date tracker to the user.

---

## Email Parsing with Gemini

Raw emails are messy — different companies write them completely differently. A simple keyword search ("congratulations", "unfortunately") isn't reliable enough. Instead, we strip the email down to plain text and send it to **Gemini 1.5 Flash** with a prompt asking it to determine:

- Is this email job-related at all?
- If yes — what company, what role, and what stage is the application at?

Gemini responds with structured JSON that we directly save to the database. This approach handles edge cases, unusual wording, and multilingual emails far better than any regex approach.

The possible application statuses we track are:

- **Applied** — confirmation that an application was received
- **Interview Scheduled** — they want to talk
- **Offer** — you got the job
- **Rejected** — they've moved on
- **Unknown** — job-related but doesn't fit a clear stage

---

## Data We Store Per User

For each user, we store their basic profile (name, email, avatar), their encrypted Gmail tokens, and the date they connected. We only sync emails received after that connection date — no historical email scanning.

For each job application, we store the company name, role, status, when it was last updated, and a reference to the email(s) that informed that status. If the same company sends multiple emails (e.g., a confirmation then an interview invite), we update the existing job record rather than creating a duplicate.

---

## Security Decisions

- Gmail tokens are **encrypted** in MongoDB — even if the database were compromised, raw tokens wouldn't be exposed.
- JWTs are stored in **httpOnly cookies** — JavaScript on the page can't access them, which prevents XSS attacks from stealing sessions.
- The cron endpoint is protected by a **shared secret** in the request header — only cron-job.org (which knows the secret) can trigger a sync.
- We use the **minimum Gmail scope necessary** — `gmail.readonly` — so the app can only read emails, never send or delete anything.

---

## What We're NOT Building (For Now)

- Scanning historical/past emails — only from the connection date forward
- Manual entry of job applications
- Notifications or alerts
- Integration with job boards (LinkedIn, Indeed, etc.)
- Multi-provider email (Outlook, Yahoo, etc.)

These could all be added later, but keeping the scope tight means we can ship a working product faster.

---

## High-Level Architecture Diagram

```
User's Browser (React)
        |
        | JWT cookie on every request
        |
   Vercel Backend (Express)
        |
        |--- MongoDB (users, job applications)
        |--- Gmail API (read emails)
        |--- Gemini Flash API (parse emails)
        |
        ^ triggered every 5 min
        |
  cron-job.org
```

---

## Development Phases

**Phase 1 — Auth (current)**
Get Gmail OAuth working end to end. User can connect their Gmail, session is created, tokens are saved.

**Phase 2 — Email Sync**
Build the cron endpoint, fetch emails from Gmail API, store raw email data.

**Phase 3 — Gemini Parsing**
Send emails through Gemini, extract job data, save structured records.

**Phase 4 — Frontend Dashboard**
Display job applications in a clean UI with status indicators and timeline.

**Phase 5 — Polish**
Handle edge cases, token refresh logic, error states, duplicate detection.