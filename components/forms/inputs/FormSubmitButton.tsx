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
      <button disabled={isLoading} type="submit" className="cart_btn cursor-pointer">
        {isLoading ? <Spinner /> : title}
      </button>
    </FormFieldAnimations>
  );
};

export default FormSubmitButton;
