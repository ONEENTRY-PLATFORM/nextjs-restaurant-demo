'use client';

import Image from 'next/image';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { JSX } from 'react';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { getApi, useGetFormByMarkerQuery } from '@/app/api';
import { useAppSelector } from '@/app/store/hooks';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ProfileIcon from '@/components/icons/profile';
import { normalizePhoneE164 } from '@/components/utils';

type SavedAddress = {
  id: string;
  street: string;
  house: string;
  floor: string;
  selected?: boolean;
};

/**
 * parseAddresses — parses `user_address` JSON (array or legacy JSON string) into a typed list.
 *
 * @param   {unknown}        raw - Raw OneEntry attribute value.
 * @returns Array of `SavedAddress` items (empty on parse failure or unexpected shape).
 */
const parseAddresses = (raw: unknown): SavedAddress[] => {
  if (!raw) return [];
  let arr: unknown = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.filter(
    (a): a is SavedAddress => typeof a === 'object' && a !== null && typeof a.id === 'string'
  );
};

/** Attributes of the `user` form that are not rendered in the "My Profile" section. */
const HIDDEN_PROFILE_MARKERS = new Set([
  'repeat_password',
  'email_notifications',
  'email_notification_reg',
  'user_address',
  'user_flat',
  'user_floor',
]);

/**
 * resolveInputType — picks the HTML input type for a OneEntry user-form attribute.
 *
 * @param   {IFormAttribute} attr - OneEntry form attribute.
 * @returns `'password'`, `'email'`, or `'text'` depending on the marker.
 */
const resolveInputType = (attr: IFormAttribute): string => {
  if (attr.marker.includes('password')) return 'password';
  if (attr.marker.includes('email')) return 'email';
  return 'text';
};

/**
 * ProfileSections — collapsible "My Profile" + "Address" sections in the profile drawer.
 *
 * @returns JSX of the profile sections (form + saved addresses + add-address form).
 */
const ProfileSections = (): JSX.Element => {
  const t = useT();
  const { user, refreshUser } = useContext(AuthContext);
  const { action, setAction } = useContext(OpenDrawerContext);

  // When opened from "+ Add Address" in the checkout step, collapse My Profile and jump straight to the add-address form.
  const addAddressIntent = action === 'add-address';
  const [profileOpen, setProfileOpen] = useState(() => !addAddressIntent);
  const [addressOpen, setAddressOpen] = useState(true);
  const [addAddressOpen, setAddAddressOpen] = useState(() => addAddressIntent);

  // Consume the intent so subsequent reopens of the popup show the default layout.
  useEffect(() => {
    if (addAddressIntent) setAction('');
  }, [addAddressIntent, setAction]);

  const [pendingAddresses, setPendingAddresses] = useState<SavedAddress[] | null>(null);
  const [newStreet, setNewStreet] = useState('');
  const [newHouse, setNewHouse] = useState('');
  const [newFloor, setNewFloor] = useState('');
  const [addressError, setAddressError] = useState('');

  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { data: userForm } = useGetFormByMarkerQuery({ marker: 'user' });

  const profileAttributes = useMemo<IFormAttribute[]>(
    () =>
      (userForm?.attributes ?? [])
        .filter(attr => !HIDDEN_PROFILE_MARKERS.has(attr.marker))
        .slice()
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [userForm]
  );

  const userField = useCallback(
    (marker: string): string => {
      if (!user?.formData || !Array.isArray(user.formData)) return '';
      const row = (user.formData as Array<{ marker: string; value: unknown }>).find(
        f => f.marker === marker
      );
      return typeof row?.value === 'string' ? row.value : '';
    },
    [user]
  );

  // Raw value without casting to string - for `json` fields (`user_address`), where the SDK returns an array/object.
  const userRawField = useCallback(
    (marker: string): unknown => {
      if (!user?.formData || !Array.isArray(user.formData)) return undefined;
      const row = (user.formData as Array<{ marker: string; value: unknown }>).find(
        f => f.marker === marker
      );
      return row?.value;
    },
    [user]
  );

  const sessionFields = useAppSelector(state => state.formFieldsReducer.fields);
  const sessionPassword = sessionFields['password']?.value ?? '';

  const fieldValue = useCallback(
    (marker: string): string => {
      if (marker.includes('password')) return edits[marker] ?? sessionPassword;
      return edits[marker] !== undefined ? edits[marker]! : userField(marker);
    },
    [edits, sessionPassword, userField]
  );

  const baseAddresses = useMemo<SavedAddress[]>(() => {
    const parsed = parseAddresses(userRawField('user_address'));
    if (parsed.length > 0 && !parsed.some(a => a.selected)) {
      parsed[0]!.selected = true;
    }
    return parsed;
  }, [userRawField]);
  const addresses = pendingAddresses ?? baseAddresses;

  const persistAddresses = useCallback(
    async (next: SavedAddress[]) => {
      if (!user?.formIdentifier || !Array.isArray(user.formData)) return;
      setAddressError('');
      const serialized = JSON.stringify(next);
      const allowedMarkers = new Set(
        (userForm?.attributes ?? []).filter(a => !a.isLogin && !a.isPassword).map(a => a.marker)
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
      try {
        // phoneSMS is optional and validated server-side against /^\+[0-9]{10,15}$/ - do not send a malformed phone in formData, otherwise it blocks saving addresses.
        const phone = normalizePhoneE164(userField('phone'));
        const phoneValid = /^\+[0-9]{10,15}$/.test(phone);
        // No `authData` — updateUser without credentials is permitted for the currently authenticated user
        // (same pattern as `updateUserState`). Requiring a session password here broke saves after refresh-token auto-login.
        await getApi().Users.updateUser({
          formIdentifier: user.formIdentifier,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formData: formData as any,
          notificationData: {
            // For the email provider the email lives in `user.identifier`, not in `formData` - fallback to identifier.
            email: userField('email') || user.identifier || '',
            phonePush: [],
            ...(phoneValid ? { phoneSMS: phone } : {}),
          },
          state: {},
        });
        refreshUser();
      } catch (e) {
        setAddressError(e instanceof Error ? e.message : 'Failed to save address');
      }
    },
    [refreshUser, user, userField, userForm?.attributes]
  );

  const onSaveProfile = useCallback(async () => {
    if (!user?.formIdentifier) return;
    setSaving(true);
    setSaveError('');
    try {
      const password = fieldValue('password');
      const login = fieldValue('email') || user.identifier || '';
      const hasPassword = Boolean(password);
      const formData = (userForm?.attributes ?? [])
        .filter(attr => !attr.isPassword)
        .filter(attr => hasPassword || !attr.isLogin)
        .map(attr => {
          const isHidden = HIDDEN_PROFILE_MARKERS.has(attr.marker);
          let value: unknown = isHidden ? userRawField(attr.marker) : fieldValue(attr.marker);
          if ((attr.type as string) === 'json') {
            if (typeof value !== 'string') {
              value = JSON.stringify(value ?? null);
            } else {
              try {
                JSON.parse(value);
              } catch {
                value = JSON.stringify(value);
              }
            }
          } else {
            if (value === undefined || value === null) value = '';
          }
          return { marker: attr.marker, type: attr.type, value };
        })
        // Do not send hidden fields without a value - the server rejects required even for an empty string.
        .filter(entry => !(HIDDEN_PROFILE_MARKERS.has(entry.marker) && entry.value === ''));
      await getApi().Users.updateUser({
        formIdentifier: user.formIdentifier,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formData: formData as any,
        authData: hasPassword
          ? [
              { marker: 'email', value: login },
              { marker: 'password', value: password },
            ]
          : [],
        notificationData: {
          email: fieldValue('email') || user.identifier || '',
          phonePush: [],
          phoneSMS: normalizePhoneE164(fieldValue('phone')),
        },
        state: {},
      });
      refreshUser();
      toast('Data saved!');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edits, fieldValue, refreshUser, user, userForm, userRawField]);

  const onApplyAddress = async () => {
    if (!newStreet.trim()) return;
    const newEntry: SavedAddress = {
      id: `a${Date.now()}`,
      street: newStreet.trim(),
      house: newHouse.trim(),
      floor: newFloor.trim(),
      // The first added address is auto-selected.
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
    // Deleted the selected one - auto-select the first remaining.
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
    <>
      {/* My Profile */}
      <div>
        <button
          type="button"
          onClick={() => setProfileOpen(v => !v)}
          className="flex w-full items-center justify-start gap-2.5"
        >
          <ProfileIcon />
          <p className="text-xl text-paper">{t('my_profile', 'My Profile')}</p>
          <Image
            src="/images/icons/chevron-up.svg"
            alt=""
            width={12}
            height={7}
            className={`transition-transform ${profileOpen ? '' : 'rotate-180'}`}
          />
        </button>

        {profileOpen && (
          <div className="mt-5">
            <form
              className="flex flex-col gap-3.75"
              onSubmit={e => {
                e.preventDefault();
                onSaveProfile();
              }}
            >
              {profileAttributes.map(attr => {
                const inputType = resolveInputType(attr);
                const placeholder = String(attr.additionalFields?.placeholder?.value ?? '');
                return (
                  <div key={attr.marker} className="flex gap-5">
                    <label className="label" htmlFor={attr.marker}>
                      {attr.localizeInfos?.title ?? attr.marker}
                    </label>
                    <input
                      id={attr.marker}
                      className="input"
                      type={inputType}
                      placeholder={placeholder}
                      value={fieldValue(attr.marker)}
                      onChange={e =>
                        setEdits(prev => ({
                          ...prev,
                          [attr.marker]: e.target.value,
                        }))
                      }
                    />
                  </div>
                );
              })}
              <button
                type="submit"
                disabled={saving || !user?.formIdentifier}
                className="hover_btn_transp mt-5 flex h-6.75 w-20.5 items-center justify-center rounded-card border border-brand font-bold text-base text-brand disabled:opacity-60"
              >
                {saving ? '' : t('submit_text', 'Save')}
              </button>
              {saveError && <p className="text-[13px] text-red-400">{saveError}</p>}
            </form>
          </div>
        )}
      </div>

      {/* Address */}
      <div>
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
              <div key={addr.id} className="mt-2.5 flex items-center justify-between gap-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                  <input
                    type="radio"
                    name="user-address"
                    checked={Boolean(addr.selected)}
                    onChange={() => onSelectAddress(addr.id)}
                  />
                  <span className="radio-custom" />
                  <span className="font-normal text-xl text-white">
                    {addr.street} str., {addr.house}
                    {addr.floor ? `, fl. ${addr.floor}` : ''}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => onDeleteAddress(addr.id)}
                  className="hover_btn_transp flex items-center justify-center rounded-card border border-brand px-5 py-1.25 font-bold text-base text-brand"
                >
                  {t('delete_button', 'Delete')}
                </button>
              </div>
            ))}
            {addressError && <p className="mt-2.5 text-[13px] text-red-400">{addressError}</p>}
            <button
              type="button"
              onClick={() => setAddAddressOpen(v => !v)}
              className="hover_btn_paper mt-7.5 rounded-card border border-paper px-5 py-1.25 font-semibold text-base text-paper"
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
                <label className="font-normal text-base text-paper">
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
                <label className="font-normal text-base text-paper">
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
                <label className="font-normal text-base text-paper">
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
                className="hover_btn_transp flex h-6.75 items-center justify-center self-end rounded-card border border-brand px-5 py-1.25 font-bold text-base text-brand"
              >
                {t('apply_text', 'Apply')}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfileSections;
