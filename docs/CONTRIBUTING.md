# Contributing to OpenReport

Welcome to OpenReport! We are excited to collaborate with open-source contributors, reporting engineers, and developers worldwide.

## Code of Conduct
We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful and constructive in all discussions.

## Development Setup

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0 (or npm)

### Initializing the Workspace
```bash
# Clone the repository
git clone https://github.com/openreport/openreport.git
cd openreport

# Install dependencies
pnpm install

# Run all unit and integration tests
pnpm test

# Build all packages
pnpm build

# Launch OpenReport Studio in development mode
pnpm dev
```

## Pull Request Guidelines
1. Ensure all new features are accompanied by automated unit or integration tests.
2. Maintain zero type-check errors (`pnpm typecheck`).
3. Follow the established code formatting and naming conventions.
4. Update relevant documentation in `docs/` and summarize your changes in `CHANGELOG.md`.
