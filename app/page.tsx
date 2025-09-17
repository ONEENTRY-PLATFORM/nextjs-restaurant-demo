// import dynamic from 'next/dynamic';
import type { IBlockEntity } from 'oneentry/dist/blocks/blocksInterfaces';
import { type FC, Suspense } from 'react';

import { getBlocksByPageUrl, getPageByUrl } from '@/app/api';
import { getDictionary } from '@/app/api/utils/dictionaries';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import type { PageProps } from '@/app/types/global';
import ProductsGridLayout from '@/components/layout/products-grid';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';
import { sortArrayByPosition } from '@/components/utils';

// const HomeHero = dynamic(() => import('@/components/layout/home-hero'), {
//   ssr: true,
// });

// export const revalidate = 10;
// export const dynamicParams = true;

const IndexPageLayout: FC<PageProps> = async (props) => {
  const { searchParams, params } = await props;
  // set dict
  const [dict] = ServerProvider('dict', await getDictionary());
  // get page
  const { page, isError } = await getPageByUrl('home_web');
  // get page blocks
  const { blocks } = await getBlocksByPageUrl({ pageUrl: page?.pageUrl || '' });
  if (isError || !page || !blocks) {
    return 'isError';
  }

  const sortedBlocks = sortArrayByPosition(blocks);
  // console.log(sortedBlocks);

  return sortedBlocks?.map((block: IBlockEntity) => {
    switch (block.identifier) {
      case 'recommended_web':
        return (
          <section
            key={block.identifier}
            className="relative mx-auto box-border flex w-full max-w-(--breakpoint-xl) shrink-0 grow flex-col self-stretch"
          >
            <div className="flex w-full flex-col items-center gap-5">
              <Suspense fallback={<ProductsGridLoader />}>
                <ProductsGridLayout
                  pagesLimit={block.quantity || 4}
                  dict={dict}
                  params={params}
                  searchParams={searchParams}
                />
              </Suspense>
            </div>
          </section>
        );
      //   return <HomeHero key={index} block={block} />;
      // case 'home_catalog':
      //   return (
      //     <div className="px-5 py-8" key={index}>
      //       <CatalogSection block={block} />
      //     </div>
      //   );
      // case 'home_gallery':
      //   return <GalleryFeed key={index} block={block} />;
      // case 'home_offers_feed':
      //   return <OffersFeed key={index} block={block} />;
      // case 'home_discounts':
      //   return <HomeDiscount key={index} block={block} />;
      // case 'home_masters':
      //   return <MastersFeed key={index} block={block} />;
      // case 'reviews_carousel':
      //   return <ReviewsCarousel key={index} block={block} />;
      default:
        break;
    }
  });
};

export default IndexPageLayout;
