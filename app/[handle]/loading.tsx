import type { JSX } from 'react';

import Loader from '@/components/shared/Loader';

/** Loading — спиннер во время загрузки страницы. */
export default function Loading(): JSX.Element {
  return <Loader />;
}
