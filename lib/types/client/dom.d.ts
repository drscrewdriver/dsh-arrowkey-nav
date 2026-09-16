import type { NavState, SessionId, Target, WorkspaceId } from './navigate.ts';
/** One workspace's visible session rows, in the order the sidebar draws them. */
export type RowsByWorkspace = Map<WorkspaceId, readonly SessionId[]>;
/** Row label text per session, used to bind a DOM section to a workspace. */
export type LabelsBySession = Map<SessionId, string>;
/** The sidebar's scrolling element, or null when the tree is not mounted. */
export declare function sidebarScroller(): Element | null;
/**
 * The session ids of one workspace in the order the sidebar currently draws
 * them.
 *
 * This is the order arrow keys must follow. The sidebar does not render the
 * controller's `sessionIds` verbatim: it reconciles them with its own persisted
 * order and promotes recently-activated sessions to the top, so the controller
 * order and the visible order can disagree. Reading the rendered order asks the
 * question the user is actually answering — "which row is above this one?" —
 * without reproducing that policy.
 *
 * The order is trusted only when the section's labels account for every row the
 * controller reports for the workspace: the same count, and the same multiset of
 * labels. That check tolerates reordering while refusing a section that is
 * showing a different set of sessions (another workspace's group, or a filtered
 * list). Anything short of that falls back to the controller order.
 * @param state - the two controller snapshots.
 * @param labels - row label text per session.
 * @param firstView - whether the workspace shows a "new session" placeholder.
 * @returns the drawn session ids per workspace.
 */
export declare function displayOrder(state: NavState, labels: LabelsBySession, firstView: readonly SessionId[]): RowsByWorkspace;
/**
 * Bring one target's row into view.
 * @param target - the resolved session target.
 * @param order - the drawn session ids of the target's workspace.
 * @param labels - row label text per session.
 */
export declare function scrollToRow(target: Target, order: readonly SessionId[], labels: LabelsBySession): void;
/** Whether the composer owned focus when the key was pressed. */
export declare function composerHadFocus(): boolean;
/**
 * Whether the composer holds no draft.
 *
 * An empty composer has nothing for an arrow key to do — there is no caret to
 * move through text — so navigation may take the key. Once a draft exists the
 * key belongs to the caret again.
 * @returns true when the composer is absent or its text is blank.
 */
export declare function composerDraftIsEmpty(): boolean;
/**
 * Put focus back into the composer.
 *
 * Only a DOM-level focus call: the composer is a `contenteditable` div, so
 * there is no selection range to restore and no draft to touch.
 */
export declare function focusComposer(): void;
