/**
 * Execution layer: turn one resolved target into client-side effects.
 *
 * The whole switching path is `sessions.open`. The details panel is not this
 * plugin's business: the shipped frame already closes it whenever the current
 * session changes, and the running build exposes no `selectPanel`.
 */
import {
  newestOf,
  visibleRows,
  type NavState,
  type SessionId,
  type SessionsFace,
  type Target,
  type UiWorkspaceFace,
  type WorkspaceId,
  type WorkspaceView,
  type WorkspacesReadFace,
} from './navigate.ts';

/**
 * Exactly what `apply` needs; the plugin declares the matching injections.
 *
 * `sessions`/`workspaces` are the two faces navigation resolves against; they
 * are typed required but tolerated missing at runtime (see `handleArrowKey`).
 * `uiWorkspace` is only the empty-workspace fallback and is optional: it is not
 * in the inject list, and builds without it (0.1.1) lose just that fallback.
 */
export interface Plan {
  readonly sessions: SessionsFace;
  readonly workspaces: WorkspacesReadFace;
  readonly uiWorkspace?: UiWorkspaceFace;
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
export function openWorkspace(plan: Plan, workspaceId: WorkspaceId, order?: readonly SessionId[]): void {
  const workspace = plan.workspaces.list.getSnapshot().items
    .find(item => item.workspaceId === workspaceId);
  if (workspace === undefined) return;

  const state = readState(plan);
  const rows = order ?? visibleRows(workspace, state);
  const blank = blankSessionFor(workspace, state, rows);
  if (blank !== undefined) {
    plan.sessions.open(blank);
    return;
  }
  const newest = newestOf(rows, state);
  if (newest !== undefined) {
    plan.sessions.open(newest);
    return;
  }
  if (plan.uiWorkspace === undefined) {
    // No shipped connect face on this build: an empty workspace has nothing to
    // land on, so the press resolves to nothing rather than inventing a session.
    return;
  }
  void plan.uiWorkspace.connectWorkspace(workspaceId)
    .then(
      (sessionId) => { plan.sessions.open(sessionId); },
      () => {
        // A workspace that cannot be connected leaves the selection alone;
        // the next press retries. Nothing to report: this plugin has no UI.
      },
    );
}

/**
 * Apply one resolved target.
 * @param plan - the three service faces.
 * @param target - the target `planArrow` returned.
 * @param order - the drawn order of the target workspace, when it was read: the
 *   landing session then follows what the user sees rather than the controller's
 *   membership order.
 */
export function execute(plan: Plan, target: Target, order?: readonly SessionId[]): void {
  if (target.kind === 'session') {
    plan.sessions.open(target.sessionId);
    return;
  }
  openWorkspace(plan, target.workspaceId, order);
}

/**
 * The workspace's reusable blank session, using the shipped predicate: it must
 * be a blank whose `cwd` is this workspace's path and which the registry has
 * not archived. The `cwd` test keeps a stale blank from another directory out.
 * @param workspace - workspace being entered.
 * @param state - the two snapshots.
 * @param rows - the rows the sidebar is drawing for this workspace.
 * @returns the blank session id, or undefined when the workspace has none.
 */
function blankSessionFor(
  workspace: WorkspaceView,
  state: NavState,
  rows: readonly SessionId[],
): SessionId | undefined {
  const archived = new Set(state.archivedSessionIds);
  for (const id of rows) {
    const summary = state.list.byId[id];
    if (summary === undefined) continue;
    if (summary.blank !== true) continue;
    if (archived.has(id)) continue;
    if (summary.cwd !== workspace.path) continue;
    return id;
  }
  return undefined;
}

/** Read the two snapshots the navigation layer resolves against. */
function readState(plan: Plan): NavState {
  const workspaces = plan.workspaces.list.getSnapshot();
  return {
    items: workspaces.items,
    archivedSessionIds: workspaces.archivedSessionIds,
    list: plan.sessions.list.getSnapshot(),
  };
}
