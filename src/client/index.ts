/**
 * Browser half of `dsh-arrowkey-nav`.
 *
 * Declares the three services the plugin reads, then owns one capturing
 * keydown listener for as long as the plugin is loaded. The details panel needs
 * no handling: the shipped frame closes it when the current session changes.
 */
import type { Plan } from './apply.ts';
import { handleArrowKey } from './session-nav.ts';

/** Cordis service injections this plugin waits for. */
export const inject = ['sessions', 'workspaces', 'uiWorkspace'];

/** The Cordis context fields this plugin uses. */
export interface PluginContext extends Plan {
  /** Owner-scoped teardown: the returned disposer runs when the plugin unloads. */
  effect(factory: () => () => void, label: string): () => void;
}

/**
 * Attach the arrow-key listener.
 * @param ctx - the plugin's Cordis context, narrowed to the services it uses.
 */
export function apply(ctx: PluginContext): void {
  const onKeyDown = (event: KeyboardEvent): void => {
    try {
      handleArrowKey(ctx, event, trace);
    } catch (error) {
      // A broken snapshot or a re-rendered tree must not take the listener with
      // it: the next press should still work, so the failure stops here.
      console.error('dsh-arrowkey-nav: keydown failed', error);
    }
  };

  ctx.effect(() => {
    document.addEventListener('keydown', onKeyDown, true);
    // One line so a silent failure is never silent: if this does not appear,
    // the plugin never activated (a pending injection) and no key can work.
    console.info(
      'dsh-arrowkey-nav: listener attached',
      {
        sessions: ctx.sessions !== undefined,
        workspaces: ctx.workspaces !== undefined,
        uiWorkspace: ctx.uiWorkspace !== undefined,
      },
    );
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      console.info('dsh-arrowkey-nav: listener removed');
    };
  }, 'dsh-arrowkey-nav: document keydown listener');
}

/**
 * Report what one arrow press decided.
 *
 * Only arrow keys are reported, so ordinary typing never reaches the console.
 * @param message - what happened.
 * @param detail - the values that decided it.
 */
function trace(message: string, detail: unknown): void {
  console.info(`dsh-arrowkey-nav: ${message}`, detail);
}
