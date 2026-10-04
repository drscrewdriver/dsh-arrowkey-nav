/**
 * Browser half of `dsh-arrowkey-nav`.
 *
 * One bundle serves every supported host line (0.1.0 through 0.2.0): the two
 * switching generations are dispatched per press by a capability probe
 * (`apply.ts` `switchExecutor`), and the selected session is read through the
 * generation-union in `navigate.ts` `toNavState`. The plugin owns one
 * capturing keydown listener for as long as it is loaded; the details panel
 * needs no handling: the shipped frame closes it when the current session
 * changes.
 */
import type { Plan } from './apply.ts';
/**
 * Cordis service injections this plugin waits for.
 *
 * `uiWorkspace` is deliberately not listed: the 0.1.0/0.1.1 generations may
 * never register it, and waiting would leave the plugin PENDING forever there.
 * It is probed opportunistically per press instead (`Plan.uiWorkspace` is
 * optional), which costs nothing on the lines that do have it.
 */
export declare const inject: string[];
/** The Cordis context fields this plugin uses. */
export interface PluginContext extends Plan {
    /** Owner-scoped teardown: the returned disposer runs when the plugin unloads. */
    effect(factory: () => () => void, label: string): () => void;
}
/**
 * Attach the arrow-key listener.
 * @param ctx - the plugin's Cordis context, narrowed to the services it uses.
 */
export declare function apply(ctx: PluginContext): void;
