'use client';

import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

/**
 * Компонент-ссылка пункта пользовательского меню.
 */
const UserMenuItem = ({
  page,
  setState,
}: {
  page: IMenusPages;
  setState: (state: boolean) => void;
}): JSX.Element => (
  <Link
    prefetch={false}
    href={`/${page.pageUrl}`}
    title={page.localizeInfos.menuTitle ?? undefined}
    className="group relative box-border flex p-2 text-paper hover:text-brand"
    onClick={() => setState(false)}
  >
    {page.localizeInfos.menuTitle}
  </Link>
);

export default UserMenuItem;
