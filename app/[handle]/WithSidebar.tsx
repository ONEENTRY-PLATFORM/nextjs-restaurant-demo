import type { JSX, ReactNode } from 'react';

import FadeTransition from '@/app/animations/FadeTransition';
import SidebarMenu from '@/components/layout/sidebar';

/**
 * Sidebar layout
 * @async server component
 *
 * @param props
 * @param props.children children ReactNode
 * @returns {Promise<JSX.Element>} Sidebar layout
 */
const WithSidebar = async ({
  children,
}: {
  children: ReactNode;
}): Promise<JSX.Element> => {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="mx-auto flex w-full max-w-(--breakpoint-xl) flex-row max-md:flex-row max-md:flex-wrap">
        <FadeTransition
          className="flex w-1/2 grow flex-col overflow-hidden max-md:w-full"
          index={0}
        >
          <div className="flex w-full flex-col pb-5">{children}</div>
        </FadeTransition>
        <aside className="w-1/2 pb-8 max-md:w-full">
          <SidebarMenu />
        </aside>
      </div>
    </div>
  );
};

export default WithSidebar;
