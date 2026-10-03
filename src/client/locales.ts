/**
 * Plugin-owned i18n dictionaries for `dsh-arrowkey-nav`.
 *
 * This plugin's browser half is headless: it installs a single capturing
 * `keydown` listener and a read-only diagnostic accessor, and it renders no UI
 * of its own (no React component, no panel, no tooltip, label, button,
 * placeholder or hint). The session/workspace rows it moves between belong to
 * the host's sidebar, not to this plugin. Consequently there are currently NO
 * user-visible strings to localize here.
 *
 * Every literal in `src/client/**` is deliberately left out of this dictionary
 * because translating it would either change observable behaviour or violate
 * the rollout rule set:
 * - `console.info` / `console.error` messages ("listener attached", "keydown
 *   failed", the `trace` tags) are log output, not UI.
 * - the ignore-reason strings in `session-nav.ts` (`'modifier held'`, ...) are
 *   diagnostics that reach those logs, never the DOM.
 * - the `constants.ts` selectors, the effect labels, `__dshArrowkeyNav` and the
 *   service names are configuration / protocol identifiers.
 *
 * The scaffolding below is still introduced so that the first string this
 * plugin ever paints has a home: `zh` is the key-set source of truth, the other
 * eight languages are typed against it (a missing or extra key is a COMPILE
 * error), and the whole set registers through the DSH `locale` service in ONE
 * call from `index.ts`.
 */

/** The namespace owned by this plugin (own vocabulary, own lifecycle). */
export const NS = 'dsh-arrowkey-nav'

/**
 * Simplified Chinese dictionary — the key-set source of truth. Empty until this
 * plugin gains rendered copy; add a key here and every language below is
 * required to supply it.
 */
export const zh = {}

/** The key union: what a `t('…')` call may name inside this namespace. */
export type ArrowKeyNavKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en: Record<ArrowKeyNavKey, string> = {}

/** Japanese dictionary, checked complete against the zh key set. */
export const ja: Record<ArrowKeyNavKey, string> = {}

/** Korean dictionary, checked complete against the zh key set. */
export const ko: Record<ArrowKeyNavKey, string> = {}

/** French dictionary, checked complete against the zh key set. */
export const fr: Record<ArrowKeyNavKey, string> = {}

/** German dictionary, checked complete against the zh key set. */
export const de: Record<ArrowKeyNavKey, string> = {}

/** Italian dictionary, checked complete against the zh key set. */
export const it: Record<ArrowKeyNavKey, string> = {}

/** Russian dictionary, checked complete against the zh key set. */
export const ru: Record<ArrowKeyNavKey, string> = {}

/** Spanish dictionary, checked complete against the zh key set. */
export const es: Record<ArrowKeyNavKey, string> = {}

/**
 * All locales in the shape the locale service consumes, keyed by BCP-47-style
 * tag. Registered in ONE call: the registry rejects a duplicate
 * `(namespace, locale)` pair, so the map form activates every language at once.
 */
export const dictionaries: Record<string, Record<string, string>> = {
  zh,
  en,
  ja,
  ko,
  fr,
  de,
  it,
  ru,
  es,
}

/**
 * Structural view of the DSH locale service — only the two members this plugin
 * touches. Declared locally on purpose: importing the real type would pull the
 * whole client type graph into a browser-only plugin for two signatures.
 */
export interface LocaleLike {
  register(ns: string, dicts: Record<string, Record<string, string>>): () => void
  bind(ns: string): (key: string) => string
}

/**
 * Build the `t(key)` helper the plugin's rendering will use. `bind` returns a
 * cached function that reads the ACTIVE locale at call time, so a language
 * switch needs no re-apply; an unknown namespace or key falls back to the key
 * itself rather than throwing inside a render, and a missing service does the
 * same. It lives here (rather than inline in `index.ts`) because this plugin
 * has no UI yet, so no call site would keep a local helper from failing the
 * `noUnusedLocals` gate — exported now, it is ready for the first string.
 */
export function createT(locale: LocaleLike | undefined, ns: string = NS): (key: string) => string {
  if (locale === undefined) return (key: string): string => key
  return (key: string): string => {
    try {
      return locale.bind(ns)(key) || key
    } catch {
      return key
    }
  }
}
