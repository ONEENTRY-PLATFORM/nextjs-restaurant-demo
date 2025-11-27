import type { JSX } from 'react';
import LogoIcon from './LogoIcon';

/**
 * Empty image placeholder
 */
const Placeholder = ({ className }: { className?: string }): JSX.Element => {
  return (
    <div
      className={
        'relative flex size-full flex-col items-center justify-center overflow-hidden rounded-xl bg-slate-50 ' +
        className
      }
    >
      <LogoIcon fill={'gray-100'} />
    </div>
  );
};

export default Placeholder;
