import type { JSX } from 'react';

import FormFieldAnimations from '@/components/forms/animations/FormFieldAnimations';
import Spinner from '@/components/shared/Spinner';

/**
 * Form submit button
 */
const FormSubmitButton = ({
  title = 'Submit',
  isLoading,
  index,
}: {
  title: string;
  isLoading: boolean;
  index: number;
}): JSX.Element => {
  return (
    <FormFieldAnimations index={index} className="w-full">
      <button
        disabled={isLoading}
        type="submit"
        className="rounded-[10px] w-full h-[60px] font-semibold text-[17px] text-center text-white bg-[#ec722b] hover:bg-[#EB4B0E] border border-[#ec722b] hover:border-[#EB4B0E] mt-[25px] cursor-pointer"
      >
        {isLoading ? <Spinner /> : title}
      </button>
    </FormFieldAnimations>
  );
};

export default FormSubmitButton;
