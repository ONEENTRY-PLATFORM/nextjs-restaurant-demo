import type { JSX } from 'react';

import Loader from '@/components/shared/Loader';

/**
 * Loading component that displays a spinner loader while the page is loading.
 * @returns {JSX.Element} Loader component indicating the loading state
 */
export default function Loading(): JSX.Element {
  return <Loader />;
}
