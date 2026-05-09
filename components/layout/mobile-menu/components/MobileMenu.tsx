import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';

import MobileMenuItem from './MobileMenuItem';

/** Список мобильного меню. */
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
