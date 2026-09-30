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
    /**
     * Local ownership counts. `mainView > 0` marks the session the host treats
     * as current; the host snapshot no longer carries a `current` field, so the
     * selection is derived from this. Optional defensively: a row without it is
     * simply not the selected one.
     */
    readonly retainedBy?: Readonly<Partial<Record<string, number>>>;
}
/**
 * The host session-list snapshot shape this plugin adapts from. The host
 * removed `current`, so the selection is derived (see `deriveCurrent`), not
 * read. Only the fields this plugin actually reads are declared.
 */
export interface HostSessionListSnapshot {
    readonly phase: string;
    readonly byId: Readonly<Record<SessionId, SessionSummary>>;
}
/** The waist-internal session-list snapshot the resolvers read. */
export interface SessionListSnapshot {
    /**
     * The selected session, derived by `deriveCurrent` from `retainedBy.mainView`;
     * the host snapshot has no such field.
     */
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
export type Target = {
    readonly kind: 'session';
    readonly sessionId: SessionId;
    /** Index inside the owning workspace's visible rows, for scrolling only. */
    readonly rowIndex: number;
    readonly workspaceId: WorkspaceId;
} | {
    readonly kind: 'workspace';
    readonly workspaceId: WorkspaceId;
};
/** The `workspaces` service fields this plugin reads. */
export interface WorkspacesReadFace {
    readonly list: {
        getSnapshot(): WorkspaceSnapshot;
    };
}
/** The `sessions` service fields this plugin reads. */
export interface SessionsFace {
    readonly list: {
        getSnapshot(): HostSessionListSnapshot;
    };
}
/** The `uiWorkspace` service fields this plugin switches and falls back through. */
export interface UiWorkspaceFace {
    /**
     * Select a Session and reveal its conversation; the host's replacement for
     * the removed `sessions.open`. `SessionTarget` also accepts a subagent
     * address, but this plugin filters subagents out, so it only ever passes an id.
     */
    openSession(target: SessionId): void;
    connectWorkspace(workspaceId: WorkspaceId): Promise<SessionId>;
}
/**
 * The session the host treats as current: the row whose `mainView` retention
 * is positive. Mirrors `mainSessionId` in the host's
 * `ui-workspace/src/client/tree.ts`. At most one row matches by host invariant
 * (`replaceMain` releases the previous before returning); if that ever breaks,
 * the first match wins and navigation degrades rather than throws.
 * @param list - the host session-list snapshot.
 * @returns the selected session id, or undefined when none is retained.
 */
export declare function deriveCurrent(list: HostSessionListSnapshot): SessionId | undefined;
/**
 * Adapt the two host snapshots into this plugin's `NavState`, deriving the
 * `current` field the host snapshot no longer carries. Single source of truth
 * for both read sites (`apply.ts` / `session-nav.ts`), so the next time the
 * host moves the selection elsewhere only `deriveCurrent` needs revisiting.
 * @param workspaces - the host workspace-list snapshot.
 * @param list - the host session-list snapshot.
 * @returns the NavState every resolver in this file reads.
 */
export declare function toNavState(workspaces: WorkspaceSnapshot, list: HostSessionListSnapshot): NavState;
/**
 * Resolve the workspace that accounts for a session.
 * @param items - workspace rows in host order.
 * @param sessionId - session whose owning workspace is required.
 * @returns the owning workspace id, or undefined when none accounts for it.
 */
export declare function owningWorkspaceId(items: readonly WorkspaceView[], sessionId: SessionId | undefined): WorkspaceId | undefined;
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
export declare function isVisibleRow(summary: SessionSummary | undefined, id: SessionId, current: SessionId | undefined, archived: ReadonlySet<SessionId>): boolean;
/**
 * The visible session rows of one workspace, in the browser's stored order.
 * @param workspace - workspace whose ordered membership is projected.
 * @param state - the two snapshots.
 * @returns session ids that the sidebar draws under that workspace.
 */
export declare function visibleRows(workspace: WorkspaceView, state: NavState): SessionId[];
/** The most recently updated session of a set. */
export declare function newestOf(rows: readonly SessionId[], state: NavState): SessionId | undefined;
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
export declare function planArrow(key: string, state: NavState, order?: readonly SessionId[]): Target | null;
