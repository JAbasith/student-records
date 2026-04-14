# Student Records Frontend

Frontend application for the Student Records school management platform.

## Stack

- **Framework** — Next.js 16 (App Router)
- **Language** — TypeScript (strict mode)
- **Styling** — Tailwind CSS v4
- **Components** — shadcn/ui (Base UI primitives)
- **Auth & Database** — Supabase (Google OAuth, Row-Level Security)
- **Testing** — Vitest + V8 coverage

## Project Structure

```
src/
├── app/                  # Next.js App Router pages & layouts
│   ├── (dashboard)/      # Authenticated dashboard routes
│   │   ├── admin/        # Admin workspace (allowlist, academic setup, users)
│   │   ├── teacher/      # Teacher workspace
│   │   ├── student/      # Student workspace
│   │   └── subjects/     # Student subject view
│   ├── auth/             # OAuth callback handler
│   └── login/            # Login page
├── components/ui/        # shadcn/ui component library
├── features/             # Feature modules (domain logic)
│   ├── academic-setup/   # Academic year, terms, subjects, enrollment
│   ├── access-control/   # Role-based route permissions
│   ├── allowlist/        # Allowlist management (single + bulk)
│   ├── auth/             # Authentication helpers & guards
│   ├── subjects/         # Student subject view logic
│   └── user-management/  # User CRUD & filtering
└── lib/                  # Shared utilities
    ├── supabase/         # Supabase client/server/config
    └── utils.ts          # Tailwind class merge helper
```

## Getting Started

```bash
cp .env.example .env     # Fill in your Supabase credentials
npm install
npm run dev              # http://localhost:3000
```

## Quality Checks

```bash
npm run lint             # ESLint (flat config)
npm run typecheck        # TypeScript strict
npm run test             # Vitest
npm run build            # Production build
```

## Add More shadcn Components

```bash
npx shadcn@latest add button card table dialog form select
```
