/**
 * Browser-half constants: the keys this plugin owns and the DOM anchors it
 * reads. Every selector here is taken from the shipped client contract, not
 * invented; the evidence is recorded in the plan's `contract.md`.
 */

/** Arrow key → step direction. Up/Left move backwards, Down/Right forwards. */
export const DELTA: Readonly<Record<string, number>> = {
  ArrowUp: -1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowRight: 1,
};

/** Group key the workspace browser uses for sessions outside every workspace. */
export const UNGROUPED = '';

/** Slot anchor the renderer wraps around the sidebar browsing region. */
export const SIDEBAR_SCOPE = '[data-slot="sidebar.workspaces"]';

/**
 * The one scrolling element in the sidebar (`.list`, `overflow-y: auto`).
 * Scoped to the sidebar region because other trees in the app also use
 * `role="tree"` (the JSON tree and the subagent lineage panel).
 */
export const TREE = '[role="tree"]';

/** A workspace group header row: authored `aria-expanded`, no `data-*`. */
export const HEADER = 'div[role="treeitem"][aria-expanded]';

/** A session row: authored `aria-selected`; search results use a `button`. */
export const ROW = 'div[role="treeitem"][aria-selected]';

/** The composer's editable surface, an authored attribute on a contenteditable div. */
export const COMPOSER = '[data-composer-input]';

/** Selectors of surfaces that own their own arrow keys. */
export const EDITABLE_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[role="textbox"]',
].join(', ');

/** Selectors of overlays that own their own arrow keys. */
export const OVERLAY_SELECTOR = [
  '[role="dialog"]',
  '[role="menu"]',
  '[role="listbox"]',
  '[aria-modal="true"]',
].join(', ');
