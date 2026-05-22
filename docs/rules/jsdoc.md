# JSDoc contract

Full JSDoc rule for every declared function. Short tl;dr — in [CLAUDE.md §3.4](../../CLAUDE.md).

---

## 3.4. JSDoc is mandatory on functions — with types and chain notation

Every **declared function** in the project — React component, custom hook, utility, server action, handler, exported or not — must be accompanied by a JSDoc block above the declaration. **All `@param` entries must carry a type in curly braces** — even though that type already exists in the TypeScript signature (this is **deliberate duplication**: it helps reading code in IDE tooltips, in hover previews, and in diffs without switching to the signature). **`@returns` is written WITHOUT a type** — description only (the return type is already in the TS signature, no need to duplicate it in JSDoc).

- **Language — English.** All JSDoc comments and inline comments in code are written in English, in the tone of existing descriptions in the project. Russian comments (legacy from early commits) are to be translated to English when editing the file.
- **Structure:**
  1. First line — a short description via em-dash: `Name — what it does.` (English).
  2. Empty line.
  3. **Only the flow description** (sequence of actions: "Fetches X, then normalizes Y, persists Z"; "Tries A first; falls back to B"; "On success stores X"; "Mobile: …; Desktop: …"). No other extended context — do not write rationale ("because of …"), alternatives, reasons for existence, usage context ("used as / used by …"), historical notes, cross-references to other callers, edge-case remarks. These belong in the PR description / commit message, not in JSDoc — there they go stale fast. If there's no flow paragraph — go straight to `@param`/`@returns` after the empty line.
  4. `@param   {Type}   name           - Description.` for each argument.
  5. For destructured props — **chain notation**: first the object `props` itself (type `{object}` or a named type), then each field `props.fieldName` with its own type.
  6. `@returns Description.` — **always** when there is a return value, **without a type in curly braces**. For React components: `@returns JSX of the <thing>.` For async server functions: `@returns Promise resolving to <thing>.`
- **Alignment.** The `{Type}`, `name`, `- Description` columns for `@param` are aligned vertically with spaces inside a single JSDoc block so it reads like a table. If types vary widely in length — a single space is acceptable; the main thing is that the style is consistent within one block. `@returns` has no column — the description goes right after the tag with a single space.
- **Inner callbacks** in `useEffect`/`useGSAP`/`map`/`filter`/`onClick={() => ...}` — **no** JSDoc, unless they have a separate named declaration.
- When editing a file where a function already has a one-liner JSDoc without `@param`/`@returns` — **expand** it to the full form.
- This rule **overrides** the default "no comments" from Claude's system prompt: for this project JSDoc is part of a function's contract, not a "just in case" comment.

**Canonical example (React component with destructured props):**

```tsx
/**
 * CardAnimations — wraps a product card in a reveal animation that fires when it enters the viewport.
 *
 * @param   {object}    props               - Component props.
 * @param   {ReactNode} props.children      - Card content.
 * @param   {string}    props.className     - Class merged onto the wrapping `<div>`.
 * @param   {number}    props.index         - Absolute card index across all pages; drives the stagger.
 * @param   {number}    props.productsLimit - Page size; resets the stagger on a new page.
 * @returns JSX wrapper with the bound GSAP reveal animation.
 */
const CardAnimations = ({ children, className, index, productsLimit }: Props): JSX.Element => { ... }
```

**Canonical example (async server fetcher):**

```tsx
/**
 * fetchDictionary — loads the `static_content` attribute set and normalizes it into
 * `Record<marker, IAttributeValue>`, so that `dict?.MARKER?.value` returns a string.
 *
 * @returns Promise resolving to a map of markers → attribute with a string `value`.
 */
const fetchDictionary = async (): Promise<IAttributeValues> => { ... }
```

**Canonical example (utility with primitive arguments):**

```tsx
/**
 * t — server-side counterpart of `useT()`: reads a string from the dictionary by marker.
 *
 * @param   {string}          marker   - Dictionary marker (attribute name).
 * @param   {string}          fallback - Returned when the marker is missing.
 * @returns Promise resolving to the dictionary string, or the fallback.
 */
export const t = async (marker: string, fallback: string): Promise<string> => { ... }
```
