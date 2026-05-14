# Icons — three storage forms

Полное правило хранения и подключения иконок. Краткое tl;dr — в [CLAUDE.md §3.3](../../CLAUDE.md).

---

## 3.3. Иконки: куда класть и в какой форме

Три формы хранения, выбор по тому, **что делает иконка в DOM**:

1. **`public/images/icons/*.svg` (статический URL-ассет)** — для **полностью декоративных** иконок с **зашитыми** `fill`/`stroke` цветами, без CSS-стилизации со стороны родителя и без hover-эффектов на `path`. Загружаются через `next/image`:

   ```tsx
   import Image from 'next/image';
   <Image src="/images/icons/flame.svg" alt="" width={15} height={20} />
   ```

   Здесь нет SVGR, иконка превращается в `<img>` (replaced element) — стили родителя (`group:hover`, `currentColor`) на `path` внутри **не действуют**. Зато оптимизация раздачи (immutable cache в [next.config.ts](../../next.config.ts) `headers()`), и не раздувается JS-бандл. Это default для новых декоративных иконок.

2. **`components/icons/*.svg` (SVGR — инлайн SVG в DOM)** — когда иконка нужна **инлайн** в DOM, чтобы её `path` ловил CSS-селектор родителя (`.hover-target path { fill: var(--color-brand) }` из [app/styles/main.css](../../app/styles/main.css)) или чтобы внутри SVG работал `class="hover-target"`. SVGR настроен в [next.config.ts](../../next.config.ts) (`@svgr/webpack`, `icon: false, titleProp: true`), TS-декларация — в [app/types/svg.d.ts](../../app/types/svg.d.ts), Tailwind v4 content-glob расширен до `*.svg` в [tailwind.config.js](../../tailwind.config.js). Импорт **всегда с явным расширением**:

   ```tsx
   import CloseXBoldIcon from '@/components/icons/close-x-bold.svg';
   <CloseXBoldIcon className="hover-target" />
   ```

   Внутри `.svg` пиши `class="..."` (не `className`) и `stroke-width=`/`fill-rule=` через дефис — SVGR конвертирует в JSX-имена.

3. **`components/icons/*.tsx` (React-компонент)** — когда у иконки есть props, меняющие **рендер**: `active`, `filled`, `size`, `variant`, conditional-логика, мердж fixed className c пользовательским. Примеры: [heart-card.tsx](../../components/icons/heart-card.tsx) (filled), [house.tsx](../../components/icons/house.tsx) (size), [clock-circle.tsx](../../components/icons/clock-circle.tsx) (variant), [star-card.tsx](../../components/icons/star-card.tsx) (size+filled).

**Правило выбора при добавлении новой иконки:**

1. Цвета зашиты, ничего не реагирует на ховер родителя, нет внутренних классов вроде `hover-target` → **`public/images/icons/*.svg`**.
2. Иконка должна быть инлайн в DOM (CSS-стилизация родителя на `path`, `class="hover-target"` внутри, `currentColor`) → **`components/icons/*.svg`**.
3. Иконка переключается по состоянию (filled/outlined, active, disabled) или принимает дискриминирующий prop → **`components/icons/*.tsx`**.

**Никогда:**

- Не оставляй inline `<svg>` прямо в компонентах фич. Любой инлайновый SVG длиной > 1 path выноси либо в `public/images/icons/`, либо в `components/icons/` (правило 3.2 про чистоту кода).
- Не дублируй уже существующую иконку под другим именем. Сначала проверяй [components/icons/](../../components/icons/) и [public/images/icons/](../../public/images/icons/).
- Не клади SVG с `class="hover-target"` (или иной CSS-зависимостью от родителя) в `public/images/icons/` — внутренние стили потеряются, потому что `<img>` не пробрасывает CSS родителя в свой shadow DOM. Такой SVG должен жить в `components/icons/` и импортироваться через SVGR.

**Tailwind-классы внутри `components/icons/*.svg`:** content-glob уже включает `*.svg`, так что `class="fill-[#EC722B] hover-target"` внутри SVG-файла будет отсканирован и сгенерирован. Если классы вдруг не применяются — первое, что проверить: что путь файла попадает под `content` в [tailwind.config.js](../../tailwind.config.js). Для `public/images/icons/*.svg` Tailwind-классы внутри **не работают** (файл не проходит через бандлер).
