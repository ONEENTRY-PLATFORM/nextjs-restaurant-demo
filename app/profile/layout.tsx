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
