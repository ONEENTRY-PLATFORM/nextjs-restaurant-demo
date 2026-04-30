'use client';

import type { JSX } from 'react';

import CloseXBoldIcon from '@/components/icons/close-x-bold.svg';

/**
 * Общая кнопка закрытия "X", используемая в углу каждого попапа
 * (`ProfilePopup`, `FavoritesPopup`, `CartWizard` и т.д.) — круглая
 * кнопка с `border-paper` и глифом X с классом `hover-target`, который
 * становится оранжевым при наведении. Лейаут (видимость по брейкпоинтам,
 * верхний отступ) контролируется вызывающим через `className`.
 * @param   {object}      props             - Пропсы кнопки.
 * @param   {() => void}  props.onClose     - Обработчик клика (например, `setTransition('close')`).
 * @param   {string}      [props.ariaLabel] - Доступная подпись, по умолчанию `'Close'`.
 * @param   {string}      [props.className] - Дополнительные утилитарные классы (видимость, отступы).
 * @returns {JSX.Element}                   JSX кнопки.
 */
const ClosePopupButton = ({
  onClose,
  ariaLabel = 'Close',
  className = '',
}: {
  onClose: () => void;
  ariaLabel?: string;
  className?: string;
}): JSX.Element => {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={ariaLabel}
      className={`group flex h-11.5 w-11.5 items-center justify-center rounded-full border border-paper hover:border-brand ${className}`}
    >
      <CloseXBoldIcon className="hover-target" />
    </button>
  );
};

export default ClosePopupButton;
