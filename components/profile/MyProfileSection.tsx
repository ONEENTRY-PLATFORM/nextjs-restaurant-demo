'use client';

import Image from 'next/image';
import type { IAuthFormData, IFormAttribute, IUserEntity } from 'oneentry/types';
import type { JSX } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { getApi, isError } from '@/app/api/api/api';
import { useT } from '@/app/store/providers/DictProvider';
import { normalizeErrorMessage } from '@/app/utils/errorHandler';
import { userHasPasswordAuth } from '@/components/forms/authProviders';
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
import { getFormAttributes, normalizePhoneE164 } from '@/components/utils';

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
 * and saves edits via `updateUser`. For OAuth-provider sessions (no password credentials)
 * password attributes are not rendered, the login field is read-only and back-filled into
 * `formData` from `user.identifier` (parity with email-provider records — same `user` form),
 * and the update payload carries neither `authData` nor `notificationData`.
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

  // OAuth accounts (google, …) have no password credentials: password inputs are
  // meaningless for them and PUT /me rejects password authData for such users.
  const passwordAuth = userHasPasswordAuth(user);

  const profileAttributes = useMemo<IFormAttribute[]>(
    () =>
      getFormAttributes(userForm)
        .filter(attr => !HIDDEN_PROFILE_MARKERS.has(attr.marker))
        .filter(attr => passwordAuth || !(attr.isPassword || attr.marker.includes('password')))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [userForm, passwordAuth]
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
      const password = passwordAuth ? fieldValue('password') : '';
      const hasPassword = Boolean(password);
      // isLogin attrs: for password providers the email row rides along only with a password
      // change (login-change semantics); for OAuth sessions it is always included — the server
      // creates such users WITHOUT an email row (the address lives in `user.identifier`), and
      // sending it backfills the record to parity with email-provider users (same `user` form).
      const formData = getFormAttributes(userForm)
        .filter(attr => !attr.isPassword)
        .filter(attr => hasPassword || !attr.isLogin || !passwordAuth)
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
      // PUT /me accepts at most ONE authData item — password change is `[{ marker: 'password' }]`,
      // never the legacy `[email, password]` pair (server: `"authData" must contain <= 1 items`);
      // an EMPTY authData array is also rejected ("Login or password values are missed"), so the
      // key is omitted entirely unless a password change is in flight.
      // notificationData is only sent for password-provider accounts: OAuth-created users have
      // no notification record server-side and PUT /me 500s on it ("reading 'en_US'" of null).
      const res = await getApi().Users.updateUser({
        formIdentifier: user.formIdentifier,
        formData: formData as unknown as IAuthFormData[],
        ...(hasPassword ? { authData: [{ marker: 'password', value: password }] } : {}),
        ...(passwordAuth
          ? {
              notificationData: {
                email: fieldValue('email') || user.identifier || '',
                phonePush: [],
                phoneSMS: normalizePhoneE164(fieldValue('phone')),
              },
            }
          : {}),
        state: {},
      });
      // The SDK returns an IError envelope instead of throwing — a failed save must not
      // refresh the user or show the success toast.
      if (isError(res)) {
        setSaveError(
          normalizeErrorMessage((res as { message?: string | string[] }).message, 'Failed to save')
        );
        return;
      }
      refreshUser();
      toast(t('data_saved_toast', 'Data saved!'));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
    // `passwordAuth` derives from `user` and the helpers are module-scope — the listed deps are the real triggers.
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
              const showRequiredMark = isRequiredAttr(attr) && !isPassword;
              // The login field of an OAuth account belongs to the provider (Google) and
              // is not persistable via PUT /me — render it read-only to avoid silent loss.
              const loginLocked = attr.isLogin === true && !passwordAuth;
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
                      autoComplete={isPassword ? 'new-password' : 'off'}
                      placeholder={placeholder}
                      aria-invalid={Boolean(error)}
                      readOnly={loginLocked}
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
