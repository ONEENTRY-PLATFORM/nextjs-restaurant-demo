import type { JSX } from 'react';

const TrashIcon = (): JSX.Element => {
  return (
    <svg
      className="hover-target"
      width="20"
      height="25"
      viewBox="0 0 20 25"
      fill="#dfe9f9"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.3695 8.33333V22.2222H4.6989V8.33333H15.3695ZM13.3688 0H6.69963L5.36581 1.38889H0.697418V4.16667H19.371V1.38889H14.7026L13.3688 0ZM18.0372 5.55556H2.03124V22.2222C2.03124 23.75 3.23169 25 4.6989 25H15.3695C16.8367 25 18.0372 23.75 18.0372 22.2222V5.55556Z"
        fill="#DFE9F9"
      />
    </svg>
  );
};

export default TrashIcon;
