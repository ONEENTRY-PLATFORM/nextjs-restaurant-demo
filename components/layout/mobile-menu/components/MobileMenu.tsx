import type { IMenusPages } from 'oneentry/types';

import MobileMenuItem from './MobileMenuItem';

/**
 * MobileMenu — recursive mobile-menu list (renders nothing for trivially short lists).
 *
 * @param   {object}        props             - Component props.
 * @param   {IMenusPages[]} props.menu        - Nested menu items.
 * @param   {string}        [props.className] - Wrapper class merged onto the `<ul>`.
 * @param   {string}        [props.parentUrl] - Optional parent URL prepended to child links.
 * @returns JSX of the menu list, or `null` when there is at most one item.
 */
function MobileMenu({
  menu,
  className = '',
  parentUrl,
}: {
  menu: IMenusPages[];
  className?: string;
  parentUrl?: string;
}) {
  if (menu.length <= 1) return null;

  return (
    <ul className={`flex flex-col ${className}`}>
      {menu.map((item: IMenusPages) => (
        <MobileMenuItem key={item.id} item={item} {...(parentUrl ? { parentUrl } : {})} />
      ))}
    </ul>
  );
}

export default MobileMenu;
