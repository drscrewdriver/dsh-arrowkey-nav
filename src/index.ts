/**
 * Node half of the arrow-key plugin.
 *
 * The Cordis loader needs an entry point for the profile row; the plugin's
 * behaviour is entirely in the browser half, which `dsh-client-modules` serves
 * from `./client`. This half therefore installs nothing and owns no state.
 */

/** Profile row identity. */
export const name = 'dsh-arrowkey-nav'

/**
 * Node-face apply. Intentionally empty: the shortcuts live in the browser.
 */
export function apply(): void {}
