import type { JSX } from 'react';

import ProfileSkeleton from '@/components/shared/skeletons/ProfileSkeleton';

/**
 * Loading — skeleton shown while any `/profile/**` page loads (personal data, orders, favorites, bookings).
 *
 * Rendered inside the profile layout, so the breadcrumbs + title from `ProfilePageHeader` stay visible while only the content slot shows the skeleton.
 *
 * @returns JSX of the profile loading skeleton.
 */
export default function Loading(): JSX.Element {
  return <ProfileSkeleton />;
}
