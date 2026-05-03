import type { JSX } from 'react';

import Loader from '@/components/shared/Loader';

/**
 * Компонент загрузки, отображающий спиннер-лоадер во время загрузки страницы.
 * @returns {JSX.Element} Компонент Loader, индицирующий состояние загрузки
 */
export default function Loading(): JSX.Element {
  return <Loader />;
}
