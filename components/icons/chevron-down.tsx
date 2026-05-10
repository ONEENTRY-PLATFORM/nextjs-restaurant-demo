import type { JSX } from 'react';

/**
 * ChevronDownIcon — orange down-chevron used in expand/collapse controls.
 *
 * @param   {object}      props             - Component props.
 * @param   {string}      [props.className] - Additional className merged onto the SVG.
 * @returns {JSX.Element} JSX of the chevron-down SVG.
 */
const ChevronDownIcon = ({ className }: { className?: string }): JSX.Element => {
  return (
    <svg
      width="15"
      height="10"
      viewBox="0 0 15 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2 2L7.5 8L13 2"
        stroke="#EC722B"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ChevronDownIcon;
