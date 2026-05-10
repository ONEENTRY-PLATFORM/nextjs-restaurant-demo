import type { JSX } from 'react';

/**
 * ArrowBackIcon — currentColor "back" arrow inheriting color from the parent text.
 *
 * @param   {object}      props             - Component props.
 * @param   {string}      [props.className] - Additional className merged onto the SVG.
 * @returns JSX of the back-arrow SVG.
 */
const ArrowBackIcon = ({ className }: { className?: string }): JSX.Element => {
  return (
    <svg
      width="27"
      height="21"
      viewBox="0 0 27 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M11.6157 0.750531C11.2648 0.395572 10.7889 0.196167 10.2926 0.196167C9.79638 0.196167 9.32046 0.395572 8.96951 0.750531L0.547949 9.27087C0.197104 9.62593 1.14441e-05 10.1074 1.14441e-05 10.6095C1.14441e-05 11.1116 0.197104 11.5931 0.547949 11.9481L8.96951 20.4685C9.32247 20.8134 9.7952 21.0042 10.2859 20.9999C10.7766 20.9956 11.246 20.7965 11.5929 20.4454C11.9399 20.0944 12.1368 19.6195 12.141 19.123C12.1453 18.6266 11.9566 18.1483 11.6157 17.7912L6.54971 12.5029H24.3286C24.8249 12.5029 25.3009 12.3034 25.6519 11.9483C26.0028 11.5933 26.2 11.1117 26.2 10.6095C26.2 10.1073 26.0028 9.62575 25.6519 9.27066C25.3009 8.91558 24.8249 8.7161 24.3286 8.7161H6.54971L11.6157 3.42781C11.9666 3.07274 12.1637 2.59123 12.1637 2.08917C12.1637 1.58711 11.9666 1.1056 11.6157 0.750531Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default ArrowBackIcon;
