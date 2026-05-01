import Image from 'next/image';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { JSX } from 'react';

import Placeholder from '@/components/shared/Placeholder';

/**
 * Картинка продукта — 1:1 порт `.menu_item > img.w-full` из
 * `static-html/index.html`. Читает `attributes.cover.value` (главное
 * изображение продукта из OneEntry set'а атрибутов `dish` — поддерживает обе
 * формы: объект и массив), fallback на {@link Placeholder}, если изображение
 * не задано.
 * @param   {object}          props            - Пропсы компонента.
 * @param   {IAttributeValues} props.attributes - `product.attributeValues`.
 * @param   {string}          props.alt        - Текст alt для accessibility.
 * @returns {JSX.Element}                      JSX картинки.
 */
const ProductImage = ({
  attributes,
  alt,
}: {
  attributes: IAttributeValues;
  alt: string;
}): JSX.Element => {
  const productImage = attributes?.cover?.value as
    | { downloadLink?: string }
    | Array<{ downloadLink?: string }>
    | undefined;
  const imageSrc = Array.isArray(productImage)
    ? productImage[0]?.downloadLink
    : productImage?.downloadLink;

  if (!imageSrc) {
    // pb-12 сдвигает центрированный логотип вверх, чтобы визуально
    // компенсировать info-полоску ("30-45 min · 50g · ★ 4"), наложенную
    // на нижний край картинки карточки — без этого логотип кажется смещённым.
    return (
      <div className="relative aspect-square w-full">
        <Placeholder className="pb-8" />
      </div>
    );
  }

  // Оборачиваем картинку в контейнер с overflow-hidden, чтобы scale на hover
  // не вылезал за границы карточки.
  return (
    <div className="relative aspect-square w-full overflow-hidden">
      <Image
        src={imageSrc}
        alt={alt}
        width={340}
        height={340}
        sizes="(min-width: 1240px) 278px, (min-width: 1020px) 220px, (min-width: 768px) 340px, 164px"
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
};

export default ProductImage;
