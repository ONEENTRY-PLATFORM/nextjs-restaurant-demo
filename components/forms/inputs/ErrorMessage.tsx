/**
 * ErrorMessage — small centred red error label rendered under a form.
 *
 * @param   {object} props       - Component props.
 * @param   {string} props.error - Error text to display.
 * @returns JSX of the error message.
 */
const ErrorMessage = ({ error }: { error: string }) => {
  return <div className="text-center text-sm text-red-500">{error}</div>;
};

export default ErrorMessage;
