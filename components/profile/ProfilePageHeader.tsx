'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { JSX } from 'react';
import { Fragment } from 'react';

import { useT } from '@/app/store/providers/DictProvider';
import HomeIcon from '@/components/icons/home';

/** ProfilePageHeader - breadcrumbs + title for `/profile/**` pages. */
type Crumb = { marker: string; fallback: string; href: string };
type Meta = { titleMarker: string; titleFallback: string; trail?: Crumb[] };

const PROFILE_CRUMB: Crumb = { marker: 'profile_label', fallback: 'Profile', href: '/profile' };

const PAGE_META: Record<string, Meta> = {
  '/profile': { titleMarker: 'personal_title', titleFallback: 'Personal' },
  '/profile/orders': {
    titleMarker: 'orders_title',
    titleFallback: 'Orders',
    trail: [PROFILE_CRUMB],
  },
  '/profile/favorites': {
    titleMarker: 'favorites_label',
    titleFallback: 'Favorites',
    trail: [PROFILE_CRUMB],
  },
  '/profile/bookings': {
    titleMarker: 'active_reservation_title',
    titleFallback: 'Active reservation',
    trail: [PROFILE_CRUMB],
  },
};

/**
 * ProfilePageHeader — breadcrumbs + title for `/profile/**` pages, route-aware via `usePathname`.
 *
 * @returns JSX of the profile page header.
 */
const ProfilePageHeader = (): JSX.Element => {
  const t = useT();
  const pathname = usePathname();
  const meta: Meta = PAGE_META[pathname] ?? {
    titleMarker: 'my_account_title',
    titleFallback: 'My Account',
  };
  const title = t(meta.titleMarker, meta.titleFallback);
  const trail = (meta.trail ?? []).map(c => ({ label: t(c.marker, c.fallback), href: c.href }));

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2.5 text-base text-muted-text">
        <Link
          href="/"
          aria-label={t('home_label', 'Home')}
          className="group inline-flex size-4 items-center justify-center"
        >
          <HomeIcon />
        </Link>
        <p>
          {trail.map((item, i) => (
            <Fragment key={item.href}>
              {i > 0 && ' / '}
              <Link href={item.href} className="transition-colors duration-200 hover:text-brand">
                {item.label}
              </Link>
            </Fragment>
          ))}
          {trail.length > 0 && ' / '}
          <span className="text-paper">{title}</span>
        </p>
      </div>
      <h1 className="text-2xl font-bold tracking-fine text-brand uppercase md:text-3xl">{title}</h1>
    </div>
  );
};

export default ProfilePageHeader;
