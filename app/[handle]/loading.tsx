import type { JSX } from 'react';

import Loader from '@/components/shared/Loader';

/** Loading — spinner shown while the page is loading. */
export default function Loading(): JSX.Element {
  return <Loader />;
}
