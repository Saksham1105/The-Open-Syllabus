# The Open Syllabus

> A student-focused platform for discovering course material, joining academic discussions, and getting help with study-related tasks.

## About

The Open Syllabus brings course resources, discussions, social features, study mode, and an optional AI helper into one web application. The project is built as a React application with a small Express server and Firebase services.

The codebase is intentionally organized around the product rather than a starter template: pages represent user-facing areas, components hold reusable interface pieces, and context providers manage shared application state.

## Features

- Course and resource discovery
- Academic discussions and peer interaction
- Friends and profile features
- Dark mode and distraction-reduced study mode
- Optional Gemini-powered AI helper
- Firebase Authentication and Firestore integration
- Responsive interface for desktop and mobile screens

## Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite |
| Routing | React Router |
| Styling | Tailwind CSS |
| UI Icons | Lucide React |
| Animation | Motion |
| Backend | Express |
| Data and Auth | Firebase / Firestore |
| AI | Google Gemini API |

## Project Structure

```text
src/
├── components/    # Reusable interface components
├── contexts/      # Shared application state and providers
├── pages/         # Route-level screens
├── lib/           # Shared utilities and helpers
├── App.jsx        # Application shell and routes
└── main.jsx       # Browser entry point

api/               # Serverless API entry point
public/            # Static assets
server.js          # Local development and production server
```

## Getting Started

### Requirements

- Node.js 20 or newer
- npm

### Install

```bash
git clone https://github.com/Saksham1105/The-Open-Syllabus.git
cd The-Open-Syllabus
npm install
```

### Environment

Create a local environment file and add the variables required by the services you enable. For the AI helper:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Keep private credentials out of source control.

### Run locally

```bash
npm run dev
```

The development server runs on port `3000` by default.

### Quality checks

```bash
npm run lint
npm run build
```

## Development Notes

The project uses standard React composition and local naming conventions. Avoid generic starter-project names, placeholder components, copied demo code, or abstractions that do not reflect an actual product need.

When adding a feature, prefer a small, readable component or helper over a large abstraction layer. Keep state close to the feature that owns it unless the state genuinely needs to be shared.

## Contributing

Use a focused branch for each change. Keep commits small and descriptive, run lint and build before opening a pull request, and include a clear explanation of the user-facing or engineering impact.

## Author

Developed and maintained by **Saksham Raj Singh Chauhan**.

## License

MIT License
