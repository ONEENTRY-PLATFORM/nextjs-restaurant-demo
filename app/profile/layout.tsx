import type { JSX, ReactNode } from 'react';

import ProfilePageHeader from '@/components/profile/ProfilePageHeader';

/**
 * ProfileLayout — wrapper for `/profile/**` routes with a shared header.
 *
 * @param   {object}      props          - Layout props.
 * @param   {ReactNode}   props.children - Nested route content.
 * @returns {JSX.Element}                JSX of the profile layout.
 */
const ProfileLayout = ({ children }: { children: ReactNode }): JSX.Element => {
  return (
    <section className="section_layout pt-0">
      <ProfilePageHeader />
      {children}
    </section>
  );
};

export default ProfileLayout;
