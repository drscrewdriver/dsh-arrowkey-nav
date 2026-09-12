/**
 * Pure-logic tests for the navigation narrow waist. No DOM: the resolver takes
 * snapshots, so its whole decision surface is reachable from plain objects.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newestOf, owningWorkspaceId, planArrow, visibleRows } from '../src/client/navigate.ts';
import type { SessionId, SessionSummary, WorkspaceView } from '../src/client/navigate.ts';

/** Build a session summary with the fields the resolver reads. */
function summary(id: string, extra: Partial<SessionSummary> = {}): SessionSummary {
  return { displayTitle: id, updatedAt: 0, ...extra };
}

/** Build a workspace row with the fields the resolver reads. */
function workspace(workspaceId: string, sessionIds: string[], path = `E:\\${workspaceId}`): WorkspaceView {
  return { workspaceId, path, sessionIds };
}

/** Build the state the resolver reads. */
function state(
  items: WorkspaceView[],
  sessions: SessionSummary[],
  current?: SessionId,
  archivedSessionIds: SessionId[] = [],
) {
  const byId: Record<SessionId, SessionSummary> = {};
  for (const s of sessions) byId[s.displayTitle] = s;
  return {
    items,
    archivedSessionIds,
    list: { current, phase: 'ready', byId },
  };
}

const WS_A = workspace('w-a', ['s-1', 's-2', 's-3']);
const WS_B = workspace('w-b', ['s-4']);
const WS_C = workspace('w-c', ['s-5', 's-6']);
const THREE = [WS_A, WS_B, WS_C];
const SIX = ['s-1', 's-2', 's-3', 's-4', 's-5', 's-6'].map(id => summary(id));

test('owningWorkspaceId mirrors the browser grouping rule', () => {
  assert.equal(owningWorkspaceId(THREE, 's-2'), 'w-a');
  assert.equal(owningWorkspaceId(THREE, 's-4'), 'w-b');
  assert.equal(owningWorkspaceId(THREE, 'ghost'), undefined);
  assert.equal(owningWorkspaceId(THREE, undefined), undefined);
});

test('owningWorkspaceId returns the first owning workspace', () => {
  const duplicate = workspace('w-dup', ['s-2']);
  assert.equal(owningWorkspaceId([...THREE, duplicate], 's-2'), 'w-a');
});

test('visibleRows drops subagents, archived rows and foreign blanks', () => {
  const s = state([
    workspace('w-a', ['s-1', 's-2', 's-3', 's-x']),
  ], [
    summary('s-1', { blank: true }),
    summary('s-2'),
    summary('s-3', { origin: 'subagent' }),
    summary('s-x'),
  ], 's-9', ['s-x']);
  assert.deepEqual(visibleRows(workspace('w-a', ['s-1', 's-2', 's-3', 's-x']), s), ['s-2']);
});

test('visibleRows keeps the selected blank placeholder', () => {
  const rows = ['blank'];
  const s = state([workspace('w-a', rows)], [summary('blank', { blank: true })], 'blank');
  assert.deepEqual(visibleRows(workspace('w-a', rows), s), ['blank']);
});

test('visibleRows tolerates an accounted id whose summary has not arrived', () => {
  const s = state([workspace('w-a', ['s-2', 'not-pulled'])], [summary('s-2')]);
  assert.deepEqual(visibleRows(workspace('w-a', ['s-2', 'not-pulled']), s), ['s-2']);
});

test('newestOf picks the most recently updated row', () => {
  const s = state(
    [workspace('w-a', ['a', 'b', 'c'])],
    [summary('a', { updatedAt: 10 }), summary('b', { updatedAt: 99 }), summary('c', { updatedAt: 50 })],
  );
  assert.equal(newestOf(['a', 'b', 'c'], s), 'b');
  assert.equal(newestOf([], s), undefined);
  assert.equal(newestOf(['missing'], s), undefined);
});

test('ArrowDown and ArrowUp move inside the current workspace only', () => {
  const s = state(THREE, SIX, 's-2');
  assert.deepEqual(planArrow('ArrowDown', s), {
    kind: 'session', sessionId: 's-3', rowIndex: 2, workspaceId: 'w-a',
  });
  assert.deepEqual(planArrow('ArrowUp', s), {
    kind: 'session', sessionId: 's-1', rowIndex: 0, workspaceId: 'w-a',
  });
});

test('ArrowDown wraps at the end of the workspace instead of crossing over', () => {
  const s = state(THREE, SIX, 's-3');
  assert.deepEqual(planArrow('ArrowDown', s), {
    kind: 'session', sessionId: 's-1', rowIndex: 0, workspaceId: 'w-a',
  });
});

test('ArrowUp wraps at the start of the workspace', () => {
  const s = state(THREE, SIX, 's-1');
  assert.deepEqual(planArrow('ArrowUp', s), {
    kind: 'session', sessionId: 's-3', rowIndex: 2, workspaceId: 'w-a',
  });
});

test('ArrowUp and ArrowDown do nothing when the selection belongs to no workspace', () => {
  // Deliberate: a blank placeholder carried over from another workspace is not
  // a position inside this one, and guessing a workspace would make an arrow
  // press jump somewhere the user did not ask for.
  const s = state(
    [workspace('w-a', ['s-2', 's-3']), workspace('w-b', ['s-4'])],
    [...SIX, summary('blank-foreign', { blank: true })],
    'blank-foreign',
  );
  assert.equal(planArrow('ArrowDown', s), null);
  assert.equal(planArrow('ArrowUp', s), null);
  // The workspace order stays walkable from there.
  assert.deepEqual(planArrow('ArrowRight', s), { kind: 'workspace', workspaceId: 'w-a' });
});

test('a single-row workspace reports no move', () => {
  const s = state(THREE, SIX, 's-4');
  assert.equal(planArrow('ArrowDown', s), null);
  assert.equal(planArrow('ArrowUp', s), null);
});

test('an ungrouped current session gets no session move', () => {
  const s = state(THREE, [...SIX, summary('stray')], 'stray');
  assert.equal(planArrow('ArrowDown', s), null);
  assert.equal(planArrow('ArrowUp', s), null);
});

test('no current session gets no session move but keeps workspace movement', () => {
  const s = state(THREE, SIX, undefined);
  assert.equal(planArrow('ArrowUp', s), null);
  // With no position in the order, each key enters at the end it implies.
  assert.deepEqual(planArrow('ArrowLeft', s), { kind: 'workspace', workspaceId: 'w-c' });
  assert.deepEqual(planArrow('ArrowRight', s), { kind: 'workspace', workspaceId: 'w-a' });
});

test('ArrowRight and ArrowLeft cycle workspaces in host order', () => {
  const s = state(THREE, SIX, 's-1');
  assert.deepEqual(planArrow('ArrowRight', s), { kind: 'workspace', workspaceId: 'w-b' });
  assert.deepEqual(planArrow('ArrowLeft', s), { kind: 'workspace', workspaceId: 'w-c' });
});

test('an ungrouped current session walks the workspace order from the end the key implies', () => {
  const s = state(THREE, [...SIX, summary('stray')], 'stray');
  assert.deepEqual(planArrow('ArrowRight', s), { kind: 'workspace', workspaceId: 'w-a' });
  assert.deepEqual(planArrow('ArrowLeft', s), { kind: 'workspace', workspaceId: 'w-c' });
});

test('a single workspace has no workspace move and never targets itself', () => {
  const s = state([WS_A], SIX, 's-1');
  assert.equal(planArrow('ArrowRight', s), null);
  assert.equal(planArrow('ArrowLeft', s), null);
});

test('archived rows are skipped rather than selected', () => {
  const s = state(THREE, SIX, 's-1', ['s-2']);
  assert.deepEqual(planArrow('ArrowDown', s), {
    kind: 'session', sessionId: 's-3', rowIndex: 1, workspaceId: 'w-a',
  });
});

test('unrelated keys resolve to nothing', () => {
  const s = state(THREE, SIX, 's-1');
  for (const key of ['Enter', 'a', 'PageDown', 'ArrowRightX', 'Space']) {
    assert.equal(planArrow(key, s), null);
  }
});
