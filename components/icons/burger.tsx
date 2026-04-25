import type { JSX } from 'react';

const BurgerIcon = (): JSX.Element => {
  return (
    <svg
      className="stroke-[#DFE9F9] hover-target"
      width="21"
      height="17"
      viewBox="0 0 21 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.95599 2H19.0868H1.95599ZM1.95599 8.5H19.0868H1.95599ZM1.95599 15H19.0868H1.95599Z"
        fill="#4C4D56"
        fillOpacity="0.5"
      />
      <path
        d="M1.95599 2H19.0868M1.95599 8.5H19.0868M1.95599 15H19.0868"
        stroke="#DFE9F9"
        strokeWidth="3"
        strokeMiterlimit="10"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default BurgerIcon;
