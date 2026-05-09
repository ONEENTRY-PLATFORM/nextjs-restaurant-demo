'use client';

import Link from 'next/link';
import type { IMenusPages } from 'oneentry/dist/menus/menusInterfaces';
import { useContext, useState } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import ChevronDownFatIcon from '@/components/icons/chevron-down-fat';

import MobileMenu from './MobileMenu';

/** Элемент списка мобильного меню. */
function MobileMenuItem({ item, parentUrl }: { item: IMenusPages; parentUrl?: string }) {
  const { setOpen } = useContext(OpenDrawerContext);
  const hasChild = Array.isArray(item.children) && item.children.length > 0;
  const [openSubmenu, setOpenSubmenu] = useState(false);
  const url =
    item.pageUrl === 'home' ? '/' : `${parentUrl ? `${parentUrl}/` : '/'}${item.pageUrl || ''}`;

  return (
    <li
      key={item.localizeInfos.menuTitle}
      className={'flex w-full flex-col py-2 text-lg text-paper transition-colors hover:text-brand'}
    >
      <div className={'flex ' + (hasChild && '')}>
        <Link
          className="w-full"
          href={url}
          prefetch={true}
          onClick={() => {
            setOpen(false);
          }}
        >
          {item.localizeInfos.menuTitle}
        </Link>
        {hasChild && (
          <button
            onClick={e => {
              e.preventDefault();
              setOpenSubmenu(!openSubmenu);
            }}
            className={'ml-auto transition-transform ' + (!openSubmenu ? '-rotate-90' : '')}
          >
            <ChevronDownFatIcon />
          </button>
        )}
      </div>
      {Array.isArray(item.children) && hasChild && (
        <MobileMenu
          menu={item.children}
          parentUrl={url}
          className={'px-2 ' + (!openSubmenu ? 'hidden' : 'visible')}
        />
      )}
    </li>
  );
}

export default MobileMenuItem;
