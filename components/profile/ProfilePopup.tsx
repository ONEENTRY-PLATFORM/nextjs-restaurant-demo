'use client';

import Image from 'next/image';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { JSX } from 'react';
import { useCallback, useContext, useMemo, useState } from 'react';

import { api, useGetFormByMarkerQuery } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ChevronUpIcon from '@/components/icons/chevron-up.svg';
import PinIcon from '@/components/icons/pin.svg';
import ProfileIcon from '@/components/icons/profile';
import ModalBackdrop from '@/components/layout/modal/components/ModalBackdrop';
import ClosePopupButton from '@/components/shared/ClosePopupButton';

import ProfilePopupAnimations from './animations/ProfilePopupAnimations';

type SavedAddress = {
  id: string;
  street: string;
  house: string;
  floor: string;
};

const initialAddresses: SavedAddress[] = [
  { id: 'a1', street: 'OneEntry', house: '40', floor: '27' },
];

// Атрибуты формы `user`, которые относятся к адресной/нотификационной
// части или дублируют пароль — в секции Personal не показываем.
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
 * Drawer-попап профиля — порт оверлея профиля из
 * `static-html/details_personal.html`, открывается по иконке пользователя
 * в глобальном хедере. Три раскрывающиеся секции: My Profile (форма личных
 * данных), Payment (сохранённые карты + форма добавления карты), Address
 * (сохранённые адреса + карта + форма добавления). Управляется через
 * `OpenDrawerContext` (`component === 'ProfilePopup'`). Повторяет паттерн
 * drawer-а {@link FavoritesPopup}. Самостоятельная страница `/profile`
 * сохранена — попап является дополнительной точкой входа.
 * @returns {JSX.Element} JSX drawer-а профиля.
 */
const ProfilePopup = (): JSX.Element => {
  const { open, component, setTransition } = useContext(OpenDrawerContext);
  const { user, refreshUser } = useContext(AuthContext);
  const isOpen = open && component === 'ProfilePopup';

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

  const close = () => setTransition('close');

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

  if (!isOpen) {
    return <></>;
  }

  return (
    <ProfilePopupAnimations>
      <div
        id="modalBody"
        className="fixed bottom-0 left-0 right-0 z-20 max-h-screen min-h-[60vh] overflow-y-auto rounded-t-[20px] bg-[rgba(76,77,86,0.8)] px-5 pt-7.25 backdrop-blur-[10px] shadow-xl md:bottom-auto md:left-auto md:right-0 md:top-37.5 md:max-w-100 md:rounded-l-[20px] md:rounded-tr-none md:pb-7.25 lg:top-37.5 xl:top-46.25"
      >
        <div className="hidden w-full md:flex justify-end">
          <ClosePopupButton
            onClose={close}
            ariaLabel="Close profile"
            className="hidden -mt-2.5 md:flex"
          />
        </div>

        <div className="mx-auto h-full max-w-87.5 overflow-y-auto pb-25 no-scrollbar md:pb-0">
          {/* Мой профиль */}
          <div>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="mt-5 md:mt-0 flex w-full items-center justify-start gap-2.5"
            >
              <ProfileIcon />
              <p className="text-xl text-paper">My Profile</p>
              <ChevronUpIcon
                className={`transition-transform ${
                  profileOpen ? '' : 'rotate-180'
                }`}
              />
            </button>

            {profileOpen && (
              <>
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
              </>
            )}
          </div>

          {/* Адрес */}
          <div className="mx-auto max-w-87.5">
            <button
              type="button"
              onClick={() => setAddressOpen((v) => !v)}
              className="mt-5 mx-auto flex w-full items-center justify-start gap-2.5"
            >
              <PinIcon />
              <p className="text-xl text-paper">Address</p>
              <ChevronUpIcon
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
                    Apply
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Кнопка закрытия для мобилы внизу */}
          <div className="mt-7.5 mb-5 flex justify-center md:hidden">
            <ClosePopupButton onClose={close} ariaLabel="Close profile" />
          </div>

          <div className="h-25 bg-transparent md:hidden" />
        </div>
      </div>
      <ModalBackdrop />
    </ProfilePopupAnimations>
  );
};

export default ProfilePopup;
