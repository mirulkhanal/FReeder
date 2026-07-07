# Contributing

Thanks for helping improve FReeder.

## Development Setup

1. Install dependencies:
   - `npm ci`
2. Run the app:
   - `npm run android`

## Coding Standards

- TypeScript strict mode is enabled; avoid `any`.
- Keep imports ordered and remove unused imports.
- Format code with Prettier.
- Keep changes focused and small.

## Local Quality Checks

Run before opening a pull request:

- `npm run check`
- `npm run build:release-artifact`

## Commit Message Convention

Commits are validated with Conventional Commits, for example:

- `feat: add catalog search filter`
- `fix: prevent duplicate library imports`
- `chore: update Android build tooling`

## Pull Request Guidelines

- Explain the "why" and "what" in the PR description.
- Link related issues.
- Ensure CI is green.
- Keep PRs reviewable and avoid unrelated changes.
