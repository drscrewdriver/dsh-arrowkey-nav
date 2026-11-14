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
  '0.2.0-rc.1', '0.2.0-rc.2', '0.2.1-rc.1', '0.2.1-rc.2', '0.2.1-rc.3', '0.2.1-rc.4', '0.2.1-rc.5', '0.2.2-rc.1', // 2026-10-18 补票：rc.2（34/34 peer 逐包 npm 在版，声明面）；2026-10-28 补票：rc.4（纯修复车，契约面零 diff）；2026-11-06 补票：0.2.2-rc.1（纯 bump，latest 切换）
]);

/**
 * The `engines.dsh` gate.
 *
 * A RANGE, not an enumeration — but the two consumers of this package need
 * different shapes, so read the next paragraph before "simplifying" this back
 * into `supportedHosts.join(' || ')`.
 *
 * The floor is derived from `supportedHosts[0]` (the oldest verified host) and
 * the ceiling is the next major, so the range can never silently drop cells the
 * whitelist still lists — that exact bug shipped once: the floor was hand-typed
 * as `0.1.1-rc.2` while the whitelist starts at `0.1.0-rc.2`, quietly excluding
 * the five 0.1.0 rcs plus 0.1.1-rc.1 from `engines.dsh`.
 *
 * - The DSH host compares `engines.dsh` with `semver.satisfies(host, range,
 *   { includePrerelease: true })`. Under that flag the range matches every rc
 *   on the 0.1.0 → 0.2.2 lines AND future rcs inside the window, so a new host
 *   rc stays installable without a republish.
 * - npm/pnpm peer resolution does NOT default to `includePrerelease`. Under
 *   plain `semver.satisfies`, the same range matches only the floor cell and
 *   the `0.2.x` stables — the intervening rcs (0.1.2-rc.1, 0.1.5-*, 0.1.7-*,
 *   0.2.0-rc.*, 0.2.1-rc.*) do NOT match, which would surface as peer warnings
 *   or ERESOLVE on hosts this build actually supports.
 *
 * So `engines.dsh` uses {@link peerRange} (range) while `peerDependencies`
 * keep enumerating {@link supportedHosts} cell by cell — the range is what the
 * host reads, the enumeration is what the package manager resolves. Changing
 * either one alone silently breaks one of the two readers.
 */
export const peerRange = (() => {
  const floor = supportedHosts[0];
  const [newestMajor, newestMinor] = supportedHosts[supportedHosts.length - 1].split('.');
  // Ceiling = one minor past the newest verified cell (0.2.x → <0.3.0-0), so the
  // range covers the whole 0.1.x/0.2.x span without claiming an unverified line.
  //
  // The `-0` suffix is load-bearing: under `includePrerelease: true` a bare
  // `<0.3.0` still admits `0.3.0-rc.1` (a prerelease sorts BELOW its release),
  // which would silently declare support for the next, unverified host line.
  // `<0.3.0-0` is the lowest possible 0.3.0 prerelease, so it excludes the whole
  // 0.3.0-* band while keeping every 0.2.x cell inside.
  return `>=${floor} <${newestMajor}.${Number(newestMinor) + 1}.0-0`;
})();

/**
 * The enumerated cell list (`0.1.0-rc.2 || … || 0.2.2-rc.1`) — kept ONLY for the
 * "tested cells" table in the READMEs and for the compat matrix. Peers and
 * engines both take {@link peerRange}; see there for why the shapes were unified.
 */
export const peerEnumeration = supportedHosts.join(' || ');

/** The host build development and the CI matrix pin as their newest cell. */
export const developmentHost = '0.2.1-rc.5';

/**
 * 2026-11-14：删除按「包是否存在」拆分 peer 的 controllerRange。
 * peer 是**宿主版本白名单**——宿主对每个 dsh-* peer 都拿宿主运行时版本去匹配，
 * 所以给 controller 两个 peer 单独掐掉 0.1.0/0.1.1 等于把这两条线的宿主整体拒载，
 * 尽管 engines.dsh 写着支持。三个 peer 一律同串 {@link peerRange}。
 */

/**
 * The range each `@deepseek-ai` peer must carry, keyed by package. Peers are
 * REQUIRED (no `peerDependenciesMeta.optional`): a host outside the whitelist
 * must fail the install loudly rather than mount with a silently missing
 * service.
 */
export const peerRanges = Object.freeze({
  '@deepseek-ai/dsh-api-session-controller': peerRange,
  '@deepseek-ai/dsh-api-workspace-controller': peerRange,
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
