PR #4 — RFC: Enhance web & mobile experience
=============================================

Summary
-------
This PR is the repository for a set of incremental improvements aimed at making the app more mobile-friendly and preparing an eventual modern UI. Changes proposed here are intentionally small and reviewable; they are intended to be the starting point for a larger initiative.

Goals
-----
- Make pages mobile-friendly (viewport, responsive layout). 
- Improve perceived performance on mobile (simple asset hints, compressed assets via CI later).
- Prepare the app for progressive web app (PWA) features (manifest, basic service worker).
- Add a Dependabot config to keep dependencies up-to-date.
- Provide a checklist so we can split work into small PRs.

Planned changes (starter)
------------------------
1. Add viewport meta tag and mobile-friendly head tags in templates.
2. Add a minimal `manifest.webmanifest` and reference it from templates.
3. Add a placeholder service worker registration script (no-op until we add assets).
4. Add `.github/dependabot.yml` to keep `app/package.json` dependencies monitored.
5. Add responsive CSS tweaks in `app/views` and a small note in README.

Acceptance criteria
-------------------
- Templates include a viewport meta tag and reference a manifest.
- Dependabot config present so dependency updates are proposed automatically.
- PR is small, builds clean in CI, and tests pass.

Next actionable tasks (can be separate PRs)
----------------------------------------
- Make `todos.ejs` responsive: convert table/list to a flex layout (PR A).
- Add `manifest.webmanifest` and icons (PR B).
- Implement service worker registration and basic offline caching (PR C).
- Add mobile end-to-end tests (Playwright) and run in CI (PR D).

Notes
-----
This PR intentionally starts small to make review and CI safer. After merging the initial infrastructure and docs, we can open focused PRs for the UI work.
