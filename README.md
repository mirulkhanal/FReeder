# FReeder

FReeder is a React Native reading app.

## Requirements

- Node.js 22+
- npm 10+
- React Native development environment

## Quick Start

1. Install dependencies:
   - `npm ci`
2. Start Metro:
   - `npm run start`
3. Run app:
   - Android: `npm run android`

## Standard Project Commands

- `npm run check`: typecheck + lint + format check
- `npm run lint:fix`: auto-fix lint findings
- `npm run format`: apply Prettier formatting
- `npm run build:release-artifact`: build production JS bundles and package release artifact

## Release Workflow

Every push to `main` triggers:

1. Dependency install
2. Linting, formatting and type checking
3. Security audit
4. Production bundle build
5. GitHub Release creation with generated release notes/changelog and attached artifact

Release assets are generated as `dist/freeder-release.apk`.

## Open Source Standards

- Conventional Commit messages are required.
- Pre-commit hook runs lint-staged checks.
- Commit-msg hook validates commit format.
- Strict TypeScript configuration is enabled.

## Repository Policies

- [Contributing Guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)
- [License](./LICENSE)
