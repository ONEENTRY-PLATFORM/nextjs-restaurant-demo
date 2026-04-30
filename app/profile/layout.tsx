import type { JSX, ReactNode } from 'react';

import ProfileTabs from '@/components/profile/ProfileTabs';

/**
 * Layout раздела профиля — оборачивает все маршруты `/profile/**` общей обвязкой
 * (заголовок + навигация по вкладкам).
 * @param   {object}      props          - Пропсы layout-а.
 * @param   {ReactNode}   props.children - Контент вложенного маршрута.
 * @returns {JSX.Element}                JSX layout-а профиля.
 */
const ProfileLayout = ({ children }: { children: ReactNode }): JSX.Element => {
  return (
    <section className="section_layout">
      <h1 className="mb-6 font-bold text-[24px] md:text-[32px] uppercase tracking-[0.02em] text-brand">
        My Account
      </h1>
      <ProfileTabs />
      {children}
    </section>
  );
};

export default ProfileLayout;
