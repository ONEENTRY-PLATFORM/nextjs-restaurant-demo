import parse from 'html-react-parser';
import type { JSX } from 'react';

/**
 * Product description component
 */
const ProductDescription = ({ description }: {
  description: {
    value: {
      htmlValue: string;
      plainValue: string;
    }[];
  };
}): JSX.Element => {
  if (!description) {
    return <></>;
  }
  const descript =
    description.value[0]?.htmlValue || description.value[0]?.plainValue;
  return (
    <div className="text-sm leading-5 text-neutral-600">
      {descript && parse(descript)}
    </div>
  );
};

export default ProductDescription;
