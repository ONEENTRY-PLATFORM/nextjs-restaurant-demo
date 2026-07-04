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
import EyeIcon from '@/components/icons/eye';
import EyeOpenIcon from '@/components/icons/eye-o';
import ProfileIcon from '@/components/icons/profile';
import {
  getUserField,
  getUserRawField,
  HIDDEN_PROFILE_MARKERS,
  resolveInputType,
  type UserFormData,
} from '@/components/profile/profileSectionsUtils';
import { validateField } from '@/components/reservation/reservationFormUtils';
import { normalizePhoneE164 } from '@/components/utils';

/**
 * isRequiredAttr — checks whether a OneEntry form attribute carries a strict required validator.
 *
 * @param   {IFormAttribute} attr - OneEntry form attribute.
 * @returns `true` when the attribute is required.
 */
const isRequiredAttr = (attr: IFormAttribute): boolean => {
  const v = (attr.validators ?? {}) as Record<string, unknown>;
  return (v.requiredValidator as { strict?: boolean } | undefined)?.strict === true;
};

type MyProfileSectionProps = {
  user: IUserEntity | undefined;
  userForm: UserFormData;
  refreshUser: () => void;
  defaultOpen: boolean;
};

/**
 * MyProfileSection — collapsible "My Profile" form in the profile drawer.
 *
 * Renders the `user`-form attributes (minus hidden markers), marks required ones with a red
 * asterisk, validates values against the form validators on submit (highlighting failed fields),
 * and saves edits via `updateUser`.
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
  const [shownPasswords, setShownPasswords] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
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
      if (edits[marker] !== undefined) return edits[marker]!;
      const stored = getUserField(user, marker);
      // OAuth-created users may have no `email` row in formData — the address
      // lives only in `user.identifier`; fall back so the field is not empty.
      if (!stored && marker === 'email' && user?.identifier?.includes('@')) {
        return user.identifier;
      }
      return stored;
    },
    [edits, user]
  );

  const onSaveProfile = useCallback(async () => {
    if (!user?.formIdentifier) return;

    // Client-side pass over the OneEntry validators. Password fields are exempt when left
    // empty - a blank password means "keep the current one", not a missing required value.
    const nextErrors: Record<string, string> = {};
    for (const attr of profileAttributes) {
      const value = fieldValue(attr.marker);
      if (attr.marker.includes('password') && !value) continue;
      const message = validateField(attr, value, t);
      if (message) nextErrors[attr.marker] = message;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
  }, [edits, fieldValue, profileAttributes, refreshUser, t, user, userForm]);

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
            // Browser autofill is disabled: the form is prefilled from OneEntry
            // user data, and autofilled values would be indistinguishable from it.
            autoComplete="off"
            onSubmit={e => {
              e.preventDefault();
              onSaveProfile();
            }}
          >
            {profileAttributes.map(attr => {
              const inputType = resolveInputType(attr);
              const isPassword = inputType === 'password';
              const shown = Boolean(shownPasswords[attr.marker]);
              const placeholder = String(attr.additionalFields?.placeholder?.value ?? '');
              const error = errors[attr.marker];
              // Password is exempt from the required mark: empty means "keep the current one".
              const showRequiredMark = isRequiredAttr(attr) && !isPassword;
              return (
                <div key={attr.marker} className="profile-anim-row flex flex-col">
                  <div className="flex gap-5">
                    <label className="label" htmlFor={attr.marker}>
                      {attr.localizeInfos?.title ?? attr.marker}
                      {showRequiredMark && <span className="text-red-500"> *</span>}
                    </label>
                    <input
                      id={attr.marker}
                      className={`input${error ? ' input-error' : ''}`}
                      type={isPassword && shown ? 'text' : inputType}
                      // `new-password` for password fields: Chrome ignores plain
                      // `off` on credential inputs and keeps autofilling them.
                      autoComplete={isPassword ? 'new-password' : 'off'}
                      placeholder={placeholder}
                      aria-invalid={Boolean(error)}
                      value={fieldValue(attr.marker)}
                      onChange={e => {
                        setEdits(prev => ({
                          ...prev,
                          [attr.marker]: e.target.value,
                        }));
                        setErrors(prev => {
                          if (!prev[attr.marker]) return prev;
                          const rest = { ...prev };
                          delete rest[attr.marker];
                          return rest;
                        });
                      }}
                    />
                    {isPassword && (
                      <button
                        type="button"
                        aria-label={shown ? 'Hide password' : 'Show password'}
                        onClick={() =>
                          setShownPasswords(prev => ({
                            ...prev,
                            [attr.marker]: !prev[attr.marker],
                          }))
                        }
                        className="-ml-11.5 flex size-4.5 shrink-0 items-center self-center"
                      >
                        {shown ? <EyeOpenIcon /> : <EyeIcon />}
                      </button>
                    )}
                  </div>
                  {error && <span className="mt-1 text-sm text-red-500">{error}</span>}
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
