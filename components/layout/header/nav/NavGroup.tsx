import type { IMenusEntity } from 'oneentry/dist/menus/menusInterfaces';
import type { FC } from 'react';

import { getMenuByMarker } from '@/app/api';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import FavoritesIcon from '@/components/icons/favorites';

import MenuButton from './MenuButton';
import NavItemCart from './NavItemCart';
import NavItemFavorites from './NavItemFavorites';
import NavItemProfile from './NavItemProfile';

/**
 * User navigation group
 * @returns JSX.Element
 */

const NavGroup: FC = async () => {
  const [dict] = ServerProvider('dict');
  const { menu, isError } = await getMenuByMarker('user_menu');

  if (!menu || isError) {
    return <p>Menu not found</p>;
  }

  return (
    <div className="flex justify-between relative self-end cursor-pointer">
      <div className="gap-8 max-md:gap-6 max-sm:gap-4 flex">
        <div className="group">
          <a href="#">
            <svg
              className="fill-[#DFE9F9] hover-target"
              width="29"
              height="25"
              viewBox="0 0 29 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M27.5538 12.0968C27.2867 12.098 27.0265 12.0129 26.8136 11.8548L14.3938 2.72581L1.97401 11.8548C1.71224 12.0473 1.3832 12.13 1.05928 12.0846C0.735356 12.0392 0.443083 11.8696 0.246756 11.6129C0.0504288 11.3562 -0.0338698 11.0336 0.0124049 10.716C0.0586795 10.3984 0.231737 10.1118 0.493506 9.91935L13.6535 0.241936C13.8671 0.0848927 14.1268 0 14.3938 0C14.6607 0 14.9205 0.0848927 15.134 0.241936L28.2941 9.91935C28.5329 10.1096 28.6907 10.3805 28.7363 10.6789C28.782 10.9773 28.7123 11.2817 28.5408 11.5323C28.436 11.6984 28.2911 11.8367 28.1191 11.9351C27.947 12.0335 27.7529 12.0891 27.5538 12.0968Z"
                fill="#DFE9F9"
              />
              <path
                d="M24.2638 25H4.52376C4.19788 24.9958 3.88654 24.867 3.65608 24.6411C3.42562 24.4151 3.29427 24.1098 3.29001 23.7903V8.46774C3.29001 8.14692 3.42 7.83923 3.65137 7.61237C3.88274 7.38551 4.19655 7.25806 4.52376 7.25806C4.85097 7.25806 5.16478 7.38551 5.39616 7.61237C5.62753 7.83923 5.75752 8.14692 5.75752 8.46774V22.5806H23.03V8.46774C23.03 8.14692 23.16 7.83923 23.3914 7.61237C23.6228 7.38551 23.9366 7.25806 24.2638 7.25806C24.591 7.25806 24.9048 7.38551 25.1362 7.61237C25.3676 7.83923 25.4976 8.14692 25.4976 8.46774V23.7903C25.4933 24.1098 25.3619 24.4151 25.1315 24.6411C24.901 24.867 24.5897 24.9958 24.2638 25Z"
                fill="#DFE9F9"
              />
              <path
                d="M17.6838 25C17.3579 24.9958 17.0466 24.867 16.8161 24.6411C16.5856 24.4151 16.4543 24.1098 16.45 23.7903V13.7097H12.3375V23.7903C12.3375 24.1111 12.2075 24.4188 11.9762 24.6457C11.7448 24.8726 11.431 25 11.1038 25C10.7766 25 10.4628 24.8726 10.2314 24.6457C10 24.4188 9.87002 24.1111 9.87002 23.7903V12.5C9.87428 12.1805 10.0056 11.8752 10.2361 11.6492C10.4665 11.4233 10.7779 11.2945 11.1038 11.2903H17.6838C18.0097 11.2945 18.321 11.4233 18.5515 11.6492C18.7819 11.8752 18.9133 12.1805 18.9175 12.5V23.7903C18.9133 24.1098 18.7819 24.4151 18.5515 24.6411C18.321 24.867 18.0097 24.9958 17.6838 25Z"
                fill="#DFE9F9"
              />
            </svg>
          </a>
        </div>
        <NavItemCart />
        <NavItemFavorites />
        <NavItemProfile userMenu={menu as IMenusEntity} />
      </div>
      <MenuButton />
    </div>
  );
};

export default NavGroup;
