/**
 * Guard tests: who owns an arrow key when the composer is focused.
 *
 * The composer is the interesting case — an empty draft yields the key, a draft
 * with text keeps it — and these tests pin that boundary, because getting it
 * wrong either blocks navigation entirely or eats the caret.
 *
 * The doubles below mirror the two real contracts they stand in for: a real
 * `Element.closest` returns an `Element` or `null` (never `undefined`) and
 * splits its comma-separated selector list.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldIgnore } from '../src/client/session-nav.ts';

/** The selectors the guard compares with. */
const COMPOSER_SELECTOR = '[data-composer-input]';
const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]';
const OVERLAY = '[role="dialog"], [role="menu"], [role="listbox"], [aria-modal="true"]';

/** Build a node double that answers only the selectors it "matches". */
function node(matches: readonly string[]): Element {
  return {
    closest: (selector: string) =>
      (selector.split(', ').some(part => matches.includes(part)) ? {} : null),
  } as unknown as Element;
}

/** The composer: an editable surface that also carries the composer anchor. */
function composer(text: string): Element {
  return {
    textContent: text,
    closest: (selector: string) =>
      (selector.split(', ').some(part => part === '[contenteditable="true"]' || part === COMPOSER_SELECTOR)
        ? {}
        : null),
  } as unknown as Element;
}

/** Install a document double for one assertion. */
function withDocument(active: Element | null, composerEl: Element | null, run: () => void): void {
  const previous = (globalThis as { document?: unknown }).document;
  (globalThis as { document?: unknown }).document = {
    activeElement: active,
    querySelector: (selector: string) =>
      (composerEl !== null && selector === COMPOSER_SELECTOR ? composerEl : null),
  };
  try {
    run();
  } finally {
    (globalThis as { document?: unknown }).document = previous;
  }
}

/** Build a keydown-like event. */
function keyDown(target: Element, extra: Record<string, unknown> = {}): KeyboardEvent {
  return {
    key: 'ArrowDown',
    target,
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    isComposing: false,
    ...extra,
  } as unknown as KeyboardEvent;
}

test('an empty composer yields its arrow keys', () => {
  const el = composer('');
  withDocument(el, el, () => {
    assert.equal(shouldIgnore(keyDown(el)), false);
  });
});

test('a whitespace-only draft also yields its arrow keys', () => {
  const el = composer('   \n\t ');
  withDocument(el, el, () => {
    assert.equal(shouldIgnore(keyDown(el)), false);
  });
});

test('a draft with text keeps its arrow keys', () => {
  const el = composer('half-written prompt');
  withDocument(el, el, () => {
    assert.equal(shouldIgnore(keyDown(el)), true);
  });
});

test('an absent composer counts as empty', () => {
  const outside = node(['body']);
  withDocument(outside, null, () => {
    assert.equal(shouldIgnore(keyDown(outside)), false);
  });
});

test('the sidebar session search always keeps its arrow keys', () => {
  const composerEl = composer('');
  const search = node(['input']);
  withDocument(search, composerEl, () => {
    assert.equal(shouldIgnore(keyDown(search)), true);
  });
});

test('a dialog keeps its own arrow keys even over an empty composer', () => {
  const el = composer('');
  const dialog = node(['[role="dialog"]']);
  withDocument(el, el, () => {
    assert.equal(shouldIgnore(keyDown(dialog)), true);
  });
});

test('a non-editable target over an empty composer is navigable', () => {
  const el = composer('');
  withDocument(el, el, () => {
    assert.equal(shouldIgnore(keyDown(node(['body']))), false);
  });
});

test('modifiers, composition and handled events are ignored regardless of focus', () => {
  const el = composer('');
  withDocument(el, el, () => {
    for (const extra of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) {
      assert.equal(shouldIgnore(keyDown(el, extra)), true);
    }
    assert.equal(shouldIgnore(keyDown(el, { isComposing: true })), true);
    assert.equal(shouldIgnore(keyDown(el, { defaultPrevented: true })), true);
  });
});

test('a target without closest is navigable', () => {
  const el = composer('');
  withDocument(el, el, () => {
    assert.equal(shouldIgnore(keyDown({ closest: undefined } as unknown as Element)), false);
  });
});

test('a throwing closest yields the key rather than navigating', () => {
  const el = composer('');
  const hostile = {
    closest: () => { throw new Error('detached'); },
  } as unknown as Element;
  withDocument(el, el, () => {
    assert.equal(shouldIgnore(keyDown(hostile)), true);
  });
});

test('a throwing composer lookup yields the key', () => {
  const el = composer('');
  const previous = (globalThis as { document?: unknown }).document;
  (globalThis as { document?: unknown }).document = {
    activeElement: el,
    querySelector: () => { throw new Error('detached document'); },
  };
  try {
    assert.equal(shouldIgnore(keyDown(composer(''))), true);
  } finally {
    (globalThis as { document?: unknown }).document = previous;
  }
});
