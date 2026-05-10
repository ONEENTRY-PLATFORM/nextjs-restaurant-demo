'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';

/**
 * AvailabilityFilter — toggle that adds/removes the `in_stock` URL search param.
 *
 * @param   {object}      props         - Component props.
 * @param   {string}      [props.title] - Label displayed next to the toggle.
 * @returns {JSX.Element} JSX of the availability toggle row.
 */
const AvailabilityFilter = ({ title }: { title?: string }): JSX.Element => {
  const pathname = usePathname();
  const { replace } = useRouter();

  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);
  const [available, setAvailability] = useState(params.get('in_stock') ? true : false);

  useEffect(() => {
    if (available) {
      params.set('in_stock', available ? 'true' : '');
    } else {
      params.delete('in_stock');
    }
    replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  return (
    <div className="mb-9 flex gap-5">
      <label htmlFor="availability" className="flex-auto text-lg leading-8 text-white/90">
        {title}
      </label>
      <div className="relative inline-block w-10 select-none align-middle transition duration-200 ease-in">
        <input
          id="availability"
          type="checkbox"
          checked={params.get('in_stock') ? true : false}
          onChange={() => setAvailability(!available)}
          className="toggle-checkbox absolute block size-6 cursor-pointer appearance-none rounded-full border-4 bg-paper transition-all duration-300 hover:border-brand"
        />
        <label
          htmlFor="availability"
          className="toggle-label block h-6 cursor-pointer overflow-hidden rounded-full bg-paper/30 transition-all duration-300"
        ></label>
      </div>
    </div>
  );
};

export default AvailabilityFilter;
