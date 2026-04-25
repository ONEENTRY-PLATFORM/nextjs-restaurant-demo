import type { JSX } from 'react';

const ClockCircleIcon = ({
  variant = 'paper',
}: {
  variant?: 'paper' | 'orange';
}): JSX.Element => {
  const color = variant === 'paper' ? '#DFE9F9' : '#EC722B';
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 0.5C15.2469 0.5 19.5 4.75314 19.5 10C19.5 15.2469 15.2469 19.5 10 19.5C4.75314 19.5 0.5 15.2469 0.5 10C0.5 4.75314 4.75314 0.5 10 0.5ZM10 1.5C7.74566 1.5 5.58365 2.39553 3.98959 3.98959C2.39553 5.58365 1.5 7.74566 1.5 10C1.5 12.2543 2.39553 14.4163 3.98959 16.0104C5.58365 17.6045 7.74566 18.5 10 18.5C12.2543 18.5 14.4163 17.6045 16.0104 16.0104C17.6045 14.4163 18.5 12.2543 18.5 10C18.5 7.74566 17.6045 5.58365 16.0104 3.98959C14.4163 2.39553 12.2543 1.5 10 1.5Z"
        fill={variant === 'paper' ? color : 'none'}
        stroke={color}
      />
    </svg>
  );
};

export default ClockCircleIcon;
