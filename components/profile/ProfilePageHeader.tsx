'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { JSX } from 'react';
import { Fragment } from 'react';

import HomeIcon from '@/components/icons/home';

/** ProfilePageHeader — breadcrumbs + заголовок страниц `/profile/**`. */
type Crumb = { label: string; href: string };
type Meta = { title: string; trail?: Crumb[] };

const PROFILE_CRUMB: Crumb = { label: 'Profile', href: '/profile' };

const PAGE_META: Record<string, Meta> = {
  '/profile': { title: 'Personal' },
  '/profile/orders': { title: 'Orders', trail: [PROFILE_CRUMB] },
  '/profile/favorites': { title: 'Favorites', trail: [PROFILE_CRUMB] },
  '/profile/bookings': { title: 'Active reservation', trail: [PROFILE_CRUMB] },
};

const ProfilePageHeader = (): JSX.Element => {
  const pathname = usePathname();
  const meta: Meta = PAGE_META[pathname] ?? { title: 'My Account' };
  const trail = meta.trail ?? [];

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2.5 text-base text-muted-text">
        <Link
          href="/"
          aria-label="Home"
          className="group inline-flex h-4 w-4 items-center justify-center"
        >
          <HomeIcon />
        </Link>
        <p>
          {trail.map((item, i) => (
            <Fragment key={item.href}>
              {i > 0 && ' / '}
              <Link href={item.href} className="hover:text-brand">
                {item.label}
              </Link>
            </Fragment>
          ))}
          {trail.length > 0 && ' / '}
          <span className="text-paper">{meta.title}</span>
        </p>
      </div>
      <h1 className="font-bold text-2xl md:text-3xl uppercase tracking-[0.02em] text-brand">
        {meta.title}
      </h1>
    </div>
  );
};

export default ProfilePageHeader;
