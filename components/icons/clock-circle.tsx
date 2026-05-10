import type { JSX } from 'react';

/**
 * ClockCircleIcon — clock-in-circle icon (paper or orange variant) for time/schedule labels.
 *
 * @param   {object}                  props           - Component props.
 * @param   {'paper' | 'orange'}      [props.variant] - `'paper'` paints both fill and stroke in paper; `'orange'` strokes brand without fill.
 * @returns JSX of the clock-circle SVG.
 */
const ClockCircleIcon = ({ variant = 'paper' }: { variant?: 'paper' | 'orange' }): JSX.Element => {
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
        d="M10.5 9.79311V9.586V5.01494L10.4949 4.92968C10.4783 4.81262 10.4207 4.70509 10.3321 4.62636C10.2406 4.54499 10.1224 4.50003 10 4.5L10.5 9.79311ZM10.5 9.79311L10.6464 9.93955M10.5 9.79311L10.6464 9.93955M10.6464 9.93955L13.3528 12.646M10.6464 9.93955L13.3528 12.646M13.3528 12.646C13.353 12.6461 13.3531 12.6462 13.3533 12.6464M13.3528 12.646L13.3533 12.6464M13.3533 12.6464C13.4427 12.7363 13.4946 12.8569 13.4985 12.9836C13.5023 13.1106 13.4577 13.2343 13.3737 13.3296C13.2897 13.4249 13.1726 13.4846 13.0461 13.4967C12.9241 13.5083 12.8023 13.4747 12.7036 13.4026L12.6356 13.3425L9.6467 10.3536C9.57205 10.2789 9.52306 10.1825 9.50657 10.0784L9.5 9.98285V5C9.5 4.86739 9.55268 4.74022 9.64645 4.64645C9.7402 4.55269 9.86735 4.50002 9.99993 4.5L13.3533 12.6464ZM10 0.5C15.2469 0.5 19.5 4.75314 19.5 10C19.5 15.2469 15.2469 19.5 10 19.5C4.75314 19.5 0.5 15.2469 0.5 10C0.5 4.75314 4.75314 0.5 10 0.5ZM10 1.5C7.74566 1.5 5.58365 2.39553 3.98959 3.98959C2.39553 5.58365 1.5 7.74566 1.5 10C1.5 12.2543 2.39553 14.4163 3.98959 16.0104C5.58365 17.6045 7.74566 18.5 10 18.5C12.2543 18.5 14.4163 17.6045 16.0104 16.0104C17.6045 14.4163 18.5 12.2543 18.5 10C18.5 7.74566 17.6045 5.58365 16.0104 3.98959C14.4163 2.39553 12.2543 1.5 10 1.5Z"
        fill={variant === 'paper' ? color : 'none'}
        stroke={color}
      />
    </svg>
  );
};

export default ClockCircleIcon;
