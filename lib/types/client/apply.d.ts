/**
 * Execution layer: turn one resolved target into client-side effects.
 *
 * The switching path is capability-probed, never version-gated: hosts from
 * 0.1.6 on expose `uiWorkspace.openSession`, older lines (0.1.0 through 0.1.5)
 * expose `sessions.open`. Whichever the running host offers is picked per
 * mount; a host offering neither leaves the plugin fail-open inert. The
 * details panel is not this plugin's business: the shipped frame already
 * closes it whenever the current session changes.
 */
import { type SessionId, type Target, type UiWorkspaceFace, type WorkspaceId } from './navigate.ts';
import type { SessionsFace, WorkspacesReadFace } from './navigate.ts';
/** Exactly what `apply` needs; the plugin declares the matching injections. */
export interface Plan {
    readonly sessions: SessionsFace;
    readonly workspaces: WorkspacesReadFace;
    /**
     * The ui-workspace client service. Present from the 0.1.2 generation on; the
     * bundle does not wait for it (waiting would park the plugin PENDING forever
     * on the pre-0.1.2 hosts that lack it) — it is probed per press instead.
     */
    readonly uiWorkspace?: UiWorkspaceFace;
}
/**
 * Read the `uiWorkspace` service off the live context, throw-safely.
 *
 * The service is declared in `inject`, so modern hosts resolve it normally;
 * this helper exists because a failed resolution must never take the fiber
 * down: the modern client runner's context proxy throws on a service that is
 * not actually registered, and a throw inside `apply` fails the whole fiber.
 * @param plan - the service faces (the live fiber context).
 * @returns the service, or undefined when the context refuses or lacks it.
 */
export declare function probeService(plan: Plan, name: 'uiWorkspace'): UiWorkspaceFace | undefined;
/**
 * The session-switch executor this running host exposes, bound and ready.
 *
 * `uiWorkspace.openSession` wins when present (0.1.6+ lines); otherwise the
 * legacy `sessions.open` (0.1.0–0.1.5 lines). `undefined` means this host
 * offers neither: the plugin stays mounted but inert rather than throwing.
 * @param plan - the service faces.
 * @returns a one-argument switch function, or undefined.
 */
export declare function switchExecutor(plan: Plan): ((id: SessionId) => void) | undefined;
/**
 * Adopt one workspace the way the sidebar does.
 *
 * Precedence: the workspace's blank placeholder, then its most recently
 * updated visible session, then the shipped `connectWorkspace` (which creates a
 * blank session there). The first two are this plugin's product choice: always
 * creating would leave a trail of empty sessions behind every arrow press.
 *
 * Without an executor, or without `connectWorkspace` on a host that has
 * neither, nothing happens: a session this plugin cannot reveal is a session
 * it must not create.
 * @param plan - the service faces.
 * @param workspaceId - target workspace.
 * @param order - the drawn order of the target workspace, when it was read.
 */
export declare function openWorkspace(plan: Plan, workspaceId: WorkspaceId, order?: readonly SessionId[]): void;
/**
 * Apply one resolved target.
 * @param plan - the service faces.
 * @param target - the target `planArrow` returned.
 * @param order - the drawn order of the target workspace, when it was read: the
 *   landing session then follows what the user sees rather than the controller's
 *   membership order.
 */
export declare function execute(plan: Plan, target: Target, order?: readonly SessionId[]): void;
