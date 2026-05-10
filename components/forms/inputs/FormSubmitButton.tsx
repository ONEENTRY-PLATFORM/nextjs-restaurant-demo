import type { JSX } from 'react';

import FormFieldAnimations from '@/components/forms/animations/FormFieldAnimations';
import Spinner from '@/components/shared/Spinner';

/**
 * FormSubmitButton — primary submit button for forms with a loading-state spinner.
 *
 * @param   {object}  props           - Component props.
 * @param   {string}  props.title     - Button label (defaults to `'Submit'`).
 * @param   {boolean} props.isLoading - When `true`, replaces the label with a spinner and disables the button.
 * @param   {number}  props.index     - Animation index used by `FormFieldAnimations` for staggered reveal.
 * @returns JSX of the submit button wrapped in form-field animations.
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
