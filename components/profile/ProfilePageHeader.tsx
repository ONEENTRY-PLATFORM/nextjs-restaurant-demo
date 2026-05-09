'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { JSX } from 'react';

/**
 * Шапка страниц `/profile/**` — заменяет хардкод `<h1>My Account</h1>`
 * в `app/profile/layout.tsx`. Рендерит breadcrumbs + заголовок текущей
 * страницы. Маппинг `pathname → метаданные` лежит в одном месте, чтобы
 * табов в дизайне нет, но навигация наверх по иерархии (Profile →
 * Orders / Favorites) была доступна через хлебные крошки.
 *
 * Если pathname не совпадает ни с одним известным маршрутом — fallback
 * `My Account` без крошек, чтобы страница всё равно имела заголовок.
 */
type Meta = { title: string; breadcrumb?: string };

const PAGE_META: Record<string, Meta> = {
  '/profile': { title: 'Personal' },
  '/profile/orders': { title: 'Orders', breadcrumb: 'Profile' },
  '/profile/favorites': { title: 'Favorites', breadcrumb: 'Profile' },
  '/profile/bookings': { title: 'Active reservation', breadcrumb: 'Profile' },
};

const ProfilePageHeader = (): JSX.Element => {
  const pathname = usePathname();
  const meta: Meta = PAGE_META[pathname] ?? { title: 'My Account' };

  return (
    <div className="mb-6">
      {meta.breadcrumb ? (
        <p className="mb-2 text-base text-paper/70">
          <Link href="/profile" className="hover:text-brand">
            {meta.breadcrumb}
          </Link>
          <span> / </span>
          <span className="text-paper">{meta.title}</span>
        </p>
      ) : null}
      <h1 className="font-bold text-2xl md:text-3xl uppercase tracking-[0.02em] text-brand">
        {meta.title}
      </h1>
    </div>
  );
};

export default ProfilePageHeader;
