'use client';

import Image from 'next/image';
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import PencilIcon from '@/components/icons/pencil';

import { formatAddressLine, type SavedAddress } from './savedAddress';

type Props = {
  address: string;
  onAddressChange: (next: string) => void;
  savedAddresses: SavedAddress[];
  onPickSaved: (line: string) => void;
  onAddAddressClick: () => void;
};

/**
 * AddressRow — address input with a dropdown of the user's saved addresses.
 *
 * Owns the dropdown open/close state and the outside-click effect that closes it.
 * The selected/typed address itself is lifted to the parent so the order submit handler can read it.
 *
 * @param   {object}                       props                   - Component props.
 * @param   {string}                       props.address           - Current address input value.
 * @param   {(next: string) => void}       props.onAddressChange   - Called when the user types in the input (parent should mark it as touched).
 * @param   {SavedAddress[]}               props.savedAddresses    - Parsed `user_address` list to render in the dropdown.
 * @param   {(line: string) => void}       props.onPickSaved       - Called when the user picks a saved address line.
 * @param   {() => void}                   props.onAddAddressClick - Called when the user clicks "Add Address" (opens profile/auth drawer).
 * @returns JSX of the address row.
 */
const AddressRow = ({
  address,
  onAddressChange,
  savedAddresses,
  onPickSaved,
  onAddAddressClick,
}: Props): JSX.Element => {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Close the saved-address dropdown when the user clicks outside of it.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  /**
   * handlePick — forwards the picked saved-address line to the parent and closes the dropdown.
   *
   * @param   {string} line - Pre-formatted address string.
   * @returns Nothing.
   */
  const handlePick = (line: string): void => {
    onPickSaved(line);
    setMenuOpen(false);
  };

  /**
   * handleAdd — closes the dropdown and forwards the "add address" click to the parent.
   *
   * @returns Nothing.
   */
  const handleAdd = (): void => {
    setMenuOpen(false);
    onAddAddressClick();
  };

  return (
    <div className={`step-payment-row flex flex-col gap-5 ${menuOpen ? 'relative z-20' : ''}`}>
      <div className="flex items-center gap-2.5 text-paper">
        <Image src="/images/icons/pin.svg" alt="" width={17} height={19} />
        <p className="font-normal text-xl text-paper">{t('address_text', 'Address')}</p>
      </div>
      <div ref={boxRef} className="relative flex items-center text-paper">
        <input
          type="text"
          value={address}
          onChange={e => onAddressChange(e.currentTarget.value)}
          placeholder="OneEntry str."
          className="w-full rounded-card border border-paper bg-transparent p-1.25 pr-8.75 text-base text-paper placeholder:text-muted-text focus:placeholder:text-transparent focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setMenuOpen(v => !v)}
          aria-label={t('change_address_text', 'Change address') || 'Change address'}
          aria-expanded={menuOpen}
          className="absolute right-1.75 top-1.75"
        >
          <PencilIcon />
        </button>
        {menuOpen && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1.25 flex flex-col gap-1.25 rounded-card border border-paper bg-ink/95 p-2.5 backdrop-blur-card shadow-xl">
            {savedAddresses.length === 0 ? (
              <p className="px-1.25 py-1.25 text-base text-paper/70">
                {t('no_saved_addresses_text', 'No saved addresses')}
              </p>
            ) : (
              savedAddresses.map(a => {
                const line = formatAddressLine(a);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handlePick(line)}
                    className="rounded-card px-1.25 py-1.25 text-left text-base text-paper transition-colors hover:text-brand"
                  >
                    {line}
                  </button>
                );
              })
            )}
            <button
              type="button"
              onClick={handleAdd}
              className="hover_btn_paper mt-2.5 self-start rounded-card border border-paper px-5 py-1.25 font-semibold text-base text-paper"
            >
              + {t('add_address_text', 'Add Address')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressRow;
