import type { Plan } from './apply.ts';
import type { LabelsBySession } from './dom.ts';
import type { NavState, SessionId } from './navigate.ts';
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
export declare function shouldIgnore(event: KeyboardEvent): boolean;
/** Read the two snapshots the navigation layer resolves against. */
export declare function readNavState(plan: Plan): NavState;
/** Row label text per session, used to bind a drawn section to its rows. */
export declare function rowLabels(state: NavState): LabelsBySession;
/**
 * The blank placeholders currently visible anywhere.
 *
 * The shared visibility rule draws only the selected one; the sidebar's own
 * grouping admits the blank of whichever workspace it belongs to, so the drawn
 * order needs the wider set to compare against a rendered section honestly.
 */
export declare function visiblePlaceholders(state: NavState): SessionId[];
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
export declare function handleArrowKey(plan: Plan, event: KeyboardEvent, trace?: (message: string, detail: unknown) => void): boolean;
