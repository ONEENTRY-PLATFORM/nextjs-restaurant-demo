import type { JSX } from 'react';

import DeleteIcon from '@/components/icons/delete';

import { useCartRemoveWithUndo } from './useCartRemoveWithUndo';

/**
 * DeleteButton — cart product remove button with an undo toast.
 *
 * @param   {object}      props           - Component props.
 * @param   {number}      props.productId - Cart product id to remove.
 * @param   {string}      props.title     - Product title used in the undo toast text.
 * @returns {JSX.Element} JSX of the trash button.
 */
const DeleteButton = ({ productId, title }: { productId: number; title: string }): JSX.Element => {
  const removeWithUndo = useCartRemoveWithUndo(productId, title);

  return (
    <button
      type="button"
      className="group relative box-border flex size-5 shrink-0 flex-col items-center justify-center"
      aria-label="Delete item"
      onClick={() => removeWithUndo()}
    >
      <DeleteIcon />
    </button>
  );
};

export default DeleteButton;
