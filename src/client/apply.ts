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
import {
  newestOf,
  toNavState,
  visibleRows,
  type NavState,
  type SessionId,
  type Target,
  type UiWorkspaceFace,
  type WorkspaceId,
  type WorkspaceView,
} from './navigate.ts';
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
export function probeService(plan: Plan, name: 'uiWorkspace'): UiWorkspaceFace | undefined {
  try {
    const value = (plan as unknown as Record<string, unknown>)[name];
    return value === undefined || value === null ? undefined : (value as UiWorkspaceFace);
  } catch {
    return undefined;
  }
}

/**
 * The session-switch executor this running host exposes, bound and ready.
 *
 * `uiWorkspace.openSession` wins when present (0.1.6+ lines); otherwise the
 * legacy `sessions.open` (0.1.0–0.1.5 lines). `undefined` means this host
 * offers neither: the plugin stays mounted but inert rather than throwing.
 * @param plan - the service faces.
 * @returns a one-argument switch function, or undefined.
 */
export function switchExecutor(plan: Plan): ((id: SessionId) => void) | undefined {
  const uiWorkspace = probeService(plan, 'uiWorkspace');
  if (uiWorkspace !== undefined && typeof uiWorkspace.openSession === 'function') {
    return uiWorkspace.openSession.bind(uiWorkspace);
  }
  if (typeof plan.sessions.open === 'function') return plan.sessions.open.bind(plan.sessions);
  return undefined;
}

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
export function openWorkspace(plan: Plan, workspaceId: WorkspaceId, order?: readonly SessionId[]): void {
  const open = switchExecutor(plan);
  if (open === undefined) return;
  const workspace = plan.workspaces.list.getSnapshot().items
    .find(item => item.workspaceId === workspaceId);
  if (workspace === undefined) return;

  const state = readState(plan);
  const rows = order ?? visibleRows(workspace, state);
  const blank = blankSessionFor(workspace, state, rows);
  if (blank !== undefined) {
    open(blank);
    return;
  }
  const newest = newestOf(rows, state);
  if (newest !== undefined) {
    open(newest);
    return;
  }
  const uiWorkspace = probeService(plan, 'uiWorkspace');
  if (uiWorkspace === undefined || typeof uiWorkspace.connectWorkspace !== 'function') return;
  void uiWorkspace.connectWorkspace(workspaceId)
    .then(
      (sessionId) => { open(sessionId); },
      () => {
        // A workspace that cannot be connected leaves the selection alone;
        // the next press retries. Nothing to report: this plugin has no UI.
      },
    );
}

/**
 * Apply one resolved target.
 * @param plan - the service faces.
 * @param target - the target `planArrow` returned.
 * @param order - the drawn order of the target workspace, when it was read: the
 *   landing session then follows what the user sees rather than the controller's
 *   membership order.
 */
export function execute(plan: Plan, target: Target, order?: readonly SessionId[]): void {
  if (target.kind === 'session') {
    switchExecutor(plan)?.(target.sessionId);
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
  return toNavState(plan.workspaces.list.getSnapshot(), plan.sessions.list.getSnapshot());
}
