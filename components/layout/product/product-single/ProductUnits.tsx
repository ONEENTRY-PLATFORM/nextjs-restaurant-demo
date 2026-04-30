import type { JSX } from 'react';

/**
 * Количество единиц продукта
 */
const ProductUnits = ({ units }: { units: number }): JSX.Element => {
  const maxUnits = units < 50 ? 50 : units * 1.2;
  const width = (units / maxUnits) * 100;

  return (
    <div className="relative mb-6 box-border flex shrink-0 flex-col ">
      <div className="self-end text-sm text-paper/60">{units} units</div>
      <div className="z-10 mt-1.5 flex w-full flex-row justify-start rounded-xl bg-paper/20">
        <div
          className={'mr-auto h-0.75 shrink-0 rounded-xl bg-brand'}
          style={{
            width: width + '%',
          }}
        />
      </div>
    </div>
  );
};

export default ProductUnits;
