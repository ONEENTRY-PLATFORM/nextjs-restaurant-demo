'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { JSX } from 'react';

const tabs: Array<{ href: string; label: string }> = [
  { href: '/profile', label: 'Personal' },
  { href: '/profile/orders', label: 'Orders' },
  { href: '/profile/favorites', label: 'Favorites' },
];

/**
 * Навигация по табам дашборда профиля — подсвечивает активный таб на основе
 * текущего pathname.
 * @returns {JSX.Element} JSX списка табов.
 */
const ProfileTabs = (): JSX.Element => {
  const pathname = usePathname();
  return (
    <ul className="mb-6 flex gap-2 overflow-x-auto no-scrollbar p-0">
      {tabs.map(t => {
        const active = pathname === t.href;
        return (
          <li key={t.href} className={'list_item ' + (active ? 'border-brand' : '')}>
            <Link href={t.href} className={'list_link ' + (active ? 'bg-brand text-white' : '')}>
              {t.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default ProfileTabs;
