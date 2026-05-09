import type { JSX } from 'react';

import DeleteIcon from '@/components/icons/delete';

import { useCartRemoveWithUndo } from './useCartRemoveWithUndo';

/** Cart product remove button with undo toast. */
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
