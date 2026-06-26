import type { JSX } from 'react';

/**
 * Skeleton — single pulsing placeholder block used to compose page loading skeletons.
 *
 * @param   {object}   props             - Component props.
 * @param   {string}   [props.className] - Tailwind classes controlling size, rounding and shade (e.g. `h-4 w-1/2 rounded-full`). Defaults give a medium-radius bar at the standard shade.
 * @returns JSX of a single pulsing placeholder.
 */
const Skeleton = ({ className = '' }: { className?: string }): JSX.Element => {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-paper/15 ${className}`} />;
};

export default Skeleton;
