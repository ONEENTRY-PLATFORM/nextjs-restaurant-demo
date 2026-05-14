import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { JSX } from 'react';

import { resolveInputType } from './reservationFormUtils';
import type { FieldValue } from './reservationTypes';

type FieldProps = {
  attr: IFormAttribute;
  values: Record<string, FieldValue>;
  onChange: (marker: string, value: FieldValue) => void;
  onOpenPicker: () => void;
  error: string | null;
};

/**
 * ReservationField — single field of the booking form (input / textarea / time-slot picker trigger).
 *
 * @param   {FieldProps}                                       props              - Component props.
 * @param   {IFormAttribute}                                   props.attr         - OneEntry form attribute.
 * @param   {Record<string, FieldValue>}                       props.values       - Current form values keyed by marker.
 * @param   {(marker: string, value: FieldValue) => void}      props.onChange     - Setter that updates a single field.
 * @param   {() => void}                                       props.onOpenPicker - Opens the date/time picker (for `timeInterval`/`time_slot`).
 * @param   {string | null}                                    props.error        - Validation error to render under the field, or `null` when valid.
 * @returns JSX of the field.
 */
const ReservationField = ({
  attr,
  values,
  onChange,
  onOpenPicker,
  error,
}: FieldProps): JSX.Element => {
  const label = attr.localizeInfos?.title ?? attr.marker;
  const isUppercase = attr.marker === 'name' || attr.marker === 'surname';
  const borderClass = error ? 'border-b-red-500' : 'border-b-muted';
  const errorNode = error ? <span className="mt-1 text-sm text-red-500">{error}</span> : null;

  if (attr.type === 'timeInterval' || attr.marker === 'time_slot') {
    const v = values[attr.marker];
    return (
      <div className="flex flex-1 flex-col">
        <button
          type="button"
          onClick={() => onOpenPicker()}
          className={`flex flex-col border-b text-left ${borderClass}`}
        >
          <span className="font-normal text-base text-paper">{label}</span>
          <span className="cart_input block">{v || 'Select date & time'}</span>
        </button>
        {errorNode}
      </div>
    );
  }

  if (attr.type === 'text') {
    return (
      <div className="flex flex-1 flex-col">
        <div className={`flex flex-col border-b ${borderClass}`}>
          <label htmlFor={attr.marker} className="font-normal text-base text-paper">
            {label}
          </label>
          <textarea
            id={attr.marker}
            name={attr.marker}
            value={values[attr.marker] ?? ''}
            onChange={ev => onChange(attr.marker, ev.currentTarget.value)}
            className="cart_input resize-none w-full"
            rows={3}
          />
        </div>
        {errorNode}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className={`flex flex-col border-b ${borderClass}`}>
        <label htmlFor={attr.marker} className="font-normal text-base text-paper">
          {label}
        </label>
        <input
          id={attr.marker}
          name={attr.marker}
          type={resolveInputType(attr.type as string, attr.marker)}
          value={values[attr.marker] ?? ''}
          onChange={ev => onChange(attr.marker, ev.currentTarget.value)}
          className={'cart_input' + (isUppercase ? ' uppercase' : '')}
        />
      </div>
      {errorNode}
    </div>
  );
};

export default ReservationField;
