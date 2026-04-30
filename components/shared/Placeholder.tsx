import type { JSX } from 'react';

import LogoIcon from './LogoIcon';

/**
 * Плейсхолдер пустого изображения
 */
const Placeholder = ({ className }: { className?: string }): JSX.Element => {
  return (
    <div
      className={
        'relative flex size-full flex-col items-center justify-center overflow-hidden rounded-[5px] bg-ink/30 text-paper/40 ' +
        (className ?? '')
      }
    >
      <LogoIcon className="w-1/2 max-w-32 h-auto" />
    </div>
  );
};

export default Placeholder;
