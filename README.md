# The Open Syllabus

A modern student-first learning hub built with React, Vite, Tailwind, Firebase, and a small Express/Vite server.

## About

The Open Syllabus is a web app for browsing course material, joining discussions, connecting with classmates, and using an AI-powered assistant as an optional helper. It includes:

- React + Vite frontend with animated navigation
- Firebase authentication and Firestore data access
- A lightweight Express server for development and production hosting
- Dark mode, study mode, notifications, and responsive UI
- Optional Gemini-powered chat support if a valid API key is provided

## Tech stack

- React 19
- Vite 6
- Tailwind CSS 4
- Firebase SDK
- Express
- Motion (for animated UI)
- React Router DOM
- Lucide icons

## Setup

### Prerequisites

- Node.js installed
- `npm` available in your terminal

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env.local` file at the project root if you want to enable the AI helper.

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

If the key is missing, the main app still works; only the AI assistant feature will be disabled.

## Run locally

### Recommended

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Alternative on Windows

You can also use the existing `start-app.bat` to launch the app and visit `http://localhost:3000`.

## Build for production

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project structure

- `src/` — React application source files
- `src/pages/` — main page views
- `src/components/` — reusable UI components
- `src/contexts/` — app state providers (auth, theme, notifications, study mode)
- `src/firebase.js` — Firebase initialization and Firestore helpers
- `server.js` — Express server with Vite middleware for development
- `public/` — static assets and service worker

## Notes

- This project uses Vite, so do not open `index.html` directly in the browser for development.
- Firebase configuration is loaded from `firebase-applet-config.json`.
- `@google/genai` is only required if you use the AI assistant component.
