# Student Records

School management system focused on student records, assessment scores, reporting, and attendance.

## Repository Structure

- `db/` - PostgreSQL schema and database assets
- `docs/` - architecture and technical documents
- `web/` - frontend application (Next.js + shadcn/ui)

## Frontend Stack Decision (Tech Lead Baseline)

- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS v4
- Component System: shadcn/ui
- Icons: lucide-react
- Tooling: ESLint + strict typed setup from Next.js defaults

Why this stack:

- scales well for role-based dashboards and CRUD-heavy UIs
- gives fast developer velocity with reusable, consistent UI primitives
- supports long-term maintainability with typed frontend architecture

## Run Frontend Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Frontend Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Code Quality Commands

Run from repository root:

```bash
npm run lint
npm run lint:web
npm run lint:web:fix
npm run format
npm run format:check
```

Run from frontend folder only:

```bash
cd web
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## Contribution Requirements

- keep pull requests focused and small enough to review quickly
- run lint and format checks before pushing
- commits are blocked if lint-staged detects issues on staged files
- use the pull request template and fill all sections

Required pull request sections:

- What
- Why
- How To Validate
- Related Tasks
- Dependencies
- Context
- Validation Evidence

Related tasks should include at least one Jira key (example: `SCH-123`) or GitHub issue reference (example: `closes #45`).

## PR Template and Automation

- PR template path: `.github/pull_request_template.md`
- PR description enforcement workflow: `.github/workflows/pr-description.yml`

The workflow validates required section headings and task references on PR open/update.

## AI Project Manager

This repo is set up for issue-driven planning through GitHub Issues.

- AI project manager guide: `docs/ai-project-manager.md`
- Epic issue template: `.github/ISSUE_TEMPLATE/epic.yml`
- Task issue template: `.github/ISSUE_TEMPLATE/task.yml`

Recommended flow:

1. Create an epic issue for the overall goal.
2. Break the epic into smaller tasks.
3. Keep one task per PR whenever possible.
4. Link PRs back to the parent issue.
5. Use labels like `ai-planned`, `ai-in-progress`, and `ai-ready-for-review` to track status.

## Pre-Commit Validation

- Husky manages git hooks from `.husky/`
- pre-commit runs `npm run precommit`
- `lint-staged` only checks files that are currently staged
- commit is blocked automatically if linting or formatting fails

## Current Status

- database schema defined in `db/schema.sql`
- architecture docs aligned to schema in `docs/architecture.md`
- professional frontend starter initialized in `web/` with shadcn/ui
