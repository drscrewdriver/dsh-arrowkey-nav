/**
 * Binding layer: one capturing keydown listener on the document.
 *
 * The listener is attached from `apply`, not from a rendered component: the two
 * facts an arrow press needs are the key itself and the current focus, and
 * neither requires a React tree. `ctx.effect` owns the listener, so unloading
 * the plugin removes it.
 */
import { execute } from './apply.ts';
import { composerDraftIsEmpty, composerHadFocus, displayOrder, focusComposer, scrollToRow } from './dom.ts';
import { COMPOSER, DELTA, EDITABLE_SELECTOR, OVERLAY_SELECTOR } from './constants.ts';
import { owningWorkspaceId, planArrow } from './navigate.ts';
import type { Plan } from './apply.ts';
import type { LabelsBySession } from './dom.ts';
import type { NavState, SessionId, Target, WorkspaceId } from './navigate.ts';

/**
 * Whether a keydown belongs to somebody else.
 *
 * Arrow keys are how the composer moves its caret, how a dialog moves between
 * its buttons, and how an open menu moves through its items, so the plugin
 * stays out of the way when any of those owns the event.
 *
 * The composer is the one conditional case: an empty draft has no caret to
 * move, so the key is free and navigation may take it. A draft with text keeps
 * its arrow keys — that is the difference between "I am writing" and "I am
 * browsing". Every other editable surface (the sidebar's session search, a
 * rename field) always keeps its keys.
 *
 * A modifier means the user asked for something else, and an event already
 * handled upstream has a decision attached that must not be overridden.
 * @param event - the keydown event.
 * @returns true when the plugin must not act on this event.
 */
export function shouldIgnore(event: KeyboardEvent): boolean {
  return decideIgnore(event).ignore;
}

/**
 * Decide one keydown: whether to leave it alone, and what that decision was.
 * One traversal serves both the guard and its diagnostic, so a press never pays
 * for the DOM twice.
 * @param event - the keydown event.
 * @returns the decision and, when ignored, the reason in plain words.
 */
function decideIgnore(event: KeyboardEvent): { ignore: boolean; reason?: string } {
  if (event.defaultPrevented) return { ignore: true, reason: 'already handled upstream' };
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return { ignore: true, reason: 'modifier held' };
  }
  if (event.isComposing === true) return { ignore: true, reason: 'IME composing' };

  const target = event.target;
  const element = target !== null && typeof target === 'object' ? (target as Element) : null;
  if (element === null || typeof element.closest !== 'function') return { ignore: false };
  try {
    // Falsy rather than `!== null`: a real `closest` returns `Element | null`,
    // and treating any other empty result as a match would misroute the key.
    if (element.closest(OVERLAY_SELECTOR)) {
      return { ignore: true, reason: 'focus is in a dialog or menu' };
    }
    if (!element.closest(EDITABLE_SELECTOR)) return { ignore: false };
    if (!element.closest(COMPOSER)) {
      return { ignore: true, reason: 'focus is in an editable surface' };
    }
    // The composer itself yields its arrow keys only while its draft is empty.
    return composerDraftIsEmpty()
      ? { ignore: false }
      : { ignore: true, reason: 'composer holds a draft' };
  } catch {
    // An unexpected node shape is not a reason to move the user's selection.
    return { ignore: true, reason: 'target shape was unexpected' };
  }
}

/** Read the two snapshots the navigation layer resolves against. */
export function readNavState(plan: Plan): NavState {
  const workspaces = plan.workspaces.list.getSnapshot();
  return {
    items: workspaces.items,
    archivedSessionIds: workspaces.archivedSessionIds,
    list: plan.sessions.list.getSnapshot(),
  };
}

/** Row label text per session, used to bind a drawn section to its rows. */
export function rowLabels(state: NavState): LabelsBySession {
  const labels: LabelsBySession = new Map();
  for (const workspace of state.items) {
    for (const id of workspace.sessionIds) {
      const summary = state.list.byId[id];
      if (summary === undefined) continue;
      labels.set(id, summary.displayTitle);
    }
  }
  return labels;
}

/**
 * The blank placeholders currently visible anywhere.
 *
 * The shared visibility rule draws only the selected one; the sidebar's own
 * grouping admits the blank of whichever workspace it belongs to, so the drawn
 * order needs the wider set to compare against a rendered section honestly.
 */
export function visiblePlaceholders(state: NavState): SessionId[] {
  const placeholders: SessionId[] = [];
  for (const workspace of state.items) {
    for (const id of workspace.sessionIds) {
      const summary = state.list.byId[id];
      if (summary?.blank !== true) continue;
      if (state.archivedSessionIds.includes(id)) continue;
      placeholders.push(id);
    }
  }
  return placeholders;
}

/**
 * One arrow key, end to end.
 *
 * Returning false means the event was left untouched: the key was irrelevant,
 * or the move it implied was a no-op, so nothing is consumed.
 * @param plan - the three service faces.
 * @param event - the keydown event.
 * @param trace - optional report of what was decided, for diagnosing a press
 *   that does nothing. Only arrow keys reach it.
 * @returns true when the plugin acted on the event.
 */
export function handleArrowKey(
  plan: Plan,
  event: KeyboardEvent,
  trace?: (message: string, detail: unknown) => void,
): boolean {
  if (DELTA[event.key] === undefined) return false;

  // A build without one of the two snapshots (an unexpected DSH generation) is
  // inert rather than broken: the listener stays attached, every press is
  // reported and ignored, and nothing throws.
  if (plan.sessions === undefined || plan.workspaces === undefined) {
    trace?.('services missing', {
      key: event.key,
      sessions: plan.sessions !== undefined,
      workspaces: plan.workspaces !== undefined,
    });
    return false;
  }

  const decision = decideIgnore(event);
  if (decision.ignore) {
    trace?.('ignored', { key: event.key, reason: decision.reason });
    return false;
  }

  const state = readNavState(plan);
  const labels = rowLabels(state);
  const drawn = displayOrder(state, labels, visiblePlaceholders(state));
  const owner = owningWorkspaceId(state.items, state.list.current);
  const order = owner === undefined ? undefined : drawn.get(owner);
  const target = planArrow(event.key, state, order);
  if (target === null) {
    trace?.('no target', {
      key: event.key,
      current: state.list.current,
      owner,
      orderFromDom: order !== undefined,
      rowsInOwner: order?.length
        ?? (owner === undefined ? undefined : rowsOf(state, owner).length),
      workspaces: state.items.length,
    });
    return false;
  }

  event.preventDefault();
  trace?.('navigating', { ...target, orderFromDom: order !== undefined });
  // Focus intent is read at press time: only a press that started in the
  // composer puts focus back, so the sidebar's search box and open dialogs
  // keep the focus they had.
  const restoreFocus = composerHadFocus();
  execute(plan, target);

  const targetOrder = planOrder(plan, target, labels);
  requestAnimationFrame(() => {
    // React has committed the new selection by now, so the target row exists.
    scrollToRow(target, targetOrder, labels);
    if (!restoreFocus) return;
    requestAnimationFrame(() => { focusComposer(); });
  });
  return true;
}

/**
 * The drawn order to scroll against after the switch.
 *
 * The selection moved, so the freshly rendered order can differ from the one
 * the key was resolved against — a promoted session lands on top. Re-reading is
 * cheap and keeps the scroll on the row the user is about to look at.
 * @param plan - the three service faces.
 * @param target - where the switch went.
 * @param labels - row label text per session.
 * @returns the target workspace's drawn order, or its controller order as a fallback.
 */
function planOrder(plan: Plan, target: Target, labels: LabelsBySession): readonly SessionId[] {
  const owner = target.kind === 'session' ? target.workspaceId : undefined;
  if (owner === undefined) return [];
  const next = readNavState(plan);
  const fresh = displayOrder(next, labels, visiblePlaceholders(next)).get(owner);
  return fresh ?? rowsOf(next, owner);
}

/** The controller-order rows of one workspace, including its blank placeholder. */
function rowsOf(state: NavState, workspaceId: WorkspaceId): SessionId[] {
  const workspace = state.items.find(item => item.workspaceId === workspaceId);
  if (workspace === undefined) return [];
  const placeholders = new Set(visiblePlaceholders(state));
  const archived = new Set(state.archivedSessionIds);
  return workspace.sessionIds.filter((id) => {
    const summary = state.list.byId[id];
    if (summary === undefined) return false;
    if (summary.origin === 'subagent') return false;
    if (archived.has(id)) return false;
    if (summary.blank === true && !placeholders.has(id)) return false;
    return true;
  });
}
