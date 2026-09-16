/**
 * Execution layer: turn one resolved target into client-side effects.
 *
 * The whole switching path is `sessions.open`. The details panel is not this
 * plugin's business: the shipped frame already closes it whenever the current
 * session changes, and the running build exposes no `selectPanel`.
 */
import { type SessionId, type SessionsFace, type Target, type UiWorkspaceFace, type WorkspaceId, type WorkspacesReadFace } from './navigate.ts';
/** Exactly what `apply` needs; the plugin declares the matching injections. */
export interface Plan {
    readonly sessions: SessionsFace;
    readonly workspaces: WorkspacesReadFace;
    readonly uiWorkspace: UiWorkspaceFace;
}
/**
 * Adopt one workspace the way the sidebar does.
 *
 * Precedence: the workspace's blank placeholder, then its most recently
 * updated visible session, then the shipped `connectWorkspace` (which creates a
 * blank session there). The first two are this plugin's product choice: always
 * creating would leave a trail of empty sessions behind every arrow press.
 * @param plan - the three service faces.
 * @param workspaceId - target workspace.
 */
export declare function openWorkspace(plan: Plan, workspaceId: WorkspaceId, order?: readonly SessionId[]): void;
/**
 * Apply one resolved target.
 * @param plan - the three service faces.
 * @param target - the target `planArrow` returned.
 * @param order - the drawn order of the target workspace, when it was read: the
 *   landing session then follows what the user sees rather than the controller's
 *   membership order.
 */
export declare function execute(plan: Plan, target: Target, order?: readonly SessionId[]): void;
