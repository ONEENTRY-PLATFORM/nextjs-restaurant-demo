/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { IMenusEntity } from 'oneentry/dist/menus/menusInterfaces';
import type { JSX } from 'react';
import { useContext, useEffect } from 'react';

import { OpenDrawerContext } from '@/app/store/providers/OpenDrawerContext';
import { flatMenuToNested } from '@/components/utils';

import ModalBackdrop from '../modal/components/ModalBackdrop';
import MobileMenuAnimations from './animations/MobileMenuAnimations';
import CloseModal from './components/CloseModal';
import MobileMenu from './components/MobileMenu';

/**
 * OffscreenModal — slide-in mobile menu drawer; closes on resize past lg and on route change.
 *
 * @param   {object}        props      - Component props.
 * @param   {IMenusEntity}  props.menu - OneEntry menu entity used to render the nested mobile menu list.
 * @returns JSX of the mobile menu drawer, or empty fragment when not active.
 */
const OffscreenModal = ({ menu }: { menu: IMenusEntity }): JSX.Element => {
  const pathname = usePathname();
  const { open, setOpen, component } = useContext(OpenDrawerContext);

  const mainMenu = flatMenuToNested(Array.isArray(menu.pages) ? menu.pages : [], null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1023) {
        setOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!open || component !== 'MobileMenu') {
    return <></>;
  }

  return (
    <MobileMenuAnimations
      id="modalBody"
      className="z-450 fixed flex size-full flex-col overflow-auto p-6 pt-12 shadow-xl md:overflow-hidden md:rounded-[20px] lg:h-auto lg:w-90 lg:p-10"
    >
      <div className="fixed inset-0 z-50 flex size-full max-w-90 flex-col bg-ink/80 backdrop-blur-card pb-6">
        <div className="p-6">
          <CloseModal />
          <div className="mb-4 w-full">
            <Image
              src={'/images/logo.svg'}
              width={82}
              height={40}
              alt={'Oasis'}
              loading="lazy"
              className="aspect-[2.05] max-w-full shrink-0 max-sm:mb-5"
            />
          </div>
          <MobileMenu menu={mainMenu} />
        </div>
      </div>
      <ModalBackdrop />
    </MobileMenuAnimations>
  );
};

export default OffscreenModal;
