# MATS – Mobile Application Threads Simulation

MATS is a web-based workflow (built with Vite + React + shadcn/ui) that lets security teams upload Android APKs, select multiple analysis engines (MobSF, MITMProxy, AndroGuard, Frida, Drozer), watch a guided execution flow, and review consolidated findings, vulnerabilities, remediation suggestions, and export-ready reports.

The current build focuses on a polished front-end experience with mocked data/state transitions so you can wire it up to real back-end services when ready.

---

## 1. Prerequisites

1. **Node.js 18+** – verify with `node -v`.  
2. **npm 9+** – bundled with Node; confirm `npm -v`.  
3. **Git** (optional but recommended) – for cloning/pulling updates.

> _Tip:_ Enable Corepack (`corepack enable`) if you prefer pnpm/yarn; adapt the npm commands accordingly.

---

## 2. Getting the Source

### Option A – Using Git
```bash
git clone <your-fork-or-repo-url> mats
cd mats
```

### Option B – Downloading an Archive
1. Download the ZIP from your source control provider.
2. Extract it and open the folder in your terminal/IDE.

---

## 3. Install Dependencies

From the project root:
```bash
npm install
```

This pulls Vite, React, shadcn/ui primitives, Radix UI, Tailwind, and supporting utilities (clsx, tailwind-merge, etc.).

---

## 4. Development Workflow

### 4.1 Start the Dev Server
```bash
npm run dev
```
* Vite boots on `http://localhost:5173`.
* Hot Module Replacement keeps UI changes instantaneous.

### 4.2 Lint / Type-Check (optional during dev)
```bash
npm run build   # runs tsc then vite build; fails on TS errors
```

### 4.3 Stop the Server
Press `Ctrl + C` in the terminal when you’re done.

---

## 5. Production Build

Generate optimized assets (tree-shaken JS + extracted CSS):
```bash
npm run build
```

Preview the build locally:
```bash
npm run preview
# Opens http://localhost:4173
```

Deploy the contents of `dist/` to your hosting provider (Netlify, Vercel, S3 + CloudFront, etc.).

---

## 6. Project Structure

```
mats/
├─ src/
│  ├─ App.tsx               # Main MATS screens + workflow state machine
│  ├─ main.tsx              # React entry point
│  ├─ index.css             # Tailwind layers + grayscale theme tokens
│  ├─ components/
│  │  └─ ui/                # shadcn-style primitives (button, card, dialog, etc.)
│  └─ lib/utils.ts          # cn() helper
├─ public/                  # Static assets (favicons, etc.)
├─ index.html               # Vite root document
├─ tailwind.config.js       # Tailwind + theme extensions
├─ vite.config.ts           # Vite + React plugin + path aliases
├─ tsconfig.json            # TS settings (strict + JSX + path aliases)
└─ package.json             # Scripts + deps
```

---

## 7. Using/Extending the UI

1. **Upload Flow:** Selecting an APK triggers the analysis dialog. Currently, the file is kept client-side; connect the file picker to your API by sending it via `FormData`.
2. **Analysis Options:** MobSF remains locked/required by default. Update `analysisOptions` in `src/App.tsx` to alter descriptions or add new engines.
3. **Progress Simulation:** The `processing` state uses a timer to animate progress from 0–100%. Replace with websocket or polling to your backend.
4. **Summary Data:** `summaryTemplate` mocks key findings, vulnerabilities, and remediation. Map this to real analyzer output once ready.
5. **PDF/Share Buttons:** Buttons are placeholders; wire them to downloads or integrations (Jira, email, etc.).

---

## 8. Styling Conventions

* Tailwind is configured with a grayscale palette; adjust tokens in `src/index.css` for different themes.
* Components inherit from shadcn/ui patterns, so you can generate more primitives with the CLI if needed.
* Use the `.glass-panel` utility for frosted surfaces; it leverages the same border, blur, and shadow recipe across sections.

---

## 9. Troubleshooting

| Issue | Fix |
| --- | --- |
| `npm install` fails on Windows due to execution policy | Run PowerShell as admin: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| Tailwind classes not applying | Ensure `tailwind.config.js` `content` paths (`./index.html`, `./src/**/*.{ts,tsx}`) include any new directories |
| Module path errors (`@/…`) | Confirm `tsconfig.json` and `vite.config.ts` both declare the `@` alias |
| Build succeeds but UI shows blank | Check browser console; ensure `npm run build && npm run preview` shows no errors |

---

## 10. Next Steps

1. Connect the upload + analysis triggers to your backend (REST, GraphQL, or websockets).
2. Replace mock `summaryTemplate` data with real responses and add error-handling states.
3. Record analysis history in local storage or via API for persistence.
4. Add auth/role-based access if needed for production use.

Happy testing! Let me know if you need scripts, deployment templates, or backend integration helpers.

