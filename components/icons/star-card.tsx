import type { JSX } from 'react';

const StarCardIcon = ({ size, filled }: { size: number; filled: boolean }): JSX.Element => {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M12 2.5l2.95 6 6.6.96-4.78 4.66 1.13 6.57L12 17.6l-5.9 3.1 1.13-6.57L2.45 9.46l6.6-.96L12 2.5z"
        fill={filled ? '#ec722b' : 'rgba(223,233,249,0.25)'}
        stroke="#ec722b"
        strokeWidth="1"
      />
    </svg>
  );
};

export default StarCardIcon;
