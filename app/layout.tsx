import type { Metadata } from "next";
import dynamic from 'next/dynamic';
import { Geist, Geist_Mono } from "next/font/google";

import { getMenuByMarker } from '@/app/api';
import { getDictionary } from '@/app/api/utils/dictionaries';
import { AuthProvider } from '@/app/store/providers/AuthContext';
import { OpenDrawerProvider } from '@/app/store/providers/OpenDrawerContext';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import StoreProvider from '@/app/store/providers/StoreProvider';
import OffscreenModal from '@/components/layout/mobile-menu';
import Modal from '@/components/layout/modal';

import RegisterGSAP from './animations/RegisterGSAP';
import TransitionProvider from './animations/TransitionProvider';

const BottomMenu = dynamic(() => import('@/components/layout/bottom-menu'), {
  ssr: true,
});
const Header = dynamic(() => import('@/components/layout/header'), {
  ssr: true,
});
const Footer = dynamic(() => import('@/components/layout/footer'), {
  ssr: true,
});
// const IntroAnimations = dynamic(() => import('./animations/IntroAnimations'), {
//   ssr: true,
// });

import "./globals.css";
import { ToastContainer } from "react-toastify";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


/**
 * Homepage static metadata
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/optimizing/metadata Next.js docs}
 * @param params page params
 */
export const metadata: Metadata = {
  title: 'OneEntry Beauty',
  description: 'OneEntry next-js Beauty description',
  openGraph: {
    type: 'website',
  },
};

/**
 * Root layout
 *
 * @async server component
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/layout Next.js docs}
 * @param params page params
 * @returns Root layout JSX.Element
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get dictionary and set to server provider
  const [dict] = ServerProvider('dict', await getDictionary());
  // const { isError, menu } = await getMenuByMarker('main');
  
  // if (isError || !menu) {
  //   // !!! 504 Error return page no internet connection
  //   return '504 Error';
  // }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <RegisterGSAP />
        <StoreProvider>
          <AuthProvider>
            <OpenDrawerProvider>
              {/* <Header menu={menu} /> */}
              <TransitionProvider>
                <div className="h-[130px] max-xl:h-[110px] max-lg:h-[110px] max-md:h-[90px] max-sm:h-[75px]"></div>
                <main className="flex flex-col grow overflow-hidden">
                  {children}
                </main>
                <Footer dict={dict} />
              </TransitionProvider>
              <BottomMenu />
              <Modal dict={dict} />
              {/* <OffscreenModal menu={menu} /> */}
            </OpenDrawerProvider>
          </AuthProvider>
          {/* <IntroAnimations /> */}
        </StoreProvider>
        <ToastContainer position="bottom-right" autoClose={2000} />
      </body>
    </html>
  );
}
