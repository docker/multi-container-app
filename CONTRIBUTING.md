Thank you for contributing!

Quick guidelines for this minimal tutorial repo:

- Open an issue for any bug or feature request.
- Keep changes small and focused — add tests when adding behavior.
- For changes that affect Docker or Compose, update `README.md` and `.github/workflows/ci.yml` as appropriate.
- Do not commit secrets or private keys. Use `.env` and add it to `.gitignore` (a `.env.example` is provided).

If you're submitting a PR, include a short description and testing steps.

Husky & Pre-commit hooks (developer setup)
-----------------------------------------

This repository uses Husky and lint-staged to run linters/formatters on staged files.
Because the Node app lives under `app/` (a subpackage), the git hooks are installed at the repository root in the `.husky/` directory.

To set up hooks locally (one-time):

1. From the repository root, install dependencies for the app:

```bash
cd app
npm install
```

2. Install Husky hooks into the repo-level `.husky` directory (run from the repository root):

```bash
npx husky install .husky
```

After that, pre-commit hooks will run automatically on `git commit` and will format and lint staged files.

If you prefer not to install hooks, CI will still run lint/format checks and fail the build if code is not formatted or contains lint errors.
