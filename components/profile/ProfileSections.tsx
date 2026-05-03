'use client';

import Image from 'next/image';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { JSX } from 'react';
import { useCallback, useContext, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { api, useGetFormByMarkerQuery } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { useT } from '@/app/store/providers/DictProvider';
import ProfileIcon from '@/components/icons/profile';

type SavedAddress = {
  id: string;
  street: string;
  house: string;
  floor: string;
};

const initialAddresses: SavedAddress[] = [];

// Атрибуты формы `user` из OneEntry, которые в секции "My Profile"
// (Personal) рендерить не нужно. Секция Personal по эталону
// `static-html/details_personal.html` показывает только поля личных
// данных (имя, телефон, email, пароль) — без адресных полей и без
// нотификационных тогглов.
const HIDDEN_PROFILE_MARKERS = new Set([
  'repeat_password',
  'email_notifications',
  'email_notification_reg',
  'user_address',
  'user_flat',
  'user_floor',
]);

const resolveInputType = (attr: IFormAttribute): string => {
  if (attr.marker.includes('password')) return 'password';
  if (attr.marker.includes('email')) return 'email';
  return 'text';
};

/**
 * Контент секций профиля — раскрывающиеся "My Profile" (форма личных
 * данных) и "Address" (карта + список сохранённых адресов + форма
 * добавления). Используется как самой страницей `/profile`, так и
 * drawer-попапом профиля ({@link ProfilePopup}). Внешние обёртки
 * (popup-фрейм, max-width, отступы) задают потребители.
 * @returns {JSX.Element} JSX секций профиля.
 */
const ProfileSections = (): JSX.Element => {
  const t = useT();
  const { user, refreshUser } = useContext(AuthContext);

  const [profileOpen, setProfileOpen] = useState(true);
  const [addressOpen, setAddressOpen] = useState(true);

  const [addresses, setAddresses] = useState<SavedAddress[]>(initialAddresses);
  const [newStreet, setNewStreet] = useState('');
  const [newHouse, setNewHouse] = useState('');
  const [newFloor, setNewFloor] = useState('');

  // Локальные правки полей формы. Если ключ отсутствует — поле не
  // редактировалось и подставляется значение из user.formData.
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { data: userForm } = useGetFormByMarkerQuery({ marker: 'user' });

  const profileAttributes = useMemo<IFormAttribute[]>(
    () =>
      (userForm?.attributes ?? [])
        .filter((attr) => !HIDDEN_PROFILE_MARKERS.has(attr.marker))
        .slice()
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [userForm],
  );

  const userField = useCallback(
    (marker: string): string => {
      if (!user?.formData || !Array.isArray(user.formData)) return '';
      const row = (
        user.formData as Array<{ marker: string; value: unknown }>
      ).find((f) => f.marker === marker);
      return typeof row?.value === 'string' ? row.value : '';
    },
    [user],
  );

  const fieldValue = useCallback(
    (marker: string): string => {
      if (marker.includes('password')) return edits[marker] ?? '';
      return edits[marker] !== undefined ? edits[marker]! : userField(marker);
    },
    [edits, userField],
  );

  const onSaveProfile = useCallback(async () => {
    if (!user?.formIdentifier) return;
    setSaving(true);
    setSaveError('');
    try {
      const formData = profileAttributes
        .filter((attr) => !attr.marker.includes('password'))
        .map((attr) => ({
          marker: attr.marker,
          type: 'string',
          value: fieldValue(attr.marker),
        }));
      const password = edits['password'] ?? '';
      await api.Users.updateUser({
        formIdentifier: user.formIdentifier,
        formData,
        authData: password ? [{ marker: 'password', value: password }] : [],
        notificationData: {
          email: fieldValue('email'),
          phonePush: [],
          phoneSMS: fieldValue('phone'),
        },
        state: {},
      });
      setEdits((prev) => ({ ...prev, password: '' }));
      refreshUser();
      toast('Data saved!');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [edits, fieldValue, profileAttributes, refreshUser, user]);

  const onApplyAddress = () => {
    if (!newStreet.trim()) return;
    setAddresses((prev) => [
      ...prev,
      {
        id: `a${Date.now()}`,
        street: newStreet.trim(),
        house: newHouse.trim(),
        floor: newFloor.trim(),
      },
    ]);
    setNewStreet('');
    setNewHouse('');
    setNewFloor('');
  };

  return (
    <>
      {/* Мой профиль */}
      <div>
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          className="flex w-full items-center justify-start gap-2.5"
        >
          <ProfileIcon />
          <p className="text-xl text-paper">My Profile</p>
          <Image
            src="/images/icons/chevron-up.svg"
            alt=""
            width={12}
            height={7}
            className={`transition-transform ${
              profileOpen ? '' : 'rotate-180'
            }`}
          />
        </button>

        {profileOpen && (
          <div className="mt-5">
            <form
              className="flex flex-col gap-3.75"
              onSubmit={(e) => {
                e.preventDefault();
                onSaveProfile();
              }}
            >
              {profileAttributes.map((attr) => {
                const inputType = resolveInputType(attr);
                const placeholder = String(
                  attr.additionalFields?.placeholder?.value ?? '',
                );
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
                      onChange={(e) =>
                        setEdits((prev) => ({
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
                className="hover_btn_transp mt-5 flex h-6.75 w-20.5 items-center justify-center rounded-[5px] border border-brand font-bold text-[16px] text-brand disabled:opacity-60"
              >
                {saving ? '…' : 'Edit'}
              </button>
              {saveError && (
                <p className="text-[13px] text-red-400">{saveError}</p>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Адрес */}
      <div>
        <button
          type="button"
          onClick={() => setAddressOpen((v) => !v)}
          className="mt-5 flex w-full items-center justify-start gap-2.5"
        >
          <Image src="/images/icons/pin.svg" alt="" width={17} height={19} />
          <p className="text-xl text-paper">{t('address_text', 'Address')}</p>
          <Image
            src="/images/icons/chevron-up.svg"
            alt=""
            width={12}
            height={7}
            className={`transition-transform ${
              addressOpen ? '' : 'rotate-180'
            }`}
          />
        </button>

        {addressOpen && (
          <div className="mt-5">
            <Image
              src="/images/picture/maps.png"
              alt="map"
              width={350}
              height={210}
              className="w-full rounded-[5px] object-cover"
            />
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="mt-2.5 flex items-center justify-between"
              >
                <p className="font-normal text-xl text-white">
                  {addr.street} str., {addr.house}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setAddresses((prev) =>
                      prev.filter((a) => a.id !== addr.id),
                    )
                  }
                  className="hover_btn_transp flex items-center justify-center rounded-[5px] border border-brand px-5 py-1.25 font-bold text-[16px] text-brand"
                >
                  Delete
                </button>
              </div>
            ))}
            <button
              type="button"
              className="hover_btn_white mt-7.5 rounded-[5px] border border-white px-5 py-1.25 font-semibold text-[16px] text-paper"
            >
              + Add Address
            </button>
            <form
              className="mt-6.25 flex max-w-75 flex-wrap gap-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                onApplyAddress();
              }}
            >
              <div className="w-full">
                <label className="font-normal text-[16px] text-paper">
                  Street
                </label>
                <input
                  className="mt-2.5 h-6.75 w-full rounded-[5px] border border-muted bg-transparent px-5 text-paper focus:outline-muted"
                  type="text"
                  placeholder="OneEntry"
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                />
              </div>
              <div className="flex w-1/6 flex-col gap-2.5">
                <label className="font-normal text-[16px] text-paper">
                  House
                </label>
                <input
                  className="h-6.75 rounded-[5px] border border-muted bg-transparent px-2.5 text-paper focus:outline-muted"
                  type="text"
                  placeholder="40"
                  value={newHouse}
                  onChange={(e) => setNewHouse(e.target.value)}
                />
              </div>
              <div className="flex w-1/6 flex-col gap-2.5">
                <label className="font-normal text-[16px] text-paper">
                  Floor
                </label>
                <input
                  className="h-6.75 rounded-[5px] border border-muted bg-transparent px-2.5 text-paper focus:outline-muted"
                  type="text"
                  placeholder="27"
                  value={newFloor}
                  onChange={(e) => setNewFloor(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="hover_btn_transp mt-5 flex h-6.75 items-center justify-center rounded-[5px] border border-brand px-5 py-1.25 font-bold text-[16px] text-brand"
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
