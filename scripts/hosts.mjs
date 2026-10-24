import assert from 'node:assert/strict';

/**
 * Single source of truth for every host-version fact this package publishes.
 *
 * `supportedHosts` is the complete list of DeepSeek Harness rc releases —
 * across all six lines — this build is verified against (npm-verified
 * 2026-10-04 against the published `@deepseek-ai/dsh` versions; each listed
 * peer package publishes a version-locked twin of every host rc). The list is
 * oldest-first and never hand-edited downstream: `sync-hosts.mjs --write`
 * distributes it, and a hand-edited `engines.dsh` / `peerDependencies` fails
 * `node scripts/sync-hosts.mjs`.
 */
export const supportedHosts = Object.freeze([
  '0.1.0-rc.2', '0.1.0-rc.3', '0.1.0-rc.6', '0.1.0-rc.7', '0.1.0-rc.8',
  '0.1.1-rc.1', '0.1.1-rc.2',
  '0.1.2-rc.1',
  '0.1.5-rc.1', '0.1.5-rc.2', '0.1.5-rc.3',
  '0.1.7-rc.1', '0.1.7-rc.2',
  '0.2.0-rc.1', '0.2.0-rc.2', '0.2.1-rc.1', '0.2.1-rc.2', '0.2.1-rc.3', // 2026-10-18 补票：rc.2（34/34 peer 逐包 npm 在版，声明面）
]);

/** The `engines.dsh` gate: exactly the enumerated rc whitelist, never a range. */
export const peerRange = supportedHosts.join(' || ');

/** The host build development and the CI matrix pin as their newest cell. */
export const developmentHost = '0.2.1-rc.3';

/**
 * `@deepseek-ai/dsh-api-session-controller` and
 * `@deepseek-ai/dsh-api-workspace-controller` first shipped with the 0.1.2
 * line — the 0.1.0/0.1.1 generations predate them and resolve the same
 * services through Cordis alone. Those hosts are therefore gated by
 * `engines.dsh` only, and the two controller peers enumerate fewer cells than
 * `supportedHosts`.
 */
const preControllerHosts = Object.freeze(supportedHosts.filter((v) => v.startsWith('0.1.0-') || v.startsWith('0.1.1-')));
export const controllerRange = supportedHosts.filter((v) => !preControllerHosts.includes(v)).join(' || ');

/**
 * The range each `@deepseek-ai` peer must carry, keyed by package. Peers are
 * REQUIRED (no `peerDependenciesMeta.optional`): a host outside the whitelist
 * must fail the install loudly rather than mount with a silently missing
 * service.
 */
export const peerRanges = Object.freeze({
  '@deepseek-ai/dsh-api-session-controller': controllerRange,
  '@deepseek-ai/dsh-api-workspace-controller': controllerRange,
  '@deepseek-ai/dsh-client-ui-workspace': peerRange,
});

/**
 * Assert a manifest's peerDependencies carry exactly the packages of
 * {@link peerRanges}. Values are not checked here: `sync-hosts.mjs` owns them
 * (its check mode fails on drift, `--write` repairs it).
 * @param peers - the manifest's `peerDependencies` object.
 */
export function assertHostPeers(peers) {
  assert.deepEqual(
    Object.keys(peers).sort(),
    Object.keys(peerRanges).sort(),
    'peerDependencies 集合与 hosts.mjs 不一致',
  );
}
