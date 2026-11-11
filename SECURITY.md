# Security policy

Last Light is a dependency-free, static browser game. The current `main` branch is the only maintained version.

## Reporting a vulnerability

Please **do not** publish working exploits, credentials, private information, or sensitive reproduction details in a public issue or pull request.

Use **Security > Advisories > Report a vulnerability** in this repository if GitHub's private vulnerability reporting is enabled. If that option is unavailable, open a short public issue asking for a private reporting channel, without including sensitive details.

Include a concise description, impact, and safe reproduction steps in your private report. Reports are reviewed on a best-effort basis. No response-time or security-fix guarantee is made.

## Data and dependency boundaries

The game does not require accounts, remote APIs, analytics, cookies, or server credentials. Progress is saved only in the player's browser using `localStorage`. No third-party JavaScript packages are installed at runtime or in CI.

The repository's `scripts/check-public-safety.mjs` performs a lightweight preventive scan. It is not a substitute for GitHub secret scanning, push protection, a full code review, or a human review of images and documents before publication.
