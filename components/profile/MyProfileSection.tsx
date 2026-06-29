'use client';

import Image from 'next/image';
import type { IAuthFormData } from 'oneentry/dist/auth-provider/authProvidersInterfaces';
import type { IFormAttribute } from 'oneentry/dist/forms/formsInterfaces';
import type { IUserEntity } from 'oneentry/dist/users/usersInterfaces';
import type { JSX } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { getApi } from '@/app/api';
import { useT } from '@/app/store/providers/DictProvider';
import ProfileIcon from '@/components/icons/profile';
import {
  getUserField,
  getUserRawField,
  HIDDEN_PROFILE_MARKERS,
  resolveInputType,
  type UserFormData,
} from '@/components/profile/profileSectionsUtils';
import { normalizePhoneE164 } from '@/components/utils';

type MyProfileSectionProps = {
  user: IUserEntity | undefined;
  userForm: UserFormData;
  refreshUser: () => void;
  defaultOpen: boolean;
};

/**
 * MyProfileSection — collapsible "My Profile" form in the profile drawer.
 *
 * Renders the `user`-form attributes (minus hidden markers) and saves edits via `updateUser`.
 *
 * @param   {MyProfileSectionProps}   props             - Component props.
 * @param   {IUserEntity | undefined} props.user        - Current authenticated user.
 * @param   {UserFormData}            props.userForm    - `user` form definition (attributes).
 * @param   {() => void}              props.refreshUser - Re-fetches the user after a successful save.
 * @param   {boolean}                 props.defaultOpen - Whether the section starts expanded.
 * @returns JSX of the "My Profile" section.
 */
const MyProfileSection = ({
  user,
  userForm,
  refreshUser,
  defaultOpen,
}: MyProfileSectionProps): JSX.Element => {
  const t = useT();
  const [profileOpen, setProfileOpen] = useState(defaultOpen);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const profileAttributes = useMemo<IFormAttribute[]>(
    () =>
      (userForm?.attributes ?? [])
        .filter(attr => !HIDDEN_PROFILE_MARKERS.has(attr.marker))
        .slice()
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [userForm]
  );

  const fieldValue = useCallback(
    (marker: string): string => {
      if (marker.includes('password')) return edits[marker] ?? '';
      return edits[marker] !== undefined ? edits[marker]! : getUserField(user, marker);
    },
    [edits, user]
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
          let value: unknown = isHidden
            ? getUserRawField(user, attr.marker)
            : fieldValue(attr.marker);
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
        formData: formData as unknown as IAuthFormData[],
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
      toast(t('data_saved_toast', 'Data saved!'));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edits, fieldValue, refreshUser, user, userForm]);

  return (
    <div className="profile-anim-row">
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
                <div key={attr.marker} className="profile-anim-row flex gap-5">
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
              className="profile-anim-row hover_btn_transp mt-5 flex h-6.75 w-20.5 items-center justify-center rounded-card border border-brand text-base font-bold text-brand disabled:opacity-60"
            >
              {saving ? '' : t('submit_text', 'Save')}
            </button>
            {saveError && <p className="text-[13px] text-red-400">{saveError}</p>}
          </form>
        </div>
      )}
    </div>
  );
};

export default MyProfileSection;
