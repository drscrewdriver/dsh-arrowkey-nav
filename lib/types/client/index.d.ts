/**
 * Browser half of `dsh-arrowkey-nav`.
 *
 * Declares the three services the plugin reads, then owns one capturing
 * keydown listener for as long as the plugin is loaded. The details panel needs
 * no handling: the shipped frame closes it when the current session changes.
 */
import type { Plan } from './apply.ts';
/** Cordis service injections this plugin waits for. */
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
