'use client';

import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';

/**
 * UserMenuItem — single user-menu link; closes the menu via `setState(false)` after navigation.
 *
 * @param   {object}                       props          - Component props.
 * @param   {IMenusPages}                  props.page     - OneEntry menu page entity (uses `pageUrl` and `localizeInfos.menuTitle`).
 * @param   {(state: boolean) => void}     props.setState - Setter that closes the parent menu on click.
 * @returns {JSX.Element} JSX of the user-menu link.
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
