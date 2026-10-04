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
 * `sessions` and `workspaces` exist on every supported host generation, and
 * `uiWorkspace` on every one from 0.1.2 on. All three are declared: the
 * modern client runner forbids reading an undeclared service — the context
 * proxy throws, and a throw inside `apply` fails the fiber — so declaring is
 * the only way `uiWorkspace` can be used at all. The two oldest generations
 * (0.1.0/0.1.1) never register it, so there the fiber stays pending and the
 * plugin runs inert; hosts that old are served by the legacy
 * `dsh-arrowkey-nav@0.1.1` release instead.
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
