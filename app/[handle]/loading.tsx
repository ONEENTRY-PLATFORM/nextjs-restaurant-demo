import type { JSX } from 'react';

import GenericPageSkeleton from '@/components/shared/skeletons/GenericPageSkeleton';

/**
 * Loading — skeleton shown while a generic CMS page (`/[handle]`) loads.
 *
 * @returns JSX of the generic page loading skeleton.
 */
export default function Loading(): JSX.Element {
  return <GenericPageSkeleton />;
}
