/**
 * DOM layer: read-only lookups with a single write — bringing the target row
 * into view. Rows carry no identity attributes (no `data-*`, no `id`), so the
 * DOM is never asked "which session is this"; identity comes from the
 * controller snapshots and the DOM is addressed positionally.
 *
 * Every lookup is total: a missing anchor, a collapsed group, a rail-collapsed
 * sidebar, or an ambiguous binding all resolve to "no scroll", never to a guess.
 */
import { COMPOSER, ROW, SIDEBAR_SCOPE, TREE } from './constants.ts';
import type { NavState, SessionId, Target, WorkspaceId, WorkspaceView } from './navigate.ts';

/** One workspace's visible session rows, in the order the sidebar draws them. */
export type RowsByWorkspace = Map<WorkspaceId, readonly SessionId[]>;

/** Row label text per session, used to bind a DOM section to a workspace. */
export type LabelsBySession = Map<SessionId, string>;

/** The sidebar's scrolling element, or null when the tree is not mounted. */
export function sidebarScroller(): Element | null {
  try {
    return document.querySelector(`${SIDEBAR_SCOPE} ${TREE}`);
  } catch {
    // A malformed selector or a detached document is not worth a failure here.
    return null;
  }
}

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
export function displayOrder(
  state: NavState,
  labels: LabelsBySession,
  firstView: readonly SessionId[],
): RowsByWorkspace {
  const drawn: RowsByWorkspace = new Map();
  const scroller = sidebarScroller();
  if (scroller === null) return drawn;
  // A scroller that is not the tree this plugin expects must degrade to the
  // controller order, never fail the key press: one malformed lookup here would
  // otherwise disable every arrow key at once.
  let sections: Element[];
  try {
    sections = groupSections(scroller);
  } catch {
    return drawn;
  }

  for (const workspace of state.items) {
    const expected = controllerRows(workspace, state, firstView);
    if (expected.length === 0) continue;
    try {
      const match = sections.filter(candidate => accountsFor(drawnLabels(candidate), expected, labels));
      if (match.length !== 1) continue;
      const resolved = resolveLabels(drawnLabels(match[0] ?? scroller), expected, labels);
      if (resolved.length === expected.length) drawn.set(workspace.workspaceId, resolved);
    } catch {
      // One unreadable section keeps that workspace on the controller order.
      continue;
    }
  }
  return drawn;
}

/**
 * The rows the controller says belong to a workspace, including the selected
 * blank placeholder when the workspace holds one.
 *
 * A blank placeholder is drawn only while it is selected, which makes the
 * shared `visibleRows` predicated on the currently selected session alone; the
 * sidebar's own grouping admits a blank of any workspace. Widening it here keeps
 * the comparison against a rendered section honest.
 * @param workspace - workspace whose rows are listed.
 * @param state - the two controller snapshots.
 * @param firstView - blank placeholders visible across all workspaces.
 * @returns session ids in controller order.
 */
function controllerRows(
  workspace: WorkspaceView,
  state: NavState,
  firstView: readonly SessionId[],
): SessionId[] {
  const archived = new Set(state.archivedSessionIds);
  const placeholders = new Set(firstView);
  const rows: SessionId[] = [];
  for (const id of workspace.sessionIds) {
    const summary = state.list.byId[id];
    if (summary === undefined) continue;
    if (summary.origin === 'subagent') continue;
    if (archived.has(id)) continue;
    if (summary.blank === true && !placeholders.has(id)) continue;
    rows.push(id);
  }
  return rows;
}

/** Whether a section's drawn labels account for exactly the expected rows. */
function accountsFor(
  actual: readonly string[],
  expected: readonly SessionId[],
  labels: LabelsBySession,
): boolean {
  const wanted = expected.map(id => labels.get(id));
  if (wanted.some(label => label === undefined)) return false;
  const remaining = [...wanted].sort();
  const drawn = [...actual].sort();
  if (remaining.length !== drawn.length) return false;
  return remaining.every((label, index) => label === drawn[index]);
}

/**
 * Map a section's drawn rows back to session ids.
 *
 * Labels are matched in order, each label consumed once, so duplicated titles
 * resolve to distinct sessions rather than collapsing onto one.
 */
function resolveLabels(
  actual: readonly string[],
  expected: readonly SessionId[],
  labels: LabelsBySession,
): SessionId[] {
  const available = new Map<string, SessionId[]>();
  for (const id of expected) {
    const label = labels.get(id);
    if (label === undefined) continue;
    const bucket = available.get(label);
    if (bucket === undefined) available.set(label, [id]);
    else bucket.push(id);
  }
  const resolved: SessionId[] = [];
  for (const label of actual) {
    const bucket = available.get(label);
    const id = bucket?.shift();
    if (id === undefined) return [];
    resolved.push(id);
  }
  return resolved;
}

/**
 * Bring one target's row into view.
 * @param target - the resolved session target.
 * @param order - the drawn session ids of the target's workspace.
 * @param labels - row label text per session.
 */
export function scrollToRow(
  target: Target,
  order: readonly SessionId[],
  labels: LabelsBySession,
): void {
  if (target.kind !== 'session') return;
  try {
    const section = sectionFor(order, labels);
    if (section === null) return;
    const row = Array.from(section.querySelectorAll(ROW))[target.rowIndex];
    if (row === undefined || typeof row.scrollIntoView !== 'function') return;
    row.scrollIntoView({ block: 'nearest' });
  } catch {
    // Scrolling is a courtesy; the selection has already moved.
  }
}

/**
 * The group section drawing exactly the given rows.
 * @param expected - session ids the workspace should be drawing.
 * @param labels - row label text per session.
 * @returns the section, or null when none accounts for the rows or several do.
 */
function sectionFor(expected: readonly SessionId[], labels: LabelsBySession): Element | null {
  if (expected.length === 0) return null;
  const scroller = sidebarScroller();
  if (scroller === null) return null;
  const matches = groupSections(scroller)
    .filter(candidate => accountsFor(drawnLabels(candidate), expected, labels));
  return matches.length === 1 ? matches[0] ?? null : null;
}

/** The group sections of the sidebar tree, in document order. */
function groupSections(scroller: Element): Element[] {
  return Array.from(scroller.children);
}

/** Whether the composer owned focus when the key was pressed. */
export function composerHadFocus(): boolean {
  try {
    const active = document.activeElement;
    if (active === null) return false;
    return active.closest(COMPOSER) !== null;
  } catch {
    return false;
  }
}

/**
 * Whether the composer holds no draft.
 *
 * An empty composer has nothing for an arrow key to do — there is no caret to
 * move through text — so navigation may take the key. Once a draft exists the
 * key belongs to the caret again.
 * @returns true when the composer is absent or its text is blank.
 */
export function composerDraftIsEmpty(): boolean {
  try {
    const composer = document.querySelector(COMPOSER);
    if (composer === null) return true;
    return String(composer.textContent ?? '').trim() === '';
  } catch {
    // Unknown state: leave the key with the composer rather than navigate.
    return false;
  }
}

/**
 * Put focus back into the composer.
 *
 * Only a DOM-level focus call: the composer is a `contenteditable` div, so
 * there is no selection range to restore and no draft to touch.
 */
export function focusComposer(): void {
  try {
    // `document.querySelector` is typed as `Element`; focus lives on
    // `HTMLElement`, so the narrowing is asserted here and re-checked at runtime
    // rather than trusting an unchecked cast with an `any`.
    const composer = document.querySelector(COMPOSER) as HTMLElement | null;
    if (composer === null) return;
    if (typeof composer.focus !== 'function') return;
    composer.focus({ preventScroll: true });
  } catch {
    // Losing focus is recoverable by clicking; never break the key handler.
  }
}

/** The label text drawn for each row element in one section. */
function drawnLabels(section: Element): string[] {
  return Array.from(section.querySelectorAll(ROW)).map((row) => {
    const title = row.querySelector('[class*="_title"]');
    return labelText(title ?? row);
  });
}

/** Normalize element text for label comparison. */
function labelText(element: Element): string {
  return String(element.textContent ?? '').replace(/\s+/g, ' ').trim();
}
