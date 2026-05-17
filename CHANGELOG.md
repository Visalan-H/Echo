# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- **Backend Code Organization**: Refactored backend file naming conventions for clarity and consistency
  - `backend/controllers/auth.js` → `backend/controllers/auth-controller.js`
  - `backend/models/User.js` → `backend/models/User-model.js`
  - `backend/routes/auth.js` → `backend/routes/auth-route.js`
  - Updated all imports across the codebase to reflect new file names

- **Serverless Deployment Support**: Prepared backend for serverless/edge deployment platforms
  - Modified `backend/server.js` to conditionally start the server only in non-production environments
  - Added production environment check: `if (process.env.NODE_ENV !== 'production')`
  - Server now exports Express app as middleware for serverless platforms (Vercel, AWS Lambda, etc.)
  - Aligns with existing Vercel configuration in frontend

- **Dependency Imports**: Updated model imports in controllers and middleware
  - `emailSync-controller.js`: Updated User model import path
  - `middleware/auth.js`: Updated User model import path

- **Code Cleanup**
  - Removed unused `isProd` variable from `backend/utils/cookie.js`
  - Minor whitespace/formatting adjustments

### Deleted Files
- `backend/controllers/auth.js` (consolidated into auth-controller.js)
- `backend/models/User.js` (consolidated into User-model.js)
- `backend/routes/auth.js` (consolidated into auth-route.js)

### New Files
- `backend/controllers/auth-controller.js`
- `backend/models/User-model.js`
- `backend/routes/auth-route.js`

### Status
- ⚠️ Working tree has uncommitted changes - files staged for renaming/refactoring
- ✅ Branch: main (up to date with origin/main)

---

## Previous Releases

### [Latest Release]
- Added SEO/OG tags and preview image (commit: 921d039)
- Merged frontend PR #2 (commit: 7a6fc15)
- Updated landing page and README (commit: 2d3ce3b)
- Added view email action and minor UI fixes (commit: 0f117fd)
- Completed edit, delete, sort and filter functionality (commit: f7ebefc)
- Frontend initialized with Bun and Vite (commit: bdd2ddc)

### Infrastructure
- Google OAuth integration with Gmail API
- Email sync with AI parsing (Groq and Gemini services)
- MongoDB backend with CRUD operations
- Job application tracking system
