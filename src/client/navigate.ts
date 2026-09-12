/**
 * Narrow waist of the plugin: the only place that reads the two client
 * controller snapshots, and the only place that depends on their field names.
 *
 * The browser half declares no dependency on the `@deepseek-ai/*` packages — a
 * value import from a feature package is forbidden by the client purity gate,
 * and this plugin never needs one at runtime. What it does touch is a handful
 * of leaf fields, mirrored below. When dsh changes those fields, this file
 * and `apply.ts` are the only files to revisit.
 */

/** Opaque session identity. */
export type SessionId = string;
/** Opaque workspace identity. */
export type WorkspaceId = string;

/** The session fields this plugin reads. */
export interface SessionSummary {
  /** Session identity; the list snapshot is keyed by it. */
  readonly id: SessionId;
  readonly origin?: 'subagent';
  /** Empty-log placeholder: another workspace's provisional "New Session" row. */
  readonly blank?: boolean;
  readonly cwd?: string;
  /** Human-facing row label; also the DOM text used to bind a group section. */
  readonly displayTitle: string;
  readonly updatedAt: number;
}

/** The session-list snapshot fields this plugin reads. */
export interface SessionListSnapshot {
  /** Host-list order. */
  readonly current: SessionId | undefined;
  readonly phase: string;
  readonly byId: Readonly<Record<SessionId, SessionSummary>>;
}

/** The workspace row fields this plugin reads. */
export interface WorkspaceView {
  readonly workspaceId: WorkspaceId;
  /** Canonical host directory path; blank-session reuse is keyed on it. */
  readonly path: string;
  /** Sessions accounted to this workspace, in the browser's stored order. */
  readonly sessionIds: readonly SessionId[];
}

/** The workspace-list snapshot fields this plugin reads. */
export interface WorkspaceSnapshot {
  /** Host order — the order the sidebar draws groups in, and ←/→ walk in. */
  readonly items: readonly WorkspaceView[];
  /** Registry-global archive set; archived sessions are drawn nowhere. */
  readonly archivedSessionIds: readonly SessionId[];
  readonly phase: string;
}

/** The two snapshots one arrow press is resolved against. */
export interface NavState {
  readonly items: readonly WorkspaceView[];
  readonly archivedSessionIds: readonly SessionId[];
  readonly list: SessionListSnapshot;
}

/** Where one arrow press wants to go. */
export type Target =
  | {
    readonly kind: 'session';
    readonly sessionId: SessionId;
    /** Index inside the owning workspace's visible rows, for scrolling only. */
    readonly rowIndex: number;
    readonly workspaceId: WorkspaceId;
  }
  | { readonly kind: 'workspace'; readonly workspaceId: WorkspaceId };

/** The `workspaces` service fields this plugin reads. */
export interface WorkspacesReadFace {
  readonly list: { getSnapshot(): WorkspaceSnapshot };
}

/** The `sessions` service fields this plugin reads and writes. */
export interface SessionsFace {
  readonly list: { getSnapshot(): SessionListSnapshot };
  open(id: SessionId): void;
}

/** The `uiWorkspace` service fields this plugin uses as a fallback. */
export interface UiWorkspaceFace {
  connectWorkspace(workspaceId: WorkspaceId): Promise<SessionId>;
}

/**
 * Resolve the workspace that accounts for a session.
 * @param items - workspace rows in host order.
 * @param sessionId - session whose owning workspace is required.
 * @returns the owning workspace id, or undefined when none accounts for it.
 */
export function owningWorkspaceId(
  items: readonly WorkspaceView[],
  sessionId: SessionId | undefined,
): WorkspaceId | undefined {
  if (sessionId === undefined) return undefined;
  for (const item of items) {
    if (item.sessionIds.includes(sessionId)) return item.workspaceId;
  }
  return undefined;
}

/**
 * Whether the sidebar draws a session as a row. Mirrors the shipped
 * `sessionVisible`: subagent children live under their parent's
 * catalog, archived sessions are hidden everywhere, and a blank placeholder
 * is drawn only while it is the selected session.
 * @param summary - the session's list row, when the pull has reached it.
 * @param id - the session's identity.
 * @param current - currently selected session.
 * @param archived - registry-global archive set.
 * @returns true when the sidebar draws this session as a row.
 */
export function isVisibleRow(
  summary: SessionSummary | undefined,
  id: SessionId,
  current: SessionId | undefined,
  archived: ReadonlySet<SessionId>,
): boolean {
  if (summary === undefined) return false;
  if (summary.origin === 'subagent') return false;
  if (archived.has(id)) return false;
  if (summary.blank === true && id !== current) return false;
  return true;
}

/**
 * The visible session rows of one workspace, in the browser's stored order.
 * @param workspace - workspace whose ordered membership is projected.
 * @param state - the two snapshots.
 * @returns session ids that the sidebar draws under that workspace.
 */
export function visibleRows(workspace: WorkspaceView, state: NavState): SessionId[] {
  const archived = new Set(state.archivedSessionIds);
  const rows: SessionId[] = [];
  for (const id of workspace.sessionIds) {
    if (!isVisibleRow(state.list.byId[id], id, state.list.current, archived)) continue;
    rows.push(id);
  }
  return rows;
}

/** The most recently updated session of a set. */
export function newestOf(rows: readonly SessionId[], state: NavState): SessionId | undefined {
  let best: SessionId | undefined;
  let bestAt = Number.NEGATIVE_INFINITY;
  for (const id of rows) {
    const summary = state.list.byId[id];
    if (summary === undefined) continue;
    if (summary.updatedAt > bestAt) {
      bestAt = summary.updatedAt;
      best = id;
    }
  }
  return best;
}

/**
 * Resolve one arrow key against the live snapshots.
 *
 * `order` is the sequence the sidebar is drawing for the workspace that owns
 * the current session, when it could be read. It is authoritative because the
 * sidebar does not render the controller's membership verbatim: it reconciles
 * that membership with its own persisted order and promotes recently-active
 * sessions to the top, so the two disagree in exactly the case a user notices —
 * the session they just activated. Without it, the controller's order is the
 * fallback, which is right whenever nothing has been reordered or promoted.
 * @param key - a KeyboardEvent key value.
 * @param state - the two snapshots.
 * @param order - the drawn row order of the owning workspace, when known.
 * @returns the target, or null when the key is irrelevant or the move is a no-op.
 */
export function planArrow(key: string, state: NavState, order?: readonly SessionId[]): Target | null {
  const current = state.list.current;
  const owner = owningWorkspaceId(state.items, current);
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    if (owner === undefined || current === undefined) return null;
    const workspace = state.items.find(item => item.workspaceId === owner);
    if (workspace === undefined) return null;
    const rows = order ?? visibleRows(workspace, state);
    if (rows.length < 2) return null;
    const step = key === 'ArrowDown' ? 1 : -1;
    const index = rows.indexOf(current);
    const next = rows[(index + step + rows.length) % rows.length];
    if (next === undefined || next === current) return null;
    return { kind: 'session', sessionId: next, rowIndex: rows.indexOf(next), workspaceId: owner };
  }
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    if (state.items.length < 2) return null;
    const step = key === 'ArrowRight' ? 1 : -1;
    // A session no workspace accounts for — or no selection at all — has no
    // position in the order. Entering at the end the key implies keeps the
    // direction the user asked for; entering at index 0 would make ArrowLeft
    // move forwards.
    const index = owner === undefined ? -1 : state.items.findIndex(item => item.workspaceId === owner);
    const from = index === -1 && step < 0 ? state.items.length : index;
    const target = state.items[(from + step + state.items.length) % state.items.length];
    if (target === undefined || target.workspaceId === owner) return null;
    return { kind: 'workspace', workspaceId: target.workspaceId };
  }
  return null;
}
