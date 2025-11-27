import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';

import { getPageByUrl } from '@/app/api';
import { getChildPagesByParentUrl } from '@/app/api';
import CategoriesGrid from '@/components/layout/categories';

/**
 * Category page
 */
const CategoryPage = async (): Promise<JSX.Element> => {
  // Get child pages by parent url
  const { pages, isError } = await getChildPagesByParentUrl('category');

  if (isError || !pages || !Array.isArray(pages)) {
    return notFound();
  }

  // extract categories data from pages
  const categories = pages.map((page: IPagesEntity) => {
    return {
      title: page.localizeInfos.title,
      link: '/shop/category/' + page.pageUrl,
      imgSrc: page.attributeValues.opengraph_image?.value[0]?.downloadLink,
    };
  });

  return (
    <section className="relative mx-auto box-border flex w-full max-w-(--breakpoint-xl) shrink-0 grow flex-col self-stretch">
      <div className="flex w-full flex-col items-center gap-5">
        <CategoriesGrid categories={categories} />
      </div>
    </section>
  );
};

export default CategoryPage;

/**
 * Generate page metadata
 */
export async function generateMetadata(): Promise<Metadata> {
  const { isError, page } = await getPageByUrl('category');

  if (isError || !page) {
    return notFound();
  }
  const { localizeInfos, isVisible, attributeValues } = page;

  const {
    url,
    width,
    height,
    altText: alt,
  } = {
    url: attributeValues.icon?.downloadLink,
    width: 300,
    height: 300,
    altText: localizeInfos.title,
  };

  return {
    title: localizeInfos.title,
    description: localizeInfos.plainContent,
    robots: {
      index: isVisible,
      follow: isVisible,
      googleBot: {
        index: isVisible,
        follow: isVisible,
      },
    },
    openGraph: url
      ? {
          images: [
            {
              url,
              width,
              height,
              alt,
            },
          ],
        }
      : null,
  };
}
