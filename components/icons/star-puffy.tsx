import type { JSX } from 'react';

/**
 * StarPuffyIcon — chunky filled-brand star for promo highlights.
 *
 * @returns JSX of the puffy-star SVG.
 */
const StarPuffyIcon = (): JSX.Element => {
  return (
    <svg
      className="size-5"
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15.9,7.8c0.3-0.3,0.4-0.8,0.3-1.2c-0.1-0.4-0.5-0.7-0.8-0.8l-3.6-0.9c-0.1,0-0.1-0.1-0.2-0.1l-2-3.2C9,1,8.1,0.9,7.6,1.6l-2,3.2l0,0.1L1.8,5.8l-0.1,0C1.3,6,1.1,6.3,1,6.7c-0.1,0.3,0,0.7,0.2,1l2.4,2.9l0.1,0.1c0,0,0,0.1,0,0.1l-0.3,3.8c0,0.4,0.2,0.8,0.6,1c0.3,0.2,0.7,0.2,1,0.1l3.5-1.4l3.6,1.4c0.2,0.1,0.3,0.1,0.5,0.1c0.3,0,0.5-0.1,0.7-0.3c0.3-0.2,0.4-0.6,0.3-0.9l-0.3-3.8c0-0.1,0-0.1,0.1-0.2L15.9,7.8z"
        fill="#ED742C"
        stroke="#ED742C"
        strokeWidth="2"
      />
    </svg>
  );
};

export default StarPuffyIcon;
