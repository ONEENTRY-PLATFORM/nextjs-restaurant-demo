import clsx from 'clsx';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { Dispatch, JSX, SetStateAction } from 'react';

import CarouselItemImage from './CarouselItemImage';
import CarouselItemTitle from './CarouselItemTitle';

/**
 * CarouselItem component
 */
const CarouselItem = ({
  item,
  index,
  currentIndex,
  setCurrentIndex,
}: {
  index: number;
  item: IProductsEntity;
  currentIndex: number;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
}): JSX.Element => {
  const isActive = index === currentIndex;

  const onSelectHandle = () => {
    setCurrentIndex(index);
  };

  return (
    <button
      onClick={onSelectHandle}
      className={
        'relative rounded-lg box-border flex w-[100px] min-h-[130px] shrink-0 flex-col ' +
        clsx(
          isActive
            ? 'border border-solid border-brand text-white'
            : 'border border-solid border-transparent text-paper/60',
        )
      }
    >
      <div className="flex w-full flex-col gap-1 overflow-hidden pb-1 text-center text-sm">
        <div className="flex h-20 w-full items-center">
          <CarouselItemImage item={item} />
        </div>
        <h3 className="w-full text-center text-xs leading-4">
          <CarouselItemTitle item={item} />
        </h3>
      </div>
    </button>
  );
};

export default CarouselItem;
