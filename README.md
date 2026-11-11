# Last Light

**A tiny lighthouse. An endless ocean. Seven nights to bring back the Sun.**

> **AI-generated code disclosure:** The initial game implementation, tests and project documentation were generated using OpenAI ChatGPT from a detailed design specification. The repository owner did **not** hand-write the initial implementation. Future changes may also be AI-assisted. This code is shared transparently for review and is not presented as manually authored or independently security certified.

Last Light is a complete, original, single-player browser game built with dependency-free HTML5 Canvas 2D, vanilla JavaScript ES modules, CSS and Web Audio. It is hosted as static files. No backend, tracking, account, download, or external asset is needed.

## Play locally

Use any static HTTP server from the project root, for example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/` in Chrome, Firefox, Safari or Edge. Opening `index.html` directly as a `file://` URL is not supported because browsers restrict ES modules. Upload the contents of the repository unchanged to any static host including GitHub Pages. Paths are relative, so subdirectory deployment works. GitHub Pages is not automatically enabled by the repository or this code; enable Pages separately in repository settings if desired.

## Controls

On touchscreens, press and drag on the water to aim and shine the beam. Release to recharge. With a mouse, click and hold and drag. Move the mouse without pressing to preview aim. With a keyboard, press **A/D** or **Left/Right** to rotate, hold **Space** to shine, and press **P** or **Escape** to pause. Menus use normal buttons and keyboard focus.

Protect the lighthouse through three waves, choose a new temporary upgrade after each wave, and face that night's encounter. Aim at the golden ships for a continuous 1.2 seconds to guide them home and gain starlight. Permanent Workshop upgrades cost banked starlight, earned upon victory or defeat. There are exactly seven story nights, a final cooperative sky-alignment sequence, and an Endless mode unlocked only after the campaign. Losing a night does not erase earlier completions.

## Save behaviour

Progress, settings, statistics and achievements are saved locally under the single `localStorage` key `last-light-save-v1`. A completed night saves its rewards immediately. An unfinished night is not checkpointed. Closing the page mid-run loses only that attempt. The Reset Progress option clears the game's own data without clearing other websites' data. Storage being unavailable does not prevent play, but progress may not survive reloads.

## Accessibility and safety

All menus use semantic HTML buttons and inputs, visible focus rings, reduced-motion and high-contrast settings. Gameplay supports pointer and keyboard controls. The game auto-pauses if the tab becomes hidden. Audio is optional and plays only after a user gesture. No permissions, analytics, networking or personal data collection are needed.

## Development checks

Node.js 22 or a recent compatible Node version can run all checks without downloading packages:

```bash
node scripts/validate.mjs
node --test
# or npm run check (npm install is not required)
```

The simulation, encounters, mathematics and persistence modules are importable from Node without a DOM. `.github/workflows/ci.yml` runs static validation and unit tests on pushes and pull requests.

## Project map

- `src/config.js`, `src/story.js`: gameplay data and all seven chapters' original dialogue.
- `src/math.js`, `src/simulation.js`, `src/encounters.js`, `src/upgrades.js`, `src/progression.js`: deterministic game mechanics and reward settlement.
- `src/renderer.js`, `src/input.js`, `src/screens.js`, `src/audio.js`: Canvas art, controls, semantic UI, optional synthesised sound.
- `src/storage.js`, `src/achievements.js`: versioned saves and local awards.
- `src/controller.js`, `src/main.js`: one-frame-loop orchestration and bootstrap.

For copyright and redistribution terms, see `LICENSE`.

## Public-repository safeguards

The project is intentionally dependency-free, so CI does not run `npm install`, fetch code-generation tools or require project secrets. GitHub Actions use read-only permissions, disable persisted checkout credentials, and pin official actions to immutable commit SHAs. Dependabot checks those action versions weekly. See [SECURITY.md](SECURITY.md) for private vulnerability reporting guidance.

Before publishing changes, run:

```bash
node scripts/check-public-safety.mjs
node scripts/validate.mjs
node --test
```

The public-safety script checks committed files for common credential signatures, personal email addresses, personal filesystem paths, and sensitive file types. It does **not** detect every secret or piece of personal information. Never commit private files or sensitive information, even if Git ignores them locally. Git ignoring a path does not remove that file from existing commits.

For a public repository, also consider enabling **secret scanning and push protection**, **Dependabot alerts**, **CodeQL code scanning**, **private vulnerability reporting**, and **branch protection / repository rulesets** in GitHub Settings. These are GitHub account/repository settings, not changes that this project can activate merely by committing a file. Review the repository's visibility and GitHub Pages configuration separately. These features may vary by repository visibility and account plan.

The source being viewable does not change its copyright terms. See [LICENSE](LICENSE).
