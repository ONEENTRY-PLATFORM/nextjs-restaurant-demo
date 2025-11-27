'use client';

import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

/**
 * User menu item link component.
 */
const UserMenuItem = ({ page, setState }: {
  page: IMenusPages;
  setState: (state: boolean) => void;
}): JSX.Element => (
  <Link
    prefetch={false}
    href={`/${page.pageUrl}`}
    title={page.localizeInfos.menuTitle}
    className="group relative box-border flex p-2 text-slate-800 hover:text-fuchsia-500"
    onClick={() => setState(false)}
  >
    {page.localizeInfos.menuTitle}
  </Link>
);

export default UserMenuItem;
