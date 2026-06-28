import type { JSX } from 'react';

/**
 * HeartScriptIcon — script-style filled heart icon for the desktop favorites nav item.
 *
 * @returns JSX of the script-heart SVG.
 */
const HeartScriptIcon = (): JSX.Element => {
  return (
    <svg
      id="head-heart"
      className="hover-target h-6 w-7.25 fill-paper"
      x="0px"
      y="0px"
      viewBox="0 0 25.8 23.2"
    >
      <path
        className="st0"
        d="M13.1,21.9h-0.4l-0.2-0.1c-1.9-1.2-3.7-2.5-5.4-4c-3.7-3.1-5.7-6.4-5.7-9.6c0-1.7,0.7-3.4,1.8-4.6 c1.2-1.2,2.7-1.8,4.4-1.8c2.2,0,4.1,0.9,5.3,2.6l0,0c1.1-1.6,3.1-2.6,5.2-2.6c1.7,0,3.3,0.7,4.5,1.8c1.2,1.2,1.8,2.8,1.8,4.6 c0,3.1-1.9,6.3-5.7,9.6c-1.8,1.6-3.6,2.9-5.6,4L13.1,21.9z M7.7,2.9c-1.4,0-2.6,0.5-3.6,1.6c-1,1-1.6,2.4-1.6,3.8 c0,2.8,1.8,5.9,5.3,8.8c1.6,1.4,3.3,2.6,5.1,3.8c1.8-1,3.6-2.3,5.3-3.8c3.5-3.1,5.3-6,5.3-8.8c0-1.5-0.6-2.8-1.6-3.8 c-1-1-2.4-1.6-3.7-1.6c-1.8,0-3.4,0.9-4.4,2.3L13,6.5l-0.8-1.4C11.1,3.7,9.6,2.9,7.7,2.9z"
      />
    </svg>
  );
};

export default HeartScriptIcon;
