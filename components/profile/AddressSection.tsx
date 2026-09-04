'use client';

import Image from 'next/image';
import type { IAuthFormData, IUserEntity } from 'oneentry/types';
import type { JSX } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { getApi, isError } from '@/app/api/api/api';
import { useT } from '@/app/store/providers/DictProvider';
import { normalizeErrorMessage } from '@/app/utils/errorHandler';
import { userHasPasswordAuth } from '@/components/forms/authProviders';
import {
  getUserField,
  getUserRawField,
  parseAddresses,
  type SavedAddress,
  type UserFormData,
} from '@/components/profile/profileSectionsUtils';
import { getFormAttributes, normalizePhoneE164 } from '@/components/utils';

type AddressSectionProps = {
  user: IUserEntity | undefined;
  userForm: UserFormData;
  refreshUser: () => void;
  defaultAddAddressOpen: boolean;
};

/**
 * AddressSection — collapsible "Address" block: saved addresses + add-address form.
 *
 * Selecting / deleting / adding an address re-serializes `user_address` and persists it via `updateUser`.
 * For OAuth sessions the payload omits `notificationData` and back-fills the missing `email`
 * row from `user.identifier` (parity with email-provider records).
 *
 * @param   {AddressSectionProps}     props                       - Component props.
 * @param   {IUserEntity | undefined} props.user                  - Current authenticated user.
 * @param   {UserFormData}            props.userForm              - `user` form definition (attributes).
 * @param   {() => void}              props.refreshUser           - Re-fetches the user after a successful save.
 * @param   {boolean}                 props.defaultAddAddressOpen - Whether the add-address form starts expanded.
 * @returns JSX of the "Address" section.
 */
const AddressSection = ({
  user,
  userForm,
  refreshUser,
  defaultAddAddressOpen,
}: AddressSectionProps): JSX.Element => {
  const t = useT();
  const [addressOpen, setAddressOpen] = useState(true);
  const [addAddressOpen, setAddAddressOpen] = useState(defaultAddAddressOpen);

  const [pendingAddresses, setPendingAddresses] = useState<SavedAddress[] | null>(null);
  const [newStreet, setNewStreet] = useState('');
  const [newHouse, setNewHouse] = useState('');
  const [newFloor, setNewFloor] = useState('');
  const [addressError, setAddressError] = useState('');

  const baseAddresses = useMemo<SavedAddress[]>(() => {
    const parsed = parseAddresses(getUserRawField(user, 'user_address'));
    if (parsed.length > 0 && !parsed.some(a => a.selected)) {
      parsed[0]!.selected = true;
    }
    return parsed;
  }, [user]);
  const addresses = pendingAddresses ?? baseAddresses;

  const persistAddresses = useCallback(
    async (next: SavedAddress[]) => {
      if (!user?.formIdentifier || !Array.isArray(user.formData)) return;
      setAddressError('');
      const serialized = JSON.stringify(next);
      const passwordAuth = userHasPasswordAuth(user);
      const allowedMarkers = new Set(
        getFormAttributes(userForm)
          .filter(a => (!a.isLogin || !passwordAuth) && !a.isPassword)
          .map(a => a.marker)
      );
      const formData = (user.formData as Array<{ marker: string; type?: string; value: unknown }>)
        .filter(f => f.marker !== 'otp_code' && allowedMarkers.has(f.marker))
        .map(f =>
          f.marker === 'user_address'
            ? { marker: 'user_address', type: 'json', value: serialized }
            : { marker: f.marker, type: f.type ?? 'string', value: f.value }
        );
      if (allowedMarkers.has('user_address') && !formData.some(f => f.marker === 'user_address')) {
        formData.push({ marker: 'user_address', type: 'json', value: serialized });
      }
      // OAuth-created users have no `email` row in formData (the address lives in
      // `user.identifier`) — backfill it so their record reaches parity with
      // email-provider users (both providers share the same `user` form).
      const loginAttr = getFormAttributes(userForm).find(a => a.isLogin);
      if (
        !passwordAuth &&
        loginAttr &&
        !formData.some(f => f.marker === loginAttr.marker) &&
        user.identifier?.includes('@')
      ) {
        formData.push({ marker: loginAttr.marker, type: 'string', value: user.identifier });
      }
      try {
        // phoneSMS is optional and validated server-side against /^\+[0-9]{10,15}$/ - do not send a malformed phone in formData, otherwise it blocks saving addresses.
        const phone = normalizePhoneE164(getUserField(user, 'phone'));
        const phoneValid = /^\+[0-9]{10,15}$/.test(phone);
        // No `authData` — updateUser without credentials is permitted for the currently authenticated user.
        // notificationData only for password-provider accounts: OAuth-created users have no
        // notification record server-side and PUT /me 500s on it ("reading 'en_US'" of null).
        const res = await getApi().Users.updateUser({
          formIdentifier: user.formIdentifier,
          formData: formData as unknown as IAuthFormData[],
          ...(userHasPasswordAuth(user)
            ? {
                notificationData: {
                  email: getUserField(user, 'email') || user.identifier || '',
                  phonePush: [],
                  ...(phoneValid ? { phoneSMS: phone } : {}),
                },
              }
            : {}),
          state: {},
        });
        // The SDK returns an IError envelope instead of throwing — a failed save must
        // not refresh the user as if it succeeded.
        if (isError(res)) {
          setAddressError(
            normalizeErrorMessage(
              (res as { message?: string | string[] }).message,
              'Failed to save address'
            )
          );
          return;
        }
        refreshUser();
      } catch (e) {
        setAddressError(e instanceof Error ? e.message : 'Failed to save address');
      }
    },
    [refreshUser, user, userForm]
  );

  const onApplyAddress = async () => {
    if (!newStreet.trim()) return;
    const newEntry: SavedAddress = {
      id: `a${Date.now()}`,
      street: newStreet.trim(),
      house: newHouse.trim(),
      floor: newFloor.trim(),
      selected: addresses.length === 0,
    };
    const next = [...addresses, newEntry];
    setPendingAddresses(next);
    setNewStreet('');
    setNewHouse('');
    setNewFloor('');
    setAddAddressOpen(false);
    await persistAddresses(next);
    setPendingAddresses(null);
  };

  const onDeleteAddress = async (id: string) => {
    const next = addresses.filter(a => a.id !== id);
    if (next.length > 0 && !next.some(a => a.selected)) {
      next[0]!.selected = true;
    }
    setPendingAddresses(next);
    await persistAddresses(next);
    setPendingAddresses(null);
  };

  const onSelectAddress = async (id: string) => {
    const next = addresses.map(a => ({ ...a, selected: a.id === id }));
    setPendingAddresses(next);
    await persistAddresses(next);
    setPendingAddresses(null);
  };

  return (
    <div className="profile-anim-row">
      <button
        type="button"
        onClick={() => setAddressOpen(v => !v)}
        className="mt-5 flex w-full items-center justify-start gap-2.5"
      >
        <Image src="/images/icons/pin.svg" alt="" width={17} height={19} />
        <p className="text-xl text-paper">{t('address_text', 'Address')}</p>
        <Image
          src="/images/icons/chevron-up.svg"
          alt=""
          width={12}
          height={7}
          className={`transition-transform ${addressOpen ? '' : 'rotate-180'}`}
        />
      </button>

      {addressOpen && (
        <div className="mt-5">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className="profile-anim-row mt-2.5 flex items-center justify-between gap-2.5"
            >
              <label className="flex flex-1 cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  name="user-address"
                  checked={Boolean(addr.selected)}
                  onChange={() => onSelectAddress(addr.id)}
                />
                <span className="radio-custom" />
                <span className="text-xl font-normal text-white">
                  {addr.street} str., {addr.house}
                  {addr.floor ? `, fl. ${addr.floor}` : ''}
                </span>
              </label>
              <button
                type="button"
                onClick={() => onDeleteAddress(addr.id)}
                className="hover_btn_transp flex items-center justify-center rounded-card border border-brand px-5 py-1.25 text-base font-bold text-brand"
              >
                {t('delete_button', 'Delete')}
              </button>
            </div>
          ))}
          {addressError && <p className="mt-2.5 text-[13px] text-red-400">{addressError}</p>}
          <button
            type="button"
            onClick={() => setAddAddressOpen(v => !v)}
            className="profile-anim-row hover_btn_paper mt-7.5 rounded-card border border-paper px-5 py-1.25 text-base font-semibold text-paper"
          >
            {t('add_address_button', '+ Add Address')}
          </button>
          <form
            hidden={!addAddressOpen}
            className="mt-6.25 flex max-w-75 flex-wrap gap-2.5"
            onSubmit={e => {
              e.preventDefault();
              onApplyAddress();
            }}
          >
            <div className="w-full">
              <label className="text-base font-normal text-paper">
                {t('street_label', 'Street')}
              </label>
              <input
                className="mt-2.5 h-6.75 w-full rounded-card border border-muted bg-transparent px-5 text-paper focus:outline-muted"
                type="text"
                placeholder=""
                value={newStreet}
                onChange={e => setNewStreet(e.target.value)}
              />
            </div>
            <div className="flex w-1/6 flex-col gap-2.5">
              <label className="text-base font-normal text-paper">
                {t('house_label', 'House')}
              </label>
              <input
                className="h-6.75 rounded-card border border-muted bg-transparent px-2.5 text-paper focus:outline-muted"
                type="text"
                placeholder=""
                value={newHouse}
                onChange={e => setNewHouse(e.target.value)}
              />
            </div>
            <div className="flex w-1/6 flex-col gap-2.5">
              <label className="text-base font-normal text-paper">
                {t('floor_label', 'Floor')}
              </label>
              <input
                className="h-6.75 rounded-card border border-muted bg-transparent px-2.5 text-paper focus:outline-muted"
                type="text"
                placeholder=""
                value={newFloor}
                onChange={e => setNewFloor(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="hover_btn_transp flex h-6.75 items-center justify-center self-end rounded-card border border-brand px-5 py-1.25 text-base font-bold text-brand"
            >
              {t('apply_text', 'Apply')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddressSection;
