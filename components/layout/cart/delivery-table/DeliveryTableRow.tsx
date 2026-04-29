import type { JSX, ReactNode } from 'react';
import { useContext } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';

import TableRowAnimations from '../animations/TableRowAnimations';

/**
 * Delivery table row — date preview shown on the initial `cart` step.
 * Clicking the row opens the `CalendarForm` modal popup (registered in
 * `components/forms/index.tsx`, rendered through the shared `Modal`
 * layer). The modal updates `cartReducer.deliveryData` and closes — the
 * cart view stays put, so cart animations don't replay.
 */
const DeliveryTableRow = ({
  label,
  value,
  icon,
  placeholder,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  placeholder: string;
}): JSX.Element => {
  const { setOpen, setComponent } = useContext(OpenDrawerContext);
  const openCalendar = () => {
    setComponent('CalendarForm');
    setOpen(true);
  };

  return (
    <TableRowAnimations
      className="tr h-12.5 border-t border-solid border-muted max-md:max-w-full max-md:flex-wrap"
      index={7}
    >
      <div className="td w-3/12 align-middle text-sm">
        <label className="my-auto h-5" htmlFor={'label-' + placeholder}>
          {label}
        </label>
      </div>
      <div className="td w-8/12 px-5 align-middle text-base">
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          readOnly
          id={'label-' + placeholder}
          name={placeholder}
          onClick={openCalendar}
          className="w-full bg-transparent text-paper focus:outline-none cursor-pointer"
        />
      </div>
      <button
        type="button"
        onClick={openCalendar}
        aria-label={label}
        className="td w-1/12 pl-5 align-middle cursor-pointer"
      >
        {icon}
      </button>
    </TableRowAnimations>
  );
};

export default DeliveryTableRow;
