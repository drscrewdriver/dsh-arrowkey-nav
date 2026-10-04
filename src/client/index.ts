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
import { probeService } from './apply.ts';
import { handleArrowKey, readNavState } from './session-nav.ts';

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
    // A `false` flag means that service is missing on this DSH build: the
    // listener stays attached but navigation stays inert (see handleArrowKey).
    // `uiWorkspace` goes through the throw-safe probe: hosts whose module
    // table lacked the package run with it undeclared, and the modern
    // runner's strict context proxy throws on a direct read of it.
    console.info(
      'dsh-arrowkey-nav: listener attached',
      {
        sessions: ctx.sessions !== undefined,
        workspaces: ctx.workspaces !== undefined,
        uiWorkspace: probeService(ctx, 'uiWorkspace') !== undefined,
      },
    );
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      console.info('dsh-arrowkey-nav: listener removed');
    };
  }, 'dsh-arrowkey-nav: document keydown listener');

  // Read-only diagnostic accessor for the console (see diagnose-console.js):
  // the service snapshots live inside this closure, so a shape probe has to
  // run from here. Removed with the plugin.
  ctx.effect(() => {
    (globalThis as Record<string, unknown>).__dshArrowkeyNav = {
      snapshot: (): unknown => {
        try {
          const state = readNavState(ctx);
          const rows = Object.values(state.list.byId);
          const sample = rows[0];
          return {
            services: {
              sessions: ctx.sessions !== undefined,
              workspaces: ctx.workspaces !== undefined,
              uiWorkspace: probeService(ctx, 'uiWorkspace') !== undefined,
            },
            sessions: {
              snapshotKeys: Object.keys(state.list),
              rowKeys: sample === undefined ? [] : Object.keys(sample),
              current: state.list.current,
              phase: state.list.phase,
              rowCount: rows.length,
              sampleRow: sample,
            },
            workspaces: {
              workspaceCount: state.items.length,
              workspaceKeys: state.items[0] === undefined ? [] : Object.keys(state.items[0]),
              archivedCount: state.archivedSessionIds.length,
              sampleWorkspace: state.items[0],
            },
          };
        } catch (error) {
          return { error: String(error) };
        }
      },
    };
    return () => {
      delete (globalThis as Record<string, unknown>).__dshArrowkeyNav;
    };
  }, 'dsh-arrowkey-nav: console diagnostic accessor');
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
