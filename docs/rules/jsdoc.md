# JSDoc contract

Полное правило JSDoc для всех объявленных функций. Краткое tl;dr — в [CLAUDE.md §3.4](../../CLAUDE.md).

---

## 3.4. JSDoc обязателен для функций — с типами и chain-нотацией

Каждая **объявленная функция** в проекте — React-компонент, кастомный хук, утилита, серверный action, обработчик, экспортируемая или нет — должна сопровождаться JSDoc-блоком над объявлением. **Все `@param` обязательно с типом в фигурных скобках** — даже если этот тип уже есть в TypeScript-сигнатуре (это **сознательное дублирование**: помогает читать код в IDE-тултипах, в hover-предпросмотре, и в diff-ах без переключения на сигнатуру). **`@returns` пишется БЕЗ типа** — только описание (тип возврата уже есть в TS-сигнатуре, дублировать его в JSDoc не нужно).

- **Язык — английский.** Все JSDoc-комментарии и инлайн-комментарии в коде пишутся на английском, в тон существующих описаний в проекте. Русские комментарии (наследие из ранних коммитов) при правке файла переводить на английский.
- **Структура:**
  1. Первая строка — короткое описание через em-dash: `Имя — что делает.` (английский).
  2. Пустая строка.
  3. **Только flow-описание** (последовательность действий: «Fetches X, then normalizes Y, persists Z»; «Tries A first; falls back to B»; «On success stores X»; «Mobile: …; Desktop: …»). Никакого другого расширенного контекста — не писать rationale («because of …»), альтернативы, причины возникновения, usage-context («used as / used by …»), исторические заметки, кросс-ссылки на других вызывающих, edge-case-замечания. Эти вещи живут в PR-описании / commit message, а не в JSDoc — там они быстро устаревают. Если flow-абзаца нет — сразу `@param`/`@returns` после пустой строки.
  4. `@param   {Type}   name           - Description.` для каждого аргумента.
  5. Для деструктурированных props — **chain-нотация**: сначала сам объект `props` (тип `{object}` или именованный type), затем каждое поле `props.fieldName` с собственным типом.
  6. `@returns Description.` — **всегда** при наличии return-значения, **без типа в фигурных скобках**. Для React-компонентов: `@returns JSX of the <thing>.` Для async-серверных функций: `@returns Promise resolving to <thing>.`
- **Выравнивание.** Колонки `{Type}`, `name`, `- Description` для `@param` — выравниваем пробелами по вертикали внутри одного JSDoc-блока, чтобы читать как таблицу. Если типы сильно разной длины — допускаем единичный пробел; главное, чтобы в одном блоке стиль был консистентным. У `@returns` колонки нет — описание идёт сразу после тега через один пробел.
- **Внутренние коллбэки** в `useEffect`/`useGSAP`/`map`/`filter`/`onClick={() => ...}` — **без** JSDoc, если у них нет отдельного именованного объявления.
- При правке файла, где у функции уже есть однострочный JSDoc без `@param`/`@returns` — **расширить** до полной формы.
- Это правило **переопределяет** дефолтное «no comments» из системного промпта Claude: для этого проекта JSDoc — часть контракта функции, а не комментарий «на всякий случай».

**Каноничный пример (React-компонент с деструктурированными props):**

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

**Каноничный пример (async server fetcher):**

```tsx
/**
 * fetchDictionary — loads the `static_content` attribute set and normalizes it into
 * `Record<marker, IAttributeValue>`, so that `dict?.MARKER?.value` returns a string.
 *
 * @returns Promise resolving to a map of markers → attribute with a string `value`.
 */
const fetchDictionary = async (): Promise<IAttributeValues> => { ... }
```

**Каноничный пример (утилита с примитивными аргументами):**

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
