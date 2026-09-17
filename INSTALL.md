# Installation Guide (Official DSH CLI)

This guide uses only the official DSH `dsh plugin` command. That command installs the dependency into a profile and synchronizes `dsh.profile.bundles`. Do not replace it with plain `npm install`, a direct `pnpm add` in the profile, or manual edits to the profile manifest.

- [English installation guide](./INSTALL.md)
- [中文安装指南](./INSTALL.zh.md)
- [日本語インストールガイド](./INSTALL.ja.md)
- [한국어 설치 안내](./INSTALL.ko.md)
- [English README](./README.md)
- [中文 README](./README.zh.md)
- [日本語 README](./README.ja.md)
- [한국어 README](./README.ko.md)
- [Changelog](./CHANGELOG.md)
- [日本語 changelog](./CHANGELOG.ja.md)
- [한국어 changelog](./CHANGELOG.ko.md)

The placeholders in this guide are:

- `<profile>`: the DSH profile to modify, usually `web`;
- `dsh-arrowkey-nav`: the npm package and the runtime plugin ID.

> **Supported DSH range: `>=0.1.5-alpha.1 <0.2.0-0`.**
>
> This guide documents the `compat/0.1.5-rc` branch — the DSH 0.1.5 line. The `sessions` and `workspaces` snapshot fields it reads are pre-stable, so check the running version with `dsh --version` before installing. The `master` branch is the original ~0.1.2 baseline (`>=0.1.2-rc.1`).

## 0. Prerequisites and profile discovery

```bash
echo "DSH_HOME=${DSH_HOME:-$HOME/.dsh}"
dsh --version
ls "${DSH_HOME:-$HOME/.dsh}/profiles"
```

Use the profile named by your running DSH process. `web` is common, but the active `--profile` argument is authoritative.

## 1. Official installation

```bash
dsh plugin --profile <profile> add github:drscrewdriver/dsh-arrowkey-nav#compat/0.1.5-rc -w
```

(the `-w` flag is required when the profile is a pnpm workspace root, as `web` is.)

The `#compat/0.1.5-rc` ref selects the DSH 0.1.5 line, which is what this branch is; `lib/` is committed on it, so a GitHub install needs no build step. Installing from the registry instead (`dsh plugin --profile <profile> add dsh-arrowkey-nav -w`) resolves to the published `master` ~0.1.2 line.

Install a specific registry version explicitly (the `master` ~0.1.2 line):

```bash
dsh plugin --profile <profile> add dsh-arrowkey-nav@0.1.1 -w
```

The official CLI updates the profile dependency, the lockfile, and `dsh.profile.bundles` automatically. Do not add a manual YAML row.

### Supply-chain cooling period

Registry installs only. The DSH runtime uses pnpm 11, whose `minimumReleaseAge` policy may block a freshly published version with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`. Add the version to `minimumReleaseAgeExclude` in `~/.dsh/profiles/<profile>/pnpm-workspace.yaml`:

```yaml
minimumReleaseAgeExclude:
  - dsh-arrowkey-nav@0.1.1
```

## 2. Restart the profile and reload the page

This plugin ships both halves, and the browser half is where the keyboard listener lives. **Restart the profile** — a running instance does not hot-load a new bundle layer — and then **reload `http://127.0.0.1:3080`**. Restarting without reloading leaves the page running the previous client bundle.

## 3. Upgrade

```bash
dsh plugin --profile <profile> update dsh-arrowkey-nav -w
```

Restart the profile and reload the page afterwards.

## 4. Local-path registration (alternative)

For development or offline installs, register the plugin from a local checkout:

```bash
dsh plugin --profile <profile> add /absolute/path/to/dsh-arrowkey-nav -w
```

A source checkout must be built before it can be registered: `npm run build` regenerates `lib/client.js` from `src/client`. The build needs `typescript`; if it is not installed in that package, point `DSH_TYPESCRIPT` at an existing `typescript` module directory. Publishing builds it automatically through the `prepublishOnly` hook.

```bash
npm run typecheck   # both compiler faces
npm test            # resolver unit tests + built-bundle smoke tests
npm run build       # regenerate lib/client.js after editing src/client
```

## 5. Verify installation

```bash
grep -n "dsh-arrowkey-nav" \
  "${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/package.json"
node -p "require('${DSH_HOME:-$HOME/.dsh}/profiles/<profile>/node_modules/dsh-arrowkey-nav/package.json').version"
```

Check the official composition:

```bash
dsh --profile <profile> --dump-default-config
```

It must contain:

```yaml
- id: dsh-arrowkey-nav
  name: dsh-arrowkey-nav
```

## 6. Verify the plugin

Reload the page, then confirm:

1. `↑` / `↓` move to the previous / next session within the current workspace, wrapping at the ends without entering a neighbouring workspace.
2. `←` / `→` move between workspaces.
3. The target row is scrolled into view after a switch.
4. Pressing an arrow while the composer is empty navigates and leaves focus in the composer, so typing continues immediately.
5. Once the composer holds a draft, its arrow keys move the caret instead of navigating.
6. Arrows do nothing while a dialog or menu is open, during IME composition, or while a modifier is held.

## 7. Troubleshooting

| Symptom | Action |
| --- | --- |
| `dsh` is not found | Install or enable the official DSH CLI. |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | Add the version to `minimumReleaseAgeExclude` in the profile's `pnpm-workspace.yaml`. |
| Arrow keys do nothing | Confirm the row is composed, then reload the page — the listener lives in the browser half. |
| Keys still behave as before install | The profile was not restarted, or the page was not reloaded. |
| Nothing scrolls into view after a switch | Expected for a collapsed workspace group or a rail-collapsed sidebar; see Known limitations in the README. |
| Arrows stopped working | Remove the plugin (`dsh plugin --profile <profile> remove dsh-arrowkey-nav`); the listener is owned by the plugin's Cordis effect and is removed with it. |

## 8. Remove

```bash
dsh plugin --profile <profile> remove dsh-arrowkey-nav
```

Restart the profile, and the keys behave exactly as before the install.

## License

MIT
