# AI Project Manager Guide

This repository is set up to be managed from GitHub Issues first, with the AI acting as a project manager that breaks large goals into executable tasks.

## Workflow

1. Create an epic issue for any large goal.
2. Break the epic into task issues using the task template.
3. Track work with labels and linked issues.
4. Keep PRs tied to one or more task issues.
5. Validate each PR against the task's acceptance criteria.

## Recommended Issue Types

- Epic: large, multi-step outcome
- Task: small implementation unit
- Bug: defect or regression
- Chore: maintenance, tooling, or cleanup

## Labels

Recommended labels for this repository:

- epic
- task
- bug
- chore
- ai-planned
- ai-in-progress
- ai-ready-for-review
- blocked
- dependency

## Natural Language Commands

Use natural language with the AI project manager in this style:

- Create an epic for student enrollment management.
- Break the marks entry epic into tasks.
- Show blocked issues for the frontend.
- Summarize what remains for the attendance module.

## Definition of Ready

Before a task is marked ready:

- the goal is clear
- acceptance criteria are listed
- dependencies are known
- validation steps are provided
- scope is small enough for one pull request

## Definition of Done

A task is complete when:

- code is merged
- lint and format checks pass
- required validation steps are documented
- the PR references the parent issue

## PR Expectations

Every pull request should link back to its source issue and include:

- what changed
- why it changed
- how to validate
- dependencies or blockers

This matches the root PR template in `.github/pull_request_template.md`.
