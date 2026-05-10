import type { JSX } from 'react';

/**
 * BurgerOrangeIcon — orange three-line "burger" menu icon (active mobile state).
 *
 * @returns JSX of the orange burger-menu SVG.
 */
const BurgerOrangeIcon = (): JSX.Element => {
  return (
    <svg
      className="stroke-brand hover-target"
      width="21"
      height="17"
      viewBox="0 0 21 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.20001 2H19.3308M2.20001 8.5H19.3308M2.20001 15H19.3308"
        stroke="#EC722B"
        strokeWidth="3"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default BurgerOrangeIcon;
