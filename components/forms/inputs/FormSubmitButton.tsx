import type { FC } from 'react';

import FormFieldAnimations from '@/components/forms/animations/FormFieldAnimations';
import Spinner from '@/components/shared/Spinner';

interface FormSubmitButtonProps {
  title: string;
  isLoading: boolean;
  index: number;
}

/**
 * Form submit button
 * @param title button title
 * @param isLoading loading state
 * @param index Index of element for animations stagger
 *
 * @returns Form submit button
 */
const FormSubmitButton: FC<FormSubmitButtonProps> = ({
  title = 'Submit',
  isLoading,
  index,
}) => {
  return (
    <FormFieldAnimations index={index} className="w-full">
      <button
        disabled={isLoading}
        type="submit"
        className="rounded-[10px] w-full h-[60px] font-semibold text-[17px] text-center flex justify-center items-center gap-[25px] text-white bg-[#ec722b] hover:bg-[#EB4B0E] border border-[#ec722b] hover:border-[#EB4B0E] mt-[25px]"
      >
        {isLoading ? <Spinner /> : title}
      </button>
    </FormFieldAnimations>
  );
};

export default FormSubmitButton;
