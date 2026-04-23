import type { JSX, ReactNode } from 'react';

import ProfileTabs from '@/components/profile/ProfileTabs';

/**
 * Profile section layout — wraps all `/profile/**` routes with shared chrome
 * (title + tabs navigation).
 * @param   {object}      props          - Layout props.
 * @param   {ReactNode}   props.children - Nested route content.
 * @returns {JSX.Element}                Profile layout JSX.
 */
const ProfileLayout = ({ children }: { children: ReactNode }): JSX.Element => {
  return (
    <section className="mx-auto w-full max-w-88 md:max-w-175 lg:max-w-250 xl:max-w-323 px-4 py-10">
      <h1 className="mb-6 font-bold text-[24px] md:text-[32px] uppercase tracking-[0.02em] text-brand">
        My Account
      </h1>
      <ProfileTabs />
      {children}
    </section>
  );
};

export default ProfileLayout;
