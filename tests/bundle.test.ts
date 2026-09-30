/**
 * Smoke test for the built bundle: load `lib/client.js` exactly the way the
 * page does, then drive a real keydown through it against fake services.
 *
 * This covers the contract the source tests cannot: the bundle registers a
 * factory under the package id, its `apply` is callable, and the listener it
 * installs actually reaches `uiWorkspace.openSession`.
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
  // The bundle is a script, by contract — it must evaluate as a global script.
  new Function(bundle)();
  const registration = registrations[0];
  return { id: registration.id, exports: registration.factory(() => { throw new Error('no require'); }) };
}

/** Build the service faces the plugin reads, in the real host shape. */
function services() {
  const calls = [];
  // Host-shape rows: every summary carries `retainedBy`, and exactly one row
  // has `mainView > 0` — that is how the host marks the selected session. The
  // list snapshot has NO `current` field; the plugin must derive it.
  const byId = {
    's-1': { id: 's-1', displayTitle: 'one', updatedAt: 0, retainedBy: {} },
    's-2': { id: 's-2', displayTitle: 'two', updatedAt: 0, retainedBy: { mainView: 1 } },
    's-3': { id: 's-3', displayTitle: 'three', updatedAt: 0, retainedBy: {} },
    's-4': { id: 's-4', displayTitle: 'four', updatedAt: 0, retainedBy: {} },
  };
  const list = { ids: ['s-1', 's-2', 's-3', 's-4'], phase: 'ready', byId };
  const items = [
    { workspaceId: 'w-a', path: 'E:\\a', sessionIds: ['s-1', 's-2', 's-3'] },
    { workspaceId: 'w-b', path: 'E:\\b', sessionIds: ['s-4'] },
  ];
  /**
   * Mirror `uiWorkspace.replaceMain`: release the previous mainView retention
   * and retain the new one, synchronously, so the next press derives the new
   * current exactly as it does against the real host.
   */
  function selectMainView(id) {
    for (const key of Object.keys(byId)) {
      byId[key] = { ...byId[key], retainedBy: key === id ? { mainView: 1 } : {} };
    }
  }
  return {
    calls,
    byId,
    list,
    selectMainView,
    sessions: {
      list: { getSnapshot: () => list },
      // NB: no `open` — ISessions has not had one since the 0.1.7/0.2.0 break.
    },
    workspaces: {
      list: { getSnapshot: () => ({ items, archivedSessionIds: [], phase: 'ready' }) },
    },
    uiWorkspace: {
      openSession: (target) => { calls.push(['openSession', target]); selectMainView(target); },
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
  assert.deepEqual(s.calls, [['openSession', 's-3']]);
  assert.equal(event.defaultPrevented, true);
});

test('ArrowUp opens the previous session and wraps at the start', () => {
  const doc = fakeDocument();
  const s = services();
  s.selectMainView('s-1');
  mount(doc, s);
  doc.keydown('ArrowUp');
  assert.deepEqual(s.calls, [['openSession', 's-3']]);
});

test('ArrowRight enters the next workspace through its session', () => {
  const doc = fakeDocument();
  const s = services();
  mount(doc, s);
  doc.keydown('ArrowRight');
  assert.deepEqual(s.calls, [['openSession', 's-4']]);
});

test('a no-op move consumes nothing', () => {
  const doc = fakeDocument();
  const s = services();
  s.selectMainView('s-4');
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
  assert.deepEqual(s.calls, [['openSession', 's-3']]);
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

test('no mainView-retained row degrades to no session move but keeps workspace walk', () => {
  const doc = fakeDocument();
  const s = services();
  // Zero current: the host has nothing retained by the main view.
  for (const key of Object.keys(s.byId)) s.byId[key] = { ...s.byId[key], retainedBy: {} };
  mount(doc, s);
  const down = doc.keydown('ArrowDown');
  assert.deepEqual(s.calls, []);
  assert.equal(down.defaultPrevented, false);
  // With no position in the order, ArrowRight enters at the first workspace.
  doc.keydown('ArrowRight');
  assert.deepEqual(s.calls, [['openSession', 's-1']]);
});

test('a row missing retainedBy entirely does not throw', () => {
  const doc = fakeDocument();
  const s = services();
  const { retainedBy: _drop, ...rest } = s.byId['s-1'];
  s.byId['s-1'] = rest;
  mount(doc, s);
  assert.doesNotThrow(() => { doc.keydown('ArrowDown'); });
  assert.deepEqual(s.calls, [['openSession', 's-3']]);
});

test('openSession synchronously moves mainView so the next press derives the new current', () => {
  const doc = fakeDocument();
  const s = services();
  mount(doc, s);
  doc.keydown('ArrowDown'); // s-2 -> s-3
  assert.deepEqual(s.calls, [['openSession', 's-3']]);
  assert.equal(s.byId['s-3'].retainedBy.mainView, 1);
  assert.equal(s.byId['s-2'].retainedBy.mainView, undefined);
  s.calls.length = 0;
  doc.keydown('ArrowDown'); // s-3 -> s-1 (wrap), derived from the moved mainView
  assert.deepEqual(s.calls, [['openSession', 's-1']]);
});
