# Changelog

## 0.5.2 — re-release of 0.5.1, no code changes

### Note

- Identical code to 0.5.1 (the strict-context crash fix); re-cut so the package actually ships its changelog entries — the 0.5.1 tarball was packed before they were committed. Verified on a live 0.1.7-rc.2 host (activation + full key pipeline) and on 0.2.0-rc.2 desktop (boot restored, ↑/↓ navigation working).

## 0.5.1 — fixed the web-boot fatal introduced by 0.5.0

### Fixed

- On current hosts 0.5.0 could fail the entire boot (\`web boot: 1 entry did not activate — dsh-arrowkey-nav: failed\`): the modern client runner's context proxy **throws** when a plugin reads a service its fiber did not declare, and 0.5.0 read \`uiWorkspace\` (listener-attach log, diagnostic accessor, executor probe) after having trimmed it from the bundle \`inject\`. The throw inside the first effect failed the plugin's fiber, and the web-boot gate treats a failed entry as fatal. 0.5.1 declares all three services again — \`uiWorkspace\` exists on every host from the 0.1.2 generation on — and reads it only through a throw-safe probe (\`probeService\`), so a missing or unresolved service can never take the fiber down.
- The 0.1.0/0.1.1 generations never register \`uiWorkspace\`, so on those lines the fiber now pends and the plugin runs inert; hosts that old are served by the legacy \`dsh-arrowkey-nav@0.1.1\` release (their loaders also predate two of the three module-table packages, which was already flagged as unverified).

## 0.5.0 — one version for every supported host line

### Changed

- **One version now serves all six host lines (0.1.0, 0.1.1, 0.1.2, 0.1.5, 0.1.7, 0.2.0) — every published rc of each.** The per-line \`compat/*\` branches and per-line builds are retired in favor of a single bundle; the line dist-tags (\`dsh-0.1.0\` … \`dsh-0.2.0\`) remain and all point at this version. The exact whitelist lives in \`scripts/hosts.mjs\` and is distributed by \`scripts/sync-hosts.mjs --write\` to \`engines.dsh\` (package.json + dsh.plugin.json), \`peerDependencies\` and the READMEs; hand edits fail \`npm run hosts:check\`.
- \`peerDependencies\` are now REQUIRED (the \`optional\` markers are gone): an untested host fails the install loudly instead of mounting with a silently missing service. The two controller peers enumerate their 8 existing versions — \`@deepseek-ai/dsh-api-{session,workspace}-controller\` first shipped with 0.1.2-rc.1, so the 0.1.0/0.1.1 generations are gated by \`engines.dsh\` alone; \`@deepseek-ai/dsh-client-ui-workspace\` enumerates all 15.
- The client bundle no longer waits for the \`uiWorkspace\` service (\`inject\` is now \`['sessions', 'workspaces']\`): the 0.1.0/0.1.1 generations may never register it, and waiting would park the plugin PENDING forever there. It is probed per press instead.

### Fixed (by design, across all lines)

- One codebase serves both switching generations through capability probing (\`src/client/apply.ts\` \`switchExecutor\`): \`uiWorkspace.openSession\` where it exists (0.1.6+), legacy \`sessions.open\` otherwise (0.1.0–0.1.5); a host offering neither stays mounted but inert. The selected session is read through a generation union (\`src/client/navigate.ts\` \`toNavState\`): the snapshot's own \`current\` (pre-0.1.6) wins, otherwise the \`retainedBy.mainView\` derivation (0.1.7/0.2.0). Per-line behavioral divergence is now impossible by construction — the class of regression behind 0.3.x/0.4.x.

### Known

- The keystroke-level verification matrix (\`--serve\` + Playwright, one cell per rc) is the remaining release gate; this entry ships with unit + bundle coverage only. The 0.1.0/0.1.1 cells additionally depend on those generations tolerating the three-entry module-table \`dsh.client.inject\` (their own plugin generation predates two of the three packages).

## 0.4.1 — `compat/0.2.0` (DSH 0.2.0 line)

### Fixed

- Restored arrow-key navigation on DSH 0.2.0-rc.2 (and 0.1.7-rc.2 on the sibling `compat/0.1.7` line, released there as 0.3.4). Two host client-API breaking changes had silently disabled every arrow key even though the plugin still activated (`listener attached` in the console, then `keydown failed` on each press):
  - `ISessions.open(id)` no longer exists — switching now goes through `uiWorkspace.openSession(target)`. The plugin already injected `uiWorkspace` and declared the `@deepseek-ai/dsh-client-ui-workspace` peer, so no manifest change was needed.
  - `SessionListState.current` was removed — the selected session is now derived in the narrow waist (`src/client/navigate.ts` `deriveCurrent`) from `retainedBy.mainView > 0`, mirroring the host's own `mainSessionId`. `planArrow` / `visibleRows` / `session-nav.ts` / `index.ts` and the pure-resolver tests are unchanged.
- `tests/bundle.test.ts` fake services were reshaped to the real host snapshot (`retainedBy.mainView` instead of `list.current`, `uiWorkspace.openSession` instead of `sessions.open`), so the bundle smoke test now catches this class of regression instead of passing green against a shape the host never had.

### Note

- The 0.4.0 "Metadata-only … additive fields only, nothing removed" claim below was incorrect: `ISessions.open` and `SessionListState.current` had in fact been removed between 0.1.5 and 0.1.7, and the 0.2.0 re-target inherited that break without re-verifying the behavior surface. This release corrects it.

### Known (0.2.0 only, non-blocking)

- On DSH 0.2.0 hosts, unnamed and blank rows are drawn with a localized label ("Untitled" / "New Session") that no longer equals `displayTitle`. A group containing such a row fails the DOM label match, so the plugin safely falls back to the controller order for that workspace: arrow navigation still works, but Up/Down order may differ slightly from what is drawn and `scrollToRow` skips those rows. Fixing it exactly would couple the client half to the host's locale dictionary (forbidden by the client purity gate); documented in the `src/client/dom.ts` header and deliberately not fixed here.

## Unreleased — `compat/0.2.0` (DSH 0.2.0 line)

### Changed

- `peerDependencies` and `engines.dsh` re-targeted to the DSH 0.2.0 line: `>=0.2.0-rc.1 <0.2.1-0` (package.json + dsh.plugin.json). The face this plugin reads (`sessions.list` snapshot, `WorkspaceSnapshot`/`WorkspaceView`, `uiWorkspace.connectWorkspace`) was diffed between the 0.1.7-rc.2 and 0.2.0-rc.1 declarations. (The original "additive fields only, nothing removed" claim was wrong — `ISessions.open` and `SessionListState.current` had already been removed before 0.1.7; see the 0.4.1 entries above.)
- Install docs point at `github:drscrewdriver/dsh-arrowkey-nav#compat/0.2.0`; the registry package ships under the `dsh-0.2.0` dist-tag as `0.4.1`.

## Unreleased — `compat/0.1.7` (DSH 0.1.7 line)

### Changed

- `peerDependencies` and `engines.dsh` re-targeted to the DSH 0.1.7 line: `>=0.1.7-rc.1 <0.1.8-0` (package.json + dsh.plugin.json). The read-only 0.1.7 detector suite (D1–D11) reports zero hits and this plugin imports no `@deepseek-ai/*` module at build or test time — but that suite did not cover the `sessions.open` / `SessionListState.current` behavior surface, which was in fact broken and is fixed in 0.3.4.
- Install docs point at `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.7`; the registry package ships under the `dsh-0.1.7` dist-tag as `0.3.4`.

### Added

- ESLint flat config (type-checked baseline for src, recommended baseline for tests) and a `lint` npm script; `npm run lint` is clean.

## Unreleased — `compat/0.1.5-rc` (DSH 0.1.5 line)

### Changed

- `engines.dsh` narrowed to `>=0.1.5-alpha.1 <0.2.0-0` — the range this branch actually implements. `dsh.plugin.json` now carries the same range instead of the stale `>=0.1.2-rc.1` inherited from `master`.
- Install docs point at `github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.5-rc`; the registry package (`dsh-arrowkey-nav@0.1.1`) remains the `master` ~0.1.2 line, and the README/support-range statements were aligned with the manifest.

### Added

- Read-only console evidence accessor `globalThis.__dshArrowkeyNav.snapshot()` (`diagnose-console.js`), which reports the `sessions` / `workspaces` snapshot shapes the page actually loaded, so the 0.1.5 adaptation can be verified on a live host.

## 0.1.1

### Fixed

- `types` and `exports["."].types` pointed at `lib/types/index.d.ts`, which the build never emits — it was absent from disk and from the published 0.1.0 tarball, so TypeScript consumers received no declarations. Both now point at `lib/index.d.ts`, which is emitted and shipped.
- `engines` was absent entirely, so neither the Node nor the DSH version was gated. Both are now declared.
- `lib/` is gitignored and no hook built it, so a publish from a clean clone would have shipped a tarball with no compiled output at all. Added the `prepublishOnly` hook.

### Added

- `dsh.plugin.json`, the `screenshots.json` display manifest, and `repository` / `homepage` / `keywords`.
- Japanese and Korean READMEs and changelogs, and the install guide in English, Simplified Chinese, Japanese and Korean.

## 0.1.0

First release: arrow-key navigation for the DSH Web GUI.

### Added

- `↑` / `↓` switch to the previous / next session inside the current workspace, wrapping at the ends and never crossing into a neighbouring workspace.
- `←` / `→` switch workspaces across all of them.
- After a switch the target row is scrolled into view, and focus returns to the composer when the press started there, so typing can continue immediately.
- Session identity is read from the two client controllers (`ctx.sessions`, `ctx.workspaces`), never from the DOM: rows carry no `data-*` and no `id`, so a row cannot be asked what session it is.
- "Next" follows the order the sidebar is drawing, reconciled against the controller's membership; it falls back to the controller order when the sidebar is not mounted (collapsed rail), and an ambiguous or mismatched section falls back instead of guessing.
- Arrow keys are yielded to whoever already owns the event: any modifier, IME composition, an event already handled upstream, or a focus inside a dialog, menu or another editable field.
- An empty composer yields its arrow keys; a composer holding a draft keeps them for the caret, so editing a prompt is never hijacked.
- The listener registers in the capture phase but calls `preventDefault()` only when it actually navigates.
- The browser half has no React components, no CSS and no platform-module requests, and the package has no runtime dependencies.

### Known limitations

- A collapsed workspace group does not scroll: its rows are not mounted and dsh exposes no public way to expand a group. The switch still happens. The workspace holding the current session is kept expanded by dsh, so `↑`/`↓` are unaffected.
- A rail-collapsed sidebar does not scroll, for the same reason.
- "In one list" mode has no workspace sections, but `←`/`→` still walk the controller's workspace order, so the list may appear to jump between sections.
- Scrolling is best effort — any lookup failure is swallowed, because the selection has already moved and a missing row must never turn into a wrong one.
- Pinned to dsh 0.1.2-rc.1: the `sessions` and `workspaces` snapshot fields are pre-stable. `src/client/navigate.ts` and `src/client/apply.ts` are the only files to revisit if a dsh upgrade changes them; a service that is gone leaves the plugin pending rather than failing the page.
