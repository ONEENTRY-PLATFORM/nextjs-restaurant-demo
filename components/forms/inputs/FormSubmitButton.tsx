import type { JSX } from 'react';

import FormFieldAnimations from '@/components/forms/animations/FormFieldAnimations';
import Spinner from '@/components/shared/Spinner';

/**
 * Кнопка сабмита формы
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
        className="rounded-[10px] w-full h-15 font-semibold text-[17px] text-center text-white bg-brand hover:bg-brand-hover border border-brand hover:border-brand-hover mt-6.25 cursor-pointer"
      >
        {isLoading ? <Spinner /> : title}
      </button>
    </FormFieldAnimations>
  );
};

export default FormSubmitButton;
