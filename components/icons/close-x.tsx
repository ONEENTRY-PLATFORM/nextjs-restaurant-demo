import type { JSX } from 'react';

/**
 * CloseXIcon — orange "close" cross icon used in modal/drawer close buttons.
 *
 * @returns JSX of the close-cross SVG.
 */
const CloseXIcon = (): JSX.Element => {
  return (
    <svg
      className="hover-target stroke-brand"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 2L18 18M18 2L2 18" stroke="#EC722B" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

export default CloseXIcon;
