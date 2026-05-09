import type { JSX, ReactNode } from 'react';

import ProfilePageHeader from '@/components/profile/ProfilePageHeader';

/**
 * Layout раздела профиля — оборачивает все маршруты `/profile/**` общим
 * хедером (хлебные крошки + заголовок текущей страницы). Навигация
 * между разделами профиля (Personal / Orders / Favorites) живёт в
 * hover-дропдауне под иконкой профиля в хедере (см.
 * `components/layout/header/nav/NavItemProfile.tsx`); табов в дизайне
 * нет.
 *
 * Заголовок страницы и хлебные крошки вычисляются в
 * {@link ProfilePageHeader} по `usePathname()` — так не нужно дублировать
 * `<h1>` в каждом `page.tsx`.
 * @param   {object}      props          - Пропсы layout-а.
 * @param   {ReactNode}   props.children - Контент вложенного маршрута.
 * @returns {JSX.Element}                JSX layout-а профиля.
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
