import Image from 'next/image';
import type { JSX } from 'react';

/**
 * Компонент картинки продукта в группе
 * @param {object} props - Параметры компонента
 * @param {string} props.imageSrc - URL картинки продукта
 * @returns {JSX.Element} Компонент картинки продукта
 */
const ProductImage = ({ imageSrc }: { imageSrc: string }): JSX.Element => {
  return (
    <div
      className="relative h-32.5 w-27.5 shrink-0"
      role="img"
      aria-label="Product image"
    >
      <Image
        fill
        sizes="(min-width: 600px) 66vw, 100vw"
        src={imageSrc}
        alt="Product"
        className="mb-10 size-full shrink-0 rounded-xl object-cover max-md:mb-8 max-sm:mb-8"
      />
    </div>
  );
};

export default ProductImage;
