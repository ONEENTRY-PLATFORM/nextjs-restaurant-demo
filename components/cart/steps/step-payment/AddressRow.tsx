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
  placeholder: string;
};

/**
 * AddressRow — address input with a dropdown of the user's saved addresses.
 *
 * @param   {object}                       props                   - Component props.
 * @param   {string}                       props.address           - Current address input value.
 * @param   {(next: string) => void}       props.onAddressChange   - Called when the user types in the input (parent should mark it as touched).
 * @param   {SavedAddress[]}               props.savedAddresses    - Parsed `user_address` list to render in the dropdown.
 * @param   {(line: string) => void}       props.onPickSaved       - Called when the user picks a saved address line.
 * @param   {() => void}                   props.onAddAddressClick - Called when the user clicks "Add Address" (opens profile/auth drawer).
 * @param   {string}                       props.placeholder       - Input placeholder pulled from the `delivery_address` form-attribute `additionalFields`.
 * @returns JSX of the address row.
 */
const AddressRow = ({
  address,
  onAddressChange,
  savedAddresses,
  onPickSaved,
  onAddAddressClick,
  placeholder,
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
        <p className="text-xl font-normal text-paper">{t('address_text', 'Address')}</p>
      </div>
      <div ref={boxRef} className="relative flex items-center text-paper">
        <input
          type="text"
          value={address}
          onChange={e => onAddressChange(e.currentTarget.value)}
          placeholder={placeholder}
          className="w-full rounded-card border border-paper bg-transparent p-1.25 pr-8.75 text-base text-paper placeholder:text-muted-text focus:outline-none focus:placeholder:text-transparent"
        />
        <button
          type="button"
          onClick={() => setMenuOpen(v => !v)}
          aria-label={t('change_address_text', 'Change address') || 'Change address'}
          aria-expanded={menuOpen}
          className="absolute top-1.75 right-1.75"
        >
          <PencilIcon />
        </button>
        {menuOpen && (
          <div className="absolute inset-x-0 top-full z-10 mt-1.25 flex flex-col gap-1.25 rounded-card border border-paper bg-ink/95 p-2.5 shadow-xl backdrop-blur-card">
            {savedAddresses.length === 0 ? (
              <p className="p-1.25 text-base text-paper/70">
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
                    className="rounded-card p-1.25 text-left text-base text-paper transition-colors hover:text-brand"
                  >
                    {line}
                  </button>
                );
              })
            )}
            <button
              type="button"
              onClick={handleAdd}
              className="hover_btn_paper mt-2.5 self-start rounded-card border border-paper px-5 py-1.25 text-base font-semibold text-paper"
            >
              + {t('add_address_button', 'Add Address')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressRow;
