'use client';

import type { JSX } from 'react';
import { useContext, useEffect } from 'react';

import { useGetFormByMarkerQuery } from '@/app/api';
import { AuthContext } from '@/app/store/providers/AuthContext';
import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { FORMS } from '@/app/utils/constants';
import AddressSection from '@/components/profile/AddressSection';
import BonusSection from '@/components/profile/BonusSection';
import MyProfileSection from '@/components/profile/MyProfileSection';

/**
 * ProfileSections — "My Profile" + "Address" + bonus sections in the profile drawer.
 *
 * Resolves the shared `user` form once and the "+ Add Address" intent (when opened from the
 * checkout step), then delegates rendering to the section components.
 *
 * @returns JSX of the profile sections.
 */
const ProfileSections = (): JSX.Element => {
  const { user, refreshUser } = useContext(AuthContext);
  const { action, setAction } = useContext(OpenDrawerContext);
  const { data: userForm } = useGetFormByMarkerQuery({ marker: FORMS.user });

  // When opened from "+ Add Address" in the checkout step, collapse My Profile and jump straight to the add-address form.
  const addAddressIntent = action === 'add-address';

  // Consume the intent so subsequent reopens of the popup show the default layout.
  useEffect(() => {
    if (addAddressIntent) setAction('');
  }, [addAddressIntent, setAction]);

  return (
    <>
      <MyProfileSection
        user={user}
        userForm={userForm}
        refreshUser={refreshUser}
        defaultOpen={!addAddressIntent}
      />
      <AddressSection
        user={user}
        userForm={userForm}
        refreshUser={refreshUser}
        defaultAddAddressOpen={addAddressIntent}
      />
      {/* Bonus balance + history (loyalty — Discounts API; hidden until configured in admin) */}
      <BonusSection />
    </>
  );
};

export default ProfileSections;
