# Changelog

## 0.3.4 — `compat/0.1.7` (DSH 0.1.7 line)

### Fixed

- Restored arrow-key navigation on DSH 0.1.7-rc.2 (the same fix ships on the `compat/0.2.0` line as 0.4.1). Two host client-API breaking changes had silently disabled every arrow key even though the plugin still activated (`listener attached` in the console, then `keydown failed` on each press):
  - `ISessions.open(id)` no longer exists — switching now goes through `uiWorkspace.openSession(target)`. The plugin already injected `uiWorkspace` and declared the `@deepseek-ai/dsh-client-ui-workspace` peer, so no manifest change was needed.
  - `SessionListState.current` was removed — the selected session is now derived in the narrow waist (`src/client/navigate.ts` `deriveCurrent`) from `retainedBy.mainView > 0`, mirroring the host's own `mainSessionId`. `planArrow` / `visibleRows` / `session-nav.ts` / `index.ts` and the pure-resolver tests are unchanged.
- `tests/bundle.test.ts` fake services were reshaped to the real host snapshot (`retainedBy.mainView` instead of `list.current`, `uiWorkspace.openSession` instead of `sessions.open`), so the bundle smoke test now catches this class of regression instead of passing green against a shape the host never had.

### Note

- The 0.3.3 "Metadata-only … D1–D11 reports zero hits" claim below was misleading: that detector suite never covered the `sessions.open` / `SessionListState.current` behavior surface, which had in fact been removed between 0.1.5 and 0.1.7. This release corrects it.

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
