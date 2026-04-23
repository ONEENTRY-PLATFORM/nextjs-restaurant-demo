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
 * Profile dashboard tab navigation — highlights the active tab based on the
 * current pathname.
 * @returns {JSX.Element} Tab list JSX.
 */
const ProfileTabs = (): JSX.Element => {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto no-scrollbar">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={
              'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ' +
              (active
                ? 'bg-brand text-white'
                : 'border border-muted text-paper/80 hover:border-brand hover:text-brand')
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default ProfileTabs;
