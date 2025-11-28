/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPageByUrl } from '@/app/api';

// import { ServerProvider } from '@/app/store/providers/ServerProvider';
// import type { PageProps } from '@/app/types/global';
// import { getDictionary } from '../api/utils/dictionaries';
// import PaymentPage from '@/components/layout/payment';
// import ProfilePage from '@/components/layout/profile';
// import AboutPage from '@/components/pages/AboutPage';
// import ContactsPage from '@/components/pages/ContactsPage';
// import PaymentCanceled from '@/components/pages/PaymentCanceled';
// import PaymentSuccess from '@/components/pages/PaymentSuccess';
// import ServicesPage from '@/components/pages/ServicesPage';
// import type { Locale } from '@/i18n-config';
// import { getDictionary } from '../dictionaries';
import WithSidebar from './WithSidebar';
import { JSX } from 'react';

/**
 * Simple page layout
 * @async
 * @param   {object}                                  params        - Page parameters
 * @param   {Promise<{ page: string; lang: string }>} params.params - The page and language parameters
 * @see {@link https://doc.oneentry.cloud/docs/pages OneEntry CMS docs}
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page Next.js docs}
 * @returns {Promise<JSX.Element>}                                  page layout JSX.Element
 */
const PageLayout = async ({
  params,
}: {
  params: Promise<{ page: string; handle: string }>;
}): Promise<JSX.Element> => {
  /** Extract page name from params */
  const { page: p } = await params;
  /** Get dictionary and set to server provider for internationalization */
  // const [dict] = ServerProvider('dict', await getDictionary());

  /** Get page data by current url */
  const { page, isError } = await getPageByUrl(p);

  /** if error return notFound */
  if (isError || !page) {
    return notFound();
  }

  /** extract data from page */
  const { pageUrl, templateIdentifier } = page;

  /** array of pages components with additional settings for next router */
  const pages = [
    {
      templateType: templateIdentifier,
      name: 'profile',
      component: null,
    },
    // {
    //   templateType: templateIdentifier,
    //   name: 'payment',
    //   component: <PaymentPage page={page} lang={lang} dict={dict} />,
    // },
    // {
    //   templateType: templateIdentifier,
    //   name: 'about_us',
    //   component: <AboutPage page={page} lang={lang} dict={dict} />,
    // },
    // {
    //   templateType: templateIdentifier,
    //   name: 'services',
    //   component: <ServicesPage page={page} lang={lang} dict={dict} />,
    // },
    // {
    //   templateType: templateIdentifier,
    //   name: 'contact_us',
    //   component: <ContactsPage page={page} lang={lang} dict={dict} />,
    // },
    // {
    //   templateType: templateIdentifier,
    //   name: 'payment_success',
    //   component: <PaymentSuccess page={page} lang={lang} dict={dict} />,
    // },
    // {
    //   templateType: templateIdentifier,
    //   name: 'payment_canceled',
    //   component: <PaymentCanceled page={page} lang={lang} dict={dict} />,
    // },
  ];

  /** Render the page component based on the page URL and template type */
  return (
    <div className="mx-auto flex min-h-80 w-full max-w-(--breakpoint-xl) flex-col overflow-hidden">
      {Array.isArray(pages) ? (
        pages.map((p, i) => {
          if (pageUrl !== p.name) {
            return null;
          }
          return p.templateType === 'withSidebar' ? (
            <WithSidebar key={i}>
              {p.component}
            </WithSidebar>
          ) : (
            <div key={i}>{p.component}</div>
          );
        })
      ) : (
        <div>Page not found</div>
      )}
    </div>
  );
};

export default PageLayout;

/**
 * Generate page metadata
 * @async
 * @param   {object}                                  params        - Page params
 * @param   {Promise<{ page: string; lang: string }>} params.params - The page and language parameters
 * @see {@link https://doc.oneentry.cloud/docs/pages OneEntry CMS docs}
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page Next.js docs}
 * @returns {Promise<Metadata>}                                     page metadata
 */
export async function generateMetadata({
  params,
}: {
  params: any;
}): Promise<Metadata> {
  /** Extract page name from params */
  const { page: pageData } = await params;

  /** Get page data by current url */
  const { page, isError } = await getPageByUrl(pageData);

  /** if error return notFound */
  if (isError || !page) {
    return notFound();
  }

  /** extract data from page */
  const { localizeInfos } = page;

  return {
    title: localizeInfos?.title,
    description: localizeInfos?.title,
    openGraph: {
      type: 'article',
    },
  };
}