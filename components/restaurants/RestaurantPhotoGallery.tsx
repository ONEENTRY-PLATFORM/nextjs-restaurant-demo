'use client';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

import Image from 'next/image';
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import RestaurantPhotoSlider from './RestaurantPhotoSlider';

type Photo = { downloadLink?: string };

/**
 * Галерея single-restaurant (Figma «Подробнее 2», node 2413:1173).
 *
 * Десктоп: большое фото слева — область показа; столбец миниатюр
 * справа. Клик по миниатюре переключает основное фото; клик по
 * основному — открывает fullscreen-lightbox (`yet-another-react-lightbox`)
 * со встроенной клавиатурной навигацией, swipe, zoom, fullscreen API
 * и thumbnail-strip'ом снизу.
 *
 * Мобила: единый горизонтальный слайдер через {@link RestaurantPhotoSlider}
 * (как в `mob_about.html`); тап по фото открывает тот же lightbox.
 */
const RestaurantPhotoGallery = ({
  photos,
  alt,
}: {
  photos: Photo[];
  alt: string;
}): JSX.Element => {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const total = photos.length;
  const main = photos[active];

  // Вертикальная карусель миниатюр: все фото остаются на своих местах
  // (не «прыгают» при переключении), активный — подсвечивается рамкой,
  // полоса прокручивается так, чтобы активный thumb был виден целиком,
  // а так же поддерживает drag-to-scroll (mouse + touch через
  // PointerEvents). Если за время drag'а пользователь увёл указатель
  // больше DRAG_THRESHOLD_PX — `click` на миниатюре подавляется (иначе
  // любой drag заканчивался бы случайным переключением активного фото).
  const thumbsContainerRef = useRef<HTMLDivElement | null>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dragState = useRef<{
    active: boolean;
    captured: boolean;
    pointerId: number;
    startY: number;
    startScroll: number;
    moved: number;
  }>({
    active: false,
    captured: false,
    pointerId: -1,
    startY: 0,
    startScroll: 0,
    moved: 0,
  });
  const DRAG_THRESHOLD_PX = 5;

  useEffect(() => {
    const container = thumbsContainerRef.current;
    const node = thumbRefs.current[active];
    if (!container || !node) return;

    // Скролл считаем вручную и применяем ТОЛЬКО к thumbs-контейнеру.
    // `Element.scrollIntoView` зовёт ancestor-bubbling — у предков с
    // overflow он тоже подкручивает scrollTop, поэтому страница ехала
    // вместе с каруселью. `container.scrollTo()` ограничивается этим
    // элементом.
    const cRect = container.getBoundingClientRect();
    const nRect = node.getBoundingClientRect();

    const relTop = nRect.top - cRect.top + container.scrollTop;
    const relBottom = relTop + nRect.height;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;

    // 1) Скрыт сверху — поднимаем на верх viewport'а.
    if (relTop < viewTop) {
      container.scrollTo({ top: relTop, behavior: 'smooth' });
      return;
    }
    // 2) Скрыт снизу — опускаем на нижнюю границу.
    if (relBottom > viewBottom) {
      container.scrollTo({
        top: relBottom - container.clientHeight,
        behavior: 'smooth',
      });
      return;
    }

    // 3) Активный полностью виден — но если он крайний снизу и за ним
    //    есть скрытые, подкручиваем на один слайд вперёд, чтобы стал
    //    виден сосед.
    const next = thumbRefs.current[active + 1];
    if (next) {
      const nextRect = next.getBoundingClientRect();
      const nextRelBottom =
        nextRect.bottom - cRect.bottom + container.scrollTop + container.clientHeight;
      if (nextRect.bottom > cRect.bottom) {
        container.scrollTo({
          top: nextRelBottom - container.clientHeight,
          behavior: 'smooth',
        });
        return;
      }
    }
    // 4) Симметрично — крайний сверху.
    const prev = thumbRefs.current[active - 1];
    if (prev) {
      const prevRect = prev.getBoundingClientRect();
      if (prevRect.top < cRect.top) {
        const prevRelTop =
          prevRect.top - cRect.top + container.scrollTop;
        container.scrollTo({ top: prevRelTop, behavior: 'smooth' });
      }
    }
  }, [active]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = thumbsContainerRef.current;
    if (!el) return;
    if (e.button !== undefined && e.button !== 0) return;
    // Захват pointer'а делаем НЕ сразу: иначе click на дочернюю
    // кнопку-thumb уйдёт в контейнер (capture target становится
    // event.target для последующих pointer-событий и click). Захватываем
    // только когда движение превысит DRAG_THRESHOLD_PX — это значит
    // юзер реально тащит, а не кликает.
    dragState.current = {
      active: true,
      captured: false,
      pointerId: e.pointerId,
      startY: e.clientY,
      startScroll: el.scrollTop,
      moved: 0,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragState.current;
    const el = thumbsContainerRef.current;
    if (!s.active || !el) return;
    const dy = e.clientY - s.startY;
    const moved = Math.abs(dy);
    if (moved < DRAG_THRESHOLD_PX) return;
    s.moved = Math.max(s.moved, moved);
    if (!s.captured) {
      el.setPointerCapture(s.pointerId);
      s.captured = true;
    }
    el.scrollTop = s.startScroll - dy;
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = thumbsContainerRef.current;
    const s = dragState.current;
    if (el && s.captured && el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    s.active = false;
    s.captured = false;
    // `moved` нужен внутри `onClickCapture` (стреляет после pointerup),
    // обнуляем на следующий tick.
    setTimeout(() => {
      dragState.current.moved = 0;
    }, 0);
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    // Если пользователь только что протащил мышью больше threshold'а —
    // глотаем click, чтобы не срабатывало переключение thumbs.
    if (dragState.current.moved > DRAG_THRESHOLD_PX) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Drag-swipe для main-фото (левая колонка). Тащишь вниз —
  // предыдущее фото, тащишь вверх — следующее. Симметрично направлению
  // карусели миниатюр справа. Если за время drag'а пользователь увёл
  // указатель меньше MAIN_DRAG_THRESHOLD_PX, считаем это кликом и
  // открываем lightbox; иначе — переключаем активное фото.
  const MAIN_DRAG_THRESHOLD_PX = 40;
  const mainDragState = useRef<{
    active: boolean;
    startY: number;
    moved: number;
    direction: 0 | 1 | -1;
  }>({ active: false, startY: 0, moved: 0, direction: 0 });

  const onMainPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== undefined && e.button !== 0) return;
    mainDragState.current = {
      active: true,
      startY: e.clientY,
      moved: 0,
      direction: 0,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMainPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = mainDragState.current;
    if (!s.active) return;
    const dy = e.clientY - s.startY;
    s.moved = Math.abs(dy);
    s.direction = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  };

  const onMainPointerEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    const s = mainDragState.current;
    const target = e.currentTarget;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
    if (s.moved > MAIN_DRAG_THRESHOLD_PX && total > 0) {
      // Тянем вверх → следующее фото; вниз → предыдущее. Циклически.
      const delta = s.direction === -1 ? 1 : -1;
      setActive((i) => (i + delta + total) % total);
    }
    s.active = false;
  };

  const onMainClickCapture = (e: React.MouseEvent<HTMLButtonElement>) => {
    // После swipe-жеста подавляем click, чтобы не открывать lightbox.
    if (mainDragState.current.moved > MAIN_DRAG_THRESHOLD_PX) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const slides = photos
    .filter((p): p is Required<Photo> => Boolean(p?.downloadLink))
    .map((p) => ({ src: p.downloadLink, alt }));

  const openLightbox = () => {
    if (slides.length > 0) setLightboxOpen(true);
  };

  return (
    <>
      {/* Mobile / tablet — слайдер с точками. Передаём `onImageClick`
          самому слайдеру, чтобы кнопкой стало только image-frame, а
          точки-индикаторы остались sibling'ами — иначе получится
          `<button>` внутри `<button>` (hydration-mismatch в React 19). */}
      <div className="md:hidden">
        <RestaurantPhotoSlider
          photos={photos}
          alt={alt}
          frameClassName="aspect-956/678"
          sizes="(max-width: 767px) 100vw, 700px"
          onImageClick={openLightbox}
        />
      </div>

      {/* Desktop — grid 1 main + max-3 thumbnails carousel.
          Grid задаёт aspect-ratio всего ряда (1294×678 из Figma:
          956 main + 60 gap + 278 thumbs = 1294 wide, 678 высота,
          совпадает с aspect main'а). Оба child'а получают `h-full`,
          поэтому правая колонка по высоте равна левой; в неё ровно
          вмещается 3 миниатюры (278×197 × 3 + gap-11 × 2 = 679 ≈
          678), остальные прокручиваются — это и есть «вертикальная
          карусель максимум на 3 видимых фото». */}
      <div className="hidden md:grid md:aspect-1294/678 md:grid-cols-[956fr_278fr] md:gap-15">
        <button
          type="button"
          onClick={openLightbox}
          onClickCapture={onMainClickCapture}
          onPointerDown={onMainPointerDown}
          onPointerMove={onMainPointerMove}
          onPointerUp={onMainPointerEnd}
          onPointerCancel={onMainPointerEnd}
          onPointerLeave={onMainPointerEnd}
          // Гасим нативный браузерный drag-and-drop на картинке —
          // иначе при mousedown браузер запускает image-drag, и наши
          // pointermove события перестают приходить.
          onDragStart={(e) => e.preventDefault()}
          aria-label={`Open ${alt} photos fullscreen`}
          className="relative h-full w-full overflow-hidden rounded-[10px] bg-ink/40 transition-opacity hover:opacity-95 disabled:cursor-default cursor-grab active:cursor-grabbing select-none touch-pan-y"
          disabled={total === 0}
        >
          {main?.downloadLink ? (
            <Image
              src={main.downloadLink}
              alt={alt}
              fill
              sizes="(min-width: 1280px) 956px, 60vw"
              className="object-cover pointer-events-none select-none"
              draggable={false}
              priority
            />
          ) : null}
        </button>
        <div
          ref={thumbsContainerRef}
          // Высота столбца тянется по высоте main-картинки в той же
          // grid-row (oба блока share одну grid-row, main задаёт высоту
          // через aspect-956/678). `min-h-0` обязателен, чтобы flex-child
          // в grid-row не растягивал ряд бесконечно. Сами миниатюры —
          // `shrink-0`, превышающие высоту прокручиваются `overflow-y-auto`.
          // Drag-to-scroll: pointerdown/move/end + onClickCapture гасят
          // случайный «выбор» миниатюры после dragа. `touch-pan-y`
          // нужен, чтобы тач-устройства не блокировали наш pointer-flow.
          className="flex h-full min-h-0 flex-col gap-11 overflow-y-auto pr-1 no-scrollbar touch-pan-y select-none cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onPointerLeave={onPointerEnd}
          onClickCapture={onClickCapture}
        >
          {photos.map((photo, index) => {
            const isActive = index === active;
            return (
              <button
                key={index}
                ref={(el) => {
                  thumbRefs.current[index] = el;
                }}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-pressed={isActive}
                className={
                  'relative aspect-278/197 w-full shrink-0 overflow-hidden rounded-[10px] bg-ink/40 transition-all ' +
                  (isActive
                    ? 'ring-2 ring-brand opacity-100'
                    : 'opacity-70 hover:opacity-100')
                }
              >
                {photo?.downloadLink ? (
                  <Image
                    src={photo.downloadLink}
                    alt={`${alt} ${index + 1}`}
                    fill
                    sizes="(min-width: 1280px) 278px, 20vw"
                    className="object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={active}
        on={{ view: ({ index }) => setActive(index) }}
        slides={slides}
        plugins={[Counter, Fullscreen, Thumbnails, Zoom]}
        controller={{ closeOnBackdropClick: true }}
        // Бэкдроп подгоняем под общий стиль попапов проекта
        // (`bg-ink/80 backdrop-blur-[10px]` в ProfilePopup,
        // FavoritesPopup, Modal и т.п.). `--color-ink` = #4c4d56,
        // 80% непрозрачность + blur(10px) — переопределяем CSS-vars
        // самой либы, чтобы не плодить override-CSS.
        styles={{
          container: {
            backgroundColor: 'rgba(76, 77, 86, 0.8)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          },
        }}
      />
    </>
  );
};

export default RestaurantPhotoGallery;
