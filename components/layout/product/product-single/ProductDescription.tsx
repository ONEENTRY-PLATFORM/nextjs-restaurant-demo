import parse from 'html-react-parser';
import type { JSX } from 'react';

/**
 * Product description component
 */
const ProductDescription = ({
  description,
}: {
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
    <div className="font-normal text-[14px] tracking-[0.02em] text-white/90">
      {descript && parse(descript)}
    </div>
  );
};

export default ProductDescription;
