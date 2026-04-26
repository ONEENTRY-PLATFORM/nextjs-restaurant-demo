import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Lato } from 'next/font/google';

import { getDictionary } from '@/app/dictionaries';
import { AuthProvider } from '@/app/store/providers/AuthContext';
import { OpenDrawerProvider } from '@/app/store/providers/OpenDrawerContext';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import StoreProvider from '@/app/store/providers/StoreProvider';
import Modal from '@/components/layout/modal';

import RegisterGSAP from './animations/RegisterGSAP';
import TransitionProvider from './animations/TransitionProvider';

const BottomMenu = dynamic(() => import('@/components/layout/bottom-menu'), {
  ssr: true,
});
const Header = dynamic(() => import('@/components/layout/header'), {
  ssr: true,
});

import './globals.css';

import { ToastContainer } from 'react-toastify';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  variable: '--font-lato',
});

/**
 * Homepage static metadata
 */
export const metadata: Metadata = {
  title: 'Restaurant — Excellence taste in every bite',
  description: 'Restaurant ordering platform built with Next.js + OneEntry CMS',
  openGraph: {
    type: 'website',
  },
};

/**
 * Root layout
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get dictionary and set to server provider
  const dictValue = await getDictionary();
  ServerProvider('dict', dictValue);
  const dict = dictValue;

  return (
    <html lang="en">
      <body
        className={`${lato.variable} font-main bg-black text-paper antialiased flex flex-col min-h-screen w-full relative`}
      >
        <RegisterGSAP />
        <StoreProvider>
          <AuthProvider>
            <OpenDrawerProvider>
              <Header />
              <TransitionProvider>
                <main className="flex flex-col grow overflow-hidden w-full">
                  {children}
                </main>
              </TransitionProvider>
              <BottomMenu />
              <Modal dict={dict} />
            </OpenDrawerProvider>
          </AuthProvider>
        </StoreProvider>
        <ToastContainer position="bottom-right" autoClose={2000} />
      </body>
    </html>
  );
}
