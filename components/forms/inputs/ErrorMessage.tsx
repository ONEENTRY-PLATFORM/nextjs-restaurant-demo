/**
 * Сообщение об ошибке
 */
const ErrorMessage = ({ error }: { error: string }) => {
  return <div className="text-center text-sm text-red-500">{error}</div>;
};

export default ErrorMessage;
