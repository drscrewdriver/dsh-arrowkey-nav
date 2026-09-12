/**
 * Display-order tests: arrow keys must follow the order the sidebar draws.
 *
 * The sidebar does not render the controller's `sessionIds` verbatim. It
 * reconciles them with its own persisted order and promotes recently-active
 * sessions to the top, so the two disagree in exactly the case a user notices —
 * the session they just activated. These tests pin that the drawn order wins,
 * and that a section which does not account for the workspace's rows is refused
 * rather than trusted.
 *
 * The doubles mirror the two real contracts they stand in for: a real
 * `Element.closest` returns an `Element` or `null` and splits its selector list,
 * and `querySelectorAll` matches only what the selector asks for.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { displayOrder } from '../src/client/dom.ts';
import type { NavState, SessionSummary, WorkspaceView } from '../src/client/navigate.ts';

/** The selectors the DOM layer queries with. */
const TREE_SELECTOR = '[data-slot="sidebar.workspaces"] [role="tree"]';
const ROW_SELECTOR = 'div[role="treeitem"][aria-selected]';

/** Build a session summary. */
function summary(id: string, extra: Partial<SessionSummary> = {}): SessionSummary {
  return { id, displayTitle: id, updatedAt: 0, ...extra };
}

/** Build a workspace row. */
function workspace(workspaceId: string, sessionIds: string[]): WorkspaceView {
  return { workspaceId, path: `E:\\${workspaceId}`, sessionIds };
}

/** Build the controller state: the list snapshot is keyed by session id. */
function state(items: WorkspaceView[], sessions: SessionSummary[], current?: string): NavState {
  const byId: Record<string, SessionSummary> = {};
  for (const s of sessions) byId[s.id] = s;
  return { items, archivedSessionIds: [], list: { current, phase: 'ready', byId } };
}

/**
 * A row element: carries a `_title` child whose text is the label.
 * @param label - the text the sidebar draws for this session.
 */
function row(label: string): Element {
  const title = { textContent: label };
  return {
    textContent: label,
    querySelector: (selector: string) => (selector === '[class*="_title"]' ? title : null),
  } as unknown as Element;
}

/** A group section holding the given row labels in the given order. */
function section(labels: readonly string[]): Element {
  const rows = labels.map(row);
  return {
    children: rows,
    querySelectorAll: (selector: string) => (selector === ROW_SELECTOR ? rows : []),
  } as unknown as Element;
}

/** Install a sidebar scroller whose group sections are the given sections. */
function withSidebar(sections: readonly Element[], run: () => void): void {
  const scroller = { children: sections };
  const previous = (globalThis as { document?: unknown }).document;
  (globalThis as { document?: unknown }).document = {
    querySelector: (selector: string) => (selector === TREE_SELECTOR ? scroller : null),
  };
  try {
    run();
  } finally {
    (globalThis as { document?: unknown }).document = previous;
  }
}

/** Labels for a set of sessions, keyed by id. */
function labelsOf(sessions: readonly SessionSummary[]): Map<string, string> {
  return new Map(sessions.map(s => [s.displayTitle, s.displayTitle]));
}

test('the drawn order wins over the controller order', () => {
  // The controller lists oldest-first; the sidebar draws the promoted session on
  // top. Arrow keys must follow what the user sees.
  const sessions = ['a', 'b', 'c'].map(id => summary(id));
  const state2 = state([workspace('w-a', ['a', 'b', 'c'])], sessions, 'c');
  withSidebar([section(['c', 'a', 'b'])], () => {
    const order = displayOrder(state2, labelsOf(sessions), []);
    assert.deepEqual(order.get('w-a'), ['c', 'a', 'b']);
  });
});

test('the controller order is followed when nothing was reordered', () => {
  const sessions = ['a', 'b', 'c'].map(id => summary(id));
  const state2 = state([workspace('w-a', ['a', 'b', 'c'])], sessions, 'a');
  withSidebar([section(['a', 'b', 'c'])], () => {
    assert.deepEqual(displayOrder(state2, labelsOf(sessions), []).get('w-a'), ['a', 'b', 'c']);
  });
});

test('a section showing a different set of rows is refused', () => {
  // w-b's rows are not drawn by any section, so it gets no drawn order and the
  // controller order stands in for it.
  const sessions = ['a', 'b', 'x'].map(id => summary(id));
  const state2 = state([workspace('w-a', ['a', 'b']), workspace('w-b', ['x'])], sessions, 'a');
  withSidebar([section(['b', 'a'])], () => {
    const order = displayOrder(state2, labelsOf(sessions), []);
    assert.deepEqual(order.get('w-a'), ['b', 'a']);
    assert.equal(order.get('w-b'), undefined);
  });
});

test('two sections accounting for the same rows resolve to neither', () => {
  // Ambiguous: refusing to guess is the point, so the caller falls back.
  const sessions = ['a', 'b'].map(id => summary(id));
  const state2 = state([workspace('w-a', ['a', 'b'])], sessions, 'a');
  withSidebar([section(['a', 'b']), section(['b', 'a'])], () => {
    assert.equal(displayOrder(state2, labelsOf(sessions), []).get('w-a'), undefined);
  });
});

test('an ambiguous pair of sections yields no order for either', () => {
  // Both workspaces draw the same labels; only one section matches each, so the
  // match is unique per workspace and both resolve.
  const sessions = ['a', 'b'].map(id => summary(id));
  const state2 = state([workspace('w-a', ['a']), workspace('w-b', ['b'])], sessions, 'a');
  withSidebar([section(['b']), section(['a'])], () => {
    const order = displayOrder(state2, labelsOf(sessions), []);
    assert.deepEqual(order.get('w-a'), ['a']);
    assert.deepEqual(order.get('w-b'), ['b']);
  });
});

test('duplicate titles resolve to distinct sessions in drawn order', () => {
  const sessions = [
    summary('s-1', { displayTitle: 'same' }),
    summary('s-2', { displayTitle: 'same' }),
  ];
  const state2 = state([workspace('w-a', ['s-1', 's-2'])], sessions, 's-1');
  const labels = new Map([['s-1', 'same'], ['s-2', 'same']]);
  withSidebar([section(['same', 'same'])], () => {
    // Both rows are accounted for, and the drawn order maps one-to-one.
    assert.deepEqual(displayOrder(state2, labels, []).get('w-a'), ['s-1', 's-2']);
  });
});

test('a selected blank placeholder counts as a drawn row', () => {
  const sessions = [summary('blank', { blank: true }), summary('a')];
  const state2 = state([workspace('w-a', ['blank', 'a'])], sessions, 'blank');
  withSidebar([section(['blank', 'a'])], () => {
    assert.deepEqual(displayOrder(state2, labelsOf(sessions), ['blank']).get('w-a'), ['blank', 'a']);
  });
});

test('a blank the sidebar does not draw is excluded from the comparison', () => {
  // Not selected and not listed as visible: the expected rows drop it, so the
  // section still accounts for the workspace.
  const sessions = [summary('blank', { blank: true }), summary('a')];
  const state2 = state([workspace('w-a', ['blank', 'a'])], sessions, 'a');
  withSidebar([section(['a'])], () => {
    assert.deepEqual(displayOrder(state2, labelsOf(sessions), []).get('w-a'), ['a']);
  });
});

test('archived and subagent rows are excluded before comparing', () => {
  const sessions = [
    summary('a'),
    summary('gone'),
    summary('child', { origin: 'subagent' }),
  ];
  const state2: NavState = {
    items: [workspace('w-a', ['a', 'gone', 'child'])],
    archivedSessionIds: ['gone'],
    list: { current: 'a', phase: 'ready', byId: Object.fromEntries(sessions.map(s => [s.displayTitle, s])) },
  };
  withSidebar([section(['a'])], () => {
    assert.deepEqual(displayOrder(state2, labelsOf(sessions), []).get('w-a'), ['a']);
  });
});

test('no sidebar tree yields no drawn order', () => {
  const sessions = [summary('a')];
  const state2 = state([workspace('w-a', ['a'])], sessions, 'a');
  const previous = (globalThis as { document?: unknown }).document;
  (globalThis as { document?: unknown }).document = { querySelector: () => null };
  try {
    assert.equal(displayOrder(state2, labelsOf(sessions), []).size, 0);
  } finally {
    (globalThis as { document?: unknown }).document = previous;
  }
});
