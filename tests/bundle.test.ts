/**
 * Smoke test for the built bundle: load `lib/client.js` exactly the way the
 * page does, then drive a real keydown through it against fake services.
 *
 * This covers the contract the source tests cannot: the bundle registers a
 * factory under the package id, its `apply` is callable, and the listener it
 * installs actually reaches `sessions.open`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const bundle = await readFile(join(root, 'lib', 'client.js'), 'utf8');

/** Minimal document double that records listeners and dispatches keydowns. */
function fakeDocument() {
  const listeners = [];
  const doc = {
    listeners,
    activeElement: null,
    composerText: '',
    addEventListener(type, handler, capture) { listeners.push({ type, handler, capture }); },
    removeEventListener(type, handler) {
      const i = listeners.findIndex(e => e.handler === handler);
      if (i >= 0) listeners.splice(i, 1);
    },
    querySelector() { return doc.composer; },
    /** The composer double: an editable surface carrying the composer anchor. */
    composer: {
      get textContent() { return doc.composerText; },
      closest: (selector) =>
        (selector.split(', ').some(part => part === '[contenteditable="true"]' || part === '[data-composer-input]')
          ? {}
          : null),
    },
    /** Deliver one keydown to every registered listener. */
    keydown(key, extra = {}) {
      const event = {
        key,
        target: null,
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        ...extra,
      };
      for (const entry of [...listeners]) entry.handler(event);
      return event;
    },
  };
  return doc;
}

/** Load the bundle and return the exports its factory registered. */
function loadBundle(doc) {
  const registrations = [];
  globalThis.window = {
    __ModuleLoader__: {
      load(registration) { registrations.push(registration); },
    },
  };
  globalThis.document = doc;
  globalThis.requestAnimationFrame = () => 0;
  // eslint-disable-next-line no-new-func -- the bundle is a script, by contract.
  new Function(bundle)();
  const registration = registrations[0];
  return { id: registration.id, exports: registration.factory(() => { throw new Error('no require'); }) };
}

/** Build the two service faces the plugin reads. */
function services() {
  const calls = [];
  // Keyed by session id, as the real list snapshot is, and every row carries the
  // identity the drawn-order lookup reads.
  const byId = {
    's-1': { id: 's-1', displayTitle: 'one', updatedAt: 0 },
    's-2': { id: 's-2', displayTitle: 'two', updatedAt: 0 },
    's-3': { id: 's-3', displayTitle: 'three', updatedAt: 0 },
    's-4': { id: 's-4', displayTitle: 'four', updatedAt: 0 },
  };
  const list = { current: 's-2', phase: 'ready', byId };
  const items = [
    { workspaceId: 'w-a', path: 'E:\\a', sessionIds: ['s-1', 's-2', 's-3'] },
    { workspaceId: 'w-b', path: 'E:\\b', sessionIds: ['s-4'] },
  ];
  return {
    calls,
    list,
    sessions: {
      list: { getSnapshot: () => list },
      open: (id) => { calls.push(['open', id]); list.current = id; },
    },
    workspaces: {
      list: { getSnapshot: () => ({ items, archivedSessionIds: [], phase: 'ready' }) },
    },
    uiWorkspace: {
      connectWorkspace: (workspaceId) => { calls.push(['connect', workspaceId]); return Promise.resolve('created'); },
    },
  };
}

/** Attach the bundle's plugin to a fake context. */
function mount(doc, s) {
  const disposers = [];
  const ctx = {
    sessions: s.sessions,
    workspaces: s.workspaces,
    uiWorkspace: s.uiWorkspace,
    effect: (factory) => { const d = factory(); disposers.push(d); return d; },
  };
  const { id, exports } = loadBundle(doc);
  exports.apply(ctx);
  return { id, inject: exports.inject, disposers };
}

test('the bundle registers the documented factory contract', () => {
  const { id, inject } = mount(fakeDocument(), services());
  assert.equal(id, 'dsh-arrowkey-nav');
  assert.deepEqual(inject, ['sessions', 'workspaces', 'uiWorkspace']);
});

test('apply installs exactly one capturing keydown listener', () => {
  const doc = fakeDocument();
  mount(doc, services());
  assert.equal(doc.listeners.length, 1);
  assert.equal(doc.listeners[0].type, 'keydown');
  assert.equal(doc.listeners[0].capture, true);
});

test('the disposer removes the listener', () => {
  const doc = fakeDocument();
  const { disposers } = mount(doc, services());
  for (const dispose of disposers) dispose();
  assert.equal(doc.listeners.length, 0);
});

test('ArrowDown opens the next session in the current workspace', () => {
  const doc = fakeDocument();
  const s = services();
  mount(doc, s);
  const event = doc.keydown('ArrowDown');
  assert.deepEqual(s.calls, [['open', 's-3']]);
  assert.equal(event.defaultPrevented, true);
});

test('ArrowUp opens the previous session and wraps at the start', () => {
  const doc = fakeDocument();
  const s = services();
  s.list.current = 's-1';
  mount(doc, s);
  doc.keydown('ArrowUp');
  assert.deepEqual(s.calls, [['open', 's-3']]);
});

test('ArrowRight enters the next workspace through its session', () => {
  const doc = fakeDocument();
  const s = services();
  mount(doc, s);
  doc.keydown('ArrowRight');
  assert.deepEqual(s.calls, [['open', 's-4']]);
});

test('a no-op move consumes nothing', () => {
  const doc = fakeDocument();
  const s = services();
  s.list.current = 's-4';
  mount(doc, s);
  const event = doc.keydown('ArrowDown');
  assert.deepEqual(s.calls, []);
  assert.equal(event.defaultPrevented, false);
});

test('modified arrows are left to the browser', () => {
  const doc = fakeDocument();
  const s = services();
  mount(doc, s);
  for (const modifier of ['ctrlKey', 'altKey', 'metaKey', 'shiftKey']) {
    doc.keydown('ArrowDown', { [modifier]: true });
  }
  assert.deepEqual(s.calls, []);
});

test('a keydown from a non-composer editable surface is ignored', () => {
  const doc = fakeDocument();
  const s = services();
  mount(doc, s);
  // The sidebar's session search: editable, but not the composer.
  const search = { closest: (sel) => (sel.split(', ').includes('input') ? {} : null) };
  doc.keydown('ArrowDown', { target: search });
  assert.deepEqual(s.calls, []);
});

test('an empty composer yields its arrow keys, so navigation happens', () => {
  const doc = fakeDocument();
  const s = services();
  doc.composerText = '';
  mount(doc, s);
  doc.keydown('ArrowDown', { target: doc.composer });
  assert.deepEqual(s.calls, [['open', 's-3']]);
});

test('a composer holding a draft keeps its arrow keys', () => {
  const doc = fakeDocument();
  const s = services();
  doc.composerText = 'a half-written prompt';
  mount(doc, s);
  doc.keydown('ArrowDown', { target: doc.composer });
  assert.deepEqual(s.calls, []);
});

test('an already-handled event is ignored', () => {
  const doc = fakeDocument();
  const s = services();
  mount(doc, s);
  doc.keydown('ArrowDown', { defaultPrevented: true });
  assert.deepEqual(s.calls, []);
});

test('a throwing snapshot does not escape the listener', () => {
  const doc = fakeDocument();
  const s = services();
  const original = s.sessions.list.getSnapshot;
  let calls = 0;
  s.sessions.list.getSnapshot = () => {
    calls += 1;
    if (calls === 1) throw new Error('snapshot exploded');
    return original();
  };
  mount(doc, s);
  assert.doesNotThrow(() => { doc.keydown('ArrowDown'); });
});
