# Security

Last Light is a small static browser game with no backend or external dependencies. Only the current `main` branch is maintained.

## Found a security issue?

Please don't put exploit details, passwords, tokens or personal information in a public issue.

If private vulnerability reporting is enabled, go to **Security → Advisories → Report a vulnerability** on GitHub. That keeps the report private while it's being reviewed.

If you don't see that option, open a public issue saying you'd like to report a security problem privately. Don't include the sensitive details in the issue.

A useful report explains what you found, why it matters and how to reproduce it safely. Reports are handled as time allows, so there's no guaranteed response or fix deadline.

## Data and checks

The game doesn't ask players to sign in and doesn't send save data anywhere. Progress lives in the player's browser using `localStorage`. No third-party JavaScript packages are installed to run the game or its tests.

CI runs `scripts/check-public-safety.mjs` to catch common credentials, personal details and files that don't belong in a public repository. It's an extra precaution, not a replacement for reviewing changes or using GitHub's secret scanning and push protection.